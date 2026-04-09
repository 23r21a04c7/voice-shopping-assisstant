const puppeteer = require('puppeteer');

(async () => {
    const url = 'https://www.ajio.com/p/469614777_black';
    console.log(`Scraping Ajio with Puppeteer: ${url}`);
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        const title = await page.evaluate(() => {
            const el = document.querySelector('.prod-name') || document.querySelector('h1.product-title') || document.querySelector('h1');
            return el ? el.innerText.trim() : null;
        });

        const priceText = await page.evaluate(() => {
            const el = document.querySelector('.prod-sp') || document.querySelector('.price') || document.querySelector('[class*="price"]');
            return el ? el.innerText.trim() : null;
        });

        console.log('Title:', title);
        console.log('Price:', priceText);

    } catch (error) {
        console.error('Puppeteer error:', error.message);
    } finally {
        await browser.close();
    }
})();
