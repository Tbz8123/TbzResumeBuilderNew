/**
 * Renders an HTML template to an image
 * @param htmlString - The HTML content to render
 * @param outputPath - The full path to save the rendered image
 * @returns Promise<void>
 */
declare function renderTemplateToImage(htmlString: string, outputPath: string): Promise<void>;

export = renderTemplateToImage;
export as namespace renderTemplateToImage;