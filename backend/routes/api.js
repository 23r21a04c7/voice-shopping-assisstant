const express = require('express');
const router = express.Router();
const axios = require('axios');
const priceController = require('../controllers/priceController.js');
const liveViewController = require('../controllers/liveViewController.js');
const authRoutes = require('./authRoutes.js');

// Mount auth routes under /api/auth
router.use('/auth', authRoutes);

// Price and Dashboard routes
if (priceController && priceController.trackPrice) {
    router.post('/track-price', priceController.trackPrice);
} else {
    console.error('❌ Critical Error: priceController.trackPrice is undefined');
}

if (priceController && priceController.comparePrice) {
    router.post('/compare-price', priceController.comparePrice);
}

// Live View / Reviews routes
if (liveViewController && liveViewController.extractPhotos) {
    router.post('/live-view', liveViewController.extractPhotos);
} else {
    console.error('❌ Critical Error: liveViewController.extractPhotos is undefined');
}

// Image Proxy — bypasses CORS/hotlink restrictions from Amazon, Flipkart, Myntra, AJIO
router.get('/image-proxy', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).send('Missing url param');

    // Only allow known shopping CDN domains for security
    const ALLOWED_DOMAINS = [
        'media-amazon.com', 'm.media-amazon.com',
        'rukminim', 'blobio',
        'assets.myntassets.com', 'myntra.myntassets.com',
        'assets.ajio.com', 'kalinganager.ajio.com'
    ];
    const isAllowed = ALLOWED_DOMAINS.some(d => url.includes(d));
    if (!isAllowed) return res.status(403).send('Domain not allowed');

    try {
        const response = await axios.get(url, {
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                'Referer': url.includes('amazon') ? 'https://www.amazon.in/' :
                           url.includes('flipkart') || url.includes('rukminim') ? 'https://www.flipkart.com/' :
                           url.includes('myntra') ? 'https://www.myntra.com/' :
                           url.includes('ajio') ? 'https://www.ajio.com/' : 'https://www.google.com/'
            },
            timeout: 10000
        });

        const contentType = response.headers['content-type'] || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache 1 day
        response.data.pipe(res);
    } catch (e) {
        console.error('[Image Proxy] Failed:', e.message);
        res.status(502).send('Failed to fetch image');
    }
});

router.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

module.exports = router;