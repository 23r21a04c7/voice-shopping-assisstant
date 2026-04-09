const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const cheerio = require('cheerio');

puppeteerExtra.use(StealthPlugin());

/**
 * PRODUCTION-GRADE Multi-Site Photo Scraper — Voice Shopping Assistant
 * 
 * Major Fixes:
 * 1. Parallel Aggregation: Optimized for multi-platform search (Amazon, FK, Myntra, AJIO).
 * 2. Visual-First Priority: Skips text-only results to force deep extraction of camera photos.
 * 3. Mobile Stealth Profile: Uses a persistent mobile identity to bypass bot-checks across sites.
 */

function detectPlatform(url) {
    const u = url.toLowerCase();
    if (u.includes('amazon.in') || u.includes('amazon.com')) return 'amazon';
    if (u.includes('flipkart.com')) return 'flipkart';
    if (u.includes('myntra.com')) return 'myntra';
    if (u.includes('ajio.com')) return 'ajio';
    return null;
}

function cleanAmazonUrl(src) {
    if (!src || src.startsWith('data:')) return src;
    return src.replace(/\._[A-Z0-9,._-]+(?=\.(jpg|jpeg|png|gif|webp))/i, '');
}

function filterPhotos(photos, platform) {
    const results = new Set();
    const photoArray = Array.from(photos);

    const SELLER_CATALOG_PATTERNS = [
        '_AC_SX', '_AC_SY', '_AC_UL', '_SR', '_SL', '_CR0,', '_UX', '_US',
        'sprite', 'pixel', 'loading', 'gif', 'transparent', 'favicon', 'logo', 'badge',
        'rating', 'star', 'arrow', 'chevron', 'checkmark', 'cart', 'search'
    ];

    if (platform === 'amazon') {
        photoArray.forEach(src => {
            if (!(src.includes('media-amazon') || src.includes('m.media-amazon'))) return;
            const highRes = cleanAmazonUrl(src);
            if (SELLER_CATALOG_PATTERNS.some(p => src.includes(p))) return;
            results.add(highRes);
        });
    } 
    else if (platform === 'flipkart') {
        const FK_UI = [',30', ',40', ',50', ',80', 'icon', 'header', 'footer', 'logo'];
        photoArray.forEach(src => {
            if (!(src.includes('rukminim') || src.includes('blobio'))) return;
            if (FK_UI.some(p => src.includes(p))) return;
            let cleaned = src;
            if (src.includes('?q=')) cleaned = src.split('?')[0]; 
            results.add(cleaned);
        });
    }
    else {
        const OTHER_UI = ['logo', 'sprite', 'footer', 'icon', 'banner', 'sale', 'placeholder'];
        photoArray.forEach(src => {
            if (!OTHER_UI.some(p => src.toLowerCase().includes(p))) results.add(src);
        });
    }

    return Array.from(results);
}

async function extractWithPuppeteer(url, platform) {
    const browser = await puppeteerExtra.launch({
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-dev-shm-usage',
            '--window-size=414,896', 
            '--disable-blink-features=AutomationControlled'
        ]
    });

    try {
        const page = await browser.newPage();
        const mobileUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1';
        await page.setUserAgent(mobileUA);
        await page.setViewport({ width: 414, height: 896, isMobile: true, hasTouch: true });

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 50000 });
        
        await page.evaluate(async () => {
            for (let i = 0; i < 15; i++) {
                window.scrollBy(0, 800);
                await new Promise(r => setTimeout(r, 450));
            }
        });
        await new Promise(r => setTimeout(r, 1500));

        const result = await page.evaluate((plat) => {
            const reviews = [];
            const photos = new Set();
            
            const SEL = {
                amazon: {
                    review: 'div[id^="customer_review-"], .a-section.review, [data-hook="review"]',
                    text: '.review-text-content, [data-hook="review-body"], .review-text',
                    gallery: '#review-media-gallery-container img, .cr-media-gallery-carousel img, .review-image-tile img, a.review-image-popover-trigger img'
                },
                flipkart: {
                    review: '._27M-N-, .DOjaWF, .qwjRop',
                    text: 'div[class*="t-ZTKy"], .z9E0IG, ._6K-7Co',
                    gallery: '._3HTjBM img, ._2x4cUpz img, ._1W_e-s img'
                },
                myntra: {
                    review: '.user-review-main, .user-review, .u-review',
                    text: '.user-review-reviewText, [class*="reviewText"]',
                    gallery: '.user-review-photo img, .review-images img, img.review-img'
                },
                ajio: {
                    review: '.review-card, .review-container',
                    text: '.review-description, .review-body',
                    gallery: '.review-images img, .reviewImg img, img.review-image'
                }
            };

            const s = SEL[plat];
            if (!s) return { reviews: [], photos: [] };

            document.querySelectorAll(s.gallery).forEach(img => {
                let src = img.src || img.dataset.src || img.getAttribute('data-a-dynamic-image') || '';
                if (src && !src.startsWith('data:')) {
                    if (src.startsWith('{')) {
                        try { const urls = Object.keys(JSON.parse(src)); if (urls.length) src = urls[0]; } catch(e) {}
                    }
                    photos.add(src);
                }
            });

            document.querySelectorAll(s.review).forEach(el => {
                const text = el.querySelector(s.text)?.innerText?.trim();
                if (text && text.length > 15) {
                    reviews.push({ text: text.substring(0, 600), image: null });
                }
                el.querySelectorAll('img').forEach(img => {
                    const src = img.src || img.dataset.src || '';
                    if (src && !src.startsWith('data:')) photos.add(src);
                });
            });

            return { title: document.title, reviews, photos: Array.from(photos) };
        }, platform);

        await browser.close();

        const cleanPhotos = filterPhotos(result.photos, platform);
        
        return {
            title: result.title.split('|')[0].split('-')[0].split(':')[0].trim(),
            reviews: [
                ...result.reviews,
                ...cleanPhotos.map(img => ({ text: null, image: img }))
            ]
        };

    } catch (e) {
        if (browser) await browser.close();
        throw e;
    }
}

