const liveViewScraper = require('./scrapers/liveViewScraper');
const amazonScraper = require('./scrapers/amazonScraper');
const extractProductId = require('./utils/extractProductId.js');
const ajioScraper = require('./scrapers/ajioScraper');

function calculateSimilarity(s1, s2) {
    if (!s1 || !s2) return 0;
    const words1 = new Set(s1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const words2 = new Set(s2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return intersection.size / union.size;
}

async function testRepro(amazonUrl) {
    try {
        console.log(`\n--- Testing Repro for URL: ${amazonUrl} ---`);
        const productInfo = extractProductId(amazonUrl);
        console.log(`Platform: ${productInfo.platform}, ID: ${productInfo.id}`);

        // Scrape Amazon (or use mock if it fails)
        let realData;
        try {
            realData = await amazonScraper.scrape(productInfo.id);
            console.log(`Amazon Title: "${realData.title}"`);
        } catch (e) {
            console.log('Amazon scrape failed, using mock data for test...');
            realData = { title: "Levi's Men's 511 Slim Fit Jeans", currentPrice: 1599 };
        }

        // Logic from priceController.js
        let cleanTitle = realData.title;
        if (cleanTitle) {
            cleanTitle = cleanTitle.replace(/\s*\(.*?\)/g, '');
            cleanTitle = cleanTitle.split(/ - | \| |: /)[0].trim();
            const words = cleanTitle.split(/\s+/);
            if (words.length > 6) {
                cleanTitle = words.slice(0, 6).join(' ');
            }
        }
        console.log(`Cleaned Title for search: "${cleanTitle}"`);

        console.log('\nResolving on Ajio...');
        const resolution = await liveViewScraper.resolveProductURL('ajio', cleanTitle);
        
        if (resolution && resolution.url) {
            console.log(`Matched Title: "${resolution.title}"`);
            console.log(`Matched URL: ${resolution.url}`);
            
            const similarity = calculateSimilarity(cleanTitle, resolution.title);
            console.log(`Similarity Score: ${similarity.toFixed(2)}`);
            
            if (similarity > 0.3) {
                console.log('✅ CONFIDENT MATCH');
                console.log('Fetching real Ajio price...');
                const targetInfo = extractProductId(resolution.url);
                const ajioData = await ajioScraper.scrape(targetInfo.id);
                console.log(`Final Ajio Price: ${ajioData.currentPrice} ${ajioData.isDemo ? '(DEMO)' : '(REAL)'}`);
            } else {
                console.log('❌ MATCH REJECTED (Too dissimilar)');
            }
        } else {
            console.log('No Ajio URL found');
        }

    } catch (error) {
        console.error('Error in repro test:', error);
    }
}

// Example Amazon Fashion URL (Levi's Jeans)
const testUrl = 'https://www.amazon.in/Levis-Mens-511-Slim-Jeans/dp/B0797MGY93';
testRepro(testUrl);
