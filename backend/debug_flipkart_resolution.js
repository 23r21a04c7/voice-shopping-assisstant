const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

async function debugFlipkart(title) {
    const query = encodeURIComponent(title);
    const url = `https://www.flipkart.com/search?q=${query}`;
    const browser = await puppeteerExtra.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href.includes('/p/itm') || a.href.includes('/p/p'))
                .map(a => ({ className: a.className, text: a.innerText, href: a.href }));
        });
        console.log(JSON.stringify(links.slice(0, 5), null, 2));
    } finally {
        await browser.close();
    }
}
debugFlipkart("Nike Men's Revolution 6 Running Shoes");