async function extractWithCheerio(url, platform) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)',
                'Referer': `https://www.${platform}.com/`
            },
            timeout: 15000
        });

        const $ = cheerio.load(response.data);
        const title = $('title').text();
        const reviews = [];
        const photos = new Set();
        
        if (platform === 'amazon') {
            $('div[id^="customer_review-"], .review').each((i, el) => {
                const text = $(el).find('.review-text-content, [data-hook="review-body"]').text().trim();
                if (text.length > 15) reviews.push({ text, image: null });
                $(el).find('img').each((j, img) => {
                    const src = $(img).attr('src') || $(img).attr('data-src');
                    if (src) photos.add(src);
                });
            });
            $('#review-media-gallery-container img, .review-image-tile img').each((i, img) => {
                const src = $(img).attr('src') || $(img).attr('data-src');
                if (src) photos.add(src);
            });
        }

        const cleanPhotos = filterPhotos(photos, platform);
        if (reviews.length === 0 && cleanPhotos.length === 0) return null;

        return {
            title: title.split('|')[0].trim(),
            reviews: [...reviews, ...cleanPhotos.map(img => ({ text: null, image: img }))]
        };
    } catch (e) { return null; }
}

exports.extractReviews = async (url) => {
    const platform = detectPlatform(url);
    if (!platform) return { title: url, reviews: [] };

    try {
        const rc = await extractWithCheerio(url, platform);
        // ONLY return Cheerio result if it contains CUSTOMER PHOTOS (Visual Priority)
        if (rc && rc.reviews.some(r => r.image)) return rc;
    } catch (e) {}

    try { return await extractWithPuppeteer(url, platform); } catch (e) { return { title: url, reviews: [] }; }
};

exports.resolveProductURLs = async (platform, title) => {
    try {
        const query = encodeURIComponent(title);
        const searchUrls = {
            amazon:   `https://www.amazon.in/s?k=${query}`,
            flipkart: `https://www.flipkart.com/search?q=${query}`,
            myntra:   `https://www.myntra.com/${query}`,
            ajio:     `https://www.ajio.com/search/?text=${query}`
        };
        const searchUrl = searchUrls[platform.toLowerCase()];
        
        const browser = await puppeteerExtra.launch({ headless: "new", args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (platform.toLowerCase() === 'flipkart') await new Promise(r => setTimeout(r, 2000));
        
        const results = await page.evaluate((plat) => {
            const candidates = [];
            
            if (plat === 'amazon') {
                const elements = Array.from(document.querySelectorAll('[data-component-type="s-search-result"]'));
                elements.forEach(el => {
                    const link = el.querySelector('h2 a');
                    if (link) {
                        candidates.push({
                            url: link.href,
                            title: link.innerText.trim()
                        });
                    }
                });
            } else if (plat === 'flipkart') {
                const links = Array.from(document.querySelectorAll('a'))
                    .filter(a => a.href && (a.href.includes('/p/itm') || a.href.includes('/p/p') || a.href.includes('product/p/')));
                
                links.slice(0, 15).forEach(a => {
                    const t = (a.innerText || a.getAttribute('title') || '').trim();
                    if (t.length > 5) {
                        candidates.push({
                            url: a.href,
                            title: t
                        });
                    }
                });
            } else if (plat === 'myntra') {
                const els = Array.from(document.querySelectorAll('.product-base a, .product-card a'));
                els.forEach(el => {
                    candidates.push({
                        url: el.href,
                        title: el.innerText.trim()
                    });
                });
            } else if (plat === 'ajio') {
                const els = Array.from(document.querySelectorAll('.rilrtl-products-list__item a.rilrtl-products-list__link, .item a'));
                els.forEach(el => {
                    candidates.push({
                        url: el.href,
                        title: el.innerText.trim()
                    });
                });
            }
            
            // Deduplicate by URL and limit to top 10
            const unique = [];
            const urls = new Set();
            for (const c of candidates) {
                if (!urls.has(c.url)) {
                    urls.add(c.url);
                    unique.push(c);
                }
            }
            return unique.slice(0, 10);
        }, platform.toLowerCase());
        
        await browser.close();
        return results;
    } catch (e) { 
        console.error(`Resolution error for ${platform}:`, e);
        return []; 
    }
};

exports.resolveProductURL = async (platform, title) => {
    const results = await exports.resolveProductURLs(platform, title);
    return results.length > 0 ? results[0] : null;
};

exports.searchAndExtractLiveView = async (platform, title) => {
    const url = await exports.resolveProductURL(platform, title);
    if (!url) return [];
    try {
        const result = await exports.extractReviews(url);
        return result.reviews || [];
    } catch (e) { return []; }
};
