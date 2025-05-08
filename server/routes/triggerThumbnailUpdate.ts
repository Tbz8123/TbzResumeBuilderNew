/**
 * Special development-only route to test thumbnail generation
 * This should be removed in production
 */

import { Router } from "express";
import { db } from "../../db";
import { resumeTemplates } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import fs from 'fs';
import path from 'path';
import { syncTemplateThumbnail } from './templates';

export const triggerThumbnailRouter = Router();

// Route to test thumbnail generation - no auth required for development only
triggerThumbnailRouter.get("/test/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    console.log(`Triggering thumbnail sync for template ${templateId} for testing...`);
    
    // Get the template
    const templates = await db.select().from(resumeTemplates).where(eq(resumeTemplates.id, templateId));
    
    if (templates.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Call the syncTemplateThumbnail function
    const updatedTemplate = await syncTemplateThumbnail(templateId);
    
    res.json({
      message: "Thumbnail sync triggered successfully",
      template: updatedTemplate
    });
  } catch (error) {
    console.error(`Error triggering thumbnail sync:`, error);
    res.status(500).json({ message: "Internal server error", error: (error as Error).message });
  }
});