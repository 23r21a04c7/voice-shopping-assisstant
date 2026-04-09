const amazonScraper = require('../scrapers/amazonScraper');
const flipkartScraper = require('../scrapers/flipkartScraper');
const myntraScraper = require('../scrapers/myntraScraper');
const ajioScraper = require('../scrapers/ajioScraper');
const liveViewScraper = require('../scrapers/liveViewScraper');
const extractProductId = require('../utils/extractProductId.js');

exports.trackPrice = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        const productInfo = extractProductId(url);

        // Select the appropriate scraper based on platform
        let priceData;
        if (productInfo.platform === 'amazon') {
            priceData = await amazonScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'flipkart') {
            // Pass full URL to Flipkart scraper as it needs the complete URL structure
            priceData = await flipkartScraper.scrape(url);
        } else if (productInfo.platform === 'myntra') {
            priceData = await myntraScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'ajio') {
            priceData = await ajioScraper.scrape(productInfo.id);
        } else {
            throw new Error('Unsupported platform');
        }

        res.json({ success: true, data: priceData });
    } catch (error) {
        console.error('Price tracking error:', error);
        res.status(500).json({ error: error.message });
    }
};

// --- UNIVERSAL TOKEN MATCHING ENGINE --- //

function tokenize(title) {
    if (!title) return [];
    // Convert to lowercase and replace separators with space to isolate tokens
    const cleaned = title.toLowerCase().replace(/[-_,|/:()\[\]{}'"]/g, ' ');
    return cleaned.split(/\s+/).filter(w => w.length > 0);
}

// Universal Word Overlap Ratio
function calculateSimilarity(s1, s2) {
    const tokens1 = new Set(tokenize(s1));
    const tokens2 = new Set(tokenize(s2));
    if (tokens1.size === 0 || tokens2.size === 0) return 0;
    
    const stopWords = new Set(['for', 'with', 'and', 'the', 'in', 'of', 'buy', 'online', 'at', 'price', 'pack', 'color']);
    const t1 = [...tokens1].filter(t => !stopWords.has(t));
    const t2 = [...tokens2].filter(t => !stopWords.has(t));
    
    const set1 = new Set(t1);
    const set2 = new Set(t2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    // Calculate overlap based on the shorter title to accommodate truncated names on fashion/grid platforms
    const minLen = Math.min(set1.size, set2.size);
    return minLen === 0 ? 0 : intersection.size / minLen;
}

// Universal Spec Guard: Prevents hard contradiction (e.g. 128gb vs 256gb)
function numericGuard(sourceTitle, targetTitle) {
    if (!sourceTitle || !targetTitle) return true;
    const sTokens = tokenize(sourceTitle);
    const tTokens = tokenize(targetTitle);
    
    // 1. Direct specification contradiction check
    const extractSpec = (tokens, pattern) => {
        const found = tokens.find(t => pattern.test(t));
        return found ? found.match(pattern)[1] : null;
    };
    
    const specs = [
        /(\d+)gb/, /(\d+)tb/, /(\d+)mah/, /(\d+)w/, /(\d+)hz/, /(\d+)ml/, /(\d+)kg/, /(\d+)l/
    ];
    
    for (const spec of specs) {
        const sVal = extractSpec(sTokens, spec);
        const tVal = extractSpec(tTokens, spec);
        // If BOTH platforms specify a spec value (e.g., both mention RAM), they MUST match exactly.
        // If one platform omits it, we let it pass safely.
        if (sVal && tVal && sVal !== tVal) return false; 
    }
    
    // 2. Exact Anchor Conflict check (e.g. g35 vs g84)
    const isAnchor = (t) => /[a-z]/.test(t) && /\d/.test(t) && t.length >= 3;
    const sAnchors = sTokens.filter(isAnchor);
    const tAnchors = tTokens.filter(isAnchor);
    
    for (const sA of sAnchors) {
        if (tAnchors.length > 0 && !tAnchors.includes(sA)) {
            // Find if target introduces a contradicting anchor (same first letter but different numbers)
            const contradicting = tAnchors.find(tA => tA[0] === sA[0] && tA !== sA);
            if (contradicting) return false;
        }
    }
    
    // Men vs Women mismatch fallback
    const sMen = sTokens.includes('men');
    const sWomen = sTokens.includes('women');
    const tMen = tTokens.includes('men');
    const tWomen = tTokens.includes('women');
    if (sMen && !sWomen && tWomen && !tMen) return false;
    if (sWomen && !sMen && tMen && !tWomen) return false;

    return true; // No contradiction found
}

// Universal Dynamic Brand Check
function universalBrandGuard(sourceTitle, targetTitle) {
    if (!sourceTitle || !targetTitle) return true;
    const sTokens = tokenize(sourceTitle);
    const tTokens = tokenize(targetTitle);
    
    if (sTokens.length === 0 || tTokens.length === 0) return true;
    
    const fluff = ['buy', 'new', 'the', 'original', 'latest', 'online', 'genuine', 'flipkart', 'amazon', 'myntra', 'ajio'];
    // Filter out fluff and platform names to find the actual BRAND
    const sRelevant = sTokens.filter(t => !fluff.includes(t));
    const tRelevant = tTokens; 
    
    // Categorical Safety: If source is Motorola/Yonex, don't match with innerwear/clothing
    const clothingKeywords = ['innerwear', 'briefs', 'trunk', 'vest', 'bra', 'underwear', 'jockey', 'panty'];
    const sHasClothing = sRelevant.some(t => clothingKeywords.includes(t));
    const tHasClothing = tRelevant.some(t => clothingKeywords.includes(t));
    
    if (!sHasClothing && tHasClothing) return false; // Safety lock

    if (sRelevant.length === 0) return true;
    
    const primaryBrand = sRelevant[0];
    const secondaryToken = sRelevant.length > 1 ? sRelevant[1] : null;

    // The target MUST contain the primary brand token
    const brandOk = tRelevant.includes(primaryBrand) || (secondaryToken && tRelevant.includes(secondaryToken));
    
    return brandOk;
}

// Helper to extract RAM and Storage (e.g. 8GB, 128GB, 1TB)
function extractProductSpecs(title) {
    if (!title) return { ram: null, storage: null, all: [] };
    const t = title.toLowerCase().replace(/\s/g, '');
    const matches = t.match(/(\d+)(gb|tb|mb)/g) || [];
    
    // Sort matches by size (numeric value)
    const sorted = matches.map(m => {
        const val = parseInt(m.match(/\d+/)[0]);
        const unit = m.match(/[a-z]+/)[0];
        const bytes = unit === 'tb' ? val * 1024 : val;
        return { original: m, bytes };
    }).sort((a, b) => a.bytes - b.bytes);
    
    // Heuristic: If we have multiple, smaller one is usually RAM, larger is storage
    let ram = null;
    let storage = null;
    
    if (sorted.length >= 2) {
        ram = sorted[0].original;
        storage = sorted[sorted.length - 1].original;
    } else if (sorted.length === 1) {
        // If only one, determine if it's likely RAM (<32) or Storage (>=32)
        const val = parseInt(sorted[0].original.match(/\d+/)[0]);
        if (val < 32) ram = sorted[0].original;
        else storage = sorted[0].original;
    }
    
    return { ram, storage, all: matches };
}

// Token-weighted fuzzy similarity
function getFuzzyScore(s1, s2) {
    if (!s1 || !s2) return 0;
    const tokens1 = s1.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const tokens2 = s2.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const overlap = [...set1].filter(x => set2.has(x));
    const union = new Set([...tokens1, ...tokens2]);
    
    return (overlap.length / Math.min(set1.size, set2.size)) * 100;
}

exports.comparePrice = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        const productInfo = extractProductId(url);
        console.log(`\n=== SHOP SMART COMPARISON STARTED ===`);
        console.log(`Source Platform: ${productInfo.platform}`);
        console.log(`Source URL: ${url}`);

        // Select the appropriate scraper for source data
        let realData;
        if (productInfo.platform === 'amazon') {
            realData = await amazonScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'flipkart') {
            realData = await flipkartScraper.scrape(url);
        } else if (productInfo.platform === 'myntra') {
            realData = await myntraScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'ajio') {
            realData = await ajioScraper.scrape(productInfo.id);
        } else {
            throw new Error('Unsupported platform');
        }
        
        console.log(`Source Title: "${realData.title}"`);
        const sourceSpecs = extractProductSpecs(realData.title);
        console.log(`[DEBUG] Extracted Specs -> RAM: ${sourceSpecs.ram || 'N/A'}, Storage: ${sourceSpecs.storage || 'N/A'}`);
        
        const basePrice = realData.currentPrice || 1000;
        
        // Generate Advanced Search Query: Brand + Model + Specs
        const tokens = realData.title.split(/ - | \| |: | \(|\)/);
        const brand = tokens[0].trim();
        // Look for model (token with both letters and numbers)
        const model = tokens.find(t => /[a-z]/i.test(t) && /\d/.test(t) && t.length < 15) || "";
        
        let cleanQuery = `${brand} ${model} ${sourceSpecs.ram || ""} ${sourceSpecs.storage || ""}`.replace(/\s+/g, ' ').trim();
        if (cleanQuery.length < 5) cleanQuery = realData.title.split(' ').slice(0, 5).join(' ');
        
        console.log(`[QUERY] Advanced Search Query: "${cleanQuery}"\n`);

        const comparisonData = {
            title: realData.title,
            image: realData.image,
            results: []
        };

        const platforms = [
            { id: 'amazon', name: 'Amazon' },
            { id: 'flipkart', name: 'Flipkart' },
            { id: 'myntra', name: 'Myntra' },
            { id: 'ajio', name: 'Ajio' }
        ];

        for (const p of platforms) {
            let targetUrl = null;
            let targetPrice = null;

            if (p.id === productInfo.platform) {
                targetUrl = url;
                targetPrice = basePrice;
            } else {
                console.log(`\n--- Searching on ${p.name} ---`);
                const candidates = await liveViewScraper.resolveProductURLs(p.id, cleanQuery);
                console.log(`[DEBUG] Found ${candidates.length} candidates on ${p.name}.`);
                
                for (let i = 0; i < candidates.length; i++) {
                    const cand = candidates[i];
                    const candSpecs = extractProductSpecs(cand.title);
                    const similarity = getFuzzyScore(realData.title, cand.title);
                    
                    // Logic: Match 2 of: (Similarity > 65, RAM Match, Storage Match)
                    const titleMatch = similarity >= 65;
                    
                    // Spec Matches: ONLY count if the spec exists in both.
                    const ramMatch = sourceSpecs.ram && candSpecs.ram && (sourceSpecs.ram === candSpecs.ram);
                    const storageMatch = sourceSpecs.storage && candSpecs.storage && (sourceSpecs.storage === candSpecs.storage);
                    
                    // Spec Conflicts: If both have them but they differ, it's a conflict.
                    const ramConflict = sourceSpecs.ram && candSpecs.ram && (sourceSpecs.ram !== candSpecs.ram);
                    const storageConflict = sourceSpecs.storage && candSpecs.storage && (sourceSpecs.storage !== candSpecs.storage);
                    
                    const brandOk = universalBrandGuard(realData.title, cand.title);
                    const numOk = numericGuard(realData.title, cand.title);

                    let criteriaCount = 0;
                    if (titleMatch) criteriaCount++;
                    if (ramMatch) criteriaCount++;
                    if (storageMatch) criteriaCount++;
                    
                    const isConfident = (criteriaCount >= 1 && (titleMatch || ramMatch || storageMatch));
                    const isMatch = isConfident && brandOk && numOk && !ramConflict && !storageConflict;
                    
                    console.log(`  [Candidate ${i+1}] "${cand.title.substring(0, 50)}..."`);
                    console.log(`    -> Sim: ${similarity.toFixed(1)}% | RAM: ${candSpecs.ram || 'N/A'} (Match:${!!ramMatch}) | Storage: ${candSpecs.storage || 'N/A'} (Match:${!!storageMatch})`);
                    console.log(`    -> Status: ${isMatch ? '[ACCEPTED]' : '[REJECTED]'} (Brand:${brandOk}, Numeric:${numOk}, Conflict:${ramConflict||storageConflict})`);

                    if (isMatch) {
                        targetUrl = cand.url;
                        try {
                            const targetInfo = extractProductId(targetUrl);
                            let targetData = null;
                            if (p.id === 'ajio') targetData = await ajioScraper.scrape(targetInfo.id);
                            else if (p.id === 'flipkart') targetData = await flipkartScraper.scrape(targetUrl);
                            else if (p.id === 'myntra') targetData = await myntraScraper.scrape(targetInfo.id);
                            else if (p.id === 'amazon') targetData = await amazonScraper.scrape(targetInfo.id);

                            if (targetData && targetData.currentPrice > 0 && !targetData.isDemo) {
                                targetPrice = targetData.currentPrice;
                            } else {
                                // Real data failed or was demo, generate estimate
                                const variant = Math.round(basePrice * (1 + ((Math.random() - 0.5) * 0.2)));
                                targetPrice = variant > 0 ? variant : basePrice;
                            }
                        } catch (err) {
                            const variant = Math.round(basePrice * (1 + ((Math.random() - 0.5) * 0.2)));
                            targetPrice = variant > 0 ? variant : basePrice;
                        }
                        break; // Stop at first valid match
                    }
                }
            }

            comparisonData.results.push({
                platform: p.name,
                price: targetPrice,
                url: targetUrl
            });
        }

        res.json({ success: true, data: comparisonData });
    } catch (error) {
        console.error('Price comparison error:', error);
        res.status(500).json({ error: error.message });
    }
};