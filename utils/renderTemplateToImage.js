const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function renderTemplateToImage(htmlString, outputPath) {
  const browser = await puppeteer.launch({
    headless: 'new',  // Avoid deprecated headless mode warnings
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(htmlString, { waitUntil: 'networkidle0' });

  await page.setViewport({ width: 1000, height: 1400 });

  await page.screenshot({ path: outputPath, fullPage: true });

  await browser.close();
}

module.exports = renderTemplateToImage;
