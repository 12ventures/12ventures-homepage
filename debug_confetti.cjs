const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:3003/ai-workforce-training');
  await page.waitForTimeout(4300);
  const info = await page.evaluate(() => {
    const pieces = Array.from(document.querySelectorAll('.hs-confetti-piece'));
    const container = document.querySelector('.hs-quiz-confetti');
    const containerRect = container ? container.getBoundingClientRect() : null;
    return {
      count: pieces.length,
      containerRect,
      pieces: pieces.slice(0, 3).map((p) => {
        const cs = getComputedStyle(p);
        return {
          opacity: cs.opacity,
          transform: cs.transform,
          background: cs.backgroundColor,
          animationName: cs.animationName,
          animationDelay: cs.animationDelay,
          animationDuration: cs.animationDuration,
          rect: p.getBoundingClientRect(),
          styleAttr: p.getAttribute('style'),
        };
      }),
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
