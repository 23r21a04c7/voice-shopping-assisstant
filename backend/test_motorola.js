const liveViewScraper = require('./scrapers/liveViewScraper');

async function testResolution() {
    console.log("Resolving Amazon URL for 'MOTOROLA g35 5G'...");
    const resolution = await liveViewScraper.resolveProductURL('amazon', 'MOTOROLA g35 5G');
    console.log(resolution);
}

testResolution().catch(console.error);
