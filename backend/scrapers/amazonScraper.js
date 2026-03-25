const axios = require('axios');
const cheerio = require('cheerio');

exports.scrape = async (productId) => {
    try {
        const url = `https://www.amazon.in/dp/${productId}`;
        console.log(`Scraping Amazon: ${url}`);

        // Make HTTP request with proper headers to mimic a browser
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: 15000
        });

        // Load HTML into cheerio
        const $ = cheerio.load(response.data);

        // Extract product title
        const title = $('#productTitle').text().trim() || 'Product';

        // Extract price - try multiple selectors
        let price = null;

        // Try main price display
        const priceWhole = $('.a-price-whole').first().text();
        const priceFraction = $('.a-price-fraction').first().text();

        if (priceWhole) {
            const wholePrice = priceWhole.replace(/[,₹]/g, '').trim();
            const fraction = priceFraction ? priceFraction.trim() : '00';
            price = parseFloat(`${wholePrice}.${fraction}`);
        }

        // Fallback to other price selectors
        if (!price || isNaN(price)) {
            const priceText = $('.a-price .a-offscreen').first().text();
            if (priceText) {
                price = parseFloat(priceText.replace(/[,₹]/g, '').trim());
            }
        }

        // Another fallback
        if (!price || isNaN(price)) {
            const priceSymbol = $('.a-price-symbol').first().text();
            const priceValue = $('.a-price-whole').first().text();
            if (priceValue) {
                price = parseFloat(priceValue.replace(/[,₹]/g, '').trim());
            }
        }

        // Extract availability
        const availability = $('#availability span').text().trim() || 'Check availability';

        // Extract image
        const image = $('#landingImage').attr('src') || $('#imgBlkFront').attr('src') || null;

        const data = {
            title,
            currentPrice: price || 0,
            lowestPrice: price || 0,
            availability,
            image,
            platform: 'Amazon',
            priceHistory: generateMockPriceHistory(price)
        };

        console.log('Amazon scraping successful:', { title, price });
        return data;

    } catch (error) {
        console.error('Amazon scraping error:', error.message);
        throw new Error(`Failed to scrape Amazon: ${error.message}`);
    }
};

// Helper function to generate mock price history
function generateMockPriceHistory(currentPrice) {
    if (!currentPrice || currentPrice === 0) return [];

    const history = [];
    const today = new Date();

    // Generate 30 days of mock data
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Create realistic price variations (±5-10%)
        const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
        const price = Math.round(currentPrice * (1 + variation));

        history.push({
            date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            price: price
        });
    }

    return history;
}
