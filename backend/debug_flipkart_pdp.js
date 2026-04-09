const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

async function testFlipkart() {
    console.log("Starting debug...");
    const browser = await puppeteerExtra.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    await page.goto("https://www.flipkart.com/yonex-mavis-350-nylon-shuttle-yellow/p/itm699f6270a0491", { waitUntil: 'networkidle2', timeout: 25000 });
    
    const result = await page.evaluate(() => {
        return `Title: ${document.title} | Body Start: ${document.body.innerHTML.substring(0, 500)}`;
    });
    
    console.log(result);
    await browser.close();
}

testFlipkart().catch(console.error);
