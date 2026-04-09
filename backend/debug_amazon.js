const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpAmazon() {
    // A classic Beauty product on Amazon India
    const url = 'https://www.amazon.in/Minimalist-Vitamin-Brightening-Beginners-Non-comedogenic/dp/B08XMS7G1C';
    console.log(`Dumping ${url}...`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.google.com/'
    });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const html = await page.evaluate(() => {
        const reviewsSection = document.querySelector('#customerReviews') || document.querySelector('#contentGrid');
        return reviewsSection ? reviewsSection.outerHTML : document.body.outerHTML;
    });
    
    const fs = require('fs');
    fs.writeFileSync('amazon_beauty_dump.html', html);
    await browser.close();
    console.log("Dumped to amazon_beauty_dump.html");
}

dumpAmazon().catch(console.error);
