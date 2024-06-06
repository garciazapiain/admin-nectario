const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({ headless: false }); // Add this option
    const page = await browser.newPage();
    await page.setViewportSize({ width: 1080, height: 1111 });

    await page.goto('https://facturacion.heb.com.mx/cli/invoice-create/');

    await page.click('#mat-input-0');
    await page.click('#mat-option-3 > span');

    await page.click('#mat-input-1');
    await page.fill('#mat-input-1', '069939');

    await page.click('html > body');
    await page.click('button[aria-label="Open calendar"]');
    await page.click('td[aria-label="5 de junio de 2024"]');

    await page.click('#mat-input-3');
    await page.fill('#mat-input-3', '40');

    await page.click('app-heb-layout > div > div span.mat-button-wrapper > span');

    // await page.click('button:has-text("Continuar")');

    await page.click('#mat-input-6');
    await page.fill('#mat-input-6', 'GAPJ611122471');

    await page.click('body body');

    await page.click('#mat-input-9');
    await page.fill('#mat-input-9', 'garciapaseiro@yahoo.com.mx');

    await page.click('#mat-input-5');
    await page.click('#mat-option-184 > span');

    await page.click('app-heb-button:nth-of-type(2) > button');

    await browser.close();
})();