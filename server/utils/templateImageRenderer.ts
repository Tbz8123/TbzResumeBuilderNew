import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

/**
 * Renders an HTML template to an image
 * @param htmlString - The HTML content to render
 * @param outputPath - The full path to save the rendered image
 * @returns Promise<void>
 */
export async function renderTemplateToImage(htmlString: string, outputPath: string): Promise<void> {
  // Make sure the output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,  // Use headless mode
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

export default renderTemplateToImage;