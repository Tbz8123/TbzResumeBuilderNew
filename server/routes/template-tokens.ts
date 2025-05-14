import express from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { resumeTemplates as templatesTable } from '@shared/schema';
import { extractTemplateTokens, analyzeTokenContext } from '../utils/binding-bot';

const router = express.Router();

// Get template tokens
router.get('/templates/:templateId/tokens', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    // Get template
    const template = await db.query.resumeTemplates.findFirst({
      where: eq(templatesTable.id, Number(templateId)),
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Extract tokens from template HTML
    const tokens = extractTemplateTokens(template.htmlContent || '');
    
    // Get context for each token
    const tokensWithContext = tokens.map(token => ({
      token,
      context: analyzeTokenContext(token, template.htmlContent || '')
    }));
    
    return res.json(tokensWithContext);
  } catch (error) {
    console.error('Error extracting template tokens:', error);
    return res.status(500).json({ error: 'Failed to extract template tokens' });
  }
});

export default router;