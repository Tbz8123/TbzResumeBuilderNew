import { db } from "@db";
import { 
  templateBindings, 
  templateBindingSchema, 
  resumeTemplates 
} from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { Router } from "express";

const router = Router();

/**
 * Utility function to detect placeholders in template content
 */
function detectPlaceholders(content: string): string[] {
  if (!content) return [];
  
  const placeholders = new Set<string>();
  
  // Match Handlebars style {{ variable }}
  const handlebarRegex = /{{\s*([^{}]+)\s*}}/g;
  let match;
  
  while ((match = handlebarRegex.exec(content)) !== null) {
    placeholders.add(match[0]);
  }
  
  // Match bracket style [[VARIABLE]]
  const bracketRegex = /\[\[([^\[\]]+)\]\]/g;
  while ((match = bracketRegex.exec(content)) !== null) {
    placeholders.add(match[0]);
  }

  // Match data-field attributes
  const dataFieldRegex = /data-field=["']([^"']+)["']/g;
  while ((match = dataFieldRegex.exec(content)) !== null) {
    placeholders.add(`data-field="${match[1]}"`);
  }
  
  // Convert Set to Array safely for all TypeScript versions
  const placeholdersArray: string[] = [];
  placeholders.forEach(placeholder => placeholdersArray.push(placeholder));
  
  return placeholdersArray;
}

/**
 * GET /api/templates/:id/placeholders
 * Detect placeholders in a template's content
 */
router.get("/templates/:id/placeholders", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    const template = await db.query.resumeTemplates.findFirst({
      where: eq(resumeTemplates.id, templateId)
    });
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    // Detect placeholders in all template content types
    const svgPlaceholders = detectPlaceholders(template.svgContent);
    const htmlPlaceholders = detectPlaceholders(template.htmlContent || "");
    const cssPlaceholders = detectPlaceholders(template.cssContent || "");
    const jsPlaceholders = detectPlaceholders(template.jsContent || "");
    
    // Combine all unique placeholders
    const allPlaceholders = [...new Set([
      ...svgPlaceholders,
      ...htmlPlaceholders,
      ...cssPlaceholders,
      ...jsPlaceholders
    ])];
    
    return res.status(200).json({ 
      placeholders: allPlaceholders,
      counts: {
        svg: svgPlaceholders.length,
        html: htmlPlaceholders.length,
        css: cssPlaceholders.length,
        js: jsPlaceholders.length,
        total: allPlaceholders.length
      } 
    });
  } catch (error) {
    console.error("Error detecting placeholders:", error);
    return res.status(500).json({ error: "Failed to detect placeholders" });
  }
});

/**
 * GET /api/templates/:id/bindings
 * Get all bindings for a template
 */
router.get("/templates/:id/bindings", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    const bindings = await db.query.templateBindings.findMany({
      where: eq(templateBindings.templateId, templateId)
    });
    
    return res.status(200).json(bindings);
  } catch (error) {
    console.error("Error fetching template bindings:", error);
    return res.status(500).json({ error: "Failed to fetch template bindings" });
  }
});

/**
 * POST /api/templates/:id/bindings
 * Create a new binding for a template
 */
router.post("/templates/:id/bindings", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    // Check if template exists
    const template = await db.query.resumeTemplates.findFirst({
      where: eq(resumeTemplates.id, templateId)
    });
    
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    
    // Validate request body
    const validatedData = templateBindingSchema.parse({
      ...req.body,
      templateId
    });
    
    // Check if binding already exists
    const existingBinding = await db.query.templateBindings.findFirst({
      where: sql`${templateBindings.templateId} = ${templateId} AND ${templateBindings.placeholderToken} = ${validatedData.placeholderToken}`
    });
    
    if (existingBinding) {
      // Update existing binding
      const [updatedBinding] = await db
        .update(templateBindings)
        .set({
          dataField: validatedData.dataField,
          description: validatedData.description,
          updatedAt: new Date()
        })
        .where(eq(templateBindings.id, existingBinding.id))
        .returning();
      
      return res.status(200).json(updatedBinding);
    }
    
    // Create new binding
    const [newBinding] = await db
      .insert(templateBindings)
      .values(validatedData)
      .returning();
    
    return res.status(201).json(newBinding);
  } catch (error) {
    console.error("Error creating template binding:", error);
    return res.status(500).json({ error: "Failed to create template binding" });
  }
});

/**
 * PUT /api/templates/:templateId/bindings/:bindingId
 * Update a template binding
 */
router.put("/templates/:templateId/bindings/:bindingId", async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const bindingId = parseInt(req.params.bindingId);
    
    if (isNaN(templateId) || isNaN(bindingId)) {
      return res.status(400).json({ error: "Invalid template or binding ID" });
    }
    
    // Check if binding exists and belongs to the template
    const existingBinding = await db.query.templateBindings.findFirst({
      where: sql`${templateBindings.id} = ${bindingId} AND ${templateBindings.templateId} = ${templateId}`
    });
    
    if (!existingBinding) {
      return res.status(404).json({ error: "Binding not found or doesn't belong to this template" });
    }
    
    // Validate request body
    const validatedData = templateBindingSchema.parse({
      ...req.body,
      templateId
    });
    
    // Update binding
    const [updatedBinding] = await db
      .update(templateBindings)
      .set({
        dataField: validatedData.dataField,
        description: validatedData.description,
        updatedAt: new Date()
      })
      .where(eq(templateBindings.id, bindingId))
      .returning();
    
    return res.status(200).json(updatedBinding);
  } catch (error) {
    console.error("Error updating template binding:", error);
    return res.status(500).json({ error: "Failed to update template binding" });
  }
});

/**
 * DELETE /api/templates/:templateId/bindings/:bindingId
 * Delete a template binding
 */
router.delete("/templates/:templateId/bindings/:bindingId", async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const bindingId = parseInt(req.params.bindingId);
    
    if (isNaN(templateId) || isNaN(bindingId)) {
      return res.status(400).json({ error: "Invalid template or binding ID" });
    }
    
    // Check if binding exists and belongs to the template
    const existingBinding = await db.query.templateBindings.findFirst({
      where: sql`${templateBindings.id} = ${bindingId} AND ${templateBindings.templateId} = ${templateId}`
    });
    
    if (!existingBinding) {
      return res.status(404).json({ error: "Binding not found or doesn't belong to this template" });
    }
    
    // Delete binding
    await db.delete(templateBindings).where(eq(templateBindings.id, bindingId));
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting template binding:", error);
    return res.status(500).json({ error: "Failed to delete template binding" });
  }
});

/**
 * DELETE /api/templates/:id/bindings
 * Delete all bindings for a template
 */
router.delete("/templates/:id/bindings", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    if (isNaN(templateId)) {
      return res.status(400).json({ error: "Invalid template ID" });
    }
    
    // Delete all bindings for the template
    await db.delete(templateBindings).where(eq(templateBindings.templateId, templateId));
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting template bindings:", error);
    return res.status(500).json({ error: "Failed to delete template bindings" });
  }
});

export default router;