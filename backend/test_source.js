const liveViewScraper = require('./scrapers/liveViewScraper');
const flipkartScraper = require('./scrapers/flipkartScraper');
const amazonScraper = require('./scrapers/amazonScraper');
const extractProductId = require('./utils/extractProductId.js');

function calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const words1 = new Set(s1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(s2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}

function brandMatch(sourceTitle, targetTitle) {
    if (!sourceTitle || !targetTitle) return true;
    const s = sourceTitle.toLowerCase();
    const t = targetTitle.toLowerCase();
    const brands = ['apple', 'samsung', 'nike', 'adidas', 'levis', 'puma', 'sony'];
    for (const b of brands) {
        if (s.includes(b)) return t.includes(b);
    }
    return true;
}

async function testSource(sourceUrl) {
    try {
        console.log(`\n--- Testing Source URL: ${sourceUrl} ---`);
        const productInfo = extractProductId(sourceUrl);
        console.log(`Source Platform: ${productInfo.platform}`);

        let realData;
        if (productInfo.platform === 'flipkart') {
             realData = await flipkartScraper.scrape(sourceUrl);
        } else {
             console.log('Skipping real scrape for this test...');
             realData = { title: "Nike Men's Revolution 6 Running Shoes", currentPrice: 2495 };
        }
        
        console.log(`Source Title: "${realData.title}"`);

        // Clean title logic from priceController.js
        let cleanTitle = realData.title;
        if (cleanTitle) {
            cleanTitle = cleanTitle.replace(/\s*\(.*?\)/g, '');
            cleanTitle = cleanTitle.split(/ - | \| |: | - Buy /)[0].trim();
            const words = cleanTitle.split(/\s+/);
            if (words.length > 5) cleanTitle = words.slice(0, 5).join(' ');
        }
        console.log(`Cleaned Title for search: "${cleanTitle}"`);

        const targets = ['amazon', 'myntra', 'ajio'];
        for (const platform of targets) {
            console.log(`\nResolving on ${platform}...`);
            const resolution = await liveViewScraper.resolveProductURL(platform, cleanTitle);
            if (resolution) {
                const sim = calculateSimilarity(cleanTitle, resolution.title);
                const bOk = brandMatch(cleanTitle, resolution.title);
                console.log(`Found: "${resolution.title}"`);
                console.log(`Similarity: ${sim.toFixed(2)}, Brand Match: ${bOk}`);
                if (sim > 0.4 && bOk) console.log('✅ MATCH ACCEPTED');
                else console.log('❌ MATCH REJECTED');
            } else {
                console.log('Not found');
            }
        }

    } catch (error) {
        console.error('Test error:', error);
    }
}

// Example Flipkart Fashion URL
const testUrl = 'https://www.flipkart.com/nike-revolution-6-nn-running-shoes-men/p/itm227844199f1a0';
testSource(testUrl);
