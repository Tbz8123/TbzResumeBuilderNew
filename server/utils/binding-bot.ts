/**
 * Template Binding Bot Utility Functions
 * 
 * This module provides utility functions for analyzing template HTML
 * and suggesting appropriate data field bindings.
 */

interface TokenContext {
  token: string;
  cleanName: string;
  htmlTag?: string;
  parentTag?: string;
  surroundingText?: string;
}

interface DataField {
  path: string;
  type: string;
  description?: string;
  title?: string;
}

interface FlattenedField extends DataField {
  name: string; // User-friendly name derived from path or title
}

interface BindingSuggestion {
  token: string;
  fieldPath: string;
  confidence: number;
  reasoning?: string;
}

interface Binding {
  id: number;
  templateId: number;
  placeholderToken: string;
  dataField: string;
}

/**
 * Extract template tokens (placeholders) from HTML content
 */
export function extractTemplateTokens(html: string): string[] {
  if (!html) return [];
  
  const placeholders: string[] = [];
  const patterns = [
    /\[\[FIELD:(.*?)\]\]/g,    // [[FIELD:name]]
    /{{([^#/][^}]*)}}/g,       // {{name}}
    /{{#each\s+(.*?)}}/g,      // {{#each items}}
    /{{#if\s+(.*?)}}/g         // {{#if condition}}
  ];
  
  // Apply each pattern
  for (const pattern of patterns) {
    let match;
    const htmlCopy = html.slice(); // Create a copy to avoid regex state issues
    while ((match = pattern.exec(htmlCopy)) !== null) {
      placeholders.push(match[0]);
    }
  }
  
  return Array.from(new Set(placeholders)); // Remove duplicates
}

/**
 * Analyze the context of a token in HTML to improve matching
 */
export function analyzeTokenContext(token: string, html: string): TokenContext {
  // Clean token name (remove syntax markers)
  const cleanName = token
    .replace(/\[\[FIELD:|\]\]/g, '')
    .replace(/{{|}}/g, '')
    .trim();
  
  const context: TokenContext = {
    token,
    cleanName
  };
  
  // Find the token in HTML to extract surrounding context
  const index = html.indexOf(token);
  if (index === -1) return context;
  
  // Get surrounding text (50 chars before and after)
  const start = Math.max(0, index - 50);
  const end = Math.min(html.length, index + token.length + 50);
  context.surroundingText = html.substring(start, end);
  
  // Try to identify containing HTML tag
  const beforeToken = html.substring(0, index);
  const lastOpenTagRegex = /<([a-zA-Z][a-zA-Z0-9]*)[^>]*>(?!.*<\/\1>.*$)/g;
  
  // For older JS compatibility, use an approach that works without matchAll
  const matches = [];
  let match;
  while ((match = lastOpenTagRegex.exec(beforeToken)) !== null) {
    matches.push(match);
  }
  
  if (matches.length > 0) {
    const lastMatch = matches[matches.length - 1];
    context.htmlTag = lastMatch[1]?.toLowerCase();
    
    // Try to find parent tag
    if (matches.length > 1) {
      const parentMatch = matches[matches.length - 2];
      context.parentTag = parentMatch[1]?.toLowerCase();
    }
  }
  
  return context;
}

/**
 * Flatten a nested schema into a list of fields with full paths
 */
function flattenSchema(
  schema: Record<string, any>, 
  parentPath: string = '', 
  result: FlattenedField[] = []
): FlattenedField[] {
  for (const [key, value] of Object.entries(schema)) {
    const path = parentPath ? `${parentPath}.${key}` : key;
    const name = value.title || formatFieldName(key);
    
    result.push({
      path,
      name,
      type: value.type || 'string',
      description: value.description,
      title: value.title
    });
    
    // Recursively process nested properties in objects
    if (value.type === 'object' && value.properties) {
      flattenSchema(value.properties, path, result);
    }
    
    // Add array item placeholder
    if (value.type === 'array' && value.items) {
      // Add array itself
      const arrayItemPath = `${path}[0]`;
      
      if (value.items.type === 'object' && value.items.properties) {
        flattenSchema(value.items.properties, arrayItemPath, result);
      } else {
        result.push({
          path: arrayItemPath,
          name: `${name} Item`,
          type: value.items.type || 'string',
          description: `First item in ${name} array`
        });
      }
    }
  }
  
  return result;
}

/**
 * Format a camelCase or snake_case field name into readable text
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    // Convert camelCase to spaces
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Convert snake_case to spaces
    .replace(/_/g, ' ')
    // Capitalize first letter
    .replace(/^./, match => match.toUpperCase());
}

/**
 * Calculate string similarity for field matching
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1.length && !str2.length) return 1.0;
  if (!str1.length || !str2.length) return 0.0;
  
  // Convert to lowercase for case-insensitive comparison
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(s1, s2);
  const maxLen = Math.max(s1.length, s2.length);
  
  return 1 - (distance / maxLen);
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Fill the first row and column
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  
  // Fill the rest of the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(
          dp[i - 1][j],     // deletion
          dp[i][j - 1],     // insertion
          dp[i - 1][j - 1]  // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Score a field based on its similarity to the token context
 */
function scoreFieldMatch(field: FlattenedField, context: TokenContext): number {
  let score = 0;
  
  // Name matching (most important)
  const nameSimilarity = calculateStringSimilarity(context.cleanName, field.name);
  score += nameSimilarity * 0.5;
  
  // Path matching
  const pathSimilarity = calculateStringSimilarity(context.cleanName, field.path);
  score += pathSimilarity * 0.3;
  
  // Type-based scoring
  if (field.type === 'string') {
    // Most placeholders are for string values
    score += 0.1;
  }
  
  // Context-based heuristics
  if (context.htmlTag) {
    // If in an <a> tag, likely an email or URL
    if (context.htmlTag === 'a' && 
        (field.path.includes('email') || field.path.includes('url') || 
         field.path.includes('website') || field.path.includes('link'))) {
      score += 0.2;
    }
    
    // If in a heading tag, likely a name or title
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(context.htmlTag) && 
        (field.path.includes('name') || field.path.includes('title'))) {
      score += 0.2;
    }
    
    // If in a <p> tag, likely descriptive content
    if (context.htmlTag === 'p' && 
        (field.path.includes('description') || field.path.includes('summary'))) {
      score += 0.1;
    }
  }
  
  return Math.min(1.0, score); // Cap at 1.0
}

/**
 * Generate reasoning for a suggestion based on confidence
 */
function generateReasoning(field: FlattenedField, score: number, context: TokenContext): string {
  if (score > 0.9) {
    return `Perfect match based on field name "${field.name}".`;
  } else if (score > 0.7) {
    return `Strong match between "${context.cleanName}" and "${field.name}".`;
  } else if (score > 0.5) {
    return `Good match based on naming similarity${context.htmlTag ? ` and HTML context <${context.htmlTag}>` : ''}.`;
  } else if (score > 0.3) {
    return `Possible match, but low confidence.`;
  } else {
    return `Low confidence match, consider manual binding.`;
  }
}

/**
 * Generate binding suggestions for template tokens
 * 
 * @param tokens Array of tokens from the template
 * @param schema Resume schema definition
 * @param html Full HTML template content
 * @param existingBindings Optional array of existing bindings
 * @returns Object mapping tokens to suggestion arrays
 */
export function suggestBindings(
  tokens: string[],
  schema: Record<string, any>,
  html: string,
  existingBindings: Binding[] = []
): Record<string, BindingSuggestion[]> {
  // Map existing bindings for quick lookup
  const bindingsMap: Record<string, string> = {};
  existingBindings.forEach(binding => {
    if (binding.dataField) {
      bindingsMap[binding.placeholderToken] = binding.dataField;
    }
  });
  
  // Flatten the schema for easier matching
  const flatFields = flattenSchema(schema);
  
  // Results object
  const results: Record<string, BindingSuggestion[]> = {};
  
  // Process each token
  for (const token of tokens) {
    // Skip already bound tokens
    if (bindingsMap[token]) continue;
    
    // Analyze token context
    const context = analyzeTokenContext(token, html);
    
    // Score each field against this token
    const scoredFields = flatFields.map(field => ({
      field,
      score: scoreFieldMatch(field, context)
    }));
    
    // Sort by score (descending)
    scoredFields.sort((a, b) => b.score - a.score);
    
    // Take top results
    const topSuggestions: BindingSuggestion[] = scoredFields
      .slice(0, 5)
      .filter(item => item.score > 0.1) // Minimum threshold
      .map(item => ({
        token,
        fieldPath: item.field.path,
        confidence: item.score,
        reasoning: generateReasoning(item.field, item.score, context)
      }));
    
    if (topSuggestions.length > 0) {
      results[token] = topSuggestions;
    }
  }
  
  return results;
}