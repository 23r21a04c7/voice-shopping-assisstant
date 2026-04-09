const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function debugFlipkart() {
    console.log("Debugging Flipkart Images...");
    const url = 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ce4?pid=MOBGTAGPTB3VS24W';
    const browser = await puppeteer.launch({ 
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
    
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Simulate scroll
    await page.evaluate(async () => {
        for(let i=0; i<10; i++) {
            window.scrollBy(0, 800);
            await new Promise(r => setTimeout(r, 600));
        }
    });
    
    const imgs = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('img')).map(img => {
            return {
                src: img.src,
                dataSrc: img.getAttribute('data-src'),
                lazySrc: img.getAttribute('lazy-src'),
                width: img.naturalWidth || img.offsetWidth,
                height: img.naturalHeight || img.offsetHeight,
                className: img.className,
                alt: img.alt
            }
        });
    });
    
    console.log(`Found ${imgs.length} total images.`);
    imgs.filter(img => img.width > 40 && img.height > 40).forEach((img, i) => {
         console.log(`[${i}] ${img.width}x${img.height} Class: ${img.className} Alt: ${img.alt || 'null'}\n    Src: ${(img.dataSrc || img.lazySrc || img.src).substring(0, 100)}`);
    });
    
    await browser.close();
}

debugFlipkart();
