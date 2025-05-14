import { db } from "../../db";
import { resumeTemplates as templatesTable } from "@shared/schema";
import { eq } from "drizzle-orm";
import { Express, Request, Response } from "express";

interface Token {
  id: string;
  text: string;
  type: "field" | "loop" | "conditional" | "raw";
}

export const setupTemplateTokensRoutes = (app: Express) => {
  // Get all tokens from a template's HTML content
  app.get("/api/templates/:id/tokens", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      // Fetch template HTML content
      const template = await db.query.resumeTemplates.findFirst({
        where: eq(templatesTable.id, parseInt(id, 10)),
      });
      
      if (!template) {
        return res.status(404).json({ error: "Template not found" });
      }
      
      // Parse HTML content to extract tokens
      const tokens = extractTokensFromHtml(template.htmlContent || "");
      
      return res.status(200).json(tokens);
    } catch (error) {
      console.error("Error extracting template tokens:", error);
      return res.status(500).json({ error: "Failed to extract template tokens" });
    }
  });
};

/**
 * Extract tokens from HTML content
 * This handles multiple template syntax formats:
 * - Handlebars style: {{ field }} and {{#each items}}...{{/each}}
 * - Custom brackets: [[FIELD:name]] and [[LOOP:items]]...[[/LOOP]]
 */
function extractTokensFromHtml(html: string): Token[] {
  if (!html) return [];
  
  const tokens: Token[] = [];
  let tokenId = 0;
  
  // Match handlebars-style simple fields: {{ field }}
  const handlebarFieldRegex = /{{([^#\/][^}]*?)}}/g;
  let match;
  
  while ((match = handlebarFieldRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "field"
    });
  }
  
  // Match handlebars-style loops: {{#each items}}
  const handlebarLoopRegex = /{{#each ([^}]*?)}}/g;
  
  while ((match = handlebarLoopRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "loop"
    });
  }
  
  // Match handlebars-style conditionals: {{#if condition}}
  const handlebarConditionalRegex = /{{#if ([^}]*?)}}/g;
  
  while ((match = handlebarConditionalRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "conditional"
    });
  }
  
  // Match bracket-style fields: [[FIELD:name]]
  const bracketFieldRegex = /\[\[FIELD:([^\]]*?)\]\]/g;
  
  while ((match = bracketFieldRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "field"
    });
  }
  
  // Match bracket-style loops: [[LOOP:items]]
  const bracketLoopRegex = /\[\[LOOP:([^\]]*?)\]\]/g;
  
  while ((match = bracketLoopRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "loop"
    });
  }
  
  // Match bracket-style conditionals: [[IF:condition]]
  const bracketConditionalRegex = /\[\[IF:([^\]]*?)\]\]/g;
  
  while ((match = bracketConditionalRegex.exec(html)) !== null) {
    tokens.push({
      id: `token-${tokenId++}`,
      text: match[0],
      type: "conditional"
    });
  }
  
  return tokens;
}