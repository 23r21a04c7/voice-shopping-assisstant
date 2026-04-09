const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function dumpFlipkart() {
    const url = 'https://www.flipkart.com/minimalist-10-vitamin-c-face-serum-glowing-skin-dull-reduction/p/itm504fe885db9e1';
    console.log(`Dumping ${url}...`);
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Get the HTML around the reviews section
    const html = await page.evaluate(() => {
        const reviewsSection = Array.from(document.querySelectorAll('div')).find(div => div.innerText.includes('Reviews'));
        return reviewsSection ? reviewsSection.outerHTML : document.body.outerHTML;
    });
    
    const fs = require('fs');
    fs.writeFileSync('flipkart_beauty_dump.html', html);
    await browser.close();
    console.log("Dumped to flipkart_beauty_dump.html");
}

dumpFlipkart().catch(console.error);
