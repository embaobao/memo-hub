import puppeteer from 'puppeteer';
(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 4000));
  
  const report = await page.evaluate(() => {
    const root = document.getElementById('root');
    const aside = document.querySelector('aside');
    const main = document.querySelector('main');
    
    return {
      rootVisible: !!root && root.innerHTML.length > 0,
      rootHeight: root?.offsetHeight,
      asideFound: !!aside,
      mainFound: !!main,
      asideWidth: aside?.offsetWidth,
      html: document.body.innerHTML.substring(0, 500)
    };
  });
  
  console.log('UI_PROBE_REPORT:', JSON.stringify(report, null, 2));
  await browser.close();
})();
