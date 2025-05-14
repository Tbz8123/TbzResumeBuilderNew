/**
 * Intelligent Binding Bot Service
 * Provides auto-suggestion capabilities for template binding using
 * similarity matching, context analysis, and intelligent field mapping.
 */

interface BindingSuggestion {
  placeholder: string;    // The template placeholder (e.g., {{name}}, [[FIELD:email]])
  fieldPath: string;      // Suggested webapp field path
  confidence: number;     // Confidence score (0-1)
  reasoning?: string;     // Optional explanation for the suggestion
}

interface DataField {
  id: string;
  name: string;
  path: string;
  description?: string;
  type: string;
  children?: DataField[];
}

interface AnalysisContext {
  placeholderName: string;
  surroundingText?: string;
  htmlTag?: string;
  existingBindings?: Record<string, string>;
}

// Helper for string similarity calculation
function calculateStringSimilarity(str1: string, str2: string): number {
  if (!str1.length && !str2.length) return 1.0;
  if (!str1.length || !str2.length) return 0.0;
  
  // Convert to lowercase for case-insensitive comparison
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  // Count matching characters
  let matches = 0;
  const maxLen = Math.max(s1.length, s2.length);
  
  // Levenshtein distance-based similarity
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLen);
}

// Levenshtein distance calculation
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

// Flatten nested data fields for easier processing
function flattenDataFields(fields: DataField[]): DataField[] {
  let result: DataField[] = [];
  
  for (const field of fields) {
    result.push(field);
    if (field.children && field.children.length > 0) {
      result = [...result, ...flattenDataFields(field.children)];
    }
  }
  
  return result;
}

// Analyzes placeholder context for better suggestions
function analyzePlaceholderContext(
  placeholder: string, 
  templateHtml: string
): AnalysisContext {
  // Extract placeholder name (remove syntax markers)
  const placeholderName = placeholder
    .replace(/\[\[FIELD:|\]\]/g, '')
    .replace(/{{|}}/g, '')
    .trim();
  
  // Find placeholder in HTML to get surrounding context
  const index = templateHtml.indexOf(placeholder);
  let surroundingText = '';
  let htmlTag = '';
  
  if (index !== -1) {
    // Get some surrounding text for context
    const start = Math.max(0, index - 50);
    const end = Math.min(templateHtml.length, index + placeholder.length + 50);
    surroundingText = templateHtml.substring(start, end);
    
    // Try to determine the HTML tag containing this placeholder
    const tagMatch = surroundingText.match(/<([a-zA-Z0-9]+)[^>]*>/);
    if (tagMatch) {
      htmlTag = tagMatch[1].toLowerCase();
    }
  }
  
  return {
    placeholderName,
    surroundingText,
    htmlTag
  };
}

// Score a field based on its similarity to the placeholder
function scoreFieldMatch(
  field: DataField, 
  context: AnalysisContext
): number {
  let score = 0;
  
  // Name-based matching (most important)
  const nameSimilarity = calculateStringSimilarity(context.placeholderName, field.name);
  score += nameSimilarity * 0.5;
  
  // Path-based matching
  const pathSimilarity = calculateStringSimilarity(context.placeholderName, field.path);
  score += pathSimilarity * 0.3;
  
  // Type-based matching
  if (field.type === 'string') {
    // Most placeholders are for string values
    score += 0.1;
  }
  
  // Context-based heuristics
  if (context.htmlTag) {
    // If placeholder is in an <a> tag, likely an email or URL
    if (context.htmlTag === 'a' && 
        (field.path.includes('email') || field.path.includes('url') || 
         field.path.includes('website') || field.path.includes('link'))) {
      score += 0.2;
    }
    
    // If placeholder is in a heading tag, likely a name or title
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(context.htmlTag) && 
        (field.path.includes('name') || field.path.includes('title'))) {
      score += 0.2;
    }
    
    // If placeholder is in a <p> tag, likely descriptive content
    if (context.htmlTag === 'p' && 
        (field.path.includes('description') || field.path.includes('summary'))) {
      score += 0.1;
    }
  }
  
  return Math.min(1.0, score); // Cap at 1.0
}

// Generate confidence-based explanation for the suggestion
function generateReasoning(field: DataField, score: number, context: AnalysisContext): string {
  if (score > 0.9) {
    return `Perfect match based on field name "${field.name}".`;
  } else if (score > 0.7) {
    return `Strong match between "${context.placeholderName}" and "${field.name}".`;
  } else if (score > 0.5) {
    return `Good match based on naming similarity and context.`;
  } else if (score > 0.3) {
    return `Possible match, but low confidence.`;
  } else {
    return `Low confidence match, consider manual binding.`;
  }
}

/**
 * Generate binding suggestions for template placeholders
 * 
 * @param placeholders Array of placeholders detected in the template
 * @param dataFields Available data fields from the webapp
 * @param templateHtml Full HTML content of the template
 * @param existingBindings Optional map of already bound placeholders
 * @returns Array of binding suggestions with confidence scores
 */
export function generateBindingSuggestions(
  placeholders: string[],
  dataFields: DataField[],
  templateHtml: string,
  existingBindings?: Record<string, string>
): Record<string, BindingSuggestion[]> {
  // Results map: placeholder -> array of suggestions
  const results: Record<string, BindingSuggestion[]> = {};
  
  // Flatten data fields for easier processing
  const flatFields = flattenDataFields(dataFields);
  
  // Process each placeholder
  for (const placeholder of placeholders) {
    // Skip if already bound and we're not regenerating
    if (existingBindings && existingBindings[placeholder]) continue;
    
    // Analyze placeholder context
    const context = analyzePlaceholderContext(placeholder, templateHtml);
    context.existingBindings = existingBindings;
    
    // Score all fields against this placeholder
    const scoredFields = flatFields.map(field => ({
      field,
      score: scoreFieldMatch(field, context)
    }));
    
    // Sort by score (descending)
    scoredFields.sort((a, b) => b.score - a.score);
    
    // Take top results (limit to 5)
    const topSuggestions: BindingSuggestion[] = scoredFields
      .slice(0, 5)
      .filter(item => item.score > 0.1) // Minimum threshold
      .map(item => ({
        placeholder,
        fieldPath: item.field.path,
        confidence: item.score,
        reasoning: generateReasoning(item.field, item.score, context)
      }));
    
    results[placeholder] = topSuggestions;
  }
  
  return results;
}

/**
 * Detect placeholders in HTML template content using regex patterns
 * 
 * @param html HTML template content
 * @returns Array of detected placeholders
 */
export function detectPlaceholders(html: string): string[] {
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
    while ((match = pattern.exec(html)) !== null) {
      placeholders.push(match[0]);
    }
  }
  
  return Array.from(new Set(placeholders)); // Remove duplicates
}

export default {
  generateBindingSuggestions,
  detectPlaceholders,
  calculateStringSimilarity
};