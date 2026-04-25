import puppeteer from 'puppeteer';
(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
    
    await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 2000));
    
    const html = await page.evaluate(() => document.body.innerHTML);
    if (html.includes('MemoHub')) {
       console.log('✅ React mounted successfully!');
       if (html.includes('System Boot Failure')) {
          console.log('⚠️ Mounted but Kernel failed to load: ' + await page.evaluate(() => document.querySelector('.text-red-500 p')?.innerText));
       } else {
          console.log('✅ Ether UI Fully Operational!');
       }
    } else {
       console.log('❌ React failed to mount.');
    }
    
    await browser.close();
  } catch(e) {
    console.log('Test script error:', e.message);
  }
})();
