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

  let browser;
  try {
    // Launch browser with more reliable settings and longer timeout
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ],
      timeout: 30000, // Increase timeout to 30 seconds
    });
    
    const page = await browser.newPage();
    
    // Add custom CSS to ensure the template fits in the viewport
    const enhancedHtml = htmlString.replace('</head>', 
      `<style>
        body {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          min-height: 100vh;
          overflow: hidden;
        }
      </style>
      </head>`
    );
    
    // Set content with longer timeout and wait for full render
    await page.setContent(enhancedHtml, { 
      waitUntil: ['load', 'networkidle0'],
      timeout: 20000
    });
    
    // Wait a bit for any JavaScript to execute and CSS to apply
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Set viewport to a standard resume size with higher resolution
    await page.setViewport({ 
      width: 794, 
      height: 1123,
      deviceScaleFactor: 2, // Higher resolution for better quality
    });
    
    // Take the screenshot with better quality settings
    await page.screenshot({ 
      path: outputPath,
      fullPage: true,
      quality: 100,
      omitBackground: false
    });
    
    console.log(`Template screenshot saved to ${outputPath}`);
    
    // Verify the file exists and has content
    if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0) {
      console.log(`Confirmed screenshot file exists with size: ${fs.statSync(outputPath).size} bytes`);
    } else {
      throw new Error(`Screenshot file missing or empty at ${outputPath}`);
    }
  } catch (error) {
    console.error('Error generating template preview:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export default renderTemplateToImage;