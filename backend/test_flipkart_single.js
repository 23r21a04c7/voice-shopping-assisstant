const liveViewScraper = require('./backend/scrapers/liveViewScraper');

async function testFlipkart() {
    const url = 'https://www.flipkart.com/nike-revolution-7-running-shoes-men/product-reviews/itm6d4d12c8e5ebd?pid=SHOGYGCFZGZVZGZG';
    try {
        console.log('Testing Flipkart extraction for:', url);
        const { reviews, title } = await liveViewScraper.extractReviews(url);
        console.log('Title:', title);
        console.log('Found', reviews.length, 'total reviews.');
        const photos = reviews.filter(r => r.image);
        console.log('Found', photos.length, 'photos.');
        if (photos.length > 0) {
            console.log('First Photo:', photos[0].image);
        }
    } catch (e) {
        console.error('Test Failed:', e);
    }
}

testFlipkart();
