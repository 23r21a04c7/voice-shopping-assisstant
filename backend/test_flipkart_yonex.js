const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

async function checkFlipkart() {
    console.log("Checking Flipkart for Yonex Mavis 350...");
    const url = "https://www.flipkart.com/search?q=Yonex%20Mavis%20350%20Shuttlecock";
    
    const browser = await puppeteerExtra.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    try {
        await page.goto(url, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 2000));
        
        const links = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('a'))
                .filter(a => a.href && (a.href.includes('/p/itm') || a.href.includes('/p/p') || a.href.includes('product/p/')))
                .map(a => ({ text: a.innerText.trim(), href: a.href }));
        });
        
        console.log(`Found ${links.length} product links.`);
        links.slice(0, 5).forEach(l => {
             console.log(`Text: ${l.text}`);
             console.log(`URL: ${l.href.substring(0, 80)}...`);
        });
        
    } finally {
        await browser.close();
    }
}

checkFlipkart();
