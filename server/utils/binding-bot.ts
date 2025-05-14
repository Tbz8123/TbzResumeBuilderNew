/**
 * Template Binding Bot
 * Utilities for analyzing templates and suggesting bindings
 */

// Regular expressions for extracting template tokens
const HANDLEBAR_PATTERN = /\{\{\s*([^}\{#\/]+?)\s*\}\}/g;
const BRACKET_PATTERN = /\[\[FIELD:([^\]]+)\]\]/g;
const BRACE_PATTERN = /\{field:([^}]+)\}/g;
const TEMPLATE_LITERAL_PATTERN = /\$\{([^}]+)\}/g;

/**
 * Extract tokens from a template HTML string
 */
export function extractTemplateTokens(html: string): string[] {
  const tokens: string[] = [];
  let match;
  
  // Extract Handlebars tokens ({{ name }})
  while ((match = HANDLEBAR_PATTERN.exec(html)) !== null) {
    tokens.push(match[0]);
  }
  
  // Reset regex state
  HANDLEBAR_PATTERN.lastIndex = 0;
  
  // Extract Bracket tokens ([[FIELD:name]])
  while ((match = BRACKET_PATTERN.exec(html)) !== null) {
    tokens.push(match[0]);
  }
  
  // Reset regex state
  BRACKET_PATTERN.lastIndex = 0;
  
  // Extract Brace tokens ({field:name})
  while ((match = BRACE_PATTERN.exec(html)) !== null) {
    tokens.push(match[0]);
  }
  
  // Reset regex state
  BRACE_PATTERN.lastIndex = 0;
  
  // Extract Template Literal tokens (${name})
  while ((match = TEMPLATE_LITERAL_PATTERN.exec(html)) !== null) {
    tokens.push(match[0]);
  }
  
  // Filter out duplicates
  return [...new Set(tokens)];
}

/**
 * Analyze the context of a token in the template
 */
export function analyzeTokenContext(token: string, html: string): { 
  context: string; 
  section?: string;
  isInRepeatedBlock: boolean;
} {
  // Default result
  const result = {
    context: '',
    isInRepeatedBlock: false
  };
  
  // Find the token in the HTML
  const index = html.indexOf(token);
  if (index === -1) return result;
  
  // Get surrounding text (100 characters before and after)
  const start = Math.max(0, index - 100);
  const end = Math.min(html.length, index + token.length + 100);
  result.context = html.substring(start, end);
  
  // Check if token is inside a loop block (common patterns)
  // Handlebars #each
  if (result.context.includes('{{#each')) {
    result.isInRepeatedBlock = true;
    
    // Try to determine section from the each block
    const eachMatch = /\{\{#each\s+([^\s}]+)/.exec(result.context);
    if (eachMatch) {
      result.section = eachMatch[1];
    }
  }
  
  // React/JSX mapping with loop
  if (result.context.includes('.map(') || result.context.includes('v-for=')) {
    result.isInRepeatedBlock = true;
  }
  
  return result;
}

/**
 * Suggest bindings for template tokens
 */
export function suggestBindings(
  tokens: string[],
  resumeSchema: any,
  html: string,
  existingBindings: any[] = []
): any[] {
  // Map to hold our suggestions
  const suggestions: any[] = [];
  
  // Skip tokens that are already bound
  const boundTokens = existingBindings.map(b => b.placeholderToken);
  const unboundTokens = tokens.filter(token => !boundTokens.includes(token));
  
  for (const token of unboundTokens) {
    // Get clean field name from token
    let fieldName = token
      .replace(/\[\[FIELD:|\]\]/g, '')
      .replace(/\{\{|\}\}/g, '')
      .replace(/\{field:|\}/g, '')
      .replace(/\$\{|\}/g, '')
      .trim();
    
    // Analyze context
    const context = analyzeTokenContext(token, html);
    
    // Find potential matches in schema
    const matches = findSchemaMatches(fieldName, resumeSchema, context);
    
    if (matches.length > 0) {
      suggestions.push({
        token,
        fieldName,
        matches,
        context: context.context,
        inRepeatedBlock: context.isInRepeatedBlock
      });
    } else {
      suggestions.push({
        token,
        fieldName,
        matches: [],
        context: context.context,
        inRepeatedBlock: context.isInRepeatedBlock
      });
    }
  }
  
  return suggestions;
}

/**
 * Find matching fields in schema
 */
function findSchemaMatches(fieldName: string, schema: any, context: any): { path: string; score: number }[] {
  const matches: { path: string; score: number }[] = [];
  const fieldNameLower = fieldName.toLowerCase();
  
  // Helper function to recursively scan schema
  function scanSchema(obj: any, path: string = '') {
    if (!obj) return;
    
    // For objects
    if (typeof obj === 'object' && !Array.isArray(obj)) {
      // Check each property
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const keyLower = key.toLowerCase();
        
        // Calculate match score
        let score = 0;
        
        // Exact match
        if (keyLower === fieldNameLower) {
          score = 100;
        } 
        // Contains match
        else if (keyLower.includes(fieldNameLower) || fieldNameLower.includes(keyLower)) {
          score = 70;
        }
        
        // Contextual boost
        if (context.section && currentPath.startsWith(context.section)) {
          score += 20;
        }
        
        // Array item in repeated block
        if (context.isInRepeatedBlock && currentPath.includes('[]')) {
          score += 15;
        }
        
        // Common patterns
        const commonPatterns: Record<string, string[]> = {
          name: ['firstName', 'lastName', 'fullName'],
          email: ['emailAddress', 'email'],
          phone: ['phoneNumber', 'telephone', 'mobile'],
          address: ['location', 'address'],
          company: ['organization', 'employer'],
          title: ['jobTitle', 'position', 'role'],
          description: ['summary', 'details', 'content']
        };
        
        // Check common patterns
        for (const [pattern, matches] of Object.entries(commonPatterns)) {
          if (fieldNameLower.includes(pattern) && matches.some(m => keyLower.includes(m))) {
            score += 25;
          }
        }
        
        // Add to matches if score is significant
        if (score > 30) {
          matches.push({
            path: currentPath,
            score
          });
        }
        
        // Recurse for nested objects
        scanSchema(value, currentPath);
      }
    }
    // For arrays with type definition
    else if (typeof obj === 'object' && obj.type === 'array' && obj.items) {
      const arrayPath = `${path}[]`;
      scanSchema(obj.items, arrayPath);
    }
  }
  
  // Start scanning
  scanSchema(schema);
  
  // Sort matches by score
  return matches.sort((a, b) => b.score - a.score);
}