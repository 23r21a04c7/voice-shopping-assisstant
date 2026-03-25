const amazonScraper = require('../scrapers/amazonScraper');
const flipkartScraper = require('../scrapers/flipkartScraper');
const myntraScraper = require('../scrapers/myntraScraper');
const ajioScraper = require('../scrapers/ajioScraper');
const extractProductId = require('../utils/extractProductId.js');

exports.trackPrice = async (req, res) => {
    try {
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL required' });
        }

        const productInfo = extractProductId(url);

        // Select the appropriate scraper based on platform
        let priceData;
        if (productInfo.platform === 'amazon') {
            priceData = await amazonScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'flipkart') {
            // Pass full URL to Flipkart scraper as it needs the complete URL structure
            priceData = await flipkartScraper.scrape(url);
        } else if (productInfo.platform === 'myntra') {
            priceData = await myntraScraper.scrape(productInfo.id);
        } else if (productInfo.platform === 'ajio') {
            priceData = await ajioScraper.scrape(productInfo.id);
        } else {
            throw new Error('Unsupported platform');
        }

        res.json({ success: true, data: priceData });
    } catch (error) {
        console.error('Price tracking error:', error);
        res.status(500).json({ error: error.message });
    }
};