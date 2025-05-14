import express from 'express';
import { db } from '@db';
import { eq } from 'drizzle-orm';
import { 
  templateBindings as bindingsTable, 
  resumeTemplates as templatesTable 
} from '@shared/schema';

// Utility functions
import { 
  extractTemplateTokens, 
  analyzeTokenContext, 
  suggestBindings 
} from '../utils/binding-bot';

const router = express.Router();

// Get all bindings for a template
router.get('/templates/:templateId/bindings', async (req, res) => {
  try {
    const { templateId } = req.params;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    const bindings = await db.query.templateBindings.findMany({
      where: eq(bindingsTable.templateId, Number(templateId)),
    });
    
    return res.json(bindings);
  } catch (error) {
    console.error('Error fetching template bindings:', error);
    return res.status(500).json({ error: 'Failed to fetch template bindings' });
  }
});

// Create a new binding
router.post('/templates/:templateId/bindings', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { placeholderToken, dataField } = req.body;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    if (!placeholderToken) {
      return res.status(400).json({ error: 'Placeholder token is required' });
    }
    
    // Check if binding already exists
    const existingBinding = await db.query.templateBindings.findFirst({
      where: (fields, operators) => 
        operators.and(
          eq(bindingsTable.templateId, Number(templateId)),
          eq(bindingsTable.placeholderToken, placeholderToken)
        ),
    });
    
    if (existingBinding) {
      return res.status(409).json({ 
        error: 'Binding already exists', 
        binding: existingBinding 
      });
    }
    
    // Create new binding
    const [newBinding] = await db.insert(bindingsTable).values({
      templateId: Number(templateId),
      placeholderToken,
      dataField: dataField || '',
    }).returning();
    
    return res.status(201).json(newBinding);
  } catch (error) {
    console.error('Error creating template binding:', error);
    return res.status(500).json({ error: 'Failed to create template binding' });
  }
});

// Update a binding
router.patch('/templates/:templateId/bindings/:bindingId', async (req, res) => {
  try {
    const { templateId, bindingId } = req.params;
    const { dataField } = req.body;
    
    if (!templateId || isNaN(Number(templateId)) || !bindingId || isNaN(Number(bindingId))) {
      return res.status(400).json({ error: 'Invalid template or binding ID' });
    }
    
    // Update binding
    const [updatedBinding] = await db.update(bindingsTable)
      .set({ dataField })
      .where(
        eq(bindingsTable.id, Number(bindingId))
      )
      .returning();
    
    if (!updatedBinding) {
      return res.status(404).json({ error: 'Binding not found' });
    }
    
    return res.json(updatedBinding);
  } catch (error) {
    console.error('Error updating template binding:', error);
    return res.status(500).json({ error: 'Failed to update template binding' });
  }
});

// Delete a binding
router.delete('/templates/:templateId/bindings/:bindingId', async (req, res) => {
  try {
    const { templateId, bindingId } = req.params;
    
    if (!templateId || isNaN(Number(templateId)) || !bindingId || isNaN(Number(bindingId))) {
      return res.status(400).json({ error: 'Invalid template or binding ID' });
    }
    
    // Delete binding
    await db.delete(bindingsTable)
      .where(
        eq(bindingsTable.id, Number(bindingId))
      );
    
    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting template binding:', error);
    return res.status(500).json({ error: 'Failed to delete template binding' });
  }
});

// AI-powered binding suggestions
router.post('/templates/:templateId/suggest-bindings', async (req, res) => {
  try {
    const { templateId } = req.params;
    const { resumeSchema } = req.body;
    
    if (!templateId || isNaN(Number(templateId))) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }
    
    if (!resumeSchema) {
      return res.status(400).json({ error: 'Resume schema is required' });
    }
    
    // Get template
    const template = await db.query.resumeTemplates.findFirst({
      where: eq(templatesTable.id, Number(templateId)),
    });
    
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    // Get existing bindings
    const existingBindings = await db.query.templateBindings.findMany({
      where: eq(bindingsTable.templateId, Number(templateId)),
    });
    
    // Extract tokens from template HTML
    const tokens = extractTemplateTokens(template.htmlContent || '');
    
    // Generate suggestions
    const suggestions = suggestBindings(tokens, resumeSchema, template.htmlContent || '', existingBindings);
    
    return res.json(suggestions);
  } catch (error) {
    console.error('Error generating binding suggestions:', error);
    return res.status(500).json({ error: 'Failed to generate binding suggestions' });
  }
});

export default router;