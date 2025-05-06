import { Router } from 'express';
import { db } from '../../db';
import { resumeTemplates } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { isAdmin, isAuthenticated } from '../auth';

const router = Router();

// Export template as PDF
router.get('/templates/:id/export/pdf', async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    // Get the template PDF content
    const templates = await db.select({
      pdfContent: resumeTemplates.pdfContent,
      name: resumeTemplates.name,
    })
    .from(resumeTemplates)
    .where(
      and(
        eq(resumeTemplates.id, templateId),
        // If not admin, only show active templates
        req.isAuthenticated() && req.user && req.user.isAdmin 
          ? undefined 
          : eq(resumeTemplates.isActive, true)
      )
    )
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const template = templates[0];
    const pdfContent = template.pdfContent;
    
    if (!pdfContent) {
      return res.status(404).json({ message: 'No PDF content available for this template' });
    }
    
    // Set headers for the response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="template-${templateId}.pdf"`);
    
    // Convert base64 to Buffer and send
    const pdfBuffer = Buffer.from(pdfContent, 'base64');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Error exporting template as PDF:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export template as DOCX (placeholder for future implementation)
router.get('/templates/:id/export/docx', isAuthenticated, async (req, res) => {
  try {
    // This is a placeholder route for future DOCX export functionality
    res.status(501).json({ message: 'DOCX export not yet implemented' });
  } catch (error) {
    console.error('Error exporting template as DOCX:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Export template data as JSON
router.get('/templates/:id/export/json', isAuthenticated, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    // Get the template data
    const templates = await db.select()
    .from(resumeTemplates)
    .where(
      and(
        eq(resumeTemplates.id, templateId),
        // If not admin, only show active templates
        req.isAuthenticated() && req.user && req.user.isAdmin 
          ? undefined 
          : eq(resumeTemplates.isActive, true)
      )
    )
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const template = templates[0];
    
    // Set headers for the response
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="template-${templateId}.json"`);
    
    // Send template data as JSON
    res.json({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      primaryColor: template.primaryColor,
      secondaryColor: template.secondaryColor,
      // Omit actual template content for security
    });
    
  } catch (error) {
    console.error('Error exporting template as JSON:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Generate template with user data (for PDF generation)
router.post('/templates/:id/generate', isAuthenticated, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: 'Invalid template ID' });
    }
    
    // Get the template HTML/CSS/JS content
    const templates = await db.select({
      htmlContent: resumeTemplates.htmlContent,
      cssContent: resumeTemplates.cssContent,
      jsContent: resumeTemplates.jsContent,
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name,
    })
    .from(resumeTemplates)
    .where(
      and(
        eq(resumeTemplates.id, templateId),
        // If not admin, only show active templates
        req.isAuthenticated() && req.user && req.user.isAdmin 
          ? undefined 
          : eq(resumeTemplates.isActive, true)
      )
    )
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: 'Template not found' });
    }
    
    const template = templates[0];
    
    // This would be where we combine the template with user data
    // and potentially use a library like Puppeteer to generate a PDF
    
    // For now, return a placeholder message
    res.status(501).json({ 
      message: 'PDF generation with custom data not yet implemented',
      template: template.name
    });
    
  } catch (error) {
    console.error('Error generating PDF from template:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;