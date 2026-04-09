const liveViewScraper = require('../scrapers/liveViewScraper');

/**
 * LIVE VIEW CONTROLLER — Photo Hunter Aggregator
 * 
 * Major Fixes:
 * 1. Aggressive Threshold: Increased fallback threshold to 15 photos to ensure visual proof.
 * 2. Precision Title Matching: Improved stripping of generic product tags and ASINs.
 * 3. Cross-Site Aggregation: Automatically searches multiple major platforms to fill photo gaps.
 */

exports.extractPhotos = async (req, res) => {
    try {
        let { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: 'Product URL or search query is required' });
        }
        
        let reviews = [];
        let title = '';

        // ─── Smart Search Detection ───
        const isUrl = url.startsWith('http');
        const isSearch = !isUrl || url.includes('/s?k=') || url.includes('/search?q=') || url.includes('/search/') || url.includes('s=');

        if (isSearch) {
            let searchTerm = url;
            if (isUrl) {
                try {
                    const parsedUrl = new URL(url);
                    searchTerm = parsedUrl.searchParams.get('k') || parsedUrl.searchParams.get('q') || parsedUrl.searchParams.get('s') || parsedUrl.searchParams.get('text') || '';
                } catch(e) {}
            } else if (url.includes('s=')) {
                const match = url.match(/s=([^&]*)/);
                if (match) searchTerm = match[1];
            }
            searchTerm = decodeURIComponent(searchTerm).replace(/\+/g, ' ').trim();
            console.log(`[Controller] Detected search query: "${searchTerm}"`);
            
            // Try to resolve the actual product URL from Amazon first
            const resolvedUrl = await liveViewScraper.resolveProductURL('amazon', searchTerm);
            if (resolvedUrl) {
                url = resolvedUrl; 
                console.log(`[Controller] Resolved to product URL: ${url}`);
            } else {
                title = searchTerm; // fallback trigger
            }
        }

        if (url.startsWith('http')) {
            console.log(`[Controller] Analyzing core product: ${url}`);
        
            try {
                const result = await liveViewScraper.extractReviews(url);
                reviews = result.reviews || [];
                if (result.title) title = result.title;
            } catch (error) {
                console.log(`[Controller] Primary scraper failed: ${error.message}`);
            }
        }

        let photoCount = reviews.filter(r => r.image).length;
        let textCount = reviews.filter(r => !r.image).length;
        
        // ─── Precision Title Normalization ───
        if (!title || title.toLowerCase().includes('page not found') || title.toLowerCase().includes('sign in') || title.length < 5) {
            // Extract from URL slugs: amazon.in/Product-Name-Here/dp/...
            const urlMatch = url.match(/amazon\.in\/([^\/?]+)/i) || 
                             url.match(/flipkart\.com\/([^\/?]+)/i) || 
                             url.match(/myntra\.com\/([^\/?]+)/i) ||
                             url.match(/ajio\.com\/([^\/?]+)/i);
            
            if (urlMatch) {
                title = urlMatch[1]
                    .replace(/-/g, ' ')
                    .replace(/[\/](dp|p|buy|pd)$/i, '')
                    .replace(/(\w{10})$/i, '') // remove trailing ASIN/IDs
                    .trim();
            }
        }

        // Clean title: Take first 6 words (usually the brand + model)
        const cleanTitle = title ? title.split(' ').slice(0, 6).join(' ').replace(/[^\w\s-]/g, '').trim() : '';

        console.log(`[Controller] Primary check: ${photoCount} Photos found for "${cleanTitle}".`);

        /** 
         * 🕵️ PHOTO HUNTER FALLBACK AGGREGATOR
         * If we have fewer than 15 photos from the main link, we seek more from trusted platforms.
         */
        if (cleanTitle && cleanTitle.length > 8 && photoCount < 15) {
            console.log(`[Controller] Seeking more visual proof for: ${cleanTitle}`);
            
            const platforms = ['amazon', 'flipkart', 'myntra', 'ajio'];
            const targetedPlatforms = platforms.filter(p => !url.toLowerCase().includes(p));
            
            // Parallel Fallback across all other major platforms
            const fallbackPromises = targetedPlatforms.map(platform => 
                liveViewScraper.searchAndExtractLiveView(platform, cleanTitle)
                    .catch(e => {
                        console.error(`[Controller] Fallback error on ${platform}:`, e.message);
                        return [];
                    })
            );

            const allFallbackResults = await Promise.all(fallbackPromises);
            
            allFallbackResults.forEach(results => {
                if (results && results.length > 0) {
                    results.forEach(rev => {
                        // Prevent duplicates and prioritize REAL IMAGES
                        if (rev.image && !reviews.some(r => r.image === rev.image)) {
                            reviews.push(rev);
                        }
                    });
                }
            });
        }

        photoCount = reviews.filter(r => r.image).length;
        console.log(`[Controller] Extraction Complete: Total ${photoCount} High-Res Photos found.`);

        res.json({ success: true, reviews: reviews.slice(0, 50) });
        
    } catch (error) {
        console.error('Reviews Controller Error:', error);
        res.status(500).json({ error: 'Failed to extract reviews.', details: error.message });
    }
};
