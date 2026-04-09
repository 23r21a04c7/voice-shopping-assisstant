const liveViewScraper = require('./scrapers/liveViewScraper');

async function testProduct(name, url) {
    console.log(`\n--- Testing ${name} ---`);
    console.log(`URL: ${url}`);
    try {
        const { reviews, title } = await liveViewScraper.extractReviews(url);
        console.log(`Title: ${title}`);
        const photos = (reviews || []).filter(r => r.image);
        console.log(`Found ${reviews.length} total reviews and ${photos.length} photos.`);
        if (photos.length > 0) {
            console.log(`Sample Photo: ${photos[0].image.substring(0, 80)}...`);
        }
    } catch (e) {
        console.error(`Test finished with error: ${e.message}`);
    }
}

async function runAllTests() {
    // 1. Electronics (iPhone 16)
    await testProduct('iPhone 16 (Amazon)', 'https://www.amazon.in/Apple-iPhone-16-128-GB/product-reviews/B0DGHPK98Q');
    
    // 2. Fashion (Nike Shoes - Flipkart)
    await testProduct('Nike Shoes (Flipkart)', 'https://www.flipkart.com/nike-revolution-7-running-shoes-men/product-reviews/itm6d4d12c8e5ebd?pid=SHOGYGCFZGZVZGZG');
    
    // 3. Home Decor (Table Lamp - Amazon)
    await testProduct('Table Lamp (Amazon)', 'https://www.amazon.in/Philips-61013-Air-Desk-Light/product-reviews/B00S6E2M9A');
}

runAllTests();
