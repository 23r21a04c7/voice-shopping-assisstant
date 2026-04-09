const priceController = require('./controllers/priceController');
const liveViewScraper = require('./scrapers/liveViewScraper');

async function debugAjioMismatch() {
    const sourceTitle = "MOTOROLA g35 5G (Guava Red, 128 GB) (4 GB RAM)";
    const ajioTitle = "Jockey Men's Cotton Innerwear";
    
    // Test helper functions
    const { extractProductSpecs, getFuzzyScore, universalBrandGuard, numericGuard } = require('./controllers/priceController');
    const tokenize = (title) => title.toLowerCase().replace(/[-_,|/:()\[\]{}'"]/g, ' ').split(/\s+/).filter(w => w.length > 0);

    console.log("--- DEBUGGING AJIO MISMATCH ---");
    console.log(`Source: ${sourceTitle}`);
    console.log(`Target: ${ajioTitle}`);

    const sourceSpecs = extractProductSpecs(sourceTitle);
    const candSpecs = extractProductSpecs(ajioTitle);
    const similarity = getFuzzyScore(sourceTitle, ajioTitle);
    
    const titleMatch = similarity >= 65;
    const ramMatch = sourceSpecs.ram && candSpecs.ram ? (sourceSpecs.ram === candSpecs.ram) : true;
    const storageMatch = sourceSpecs.storage && candSpecs.storage ? (sourceSpecs.storage === candSpecs.storage) : true;
    
    const brandOk = universalBrandGuard(sourceTitle, ajioTitle);
    const numOk = numericGuard(sourceTitle, ajioTitle);

    console.log(`Similarity Score: ${similarity}%`);
    console.log(`RAM Match: ${ramMatch} (Source: ${sourceSpecs.ram}, Target: ${candSpecs.ram})`);
    console.log(`Storage Match: ${storageMatch} (Source: ${sourceSpecs.storage}, Target: ${candSpecs.storage})`);
    console.log(`Brand Guard: ${brandOk}`);
    console.log(`Numeric Guard: ${numOk}`);

    let criteriaCount = 0;
    if (titleMatch) criteriaCount++;
    if (ramMatch) criteriaCount++;
    if (storageMatch) criteriaCount++;
    
    const finalResult = criteriaCount >= 2 && brandOk && numOk;
    console.log(`Final Result: ${finalResult ? "[ACCEPTED]" : "[REJECTED]"} (Criteria: ${criteriaCount}/3)`);
}

debugAjioMismatch().catch(console.error);
