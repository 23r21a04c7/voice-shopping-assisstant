const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

exports.scrape = async (urlOrProductId) => {
    let browser;
    try {
        let url;
        let cleanId; 

        if (urlOrProductId.startsWith('http')) {
            url = urlOrProductId;
            const match = urlOrProductId.match(/\/p\/(?:itm)?([a-zA-Z0-9]+)/);
            cleanId = match ? match[1] : 'unknown';
        } else {
            cleanId = urlOrProductId.startsWith('itm') ? urlOrProductId : `itm${urlOrProductId}`;
            url = `https://www.flipkart.com/product/p/${cleanId}`;
        }

        console.log(`Scraping Flipkart via Puppeteer: ${url}`);

        browser = await puppeteerExtra.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });

        const page = await browser.newPage();
        
        // Anti-bot stealth user agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 25000 });
        
        // Briefly wait for price render
        await new Promise(resolve => setTimeout(resolve, 1500));

        const result = await page.evaluate(() => {
            const titleEl = document.querySelector('.B_NuCI') || document.querySelector('.VU-ZEz') || document.querySelector('[class*="pdp-name"]') || document.querySelector('h1');
            
            // Priority: The main struck-through / highlighted actual price. Flipkart frequently uses .Nx9bqj
            const priceEl = document.querySelector('.Nx9bqj.CrvsTz') || document.querySelector('.Nx9bqj') || document.querySelector('._30jeq3') || document.querySelector('._1_WHN1');
            
            // Special Flipkart Sale Banners (e.g., "WOW! DEAL Buy at ₹985")
            // This grabs any deeply discounted promotion text if the main price is hidden
            const promoEl = Array.from(document.querySelectorAll('div, span')).find(el => el.innerText && el.innerText.includes('Buy at ₹'));
            let promoPriceText = null;
            if (promoEl) {
                const match = promoEl.innerText.match(/Buy at [₹Rs.\s]*([0-9,]+)/i);
                if (match) promoPriceText = match[1];
            }

            const imgEl = document.querySelector('._396cs4 img') || document.querySelector('._2r_T1I img') || document.querySelector('img[loading="eager"]');

            return {
                title: titleEl ? titleEl.innerText.trim() : null,
                priceText: priceEl ? priceEl.innerText : null,
                promoPriceText: promoPriceText,
                img: imgEl ? imgEl.src : null
            };
        });

        await browser.close();

        let price = null;
        
        // Always prioritize the promo/offer price if it exists (e.g. "Buy at ₹985")
        if (result.promoPriceText) {
            price = parseFloat(result.promoPriceText.replace(/[,₹Rs.\s]/g, '').trim());
        } else if (result.priceText) {
            price = parseFloat(result.priceText.replace(/[,₹Rs.\s]/g, '').trim());
        }

        if (!result.title || !price) {
            console.log('Could not extract product data from Puppeteer, using demo data');
            return generateDemoData(urlOrProductId);
        }

        console.log('Flipkart scraping successful:', { title: result.title, price });

        return {
            title: result.title,
            currentPrice: price,
            lowestPrice: Math.round(price * 0.95),
            availability: 'In stock',
            image: result.img,
            platform: 'Flipkart',
            priceHistory: generateMockPriceHistory(price),
            isDemo: false
        };

    } catch (error) {
        if (browser) await browser.close();
        console.error('Flipkart Puppeteer scraping error:', error.message);
        return generateDemoData(urlOrProductId);
    }
};

function generateDemoData(urlOrProductId) {
    const demoPrice = 15999;
    let fallbackTitle = 'Flipkart Product (Demo)';
    
    // Extract sensible name from URL if possible
    if (urlOrProductId && urlOrProductId.includes('.com/')) {
        try {
            const urlObj = new URL(urlOrProductId);
            // Paths are usually /product-slug/p/itm... or /p/p/itm...
            let slug = urlObj.pathname.split('/')[1];
            
            // If the first part is 'p' or 'product', the name might be later or missing
            if ((slug === 'p' || slug === 'product') && urlObj.pathname.split('/')[2]) {
                slug = urlObj.pathname.split('/')[2];
            }

            if (slug && slug !== 'p' && slug !== 'product') {
                // Convert 'motorola-g35-5g-guava-red-128-gb' to 'Motorola G35 5g Guava Red 128 Gb'
                fallbackTitle = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            }
        } catch (e) {}
    }

    return {
        title: fallbackTitle,
        currentPrice: demoPrice,
        lowestPrice: Math.round(demoPrice * 0.92),
        availability: 'Check on Flipkart',
        image: null,
        platform: 'Flipkart',
        priceHistory: generateMockPriceHistory(demoPrice),
        isDemo: true,
        demoMessage: 'Note: Flipkart has anti-scraping measures. Showing demo data.'
    };
}

function generateMockPriceHistory(currentPrice) {
    if (!currentPrice || currentPrice === 0) return [];
    const history = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * 0.1;
        history.push({
            date: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
            price: Math.round(currentPrice * (1 + variation))
        });
    }
    return history;
}
