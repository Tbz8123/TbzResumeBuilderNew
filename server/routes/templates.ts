import { Router } from "express";
import { db } from "../../db";
import { resumeTemplates, resumeTemplateVersions, resumeTemplateSchema, resumeTemplateVersionSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { isAdmin, isAuthenticated } from "../auth";
import { z } from "zod";
import fs from 'fs';
import path from 'path';
import { upload } from '../utils/upload';
import { renderTemplateToImage } from '../utils/templateImageRenderer';

/**
 * Generates a fallback SVG preview for a template when Puppeteer fails
 * @param templateName - The name of the template
 * @param primaryColor - The primary color to use (typically for backgrounds)
 * @param secondaryColor - The secondary/accent color to use
 * @returns An SVG string representing the template preview
 */
function generateTemplatePreviewSvg(templateName: string, primaryColor = "#2d2f35", secondaryColor = "#4a90e2"): string {
  // Check if it's a two-column template with a dark sidebar
  const isDarkSidebarTemplate = primaryColor === "#2d2f35" || primaryColor === "#1e1e1e";
  
  if (isDarkSidebarTemplate) {
    // Two-column layout with dark sidebar on left, white main content on right
    return `<svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="100%" height="100%" fill="white"/>
      
      <!-- Two-column layout with dark sidebar -->
      <rect width="280" height="100%" fill="${primaryColor}"/>
      <rect x="280" y="0" width="520" height="100%" fill="white"/>
      
      <!-- Left column header -->
      <rect x="20" y="50" width="240" height="50" fill="${secondaryColor}"/>
      <text x="30" y="85" font-family="Arial" font-size="20" font-weight="bold" fill="white">
        ${templateName || "Professional Resume"}
      </text>
      
      <!-- Left column content -->
      <text x="20" y="130" font-family="Arial" font-size="14" fill="white">
        Job Position
      </text>
      
      <text x="20" y="180" font-family="Arial" font-size="16" font-weight="bold" fill="white">
        Contact
      </text>
      
      <!-- Contact items -->
      <text x="20" y="210" font-family="Arial" font-size="12" fill="white">+600 123-4567</text>
      <text x="20" y="230" font-family="Arial" font-size="12" fill="white">email@example.com</text>
      <text x="20" y="250" font-family="Arial" font-size="12" fill="white">123 Street, City, State</text>
      
      <!-- Education section -->
      <text x="20" y="300" font-family="Arial" font-size="16" font-weight="bold" fill="white">
        Education
      </text>
      <text x="20" y="330" font-family="Arial" font-size="12" fill="white" font-weight="bold">
        DEGREE NAME
      </text>
      <text x="20" y="350" font-family="Arial" font-size="12" fill="white">
        University Name
      </text>
      
      <!-- Skills section -->
      <text x="20" y="400" font-family="Arial" font-size="16" font-weight="bold" fill="white">
        Skills
      </text>
      <text x="20" y="430" font-family="Arial" font-size="12" fill="white">• Skill 1</text>
      <text x="20" y="450" font-family="Arial" font-size="12" fill="white">• Skill 2</text>
      <text x="20" y="470" font-family="Arial" font-size="12" fill="white">• Skill 3</text>
      
      <!-- Right column section headings -->
      <text x="320" y="100" font-family="Arial" font-size="24" font-weight="bold" fill="${secondaryColor}">
        Profile
      </text>
      <rect x="320" y="120" width="450" height="2" fill="#ddd"/>
      
      <!-- Profile content placeholder -->
      <rect x="320" y="140" width="450" height="7" rx="3" fill="#eee"/>
      <rect x="320" y="155" width="450" height="7" rx="3" fill="#eee"/>
      <rect x="320" y="170" width="350" height="7" rx="3" fill="#eee"/>
      
      <!-- Experience heading -->
      <text x="320" y="220" font-family="Arial" font-size="24" font-weight="bold" fill="${secondaryColor}">
        Experience
      </text>
      <rect x="320" y="240" width="450" height="2" fill="#ddd"/>
      
      <!-- Experience item 1 -->
      <text x="320" y="270" font-family="Arial" font-size="16" font-weight="bold" fill="#333">
        Job Title
      </text>
      <text x="320" y="290" font-family="Arial" font-size="14" fill="#555">
        Company Name | 2018 - Present
      </text>
      <rect x="320" y="310" width="450" height="7" rx="3" fill="#eee"/>
      <rect x="320" y="325" width="420" height="7" rx="3" fill="#eee"/>
      <rect x="320" y="340" width="380" height="7" rx="3" fill="#eee"/>
      
      <!-- Experience item 2 -->
      <text x="320" y="380" font-family="Arial" font-size="16" font-weight="bold" fill="#333">
        Previous Job
      </text>
      <text x="320" y="400" font-family="Arial" font-size="14" fill="#555">
        Previous Company | 2015 - 2018
      </text>
      <rect x="320" y="420" width="450" height="7" rx="3" fill="#eee"/>
      <rect x="320" y="435" width="420" height="7" rx="3" fill="#eee"/>
    </svg>`;
  } else {
    // Modern single column or creative layout
    return `<svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
      <!-- Background with primary color header -->
      <rect width="100%" height="100%" fill="white"/>
      <rect width="100%" height="200" fill="${primaryColor}"/>
      
      <!-- Header content -->
      <text x="50%" y="100" font-family="Arial" font-size="36" font-weight="bold" text-anchor="middle" fill="white">
        ${templateName || "Creative Resume"}
      </text>
      <text x="50%" y="140" font-family="Arial" font-size="18" text-anchor="middle" fill="white">
        Professional Position
      </text>
      
      <!-- Accent bar -->
      <rect x="50" y="230" width="700" height="8" rx="4" fill="${secondaryColor}"/>
      
      <!-- Contact information section -->
      <text x="50" y="280" font-family="Arial" font-size="20" font-weight="bold" fill="${secondaryColor}">
        Contact Information
      </text>
      
      <!-- Contact items in row -->
      <text x="50" y="310" font-family="Arial" font-size="14" fill="#444">📞 +600 123-4567</text>
      <text x="300" y="310" font-family="Arial" font-size="14" fill="#444">✉️ email@example.com</text>
      <text x="550" y="310" font-family="Arial" font-size="14" fill="#444">🏠 City, State</text>
      
      <!-- Summary section -->
      <text x="50" y="360" font-family="Arial" font-size="20" font-weight="bold" fill="${secondaryColor}">
        Professional Summary
      </text>
      
      <!-- Summary content placeholder -->
      <rect x="50" y="380" width="700" height="7" rx="3" fill="#eee"/>
      <rect x="50" y="395" width="700" height="7" rx="3" fill="#eee"/>
      <rect x="50" y="410" width="500" height="7" rx="3" fill="#eee"/>
      
      <!-- Two column layout for skills and education -->
      <text x="50" y="460" font-family="Arial" font-size="20" font-weight="bold" fill="${secondaryColor}">
        Skills
      </text>
      
      <rect x="50" y="480" width="330" height="30" rx="15" fill="#f5f5f5"/>
      <text x="65" y="500" font-family="Arial" font-size="14" fill="#444">Skill 1</text>
      
      <rect x="50" y="520" width="330" height="30" rx="15" fill="#f5f5f5"/>
      <text x="65" y="540" font-family="Arial" font-size="14" fill="#444">Skill 2</text>
      
      <rect x="50" y="560" width="330" height="30" rx="15" fill="#f5f5f5"/>
      <text x="65" y="580" font-family="Arial" font-size="14" fill="#444">Skill 3</text>
      
      <!-- Education section -->
      <text x="420" y="460" font-family="Arial" font-size="20" font-weight="bold" fill="${secondaryColor}">
        Education
      </text>
      
      <text x="420" y="490" font-family="Arial" font-size="16" font-weight="bold" fill="#333">
        Degree Name
      </text>
      <text x="420" y="515" font-family="Arial" font-size="14" fill="#555">
        University Name | 2014 - 2018
      </text>
      
      <!-- Experience section -->
      <text x="50" y="620" font-family="Arial" font-size="20" font-weight="bold" fill="${secondaryColor}">
        Work Experience
      </text>
      
      <!-- Experience item -->
      <text x="50" y="650" font-family="Arial" font-size="16" font-weight="bold" fill="#333">
        Job Title
      </text>
      <text x="50" y="670" font-family="Arial" font-size="14" fill="#555">
        Company Name | 2018 - Present
      </text>
      <rect x="50" y="690" width="700" height="7" rx="3" fill="#eee"/>
      <rect x="50" y="705" width="650" height="7" rx="3" fill="#eee"/>
      <rect x="50" y="720" width="600" height="7" rx="3" fill="#eee"/>
    </svg>`;
  }
}

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
      svgContent: resumeTemplates.svgContent,
      htmlContent: resumeTemplates.htmlContent,
      cssContent: resumeTemplates.cssContent,
      jsContent: resumeTemplates.jsContent,
      displayScale: resumeTemplates.displayScale,
      width: resumeTemplates.width,
      height: resumeTemplates.height,
      aspectRatio: resumeTemplates.aspectRatio,
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

    // TEMPORARY: Fix specific template colors for display
    const processedTemplates = templates.map(template => {
      // Fix the blue/dark template (ID 11) if needed
      if (template.id === 11 && template.htmlContent && 
          (template.htmlContent.indexOf('background-color: #2d2f35') !== -1 || 
           template.htmlContent.indexOf('left-section') !== -1)) {
        
        // Override colors to match the actual template design
        template.primaryColor = "#2d2f35";   // dark gray for left sidebar
        template.secondaryColor = "#4a90e2"; // blue for headers
      }
      return template;
    });
    
    res.json(processedTemplates);
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
    
    let template = templates[0];
    
    // TEMPORARY: Fix for the blue/dark template (ID 11)
    // Check if this is the blue/dark gray template we're troubleshooting
    if (templateId === 11 && template.htmlContent && 
        (template.htmlContent.indexOf('background-color: #2d2f35') !== -1 || 
         template.htmlContent.indexOf('left-section') !== -1)) {
      
      // Fix colors if they don't match the actual template design
      if (template.primaryColor !== "#2d2f35" || template.secondaryColor !== "#4a90e2") {
        console.log("Updating template colors to match actual template design");
        
        // Update the template's stored colors to match the actual template
        await db.update(resumeTemplates)
          .set({
            primaryColor: "#2d2f35",   // dark gray
            secondaryColor: "#4a90e2", // blue
          })
          .where(eq(resumeTemplates.id, templateId));
          
        // Regenerate preview with correct colors
        template.primaryColor = "#2d2f35";
        template.secondaryColor = "#4a90e2";
      }
    }
    
    res.json(template);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template HTML content
router.get("/:id/html", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Get the template HTML content
    const templates = await db.select({
      htmlContent: resumeTemplates.htmlContent,
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    const template = templates[0];
    const htmlContent = template.htmlContent;
    
    if (!htmlContent) {
      return res.status(404).json({ message: "No HTML content available for this template" });
    }
    
    // Return the HTML content
    res.setHeader('Content-Type', 'text/plain');
    res.send(htmlContent);
    
  } catch (error) {
    console.error("Error fetching template HTML:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template CSS content
router.get("/:id/css", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Get the template CSS content
    const templates = await db.select({
      cssContent: resumeTemplates.cssContent,
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    const template = templates[0];
    const cssContent = template.cssContent;
    
    if (!cssContent) {
      return res.status(404).json({ message: "No CSS content available for this template" });
    }
    
    // Return the CSS content
    res.setHeader('Content-Type', 'text/plain');
    res.send(cssContent);
    
  } catch (error) {
    console.error("Error fetching template CSS:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template JavaScript content
router.get("/:id/js", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Get the template JavaScript content
    const templates = await db.select({
      jsContent: resumeTemplates.jsContent,
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    const template = templates[0];
    const jsContent = template.jsContent;
    
    if (!jsContent) {
      return res.status(404).json({ message: "No JavaScript content available for this template" });
    }
    
    // Return the JavaScript content
    res.setHeader('Content-Type', 'text/plain');
    res.send(jsContent);
    
  } catch (error) {
    console.error("Error fetching template JavaScript:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template PDF content
router.get("/:id/pdf", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
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
      return res.status(404).json({ message: "Template not found" });
    }
    
    const template = templates[0];
    const pdfContent = template.pdfContent;
    
    if (!pdfContent) {
      return res.status(404).json({ message: "No PDF content available for this template" });
    }
    
    // Return the PDF content as base64
    res.setHeader('Content-Type', 'text/plain'); // Using text/plain for base64 content
    res.send(pdfContent);
    
  } catch (error) {
    console.error("Error fetching template PDF:", error);
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
    
    // Get the complete template to include name for fallback preview
    const templates = await db.select({
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name,
      primaryColor: resumeTemplates.primaryColor,
      secondaryColor: resumeTemplates.secondaryColor,
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
    
    // Extract template details for possible fallback
    const template = templates[0];
    let content = template.svgContent || '';
    
    // TEMPORARY: Fix for the blue/dark template (ID 11)
    // Check if this is the blue/dark gray template by template ID
    if (templateId === 11) {
      // Override colors to match actual template design 
      template.primaryColor = "#2d2f35";   // dark gray for left sidebar
      template.secondaryColor = "#4a90e2"; // blue for headers
    }
    
    console.log(`Serving template ${templateId} as text/html`); // Log for debugging
    
    // Add security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Create a sample template based on template.name and type
    const getRandomTemplate = () => {
      // Templates collection based on template's characteristics
      const templates = [
        // Sleek dark template with golden accents - "Brian"
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: #000;
              color: #fff;
              overflow-x: hidden;
              max-width: 100vw;
            }
            
            .resume-container {
              display: flex;
              width: 100%;
              height: 100vh;
              position: relative;
            }
            
            .left-column {
              width: 40%;
              background: #000;
              padding: 30px;
              position: relative;
            }
            
            .right-column {
              width: 60%;
              padding: 30px 40px;
              background: #0a0a0a;
              overflow-y: auto;
            }
            
            .photo-container {
              width: 150px;
              height: 150px;
              border-radius: 50%;
              background: #1a1a1a;
              margin: 20px auto 30px;
              position: relative;
              overflow: hidden;
              border: 2px solid #333;
            }
            
            .photo-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 50px;
              color: #444;
              text-transform: uppercase;
            }
            
            .name {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 5px;
              letter-spacing: -0.5px;
              position: relative;
              text-align: right;
            }
            
            .job-title {
              font-size: 16px;
              color: #aaa;
              margin-bottom: 40px;
              text-align: right;
            }
            
            .section-title {
              font-size: 16px;
              text-transform: uppercase;
              color: #e2b52d;
              font-weight: 600;
              margin-bottom: 15px;
              position: relative;
              letter-spacing: 1px;
              text-align: right;
            }
            
            .section-title::before {
              content: "";
              position: absolute;
              bottom: -5px;
              right: 0;
              width: 30px;
              height: 2px;
              background: #e2b52d;
            }
            
            .contact-item {
              margin-bottom: 12px;
              display: flex;
              justify-content: flex-end;
              align-items: center;
              text-align: right;
            }
            
            .contact-item-text {
              color: #ccc;
              font-size: 14px;
            }
            
            .contact-item::before {
              content: "•";
              color: #e2b52d;
              margin-left: 10px;
              font-size: 18px;
            }
            
            .section-content {
              margin-bottom: 30px;
            }
            
            .section-right {
              margin-bottom: 40px;
            }
            
            .right-section-title {
              font-size: 16px;
              text-transform: uppercase;
              color: #e2b52d;
              font-weight: 600;
              margin-bottom: 15px;
              position: relative;
              letter-spacing: 1px;
            }
            
            .right-section-title::before {
              content: "";
              position: absolute;
              bottom: -5px;
              left: 0;
              width: 30px;
              height: 2px;
              background: #e2b52d;
            }
            
            .job-item {
              margin-bottom: 15px;
              animation: fadeIn 0.5s ease-out;
            }
            
            .job-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
            }
            
            .job-role {
              font-weight: 600;
              color: #eee;
              font-size: 15px;
            }
            
            .job-date {
              color: #888;
              font-size: 14px;
            }
            
            .job-company {
              margin-bottom: 8px;
              color: #bbb;
              font-size: 14px;
            }
            
            .job-description {
              color: #aaa;
              font-size: 14px;
              line-height: 1.4;
              margin-left: 15px;
              position: relative;
            }
            
            .job-description::before {
              content: "";
              position: absolute;
              left: -15px;
              top: 8px;
              width: 6px;
              height: 6px;
              border-radius: 50%;
              background: #e2b52d;
            }
            
            .skill-item {
              margin-bottom: 8px;
              color: #ccc;
              font-size: 14px;
              text-align: right;
            }
            
            .skill-bar {
              margin-top: 5px;
              width: 100%;
              height: 4px;
              background: #222;
              border-radius: 2px;
              overflow: hidden;
              position: relative;
            }
            
            .skill-level {
              position: absolute;
              top: 0;
              right: 0;
              height: 100%;
              background: #e2b52d;
              transition: width 0.8s ease-out;
              animation: skillFill 1.5s ease-out forwards;
            }
            
            .references-item {
              margin-bottom: 15px;
              color: #ccc;
              font-size: 14px;
              text-align: right;
            }
            
            .references-name {
              font-weight: 600;
              color: #ddd;
              font-size: 14px;
            }
            
            .references-contact {
              color: #999;
              font-size: 13px;
            }
            
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes skillFill {
              from { width: 0; }
              to { width: var(--skill-width); }
            }
            
            .glow {
              position: absolute;
              top: -20%;
              left: -20%;
              width: 120%;
              height: 50%;
              background: radial-gradient(ellipse at center, rgba(226,181,45,0.15) 0%, rgba(226,181,45,0) 70%);
              pointer-events: none;
              transform: rotate(-20deg);
              opacity: 0.8;
              filter: blur(40px);
              z-index: 0;
            }
            
            .section-right {
              position: relative;
              z-index: 1;
            }
            
            .section-content {
              position: relative;
              z-index: 1;
            }
            
            .about-text {
              font-size: 14px;
              line-height: 1.6;
              color: #aaa;
              margin-bottom: 30px;
            }
            
            .education-item {
              margin-bottom: 15px;
            }
            
            .education-degree {
              font-weight: 600;
              color: #eee;
              font-size: 15px;
              margin-bottom: 5px;
            }
            
            .education-school {
              color: #bbb;
              font-size: 14px;
              margin-bottom: 3px;
            }
            
            .education-date {
              color: #888;
              font-size: 13px;
            }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="resume-container">
            <div class="left-column">
              <div class="glow"></div>
              
              <div class="photo-container">
                <div class="photo-placeholder">B</div>
              </div>
              
              <div class="section-content">
                <h2 class="section-title">Contact Me</h2>
                <div class="contact-item">
                  <span class="contact-item-text">+1-718-310-5658</span>
                </div>
                <div class="contact-item">
                  <span class="contact-item-text">brian@example.com</span>
                </div>
                <div class="contact-item">
                  <span class="contact-item-text">linkedin.com/in/brian</span>
                </div>
                <div class="contact-item">
                  <span class="contact-item-text">769 Providence Street, Lincoln Park, MI 48146</span>
                </div>
              </div>
              
              <div class="section-content">
                <h2 class="section-title">Skills</h2>
                <div class="skill-item">
                  Photoshop
                  <div class="skill-bar">
                    <div class="skill-level" style="--skill-width: 95%"></div>
                  </div>
                </div>
                <div class="skill-item">
                  Illustrator
                  <div class="skill-bar">
                    <div class="skill-level" style="--skill-width: 80%"></div>
                  </div>
                </div>
                <div class="skill-item">
                  InDesign
                  <div class="skill-bar">
                    <div class="skill-level" style="--skill-width: 85%"></div>
                  </div>
                </div>
                <div class="skill-item">
                  After Effects
                  <div class="skill-bar">
                    <div class="skill-level" style="--skill-width: 75%"></div>
                  </div>
                </div>
                <div class="skill-item">
                  HTML/CSS
                  <div class="skill-bar">
                    <div class="skill-level" style="--skill-width: 90%"></div>
                  </div>
                </div>
              </div>
              
              <div class="section-content">
                <h2 class="section-title">References</h2>
                <div class="references-item">
                  <div class="references-name">Darren H. Nguyen</div>
                  <div class="references-contact">+1-555-123-4567</div>
                </div>
                <div class="references-item">
                  <div class="references-name">Robert J. Bolton</div>
                  <div class="references-contact">+1-555-987-6543</div>
                </div>
              </div>
            </div>
            
            <div class="right-column">
              <div class="name">BRIAN</div>
              <div class="job-title">Graphic & Web Designer</div>
              
              <div class="section-right">
                <h2 class="right-section-title">About Me</h2>
                <div class="about-text">
                  Creative and detail-oriented Graphic Designer with over 7 years of experience creating visual concepts that communicate ideas that inspire, inform, and captivate consumers. Proficient in Adobe Creative Suite with a strong background in both print and digital media design.
                </div>
              </div>
              
              <div class="section-right">
                <h2 class="right-section-title">Experience</h2>
                
                <div class="job-item">
                  <div class="job-header">
                    <div class="job-role">Senior Web Designer</div>
                    <div class="job-date">2020 - Present</div>
                  </div>
                  <div class="job-company">Creative Agency XYZ</div>
                  <div class="job-description">Led UI/UX design for multiple high-profile client websites and applications</div>
                  <div class="job-description">Managed a team of 3 junior designers and provided mentorship</div>
                  <div class="job-description">Increased client satisfaction ratings by 35% through improved design processes</div>
                </div>
                
                <div class="job-item">
                  <div class="job-header">
                    <div class="job-role">Graphic Designer</div>
                    <div class="job-date">2017 - 2020</div>
                  </div>
                  <div class="job-company">Design Studio ABC</div>
                  <div class="job-description">Created brand identities, marketing materials, and digital assets for clients</div>
                  <div class="job-description">Collaborated with marketing team to develop cohesive visual strategies</div>
                  <div class="job-description">Designed 20+ successful advertising campaigns for both print and digital media</div>
                </div>
              </div>
              
              <div class="section-right">
                <h2 class="right-section-title">Education</h2>
                
                <div class="education-item">
                  <div class="education-degree">Bachelor of Fine Arts in Graphic Design</div>
                  <div class="education-school">School of Visual Arts</div>
                  <div class="education-date">2013 - 2017</div>
                </div>
                
                <div class="education-item">
                  <div class="education-degree">Certificate in UI/UX Design</div>
                  <div class="education-school">Design Academy Online</div>
                  <div class="education-date">2018</div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>`,

        // Modern yellow-accented template with skills list - "Tbz"
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: #222;
              color: #333;
              overflow-x: hidden;
              max-width: 100vw;
            }
            
            .resume-container {
              display: flex;
              width: 100%;
              height: 100vh;
              position: relative;
            }
            
            .left-column {
              width: 35%;
              background: #111;
              padding: 30px;
              position: relative;
              overflow: hidden;
            }
            
            .right-column {
              width: 65%;
              padding: 40px;
              background: #f9f9f9;
              position: relative;
              overflow-y: auto;
            }
            
            .photo-container {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              background: #222;
              margin: 0 auto 30px;
              position: relative;
              overflow: hidden;
            }
            
            .photo-placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 40px;
              color: #777;
              background: #2a2a2a;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: 600;
              text-transform: uppercase;
              color: #ffb400;
              margin-bottom: 20px;
              letter-spacing: 1px;
              position: relative;
              display: flex;
              align-items: center;
            }
            
            .section-title::before {
              content: "";
              width: 6px;
              height: 6px;
              background: #ffb400;
              margin-right: 10px;
              display: inline-block;
            }
            
            .contact-item {
              margin-bottom: 15px;
              display: flex;
              color: #ddd;
              font-size: 14px;
              align-items: center;
            }
            
            .contact-item::before {
              content: "•";
              color: #ffb400;
              margin-right: 10px;
              font-size: 18px;
            }
            
            .skill-item {
              margin-bottom: 20px;
              color: #ddd;
            }
            
            .skill-name {
              font-size: 14px;
              margin-bottom: 5px;
            }
            
            .skill-bar {
              height: 6px;
              background: rgba(255,255,255,0.1);
              position: relative;
              border-radius: 3px;
              overflow: hidden;
            }
            
            .skill-level {
              position: absolute;
              top: 0;
              left: 0;
              height: 100%;
              background: #ffb400;
              transition: width 1s ease-out;
              animation: skillFill 1.5s ease-out forwards;
            }
            
            .references-item {
              margin-bottom: 15px;
              color: #ddd;
            }
            
            .references-name {
              font-weight: 600;
              font-size: 14px;
              margin-bottom: 3px;
            }
            
            .references-position {
              color: #aaa;
              font-size: 12px;
              margin-bottom: 3px;
            }
            
            .references-contact {
              font-size: 12px;
              color: #999;
            }
            
            .name-container {
              position: relative;
              z-index: 2;
              margin: 30px 0;
            }
            
            .name {
              font-size: 36px;
              font-weight: 700;
              font-family: 'Poppins', sans-serif;
              margin-bottom: 5px;
              color: #222;
              position: relative;
            }
            
            .job-title {
              font-size: 16px;
              color: #555;
              font-weight: 500;
            }
            
            .right-section-title {
              font-size: 22px;
              color: #333;
              font-weight: 600;
              margin-bottom: 20px;
              position: relative;
              padding-bottom: 10px;
              font-family: 'Poppins', sans-serif;
            }
            
            .right-section-title::after {
              content: "";
              position: absolute;
              left: 0;
              bottom: 0;
              width: 40px;
              height: 3px;
              background: #ffb400;
            }
            
            .about-text {
              font-size: 15px;
              line-height: 1.6;
              color: #555;
              margin-bottom: 30px;
            }
            
            .experience-item {
              margin-bottom: 25px;
              position: relative;
              padding-left: 20px;
            }
            
            .experience-item::before {
              content: "";
              position: absolute;
              left: 0;
              top: 8px;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #ffb400;
            }
            
            .experience-title {
              font-weight: 600;
              font-size: 17px;
              color: #333;
              margin-bottom: 5px;
            }
            
            .experience-company {
              font-size: 15px;
              color: #444;
              margin-bottom: 5px;
            }
            
            .experience-date {
              font-size: 14px;
              color: #666;
              margin-bottom: 10px;
            }
            
            .experience-description {
              font-size: 14px;
              color: #555;
              line-height: 1.5;
            }
            
            .education-item {
              margin-bottom: 20px;
            }
            
            .education-degree {
              font-weight: 600;
              font-size: 16px;
              color: #333;
              margin-bottom: 5px;
            }
            
            .education-school {
              font-size: 15px;
              color: #444;
              margin-bottom: 3px;
            }
            
            .education-date {
              font-size: 14px;
              color: #666;
            }
            
            .section-right {
              margin-bottom: 40px;
            }
            
            @keyframes skillFill {
              from { width: 0; }
              to { width: var(--skill-width); }
            }
            
            .left-glow {
              position: absolute;
              top: -30%;
              left: -30%;
              width: 150%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(255,180,0,0.1) 0%, rgba(255,180,0,0) 70%);
              transform: rotate(-30deg);
              pointer-events: none;
              z-index: 1;
            }
            
            .right-glow {
              position: absolute;
              top: 10%;
              right: -10%;
              width: 40%;
              height: 40%;
              background: radial-gradient(ellipse at center, rgba(255,180,0,0.05) 0%, rgba(255,180,0,0) 70%);
              pointer-events: none;
              z-index: 1;
            }
            
            .decoration-line {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 8px;
              background: #ffb400;
            }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="resume-container">
            <div class="left-column">
              <div class="left-glow"></div>
              
              <div class="photo-container">
                <div class="photo-placeholder">T</div>
              </div>
              
              <div class="section-title">Contact Me</div>
              <div class="contact-item">+1-734-310-5050</div>
              <div class="contact-item">example@gmail.com</div>
              <div class="contact-item">www.yourwebsite.com</div>
              <div class="contact-item">789 Providence Street, Lincoln Park, MI 48146</div>
              
              <div class="section-title" style="margin-top: 30px;">References</div>
              <div class="references-item">
                <div class="references-name">Darren H. Nguyen</div>
                <div class="references-position">Design Director, XYZ Co.</div>
                <div class="references-contact">+1-555-123-4567</div>
              </div>
              <div class="references-item">
                <div class="references-name">Robert J. Bolton</div>
                <div class="references-position">Creative Lead, ABC Inc.</div>
                <div class="references-contact">+1-555-987-6543</div>
              </div>
              
              <div class="section-title" style="margin-top: 30px;">Education</div>
              <div class="references-item">
                <div class="references-name">Bachelor of Design</div>
                <div class="references-position">University of Design Arts</div>
                <div class="references-contact">2014 - 2018</div>
              </div>
            </div>
            
            <div class="right-column">
              <div class="decoration-line"></div>
              <div class="right-glow"></div>
              
              <div class="name-container">
                <div class="name">TBZ</div>
                <div class="job-title">Senior Web Designer & Creative Specialist</div>
              </div>
              
              <div class="section-right">
                <div class="right-section-title">About Me</div>
                <div class="about-text">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl at tincidunt commodo, purus nisi lacinia est, eu auctor magna nisi eu nulla. Nam euismod magna sit amet magna tincidunt, eu aliquet magna tempus.
                </div>
              </div>
              
              <div class="section-right">
                <div class="right-section-title">Experience</div>
                
                <div class="experience-item">
                  <div class="experience-title">Senior Web Designer</div>
                  <div class="experience-company">Creative Solutions Agency</div>
                  <div class="experience-date">2021 - Present</div>
                  <div class="experience-description">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl at tincidunt commodo, purus nisi lacinia est, eu auctor magna nisi eu nulla.
                  </div>
                </div>
                
                <div class="experience-item">
                  <div class="experience-title">UI/UX Designer</div>
                  <div class="experience-company">Digital Marketing Studio</div>
                  <div class="experience-date">2018 - 2021</div>
                  <div class="experience-description">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed euismod, nisl at tincidunt commodo, purus nisi lacinia est, eu auctor magna nisi eu nulla.
                  </div>
                </div>
              </div>
              
              <div class="section-right">
                <div class="right-section-title">Skills</div>
                
                <div style="display: flex; flex-wrap: wrap; gap: 20px;">
                  <div style="flex: 1; min-width: 200px;">
                    <div class="skill-item">
                      <div class="skill-name">Adobe Photoshop</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 95%"></div>
                      </div>
                    </div>
                    
                    <div class="skill-item">
                      <div class="skill-name">HTML/CSS</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 90%"></div>
                      </div>
                    </div>
                    
                    <div class="skill-item">
                      <div class="skill-name">JavaScript</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 80%"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div style="flex: 1; min-width: 200px;">
                    <div class="skill-item">
                      <div class="skill-name">Illustrator</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 85%"></div>
                      </div>
                    </div>
                    
                    <div class="skill-item">
                      <div class="skill-name">Figma</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 90%"></div>
                      </div>
                    </div>
                    
                    <div class="skill-item">
                      <div class="skill-name">After Effects</div>
                      <div class="skill-bar">
                        <div class="skill-level" style="--skill-width: 75%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>`,
        
        // Apple-inspired minimal template with sleek design - similar to your reference
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700&display=swap');
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            }
            
            body {
              margin: 0;
              padding: 0;
              background: #f5f5f7;
              color: #333;
              overflow-x: hidden;
              max-width: 100vw;
            }
            
            .resume-card {
              width: 100%;
              height: 100vh;
              position: relative;
              display: flex;
              flex-direction: column;
              border-radius: 8px;
              background: #000;
              box-shadow: 0 5px 25px rgba(0,0,0,0.05);
              overflow: hidden;
              animation: cardFadeIn 0.8s ease-out forwards;
            }
            
            .header {
              padding: 30px;
              position: relative;
              z-index: 2;
            }
            
            .product-name {
              font-size: 32px;
              font-weight: 600;
              color: #f5f5f7;
              letter-spacing: -0.5px;
              margin-bottom: 5px;
            }
            
            .tagline {
              font-size: 16px;
              font-weight: 400;
              color: #9765f6;
              margin-bottom: 10px;
              position: relative;
              display: inline-block;
            }
            
            .tagline::after {
              content: "®";
              position: absolute;
              top: 0;
              right: -12px;
              font-size: 10px;
            }
            
            .price {
              font-size: 16px;
              font-weight: 500;
              color: #aaa;
              margin-top: 10px;
            }
            
            .body {
              flex: 1;
              display: flex;
              position: relative;
              overflow: hidden;
            }
            
            .product-image {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              position: relative;
              flex: 1;
            }
            
            .product-image::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(circle at 40% 40%, rgba(151, 101, 246, 0.5) 0%, rgba(151, 101, 246, 0.1) 40%, rgba(0,0,0,0) 65%);
              pointer-events: none;
              animation: glowPulse 4s ease-in-out infinite alternate;
            }
            
            .product-placeholder {
              position: relative;
              transform-style: preserve-3d;
              transform: perspective(1000px) rotateY(-5deg) rotateX(5deg);
              animation: float 6s ease-in-out infinite;
              z-index: 2;
            }
            
            .product-text {
              color: #f5f5f7;
              font-size: 140px;
              font-weight: 700;
              text-shadow: 0 0 20px rgba(151, 101, 246, 0.7), 0 0 40px rgba(151, 101, 246, 0.4);
              letter-spacing: -6px;
              animation: pulse 4s ease-in-out infinite alternate;
            }
            
            .features {
              position: absolute;
              bottom: 0;
              width: 100%;
              display: flex;
              flex-wrap: wrap;
              padding: 20px;
              gap: 10px;
              z-index: 3;
            }
            
            .feature {
              padding: 8px 15px;
              background: rgba(255,255,255,0.1);
              border-radius: 20px;
              font-size: 14px;
              color: #f5f5f7;
              backdrop-filter: blur(5px);
              animation: fadeUp 0.5s ease-out forwards;
              animation-delay: calc(var(--index) * 0.1s);
              opacity: 0;
              transform: translateY(10px);
            }
            
            @keyframes cardFadeIn {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
            }
            
            @keyframes float {
              0%, 100% { transform: perspective(1000px) rotateY(-5deg) rotateX(5deg) translateY(0); }
              50% { transform: perspective(1000px) rotateY(2deg) rotateX(-2deg) translateY(-15px); }
            }
            
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.7; }
            }
            
            @keyframes glowPulse {
              0%, 100% { opacity: 0.5; }
              50% { opacity: 0.8; }
            }
            
            @keyframes fadeUp {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="resume-card">
            <div class="header">
              <div class="product-name">${template.name}</div>
              <div class="tagline">TbzResumeBuilder</div>
              <div class="price">Professional Resume Template</div>
            </div>
            
            <div class="body">
              <div class="product-image">
                <div class="product-placeholder">
                  <div class="product-text">PRO</div>
                </div>
              </div>
              
              <div class="features">
                <div class="feature" style="--index: 1">ATS-Optimized</div>
                <div class="feature" style="--index: 2">Professional Design</div>
                <div class="feature" style="--index: 3">Customizable</div>
                <div class="feature" style="--index: 4">Modern Layout</div>
                <div class="feature" style="--index: 5">Eye-Catching</div>
              </div>
            </div>
          </div>
        </body>
        </html>`
      ];
      
      // Select a template based on the name or pick a random one if we can't determine
      const templateIndex = templateId % templates.length;
      return templates[templateIndex];
    };

    // If content is empty or too short, provide a fallback
    if (!content || content.trim().length < 50) {
      try {
        const fallbackContent = getRandomTemplate();
        
        // Set appropriate content type
        res.setHeader('Content-Type', 'text/html');
        res.send(fallbackContent);
        console.log(`Serving generated template for ${templateId} as text/html`);
        return;
      } catch (err) {
        console.error("Error generating fallback template:", err);
        // If the fallback template generation fails, we'll continue with the regular flow
      }
    }
    
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
      // If content doesn't look like SVG or HTML, try to wrap it in an HTML document
      content = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none';">
        <title>${template.name} Template</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #fff;
            color: #333;
          }
          .container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
      </body>
      </html>`;
      
      res.setHeader('Content-Type', 'text/html');
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

    // Get template with both thumbnailUrl and svgContent
    const templates = await db.select({
      thumbnailUrl: resumeTemplates.thumbnailUrl,
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name
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

    const template = templates[0];
    
    // If template has a thumbnailUrl, redirect to it
    if (template.thumbnailUrl) {
      return res.redirect(template.thumbnailUrl);
    }
    
    // If the template has SVG content, convert to a simpler SVG preview
    if (template.svgContent) {
      // Create a simple preview image based on the template name
      const previewSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <rect width="100%" height="100%" fill="#f1f5f9" />
        <rect x="40" y="40" width="320" height="120" fill="#ffffff" rx="8" stroke="#e2e8f0" stroke-width="2" />
        <text x="200" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="#0f172a" font-weight="bold">${template.name}</text>
        
        <rect x="40" y="180" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="40" y="230" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="40" y="280" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <rect x="40" y="340" width="150" height="180" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="210" y="340" width="150" height="180" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <rect x="40" y="540" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <text x="200" y="570" font-family="Arial" font-size="14" text-anchor="middle" fill="#64748b">Resume Template</text>
      </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(previewSvg);
      return;
    }
    
    // If all else fails, serve a default placeholder image
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
      // IMPORTANT: Preserve empty strings as valid content
      htmlContent: req.body.htmlContent !== undefined ? req.body.htmlContent : null,
      cssContent: req.body.cssContent !== undefined ? req.body.cssContent : null,
      jsContent: req.body.jsContent !== undefined ? req.body.jsContent : null,
      pdfContent: req.body.pdfContent || null,
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
      // CRITICAL FIX: Always preserve content as empty strings (not null)
      htmlContent: template.htmlContent !== undefined ? template.htmlContent : '',
      cssContent: template.cssContent !== undefined ? template.cssContent : '',
      jsContent: template.jsContent !== undefined ? template.jsContent : '',
      pdfContent: template.pdfContent || null,
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
    
    // Debug: For tracking which fields are being sent
    console.log("Template content fields:", {
      htmlContent: typeof req.body.htmlContent,
      cssContent: typeof req.body.cssContent,
      jsContent: typeof req.body.jsContent,
      svgContent: typeof req.body.svgContent,
    });
    
    // Create a clean object with only the needed fields
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      svgContent: req.body.svgContent || '', // Always ensure it's a string, never null
      // CRITICAL FIX: Always preserve content as empty strings (not null)
      htmlContent: req.body.htmlContent !== undefined ? req.body.htmlContent : '',
      cssContent: req.body.cssContent !== undefined ? req.body.cssContent : '',
      jsContent: req.body.jsContent !== undefined ? req.body.jsContent : '',
      pdfContent: req.body.pdfContent || null,
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
      // CRITICAL FIX: Always preserve empty strings in version history too
      htmlContent: validatedData.htmlContent !== undefined ? validatedData.htmlContent : '',
      cssContent: validatedData.cssContent !== undefined ? validatedData.cssContent : '',
      jsContent: validatedData.jsContent !== undefined ? validatedData.jsContent : '',
      pdfContent: validatedData.pdfContent || null,
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
      htmlContent: resumeTemplateVersions.htmlContent,
      cssContent: resumeTemplateVersions.cssContent,
      jsContent: resumeTemplateVersions.jsContent,
      pdfContent: resumeTemplateVersions.pdfContent,
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
    
    // Update the template with the old version's content (all content types)
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        svgContent: versions[0].svgContent,
        htmlContent: versions[0].htmlContent,
        cssContent: versions[0].cssContent,
        jsContent: versions[0].jsContent,
        pdfContent: versions[0].pdfContent,
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
      htmlContent: versions[0].htmlContent,
      cssContent: versions[0].cssContent,
      jsContent: versions[0].jsContent,
      pdfContent: versions[0].pdfContent,
      createdById: req.user?.id,
      changelog: `Restored from version ${versionNumber}`,
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error restoring template version:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Template Preview Image Generation - Admin only
router.post("/:id/generate-preview", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Get the source type from request body (default to 'html')
    const { sourceType = 'html' } = req.body;
    
    // Get the complete template with all fields we might need
    const templates = await db.select({
      htmlContent: resumeTemplates.htmlContent,
      cssContent: resumeTemplates.cssContent,
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name,
      primaryColor: resumeTemplates.primaryColor,
      secondaryColor: resumeTemplates.secondaryColor,
    })
    .from(resumeTemplates)
    .where(eq(resumeTemplates.id, templateId))
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    const template = templates[0];
    
    // Set the output path with SVG extension since PNG generation might fail with Puppeteer
    let outputFilename = `template-${templateId}-${Date.now()}.svg`;
    const outputPath = `public/uploads/previews/${outputFilename}`;
    
    // Ensure directory exists 
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Extract colors from template for preview generation
    let primaryColor = template.primaryColor || "#2d2f35";
    let secondaryColor = template.secondaryColor || "#4a90e2";
    
    // Analyze HTML content to detect colors if needed
    if (template.htmlContent) {
      const htmlContent = template.htmlContent;
      
      // Check for two-column layout with dark sidebar, blue accents
      const hasDarkSidebar = 
        htmlContent.includes('background-color: #2d2f35') || 
        htmlContent.includes('.left-section') ||
        (htmlContent.includes('display: flex') && htmlContent.includes('width: 35%'));
        
      if (hasDarkSidebar) {
        primaryColor = "#2d2f35";
        secondaryColor = "#4a90e2";
      }
      
      // Update detected colors in the template
      if (primaryColor !== template.primaryColor || secondaryColor !== template.secondaryColor) {
        await db.update(resumeTemplates)
          .set({
            primaryColor,
            secondaryColor
          })
          .where(eq(resumeTemplates.id, templateId));
      }
    }
    
    let previewGenerated = false;
    
    // Try to use existing SVG content first if available and requested
    if (sourceType === 'svg' && template.svgContent) {
      fs.writeFileSync(outputPath, template.svgContent);
      previewGenerated = true;
    } 
    // Otherwise try HTML rendering with Puppeteer
    else if (template.htmlContent) {
      try {
        // Try to generate PNG with Puppeteer first
        const pngOutputPath = outputPath.replace(/\.svg$/, '.png');
        await renderTemplateToImage(template.htmlContent, pngOutputPath);
        
        // If successful, use PNG extension instead
        outputFilename = outputFilename.replace(/\.svg$/, '.png');
        previewGenerated = true;
      } catch (puppeteerError) {
        console.error(`Error generating HTML preview with Puppeteer:`, puppeteerError);
        // Puppeteer failed - fall back to SVG generation below
      }
    }
    
    // If preview wasn't successfully generated, create a fallback SVG
    if (!previewGenerated) {
      const fallbackSvg = generateTemplatePreviewSvg(template.name, primaryColor, secondaryColor);
      fs.writeFileSync(outputPath, fallbackSvg);
    }
    
    // Update the template with the new thumbnail URL
    const thumbnailUrl = `/uploads/previews/${outputFilename}`;
    
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        thumbnailUrl,
        primaryColor,
        secondaryColor,
        updatedAt: new Date()
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    res.json({ 
      success: true, 
      message: "Preview generated successfully", 
      thumbnailUrl,
      template: updatedTemplate
    });
    
  } catch (error) {
    console.error("Error generating template preview:", error);
    res.status(500).json({ message: "Failed to generate preview" });
  }
});

// Upload Preview Image - Admin only
router.post("/:id/upload-preview", isAdmin, upload.single('previewImage'), async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    // Get file path relative to public directory
    const thumbnailUrl = `/uploads/previews/${req.file.filename}`;
    
    // Update the template with the new thumbnail URL
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        thumbnailUrl: thumbnailUrl,
        updatedAt: new Date(),
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    if (!updatedTemplate) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json({ 
      success: true, 
      message: "Image uploaded successfully", 
      thumbnailUrl: thumbnailUrl,
      template: updatedTemplate
    });
    
  } catch (error) {
    console.error("Error uploading template preview:", error);
    res.status(500).json({ message: "Failed to upload preview image" });
  }
});

export default router;