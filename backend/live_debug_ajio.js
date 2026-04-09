const priceController = require('./controllers/priceController');
const extractProductId = require('./utils/extractProductId.js');
const flipkartScraper = require('./scrapers/flipkartScraper');
const liveViewScraper = require('./scrapers/liveViewScraper');

async function debugCompare() {
    const url = 'https://www.flipkart.com/motorola-g35-5g-guava-red-128-gb/p/itm60f38b907471d';
    
    console.log("=== STARTING LIVE DEBUG PROBE ===");
    console.log(`Input URL: ${url}`);
    
    // 1. Scrape Source (Mocking the controller flow)
    const realData = await flipkartScraper.scrape(url);
    console.log(`\nSOURCE DATA:`);
    console.log(`Title: "${realData.title}"`);
    console.log(`Is Demo: ${realData.isDemo}`);
    
    const sourceSpecs = { ram: "4GB", storage: "128GB" }; // Hardcoded based on URL for this probe
    console.log(`Assumed Specs -> RAM: ${sourceSpecs.ram}, Storage: ${sourceSpecs.storage}`);

    const cleanQuery = "Motorola G35 4GB 128GB";
    console.log(`\nSEARCH QUERY: "${cleanQuery}"`);
    
    // 2. Search Ajio
    console.log("\n--- SEARCHING AJIO ---");
    const candidates = await liveViewScraper.resolveProductURLs('ajio', cleanQuery);
    console.log(`Found ${candidates.length} candidates on Ajio.`);

    for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        console.log(`\nEvaluating Candidate ${i+1}: "${cand.title}"`);
        
        // Manual trace of matching logic
        const tTokens = cand.title.toLowerCase().replace(/[-_,|/:()\[\]{}'"]/g, ' ').split(/\s+/);
        const brandOk = tTokens.includes("motorola");
        
        console.log(`  -> Brand 'motorola' found in target? ${brandOk}`);
        if (!brandOk) {
            console.log(`  -> [REJECTED] Brand mismatch.`);
        }
    }
}

debugCompare().catch(console.error);
