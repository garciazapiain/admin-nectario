const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Add this option
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.setViewportSize({ width: 1080, height: 1111 });
    await page.goto('https://www3.costco.com.mx/facturacion');

    await page.click('#ticket');
    await page.fill('#ticket', '72500800550605241023');
    await page.click('#monto');
    await page.dblclick('#monto');
    await page.click('#monto');
    await page.fill('#monto', '$2,123.93');
    await page.press('#monto', '.');
    await page.click('#rfc');
    await page.fill('#rfc', 'GAPJ611122471');
    await page.click('form > div:nth-of-type(1) button:nth-of-type(2)');
    await page.waitForTimeout(5000); // waits for 5 seconds
    await browser.close();
})();