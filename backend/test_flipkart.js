const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

(async () => {
    const url = 'https://www.flipkart.com/nike-revolution-7-running-shoes-men/p/itm96dd3ba58e201?pid=SHOGTNT7QGFEKKY3';
    
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const priceInfo = await page.evaluate(() => {
            // Find all elements containing ₹
            const elements = Array.from(document.querySelectorAll('*'))
                .filter(el => el.innerText && el.innerText.includes('₹') && el.children.length === 0);
            
            // Map the ones that look like a clean price, e.g. "₹2,695"
            return elements.map(el => ({
                text: el.innerText,
                className: el.className || el.parentElement.className
            })).filter(x => x.text.length < 15);
        });

        console.log('Price Elements found:', priceInfo);

    } catch (error) {
        console.error('Puppeteer error:', error.message);
    } finally {
        await browser.close();
    }
})();
