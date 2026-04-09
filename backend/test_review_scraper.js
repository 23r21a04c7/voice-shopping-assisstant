const { extractReviews } = require('./scrapers/liveViewScraper');

const TEST_URL = process.argv[2] || 'https://www.amazon.in/YONEX-Unisex-Adult-Badminton-Shoes/dp/B07VGRW8ZN/';

console.log('Testing review extraction on:', TEST_URL);
console.log('This may take 30-60 seconds...\n');

extractReviews(TEST_URL).then(result => {
    console.log('\n=== RESULT ===');
    console.log('Title:', result.title);
    console.log('Total entries:', result.reviews.length);

    const textReviews = result.reviews.filter(r => r.text && !r.image);
    const photoEntries = result.reviews.filter(r => r.image);

    console.log('Text reviews:', textReviews.length);
    console.log('Customer photos:', photoEntries.length);

    if (photoEntries.length > 0) {
        console.log('\n📸 Customer photo URLs:');
        photoEntries.forEach((r, i) => console.log(`  ${i + 1}. ${r.image}`));
    } else {
        console.log('\n❌ NO customer photos found');
    }

    if (textReviews.length > 0) {
        console.log('\n💬 Sample review:');
        console.log(' ', textReviews[0].text.substring(0, 200));
    }
}).catch(err => {
    console.error('\n❌ FAILED:', err.message);
});
