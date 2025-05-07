const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Renders an HTML template to an image
 * @param {string} htmlString - The HTML content to render
 * @param {string} outputPath - The full path to save the rendered image
 * @returns {Promise<void>}
 */
async function renderTemplateToImage(htmlString, outputPath) {
  // Make sure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: 'new',  // Use new headless mode to avoid deprecation warnings
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set the content and wait for it to fully render
    await page.setContent(htmlString, { waitUntil: 'networkidle0' });
    
    // Set viewport size to A4 dimensions (794x1123) at 96 DPI
    await page.setViewport({ 
      width: 794, 
      height: 1123,
      deviceScaleFactor: 1.5, // Higher resolution for better quality
    });
    
    // Take the screenshot
    await page.screenshot({ 
      path: outputPath,
      fullPage: true,
      quality: 90,
    });
    
    console.log(`Template screenshot saved to ${outputPath}`);
  } catch (error) {
    console.error('Error generating template preview:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = renderTemplateToImage;