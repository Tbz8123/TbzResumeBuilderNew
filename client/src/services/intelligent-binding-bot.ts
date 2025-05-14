// Define a string similarity comparison function
// This is a simple implementation that doesn't rely on external libraries
function compareStrings(str1: string, str2: string): number {
  // If either string is empty, the similarity is 0
  if (!str1 || !str2) return 0;
  
  const str1Lower = str1.toLowerCase();
  const str2Lower = str2.toLowerCase();
  
  // Direct match
  if (str1Lower === str2Lower) return 1;
  
  // Find matching characters
  let matches = 0;
  let position = 0;
  
  for (let i = 0; i < str1Lower.length; i++) {
    const char = str1Lower[i];
    const pos = str2Lower.indexOf(char, position);
    
    if (pos >= 0) {
      matches++;
      position = pos + 1;
    }
  }
  
  // Calculate similarity score
  return matches * 2 / (str1Lower.length + str2Lower.length);
}

interface BindingResult {
  placeholder: string;
  field: string;
  confidence: number;
}

interface DataField {
  id: string;
  name: string;
  path: string;
  description?: string;
  type: 'string' | 'number' | 'array' | 'object' | 'boolean' | 'date';
  children?: DataField[];
}

/**
 * IntelligentBindingBot provides automated mapping between template 
 * placeholders and resume data fields
 */
export class IntelligentBindingBot {
  private flattenedFields: { path: string; name: string; description?: string }[] = [];
  private confidenceThreshold = 0.4;

  constructor(fields: DataField[], confidenceThreshold = 0.4) {
    this.flattenedFields = this.flattenDataFields(fields);
    this.confidenceThreshold = confidenceThreshold;
  }

  /**
   * Process a list of template placeholders and match them to data fields
   */
  public processPlaceholders(placeholders: string[]): BindingResult[] {
    const results: BindingResult[] = [];

    for (const placeholder of placeholders) {
      const bestMatch = this.findBestMatch(placeholder);
      if (bestMatch) {
        results.push({
          placeholder,
          field: bestMatch.field,
          confidence: bestMatch.score
        });
      }
    }

    return results;
  }

  /**
   * Find the best matching data field for a placeholder
   */
  private findBestMatch(placeholder: string): { field: string; score: number } | null {
    // Clean placeholder text
    const cleanPlaceholder = this.cleanPlaceholder(placeholder);
    
    let bestScore = 0;
    let bestField = '';

    // First, try exact path matching
    const exactMatch = this.flattenedFields.find(field => 
      field.path.toLowerCase() === cleanPlaceholder.toLowerCase()
    );

    if (exactMatch) {
      return { field: exactMatch.path, score: 1.0 };
    }

    // Try matching with field paths
    for (const field of this.flattenedFields) {
      // Compare with path
      const pathScore = stringSimilarity.compareTwoStrings(
        cleanPlaceholder.toLowerCase(),
        field.path.toLowerCase()
      );
      
      // Compare with name
      const nameScore = stringSimilarity.compareTwoStrings(
        cleanPlaceholder.toLowerCase(),
        field.name.toLowerCase()
      );
      
      // Compare with description if available
      let descScore = 0;
      if (field.description) {
        descScore = stringSimilarity.compareTwoStrings(
          cleanPlaceholder.toLowerCase(),
          field.description.toLowerCase()
        ) * 0.7; // Weight description matches less
      }
      
      // Take the best score
      const score = Math.max(pathScore, nameScore, descScore);
      
      if (score > bestScore) {
        bestScore = score;
        bestField = field.path;
      }
    }

    // Handle special cases for array fields
    if (cleanPlaceholder.includes('each') || cleanPlaceholder.includes('loop')) {
      const arrayFields = this.flattenedFields.filter(field => field.path.includes('[]'));
      
      for (const field of arrayFields) {
        // Extract array name from path like "education[]"
        const arrayName = field.path.split('[')[0];
        const score = stringSimilarity.compareTwoStrings(
          cleanPlaceholder.toLowerCase(),
          arrayName.toLowerCase()
        );
        
        if (score > bestScore) {
          bestScore = score;
          bestField = field.path;
        }
      }
    }

    return bestScore >= this.confidenceThreshold 
      ? { field: bestField, score: bestScore } 
      : null;
  }

  /**
   * Clean a placeholder string to remove template-specific syntax
   */
  private cleanPlaceholder(placeholder: string): string {
    return placeholder
      .replace(/\[\[(FIELD|LOOP|IF):|\]\]/g, '')  // Remove [[FIELD:...]] syntax
      .replace(/{{[#/]?(each|if)\s+|}}/g, '')     // Remove {{#each ...}} syntax
      .replace(/{{|}}/g, '')                      // Remove {{ }}
      .replace(/\./g, ' ')                        // Replace dots with spaces
      .replace(/\s+/g, ' ')                       // Normalize whitespace
      .trim();
  }

  /**
   * Flatten a nested data field structure for easier matching
   */
  private flattenDataFields(fields: DataField[]): { path: string; name: string; description?: string }[] {
    const result: { path: string; name: string; description?: string }[] = [];
    
    const process = (field: DataField, prefix = ''): void => {
      const path = prefix ? `${prefix}.${field.path}` : field.path;
      
      result.push({
        path: field.path,
        name: field.name,
        description: field.description
      });
      
      if (field.children && field.children.length > 0) {
        field.children.forEach(child => process(child, field.path));
      }
    };
    
    fields.forEach(field => process(field));
    return result;
  }

  /**
   * Process placeholders from HTML content to extract template tokens
   */
  public static extractPlaceholdersFromHtml(html: string): string[] {
    if (!html) return [];
    
    const placeholders: string[] = [];
    const basicRegex = /{{[^{}]+}}/g;
    const advancedRegex = /\[\[(FIELD|LOOP|IF):[^\]]+\]\]/g;
    
    // Extract basic handlebars-style placeholders
    let match;
    while ((match = basicRegex.exec(html)) !== null) {
      placeholders.push(match[0]);
    }
    
    // Extract advanced syntax placeholders
    while ((match = advancedRegex.exec(html)) !== null) {
      placeholders.push(match[0]);
    }
    
    return placeholders;
  }
}