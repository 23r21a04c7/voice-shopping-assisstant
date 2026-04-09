const liveViewScraper = require('./backend/scrapers/liveViewScraper');

async function test() {
    const url = 'https://www.amazon.in/Apple-iPhone-16-128-GB/product-reviews/B0DGHPK98Q'; // Real Amazon product reviews URL
    try {
        console.log('Testing extraction for:', url);
        const { reviews, title } = await liveViewScraper.extractReviews(url);
        console.log('Title:', title);
        console.log('Found', reviews.length, 'reviews');
        const photos = reviews.filter(r => r.image);
        console.log('Found', photos.length, 'photos');
        photos.forEach((p, i) => {
            console.log(`Photo ${i+1}: ${p.image.substring(0, 100)}...`);
        });
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
