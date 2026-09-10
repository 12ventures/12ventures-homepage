const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3003/ai-workforce-training');
  const handle = await page.waitForSelector('.hs-phone-training');
  const times = [4180, 4260, 4340, 4420, 4500, 4600, 4700];
  let prev = 0;
  for (const t of times) {
    await page.waitForTimeout(t - prev);
    prev = t;
    await handle.screenshot({ path: `shot_c_${t}.png` });
  }
  await browser.close();
})();
