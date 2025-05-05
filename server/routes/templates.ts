import { Router } from "express";
import { db } from "../../db";
import { resumeTemplates, resumeTemplateVersions, resumeTemplateSchema, resumeTemplateVersionSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { isAdmin, isAuthenticated } from "../auth";
import { z } from "zod";

const router = Router();

// Get all templates (public route - available to all users)
router.get("/", async (req, res) => {
  try {
    const templates = await db.select({
      id: resumeTemplates.id,
      name: resumeTemplates.name,
      description: resumeTemplates.description,
      category: resumeTemplates.category,
      thumbnailUrl: resumeTemplates.thumbnailUrl,
      isPopular: resumeTemplates.isPopular,
      isActive: resumeTemplates.isActive,
      primaryColor: resumeTemplates.primaryColor,
      secondaryColor: resumeTemplates.secondaryColor,
      createdAt: resumeTemplates.createdAt,
    })
    .from(resumeTemplates)
    .where(
      // If not admin, only show active templates
      req.isAuthenticated() && req.user && req.user.isAdmin 
        ? undefined 
        : eq(resumeTemplates.isActive, true)
    )
    .orderBy(desc(resumeTemplates.createdAt));
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single template by ID
router.get("/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const templates = await db.select().from(resumeTemplates)
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json(templates[0]);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template SVG content
router.get("/:id/svg", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const templates = await db.select({
      svgContent: resumeTemplates.svgContent,
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    let content = templates[0].svgContent || '';
    
    // Add security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none';");
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Check if content is SVG or HTML
    if (content.trim().startsWith('<svg') || content.trim().startsWith('<?xml')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (content.trim().startsWith('<!DOCTYPE html>') || content.trim().startsWith('<html')) {
      // Add CSP meta tag for HTML content if not present
      if (!content.includes('<meta http-equiv="Content-Security-Policy"')) {
        const metaTag = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; script-src \'none\';">';
        content = content.replace('<head>', '<head>' + metaTag);
      }
      
      // Add proper viewport meta tag for responsive display if not present
      if (!content.includes('<meta name="viewport"')) {
        const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        content = content.replace('<head>', '<head>' + viewportTag);
      }
      
      res.setHeader('Content-Type', 'text/html');
    } else {
      // Default to plain text if we can't determine the type
      res.setHeader('Content-Type', 'text/plain');
    }
    
    // Log content type for debugging
    console.log(`Serving template ${templateId} as ${res.getHeader('Content-Type')}`);
    
    res.send(content);
  } catch (error) {
    console.error("Error fetching template content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template preview image
router.get("/:id/preview", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const templates = await db.select({
      thumbnailUrl: resumeTemplates.thumbnailUrl,
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    // If template has a thumbnailUrl, redirect to it
    if (templates[0].thumbnailUrl) {
      return res.redirect(templates[0].thumbnailUrl);
    }
    
    // Otherwise, serve a default placeholder image
    const placeholderSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="100%" height="100%" fill="#f8f9fa" />
      <rect x="50" y="50" width="300" height="80" fill="#e9ecef" rx="4" />
      <rect x="50" y="150" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="190" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="230" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="290" width="140" height="180" fill="#e9ecef" rx="4" />
      <rect x="210" y="290" width="140" height="180" fill="#e9ecef" rx="4" />
      <rect x="50" y="490" width="300" height="60" fill="#e9ecef" rx="4" />
      <text x="200" y="320" font-family="Arial" font-size="20" text-anchor="middle" fill="#6c757d">Template Preview</text>
    </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(placeholderSvg);
  } catch (error) {
    console.error("Error fetching template preview:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN ROUTES

// Create a new template (admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    console.log("Creating template with data:", req.body);
    
    // Create a clean object with only the needed fields
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      svgContent: req.body.svgContent,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isPopular: req.body.isPopular !== undefined ? req.body.isPopular : false,
      primaryColor: req.body.primaryColor || "#5E17EB",
      secondaryColor: req.body.secondaryColor || "#4A11C0",
      thumbnailUrl: req.body.thumbnailUrl || null,
    };
    
    const validatedData = resumeTemplateSchema.parse(templateData);
    
    const [template] = await db.insert(resumeTemplates)
      .values(validatedData)
      .returning();
    
    // Also create the first version
    await db.insert(resumeTemplateVersions).values({
      templateId: template.id,
      versionNumber: 1,
      svgContent: template.svgContent,
      createdById: req.user?.id,
      changelog: "Initial version",
    });
    
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a template (admin only)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    console.log("Updating template with ID:", templateId, "and data:", req.body);
    
    // Create a clean object with only the needed fields
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      svgContent: req.body.svgContent,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isPopular: req.body.isPopular !== undefined ? req.body.isPopular : false,
      primaryColor: req.body.primaryColor || "#5E17EB",
      secondaryColor: req.body.secondaryColor || "#4A11C0",
      thumbnailUrl: req.body.thumbnailUrl || null,
    };
    
    const validatedData = resumeTemplateSchema.parse(templateData);
    
    // Check if the template exists
    const existingTemplate = await db.select({ id: resumeTemplates.id })
      .from(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId))
      .limit(1);
      
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Get the latest version number
    const versionResult = await db.select({ 
      versionNumber: resumeTemplateVersions.versionNumber 
    })
    .from(resumeTemplateVersions)
    .where(eq(resumeTemplateVersions.templateId, templateId))
    .orderBy(desc(resumeTemplateVersions.versionNumber))
    .limit(1);
    
    const nextVersionNumber = versionResult.length > 0 ? versionResult[0].versionNumber + 1 : 1;
    
    // Update the template
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    // Create a new version
    await db.insert(resumeTemplateVersions).values({
      templateId: templateId,
      versionNumber: nextVersionNumber,
      svgContent: validatedData.svgContent,
      createdById: req.user?.id,
      changelog: req.body.changelog || `Version ${nextVersionNumber}`,
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a template (admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Check if the template exists
    const existingTemplate = await db.select({ id: resumeTemplates.id })
      .from(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId))
      .limit(1);
      
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Delete all versions first (due to foreign key constraint)
    await db.delete(resumeTemplateVersions)
      .where(eq(resumeTemplateVersions.templateId, templateId));
    
    // Delete the template
    await db.delete(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId));
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all versions of a template (admin only)
router.get("/:id/versions", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    const versions = await db.select().from(resumeTemplateVersions)
      .where(eq(resumeTemplateVersions.templateId, templateId))
      .orderBy(desc(resumeTemplateVersions.versionNumber));
    
    res.json(versions);
  } catch (error) {
    console.error("Error fetching template versions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific version of a template (admin only)
router.get("/:id/versions/:versionNumber", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    if (isNaN(templateId) || isNaN(versionNumber)) {
      return res.status(400).json({ message: "Invalid template ID or version number" });
    }
    
    const versions = await db.select().from(resumeTemplateVersions)
      .where(
        and(
          eq(resumeTemplateVersions.templateId, templateId),
          eq(resumeTemplateVersions.versionNumber, versionNumber)
        )
      )
      .limit(1);
    
    if (versions.length === 0) {
      return res.status(404).json({ message: "Version not found" });
    }
    
    res.json(versions[0]);
  } catch (error) {
    console.error("Error fetching template version:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Restore a previous version (admin only)
router.post("/:id/versions/:versionNumber/restore", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    if (isNaN(templateId) || isNaN(versionNumber)) {
      return res.status(400).json({ message: "Invalid template ID or version number" });
    }
    
    // Get the version to restore
    const versions = await db.select({
      svgContent: resumeTemplateVersions.svgContent,
    })
    .from(resumeTemplateVersions)
    .where(
      and(
        eq(resumeTemplateVersions.templateId, templateId),
        eq(resumeTemplateVersions.versionNumber, versionNumber)
      )
    )
    .limit(1);
    
    if (versions.length === 0) {
      return res.status(404).json({ message: "Version not found" });
    }
    
    // Update the template with the old version's SVG content
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        svgContent: versions[0].svgContent,
        updatedAt: new Date(),
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    // Get the latest version number
    const versionResult = await db.select({ 
      versionNumber: resumeTemplateVersions.versionNumber 
    })
    .from(resumeTemplateVersions)
    .where(eq(resumeTemplateVersions.templateId, templateId))
    .orderBy(desc(resumeTemplateVersions.versionNumber))
    .limit(1);
    
    const nextVersionNumber = versionResult[0].versionNumber + 1;
    
    // Create a new version entry for the restoration
    await db.insert(resumeTemplateVersions).values({
      templateId: templateId,
      versionNumber: nextVersionNumber,
      svgContent: versions[0].svgContent,
      createdById: req.user?.id,
      changelog: `Restored from version ${versionNumber}`,
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error restoring template version:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;