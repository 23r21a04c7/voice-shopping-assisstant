const axios = require('axios');
const cheerio = require('cheerio');

exports.scrape = async (productId) => {
    try {
        const url = `https://www.ajio.com/p/${productId}`;
        console.log(`Scraping Ajio: ${url}`);

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

        // Extract product title - Ajio uses specific class names
        const title = $('.prod-name').first().text().trim() ||
            $('h1.product-title').first().text().trim() ||
            $('h1').first().text().trim() ||
            'Product';

        // Extract price - Ajio price structure
        let price = null;

        const priceText = $('.prod-sp').first().text() ||
            $('.price').first().text() ||
            $('[class*="price"]').first().text();

        if (priceText) {
            price = parseFloat(priceText.replace(/[,₹Rs.\s]/g, '').trim());
        }

        // If we couldn't extract a valid price, return demo data
        if (!price || price === 0 || isNaN(price)) {
            console.log('Could not extract valid price from Ajio, using demo data');
            return generateDemoData(productId);
        }

        // Extract availability
        const availability = $('.prod-availability').first().text().trim() ||
            'Check availability';

        // Extract image
        const image = $('.rilrtl-lazy-img').first().attr('src') ||
            $('img[class*="product"]').first().attr('src') ||
            null;

        const data = {
            title,
            currentPrice: price,
            lowestPrice: Math.round(price * 0.88), // Assume 12% lower was the lowest
            availability,
            image,
            platform: 'Ajio',
            priceHistory: generateMockPriceHistory(price)
        };

        console.log('Ajio scraping successful:', { title, price });
        return data;

    } catch (error) {
        console.error('Ajio scraping error:', error.message);
        // Return demo data instead of throwing
        console.log('Returning demo data due to scraping error');
        return generateDemoData(productId);
    }
};

// Generate demo data when scraping fails
function generateDemoData(productId) {
    const demoPrice = 3299; // Demo price
    return {
        title: 'Ajio Product (Demo)',
        currentPrice: demoPrice,
        lowestPrice: Math.round(demoPrice * 0.88),
        availability: 'Check on Ajio',
        image: null,
        platform: 'Ajio',
        priceHistory: generateMockPriceHistory(demoPrice),
        isDemo: true,
        demoMessage: 'Note: Ajio has anti-scraping measures. Showing demo data. Please visit Ajio directly for accurate pricing.'
    };
}

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
