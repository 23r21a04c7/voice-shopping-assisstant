const { extractReviews } = require('./scrapers/liveViewScraper');

const SITES = [
    { name: 'Myntra', url: 'https://www.myntra.com/shoes/adidas/adidas-men-white-originals-stan-smith-sneakers/11388052/buy' },
    { name: 'AJIO', url: 'https://www.ajio.com/nike-men-court-vision-low-sneakers/p/469033325_white' }
];

async function runTest() {
    for (const site of SITES) {
        console.log(`\n--- Testing ${site.name} ---`);
        try {
            const result = await extractReviews(site.url);
            console.log(`Title: ${result.title}`);
            const photos = result.reviews.filter(r => r.image);
            const texts = result.reviews.filter(r => !r.image);
            console.log(`Found ${photos.length} photos and ${texts.length} text reviews.`);
            
            if (photos.length > 0) {
                console.log('Sample Photo URL:', photos[0].image);
            }
        } catch (e) {
            console.error(`Error testing ${site.name}:`, e.message);
        }
    }
}

runTest();
