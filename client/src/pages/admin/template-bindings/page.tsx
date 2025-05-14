import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Save, ArrowLeft, Search, ChevronRight, 
  ChevronLeft, Code, AlertTriangle, Settings, Check, 
  Filter, WandSparkles, Lightbulb, RefreshCw, Bot,
  Type, ListOrdered, SplitSquareVertical, Hash, Box,
  ToggleLeft, CircleDot, Calendar as CalendarIcon, X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BindingSuggestions, BindingSuggestion } from '@/components/templates/BindingSuggestions';

// Types
// Client-side binding model
interface Template {
  id: number;
  name: string;
  description: string;
  html?: string;
  css?: string;
  htmlContent?: string;
  cssContent?: string;
}

interface Binding {
  id: number;
  templateId: number;
  placeholder: string; // Maps to placeholderToken in the DB
  selector: string;    // Maps to dataField in the DB
  description?: string;
  isMapped?: boolean;
  updatedAt?: string | Date;
  createdAt?: string | Date;
}

// Server-side binding model (as it comes from the API)
interface ServerBinding {
  id: number;
  templateId: number;
  placeholderToken: string;
  dataField: string;
  description?: string;
  updatedAt?: string;
  createdAt?: string;
}

interface DataField {
  id: string;
  name: string;
  path: string;
  description?: string;
  type: 'string' | 'number' | 'array' | 'object' | 'boolean' | 'date';
  children?: DataField[];
}

interface TemplateToken {
  id: string;
  text: string;
  type: 'field' | 'loop' | 'conditional' | 'raw';
  position: { x: number; y: number; width: number; height: number };
  color?: string;
  isMapped?: boolean;
}

export default function TemplateBindingsPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { toast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [wizardMode, setWizardMode] = useState<boolean>(false);
  const [wizardStep, setWizardStep] = useState<number>(0);
  const [highlightedTokens, setHighlightedTokens] = useState<TemplateToken[]>([]);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [filterText, setFilterText] = useState<string>('');
  const [dataFields, setDataFields] = useState<DataField[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [selectedBinding, setSelectedBinding] = useState<Binding | null>(null);
  const [autoSuggestMade, setAutoSuggestMade] = useState<boolean>(false);
  const [previewClickedToken, setPreviewClickedToken] = useState<string | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState<boolean>(false);
  const [fieldSelectorPosition, setFieldSelectorPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  
  // AI binding suggestions state
  const [showSuggestionsDialog, setShowSuggestionsDialog] = useState<boolean>(false);
  const [bindingSuggestions, setBindingSuggestions] = useState<BindingSuggestion[]>([]);
  const [isProcessingBindings, setIsProcessingBindings] = useState<boolean>(false);

  // Helper colors for token highlighting
  const tokenColors = [
    'rgba(59, 130, 246, 0.2)', // blue
    'rgba(239, 68, 68, 0.2)',  // red
    'rgba(16, 185, 129, 0.2)', // green
    'rgba(245, 158, 11, 0.2)', // amber
    'rgba(139, 92, 246, 0.2)',  // purple
  ];

  // Fetch template data
  const { data: template, isLoading: isLoadingTemplate } = useQuery<Template>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  // Fetch template bindings
  const { data: serverBindings, isLoading: isLoadingBindings } = useQuery<ServerBinding[]>({
    queryKey: [`/api/templates/${templateId}/bindings`],
    enabled: !!templateId,
  });

  // Fetch resume schema
  const { data: resumeSchema } = useQuery<Record<string, any>>({
    queryKey: ['/api/resume/schema'],
  });

  // Fetch template schema (what fields it expects)
  const { data: templateSchema } = useQuery<Record<string, any>>({
    queryKey: [`/api/templates/${templateId}/schema`],
    enabled: !!templateId,
  });

  // Update binding mutation
  const updateBindingMutation = useMutation({
    mutationFn: async (binding: Binding) => {
      const response = await fetch(`/api/templates/${templateId}/bindings/${binding.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataField: binding.selector,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update binding');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "Binding updated",
        description: "The template binding has been updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle changes to the selected binding's selector
  const handleSelectorChange = (bindingId: number, value: string) => {
    setBindings(prev => prev.map(binding => 
      binding.id === bindingId ? { ...binding, selector: value } : binding
    ));
  };

  // Handle saving a binding
  const handleSaveBinding = (binding: Binding) => {
    setSelectedBinding(binding);
    updateBindingMutation.mutate(binding);
  };

  // Handle selecting a binding
  const handleBindingSelection = (binding: Binding, tokenId?: string | null) => {
    setSelectedBinding(binding);
    if (tokenId) {
      setActiveToken(tokenId);
    }
  };

  // Handle selecting a data field to bind to the selected binding
  const handleDataFieldSelect = (field: DataField) => {
    if (!selectedBinding) return;
    
    const updatedBinding = { ...selectedBinding, selector: field.path };
    setBindings(prev => prev.map(b => 
      b.id === updatedBinding.id ? updatedBinding : b
    ));
    
    // Save binding if auto-save is enabled
    handleSaveBinding(updatedBinding);
  };

  // Convert server bindings to client bindings
  const mapBindings = (serverBindings: ServerBinding[]): Binding[] => {
    return serverBindings.map(b => ({
      id: b.id,
      templateId: b.templateId,
      placeholder: b.placeholderToken,
      selector: b.dataField,
      description: b.description,
      updatedAt: b.updatedAt,
      createdAt: b.createdAt,
      isMapped: !!b.dataField && b.dataField.trim() !== ''
    }));
  };

  // Flatten nested data fields for easier searching
  const flattenDataFields = (fields: DataField[]): DataField[] => {
    let result: DataField[] = [];
    
    for (const field of fields) {
      result.push(field);
      if (field.children && field.children.length > 0) {
        result = [...result, ...flattenDataFields(field.children)];
      }
    }
    
    return result;
  };

  // Filter data fields based on search text
  const filterDataFields = (fields: DataField[], filter: string): DataField[] => {
    if (!filter.trim()) return fields;
    
    const filtered: DataField[] = [];
    const lowerFilter = filter.toLowerCase();
    
    for (const field of fields) {
      const nameMatch = field.name.toLowerCase().includes(lowerFilter);
      const pathMatch = field.path.toLowerCase().includes(lowerFilter);
      const descMatch = field.description?.toLowerCase().includes(lowerFilter);
      
      // Include this field if it matches
      if (nameMatch || pathMatch || descMatch) {
        filtered.push(field);
      }
      
      // Check children too
      if (field.children && field.children.length > 0) {
        const filteredChildren = filterDataFields(field.children, filter);
        if (filteredChildren.length > 0) {
          filtered.push({
            ...field,
            children: filteredChildren
          });
        }
      }
    }
    
    return filtered;
  };

  // Auto-match fields based on names and paths
  const performBasicMatching = () => {
    // Get all unmapped bindings
    const unmappedBindings = bindings.filter(b => !b.selector || b.selector.trim() === '');
    
    if (unmappedBindings.length === 0) {
      toast({
        title: "No unmapped fields",
        description: "All template fields are already mapped to data fields",
      });
      return;
    }
    
    // Flatten data fields for easier matching
    const flatFields = flattenDataFields(dataFields);
    
    // Track updates
    const updatedBindings: Binding[] = [...bindings];
    let updateCount = 0;
    
    // Try to match each unmapped binding
    for (const binding of unmappedBindings) {
      // Extract field name from placeholder (handles multiple formats)
      let fieldName = binding.placeholder
        .replace(/\[\[FIELD:|\]\]/g, '')
        .replace(/{{|}}/g, '')
        .trim()
        .toLowerCase();
      
      // Find exact match first
      const exactMatch = flatFields.find(f => 
        f.path.toLowerCase() === fieldName || 
        f.name.toLowerCase() === fieldName
      );
      
      if (exactMatch) {
        // Update the binding
        const index = updatedBindings.findIndex(b => b.id === binding.id);
        if (index !== -1) {
          updatedBindings[index] = { 
            ...binding, 
            selector: exactMatch.path,
            isMapped: true
          };
          updateCount++;
        }
      }
    }
    
    // Update state with new bindings
    if (updateCount > 0) {
      setBindings(updatedBindings);
      
      // Save updated bindings
      updatedBindings
        .filter(b => b.selector && b.selector.trim() !== '')
        .forEach(b => {
          updateBindingMutation.mutate(b);
        });
      
      toast({
        title: "Auto-match complete",
        description: `Matched ${updateCount} fields based on names`,
      });
    } else {
      toast({
        title: "No matches found",
        description: "Could not find any automatic matches for unmapped fields",
      });
    }
  };

  // Extract template tokens from HTML content
  const refreshTokenHighlights = () => {
    // Generate a new template preview - in a real app this would
    // extract tokens from the HTML and mark their positions
    const tokens: TemplateToken[] = [];
    
    if (template?.html) {
      // Placeholder extraction logic (simplified)
      const fieldRegex = /\[\[FIELD:(.*?)\]\]|{{([^#/][^}]*)}}/g;
      let match;
      
      // Process template HTML to extract fields
      const html = template.html;
      let id = 0;
      
      while ((match = fieldRegex.exec(html)) !== null) {
        const token = match[0];
        tokens.push({
          id: `token-${id++}`,
          text: token,
          type: "field",
          position: generateMockPosition(),
          color: tokenColors[id % tokenColors.length],
          isMapped: false
        });
      }
    }
    
    // If no tokens were found, add some mocks for demonstration
    if (tokens.length === 0) {
      tokens.push({
        id: "placeholder-token-1",
        text: "[[FIELD:name]]",
        type: "field",
        position: generateMockPosition(),
        color: tokenColors[0],
        isMapped: false
      });
      tokens.push({
        id: "placeholder-token-2",
        text: "[[FIELD:email]]",
        type: "field",
        position: generateMockPosition(),
        color: tokenColors[1],
        isMapped: false
      });
    }
    
    setHighlightedTokens(tokens);
    simulateTokenPositions();
  };
  
  // Generate more structured positions for token visualization
  const generateMockPosition = () => {
    // Get current count of tokens for ordered positioning
    const currentTokenCount = highlightedTokens.length;
    
    // Create a structured grid layout
    const row = Math.floor(currentTokenCount / 3);
    const col = currentTokenCount % 3;
    
    return {
      x: 50 + (col * 160),
      y: 50 + (row * 50),
      width: 140, 
      height: 30
    };
  };
  
  // Simulate getting token positions from the rendered template
  const simulateTokenPositions = () => {
    // In a real implementation, this would get positions from the actual DOM
    setTimeout(() => {
      setHighlightedTokens(prev => {
        // Create structured layout based on token type
        return prev.map((token, index) => {
          // Organize tokens by their type 
          const row = Math.floor(index / 3);
          const col = index % 3;
          
          // Basic position grid
          const position = {
            x: 50 + (col * 180),
            y: 50 + (row * 60),
            width: 160,
            height: 35
          };
          
          return {
            ...token,
            position
          };
        });
      });
    }, 300);
  };

  // Auto-suggest bindings based on template field names
  const autoSuggestBindings = () => {
    try {
      // Start processing
      setIsProcessingBindings(true);
      
      // Get all unmapped bindings
      const unmappedBindings = bindings.filter(b => !b.selector || b.selector.trim() === '');
      
      if (unmappedBindings.length === 0) {
        toast({
          title: "No unmapped fields",
          description: "All template fields are already mapped to data fields",
        });
        setIsProcessingBindings(false);
        return;
      }
      
      // Flatten data fields for easier matching
      const flatFields = flattenDataFields(dataFields);
      
      // Create suggestions
      const suggestions: BindingSuggestion[] = [];
      
      // Process each unmapped binding
      for (const binding of unmappedBindings) {
        // Extract field name from placeholder (handles multiple formats)
        let fieldName = binding.placeholder
          .replace(/\[\[FIELD:|\]\]/g, '')
          .replace(/{{|}}/g, '')
          .trim();
        
        // Find exact or close matches
        let bestMatch = null;
        let bestScore = 0;
        
        // Try exact match first
        for (const field of flatFields) {
          // Check for exact path match
          if (field.path === fieldName) {
            bestMatch = field;
            bestScore = 1.0;
            break;
          }
          
          // Check for name match
          if (field.name.toLowerCase() === fieldName.toLowerCase()) {
            bestMatch = field;
            bestScore = 0.9;
            break;
          }
          
          // Check for partial matches
          if (field.path.toLowerCase().includes(fieldName.toLowerCase()) ||
              fieldName.toLowerCase().includes(field.path.toLowerCase())) {
            const score = 0.7;
            if (score > bestScore) {
              bestMatch = field;
              bestScore = score;
            }
          }
        }
        
        // For demonstration purposes, also add some other relevant suggestions
        const additionalSuggestions: {field: DataField, score: number}[] = [];
        
        for (const field of flatFields) {
          // Skip already selected best match
          if (bestMatch && field.path === bestMatch.path) continue;
          
          // Generate relevance score based on field type and name similarity
          let score = 0;
          
          // Type-based scoring (prefer strings for most fields)
          if (field.type === 'string') score += 0.2;
          
          // Name-based scoring
          const nameSimilarity = calculateStringSimilarity(fieldName.toLowerCase(), field.name.toLowerCase());
          score += nameSimilarity * 0.5;
          
          // Path-based scoring
          const pathSimilarity = calculateStringSimilarity(fieldName.toLowerCase(), field.path.toLowerCase());
          score += pathSimilarity * 0.3;
          
          // Add if score is good enough
          if (score > 0.3) {
            additionalSuggestions.push({field, score});
          }
        }
        
        // Sort additional suggestions by score
        additionalSuggestions.sort((a, b) => b.score - a.score);
        
        // Keep top 3 additional suggestions
        const topAdditionalSuggestions = additionalSuggestions.slice(0, 3);
        
        // Add the suggestions
        if (bestMatch) {
          suggestions.push({
            bindingId: binding.id,
            token: binding.placeholder,
            suggestions: [
              { fieldPath: bestMatch.path, fieldName: bestMatch.name, confidence: bestScore },
              ...topAdditionalSuggestions.map(s => ({
                fieldPath: s.field.path,
                fieldName: s.field.name,
                confidence: s.score
              }))
            ]
          });
        }
      }
      
      // Show suggestions dialog if we have any
      if (suggestions.length > 0) {
        setBindingSuggestions(suggestions);
        setShowSuggestionsDialog(true);
        setAutoSuggestMade(true);
      } else {
        toast({
          title: "No suggestions",
          description: "Could not generate any suggestions for the unmapped fields",
        });
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error generating suggestions",
        description: "An error occurred while analyzing the template fields",
        variant: "destructive",
      });
    } finally {
      setIsProcessingBindings(false);
    }
  };

  // Simple string similarity calculation
  const calculateStringSimilarity = (str1: string, str2: string): number => {
    if (!str1.length && !str2.length) return 1.0;
    if (!str1.length || !str2.length) return 0.0;
    
    // Count matching characters
    let matches = 0;
    const maxLen = Math.max(str1.length, str2.length);
    
    for (let i = 0; i < str1.length && i < str2.length; i++) {
      if (str1[i] === str2[i]) matches++;
    }
    
    return matches / maxLen;
  };

  // Handle accepting an AI suggestion
  const handleAcceptSuggestion = (bindingId: number, fieldPath: string) => {
    const binding = bindings.find(b => b.id === bindingId);
    if (!binding) return;
    
    const updatedBinding = { ...binding, selector: fieldPath, isMapped: true };
    setBindings(prev => prev.map(b => b.id === bindingId ? updatedBinding : b));
    
    // Save the binding
    updateBindingMutation.mutate(updatedBinding);
  };

  // Handle accepting all AI suggestions at once
  const handleAcceptAllSuggestions = (suggestions: BindingSuggestion[]) => {
    // Update bindings with top suggestions
    const updatedBindings = [...bindings];
    
    for (const suggestion of suggestions) {
      const topSuggestion = suggestion.suggestions[0];
      if (topSuggestion && topSuggestion.confidence >= 0.5) {
        const index = updatedBindings.findIndex(b => b.id === suggestion.bindingId);
        if (index !== -1) {
          updatedBindings[index] = {
            ...updatedBindings[index],
            selector: topSuggestion.fieldPath,
            isMapped: true
          };
          
          // Save the binding
          updateBindingMutation.mutate(updatedBindings[index]);
        }
      }
    }
    
    setBindings(updatedBindings);
    setShowSuggestionsDialog(false);
  };

  // Handle dismissing the AI suggestions
  const handleDismissSuggestion = () => {
    setShowSuggestionsDialog(false);
  };

  // Helper function to prepare iframe content with HTML and CSS
  const getTemplateIframeContent = () => {
    if (!template) return '';

    // Prepare a full HTML document with the template content and CSS
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Template Preview</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
              color: #333;
              line-height: 1.5;
              margin: 0;
              padding: 10px;
            }
            
            /* Template placeholder highlighting */
            .template-token {
              background-color: rgba(59, 130, 246, 0.1);
              border: 2px solid rgba(59, 130, 246, 0.5);
              border-radius: 3px;
              cursor: pointer;
              position: relative;
              padding: 0 3px;
              margin: 0 2px;
              display: inline-block;
            }
            
            .template-token.mapped {
              background-color: rgba(16, 185, 129, 0.1);
              border-color: rgba(16, 185, 129, 0.5);
            }
            
            .template-token.active {
              background-color: rgba(59, 130, 246, 0.2);
              border-color: rgba(59, 130, 246, 0.8);
              box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
            }
            
            .field-selector {
              position: absolute;
              background: white;
              border: 1px solid #ccc;
              border-radius: 4px;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
              z-index: 1000;
              max-height: 300px;
              overflow-y: auto;
              width: 250px;
            }
            
            .field-selector-item {
              padding: 8px 12px;
              border-bottom: 1px solid #eee;
              cursor: pointer;
            }
            
            .field-selector-item:hover {
              background-color: #f5f5f5;
            }
            
            /* Template CSS */
            ${template.css || ''}
          </style>
        </head>
        <body>
          ${template.htmlContent || 'No HTML content available for this template.'}
          
          <script>
            // This script will be executed in the iframe to handle click events
            // and communicate with the parent window
            document.addEventListener('DOMContentLoaded', function() {
              // Find all placeholders in the template
              const placeholderRegexes = [
                /\\[\\[FIELD:(.*?)\\]\\]/g,
                /{{([^#/][^}]*)}}/g,
                /{{#each\\s+(.*?)}}/g,
                /{{#if\\s+(.*?)}}/g
              ];
              
              // Function to process text nodes and wrap placeholders
              function processTextNodes(node) {
                if (node.nodeType === Node.TEXT_NODE) {
                  let content = node.textContent;
                  let hasMatch = false;
                  
                  // Check each placeholder pattern
                  placeholderRegexes.forEach(regex => {
                    if (content.match(regex)) {
                      hasMatch = true;
                    }
                  });
                  
                  if (hasMatch) {
                    const span = document.createElement('span');
                    span.innerHTML = content;
                    node.parentNode.replaceChild(span, node);
                    
                    // Now apply the regex replacement to the span's innerHTML
                    placeholderRegexes.forEach(regex => {
                      span.innerHTML = span.innerHTML.replace(regex, (match) => {
                        return \`<span class="template-token" data-token="\${match}">\${match}</span>\`;
                      });
                    });
                  }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  // Skip script tags
                  if (node.tagName === 'SCRIPT') return;
                  
                  // Process child nodes
                  Array.from(node.childNodes).forEach(child => {
                    processTextNodes(child);
                  });
                }
              }
              
              // Process the entire document
              processTextNodes(document.body);
              
              // Add click event listeners to all tokens
              document.querySelectorAll('.template-token').forEach(token => {
                token.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Send message to parent window
                  window.parent.postMessage({
                    type: 'TOKEN_CLICKED',
                    token: this.dataset.token,
                    rect: this.getBoundingClientRect()
                  }, '*');
                  
                  // Remove active class from all tokens
                  document.querySelectorAll('.template-token.active').forEach(t => {
                    t.classList.remove('active');
                  });
                  
                  // Add active class to this token
                  this.classList.add('active');
                });
              });
              
              // Listen for messages from parent window
              window.addEventListener('message', function(event) {
                if (event.data.type === 'UPDATE_TOKEN_MAPPING') {
                  const { token, isMapped } = event.data;
                  
                  // Find all matching tokens
                  document.querySelectorAll(\`.template-token[data-token="\${token}"]\`).forEach(el => {
                    if (isMapped) {
                      el.classList.add('mapped');
                    } else {
                      el.classList.remove('mapped');
                    }
                  });
                }
              });
            });
          </script>
        </body>
      </html>
    `;
  };
  
  // Set up interactivity for the template preview iframe
  const setupTemplatePreviewInteractivity = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    // Store the iframe ref (only if the ref is mutable)
    if (iframeRef) {
      // Using type assertion to handle readonly property
      (iframeRef as { current: HTMLIFrameElement | null }).current = iframe;
    }
    
    // Add message event listener to catch clicks from the iframe
    const handleIframeMessage = (event: MessageEvent) => {
      // Skip messages from other sources
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) {
        return;
      }
      
      // Handle token click events
      if (event.data.type === 'TOKEN_CLICKED') {
        const { token, rect } = event.data;
        
        // Find the binding for this token
        const binding = bindings.find(b => 
          b.placeholder === token ||
          b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === token.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() ||
          b.placeholder.replace(/{{|}}/g, '').trim() === token.replace(/{{|}}/g, '').trim()
        );
        
        if (binding) {
          // Select the binding in the UI
          setSelectedBinding(binding);
          
          // Position field selector if needed
          const iframeRect = iframe.getBoundingClientRect();
          setFieldSelectorPosition({
            x: iframeRect.left + rect.left + rect.width / 2,
            y: iframeRect.top + rect.top + rect.height
          });
          
          // Store the clicked token
          setPreviewClickedToken(token);
          
          // Open the field selector
          setShowFieldSelector(true);
        } else {
          // If no binding exists, we may want to create one
          // This would depend on how you want to handle new bindings
          console.log('No binding found for token:', token);
          toast({
            title: "No binding record",
            description: "This token doesn't have a binding record. Create one to link it to a data field.",
            variant: "destructive",
          });
        }
      }
    };
    
    // Add the event listener
    window.addEventListener('message', handleIframeMessage);
    
    // Clean up the event listener when component unmounts
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  };
  
  // Highlight placeholders in the preview after iframe loads
  const highlightPreviewPlaceholders = () => {
    // Wait for iframe to load completely
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    // Update token mappings in the iframe
    bindings.forEach(binding => {
      iframeRef.current?.contentWindow?.postMessage({
        type: 'UPDATE_TOKEN_MAPPING',
        token: binding.placeholder,
        isMapped: binding.selector && binding.selector.trim() !== '',
      }, '*');
    });
  };

  // Load initial data
  useEffect(() => {
    if (template) {
      if (template.html) {
        setTemplateHtml(template.html);
      } else if (template.htmlContent) {
        setTemplateHtml(template.htmlContent);
      }
      setTemplateName(template.name);
    }
  }, [template]);

  // Process server bindings into client bindings
  useEffect(() => {
    if (serverBindings) {
      setBindings(mapBindings(serverBindings));
    }
  }, [serverBindings]);

  // Process schema into flat data fields
  useEffect(() => {
    if (resumeSchema) {
      // Convert the schema to a list of DataField objects
      const fields: DataField[] = [];
      
      for (const [key, value] of Object.entries(resumeSchema)) {
        fields.push({
          id: key,
          name: value.title || key,
          path: key,
          description: value.description,
          type: value.type as any,
          children: processSchemaChildren(value, key)
        });
      }
      
      setDataFields(fields);
    }
  }, [resumeSchema]);

  // Helper function to process nested schema properties
  const processSchemaChildren = (schema: any, parentPath: string): DataField[] | undefined => {
    if (schema.type === 'object' && schema.properties) {
      const children: DataField[] = [];
      
      for (const [key, value] of Object.entries(schema.properties)) {
        children.push({
          id: `${parentPath}.${key}`,
          name: (value as any).title || key,
          path: `${parentPath}.${key}`,
          description: (value as any).description,
          type: (value as any).type as any,
          children: processSchemaChildren(value, `${parentPath}.${key}`)
        });
      }
      
      return children;
    } else if (schema.type === 'array' && schema.items) {
      return [
        {
          id: `${parentPath}[0]`,
          name: 'Array Item',
          path: `${parentPath}[0]`,
          description: 'First item in the array',
          type: (schema.items as any).type as any,
          children: processSchemaChildren(schema.items, `${parentPath}[0]`)
        }
      ];
    }
    
    return undefined;
  };

  // Generate token highlights
  useEffect(() => {
    if (template?.html) {
      refreshTokenHighlights();
    }
  }, [template?.html]);

  // Calculate completion percentage
  useEffect(() => {
    if (bindings.length > 0) {
      const mappedCount = bindings.filter(b => b.selector && b.selector.trim() !== '').length;
      const percentage = Math.round((mappedCount / bindings.length) * 100);
      setCompletionPercentage(percentage);
    }
  }, [bindings]);

  // Reset selected binding when bindings change
  useEffect(() => {
    setSelectedBinding(null);
  }, [templateId]);

  // Render a data field (recursive)
  const renderDataField = (field: DataField, level = 0) => {
    // Check if this field is used by any bindings
    const usedByBindingIds = bindings
      .filter(b => b.selector === field.path)
      .map(b => b.id);
    
    const isMapped = usedByBindingIds.length > 0;
    
    // Determine display based on field type
    let typeIcon;
    let typeColor;
    let typeBg;
    let typeBorder;
    
    switch (field.type) {
      case 'string':
        typeColor = 'text-blue-700';
        typeBg = 'bg-blue-50';
        typeBorder = 'border-blue-200';
        typeIcon = <Type className="h-4 w-4 text-blue-600" />;
        break;
      case 'array':
        typeColor = 'text-amber-700';
        typeBg = 'bg-amber-50';
        typeBorder = 'border-amber-200';
        typeIcon = <ListOrdered className="h-4 w-4 text-amber-600" />;
        break;
      case 'object':
        typeColor = 'text-slate-700';
        typeBg = 'bg-slate-50';
        typeBorder = 'border-slate-200';
        typeIcon = <Box className="h-4 w-4 text-slate-600" />;
        break;
      case 'number':
        typeColor = 'text-purple-700';
        typeBg = 'bg-purple-50';
        typeBorder = 'border-purple-200';
        typeIcon = <Hash className="h-4 w-4 text-purple-600" />;
        break;
      case 'boolean':
        typeColor = 'text-green-700';
        typeBg = 'bg-green-50';
        typeBorder = 'border-green-200';
        typeIcon = <ToggleLeft className="h-4 w-4 text-green-600" />;
        break;
      case 'date':
        typeColor = 'text-pink-700';
        typeBg = 'bg-pink-50';
        typeBorder = 'border-pink-200';
        typeIcon = <CalendarIcon className="h-4 w-4 text-pink-600" />;
        break;
      default:
        typeColor = 'text-gray-700';
        typeBg = 'bg-gray-50';
        typeBorder = 'border-gray-200';
        typeIcon = <CircleDot className="h-4 w-4 text-gray-600" />;
    }
    
    return (
      <div key={field.id} style={{ marginLeft: `${level * 16}px` }}>
        <div 
          className={`py-2 px-3 my-1 rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 
            ${isMapped 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
              : 'border border-slate-200 dark:border-slate-700'
            }
            transition-all duration-150
          `}
          onClick={() => handleDataFieldSelect(field)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2">
                <div className={`w-8 h-8 rounded-md ${typeBg} dark:bg-opacity-20 ${typeBorder} flex items-center justify-center`}>
                  {typeIcon}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">{field.name}</div>
                <div className="text-xs text-muted-foreground font-mono">{field.path}</div>
                {field.description && (
                  <div className="text-xs text-muted-foreground mt-0.5 italic">{field.description}</div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <Badge variant="outline" className={`${typeBg} ${typeColor} border-${typeBorder}`}>
                {field.type}
              </Badge>
              
              {isMapped && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800">
                  <Check className="h-3 w-3 mr-1" />
                  Mapped {usedByBindingIds.length > 1 ? `(${usedByBindingIds.length})` : ''}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {field.children && field.children.length > 0 && (
          <div className="ml-4 pl-2 border-l-2 border-slate-200 dark:border-slate-700">
            {field.children.map(child => renderDataField(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render data fields tree
  const renderDataFields = (fields: DataField[]) => {
    const filteredFields = filterDataFields(fields, filterText);
    
    return (
      <div className="space-y-1">
        {filteredFields.map(field => renderDataField(field))}
      </div>
    );
  };

  // Field selector popup component
  const FieldSelectorPopup = () => {
    if (!showFieldSelector || !previewClickedToken) return null;
    
    // Get flat list of fields for the selector
    const flatFields = flattenDataFields(dataFields);
    
    return (
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 rounded-md border shadow-lg p-2 w-64 max-h-72 overflow-y-auto"
        style={{
          top: `${fieldSelectorPosition.y}px`,
          left: `${fieldSelectorPosition.x - 128}px`, // Center it by offsetting half width
        }}
      >
        <div className="flex justify-between items-center mb-2 pb-2 border-b">
          <h3 className="text-sm font-medium">Select Field</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-5 w-5 p-0" 
            onClick={() => setShowFieldSelector(false)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="space-y-1">
          {flatFields.map(field => (
            <div
              key={field.path}
              className="px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
              onClick={() => {
                // Find binding for the clicked token
                const binding = bindings.find(b => 
                  b.placeholder === previewClickedToken ||
                  b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === previewClickedToken?.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() ||
                  b.placeholder.replace(/{{|}}/g, '').trim() === previewClickedToken?.replace(/{{|}}/g, '').trim()
                );
                
                if (binding) {
                  // Update binding with selected field
                  const updatedBinding = { ...binding, selector: field.path };
                  setBindings(prev => prev.map(b => b.id === binding.id ? updatedBinding : b));
                  
                  // Save the binding
                  updateBindingMutation.mutate(updatedBinding);
                  
                  // Close field selector
                  setShowFieldSelector(false);
                  
                  // Highlight the field in the preview
                  setTimeout(highlightPreviewPlaceholders, 100);
                }
              }}
            >
              <span className="mr-1.5 h-3 w-3 flex-shrink-0">
                {field.type === 'string' && <Type className="h-3 w-3 text-blue-600" />}
                {field.type === 'array' && <ListOrdered className="h-3 w-3 text-amber-600" />}
                {field.type === 'object' && <Box className="h-3 w-3 text-slate-600" />}
                {field.type === 'number' && <Hash className="h-3 w-3 text-purple-600" />}
              </span>
              <span className="flex-1 truncate font-mono text-xs">{field.path}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container py-6">
      {/* Field selector popup for interactive preview */}
      <FieldSelectorPopup />
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Template Bindings</h1>
          <p className="text-gray-500 mt-1">
            Connect data fields to template placeholders for{' '}
            <span className="font-medium text-primary">{templateName}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={refreshTokenHighlights}
                  size="sm"
                  className="gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh token detection</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={performBasicMatching}
                  size="sm"
                  className="gap-1"
                >
                  <Lightbulb className="h-4 w-4" />
                  Auto Match
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically match template fields to data fields by name</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={autoSuggestBindings}
                  size="sm"
                  className="gap-1 border-purple-200 bg-purple-50 hover:bg-purple-100 hover:text-purple-900 text-purple-700"
                >
                  <Bot className="h-4 w-4" />
                  AI Suggest
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to intelligently suggest field matches with confidence scores</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  onClick={() => setWizardMode(!wizardMode)}
                  size="sm"
                  className={`gap-1 ${wizardMode ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}`}
                >
                  <WandSparkles className="h-4 w-4" />
                  Wizard Mode
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guide through all bindings one by one</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Link href="/admin/templates">
            <Button 
              variant="ghost" 
              size="sm"
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm font-medium">Binding Progress</div>
          <div className="text-sm text-muted-foreground">{completionPercentage}% Complete</div>
        </div>
        <Progress value={completionPercentage} className="h-2" />
      </div>
      
      {/* AI Binding Suggestions Dialog */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI-Powered Template Binding Suggestions
            </DialogTitle>
          </DialogHeader>
          
          <BindingSuggestions 
            suggestions={bindingSuggestions}
            onAccept={handleAcceptSuggestion}
            onAcceptAll={handleAcceptAllSuggestions}
            onDismiss={handleDismissSuggestion}
            isLoading={isProcessingBindings}
          />
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSuggestionsDialog(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoadingTemplate || isLoadingBindings ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Two-column layout for Data Fields and Template Placeholders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left column: Data Fields */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b bg-blue-50 dark:bg-blue-950">
                <h2 className="font-semibold text-blue-900 dark:text-blue-200">Your Web-App Fields</h2>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">resumeData Schema</p>
              </div>
              <div className="p-4">
                <div className="flex items-center px-3 py-2 rounded-md border mb-3">
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input 
                    type="text"
                    placeholder="Search fields..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <ScrollArea className="h-[520px] pr-2">
                  {renderDataFields(dataFields)}
                </ScrollArea>
              </div>
            </Card>
            
            {/* Right column: Template Placeholders */}
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b bg-purple-50 dark:bg-purple-950">
                <h2 className="font-semibold text-purple-900 dark:text-purple-200">Template Placeholders</h2>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">Detected in your HTML</p>
              </div>
              <div className="p-4">
                <div className="flex items-center px-3 py-2 rounded-md border mb-3">
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  <Input 
                    type="text"
                    placeholder="Search tokens..."
                    className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => {
                      // Filter tokens based on input
                      const filterValue = e.target.value.toLowerCase();
                      const filtered = highlightedTokens.filter(token => 
                        token.text.toLowerCase().includes(filterValue)
                      );
                      if (filtered.length > 0 && filterValue.trim() !== '') {
                        setActiveToken(filtered[0].id);
                      }
                    }}
                  />
                </div>
                <ScrollArea className="h-[520px] pr-2">
                  <div className="space-y-3">
                    {bindings.map(binding => {
                      const token = highlightedTokens.find(t => t.text === binding.placeholder);
                      const isSelected = selectedBinding?.id === binding.id;
                      const isActive = token && activeToken === token.id;
                      const isMapped = binding.selector && binding.selector.trim() !== '';
                      
                      return (
                        <div 
                          key={binding.id}
                          id={`binding-${binding.id}`}
                          className={`border rounded-md p-3 relative ${
                            isSelected ? 'border-primary bg-primary/5' : 
                            isMapped ? 'border-green-200 bg-green-50' : 
                            'hover:border-primary/50'
                          }`}
                          onClick={() => handleBindingSelection(binding, token?.id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-1">
                              <div className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                                binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('FIELD:') || binding.placeholder.includes('{{') && !binding.placeholder.includes('{{#')) ? 'bg-blue-100 text-blue-800' : 
                                binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('LOOP:') || binding.placeholder.includes('{{#each')) ? 'bg-amber-100 text-amber-800' : 
                                binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('IF:') || binding.placeholder.includes('{{#if')) ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('FIELD:') || binding.placeholder.includes('{{') && !binding.placeholder.includes('{{#')) ? (
                                  <Type className="h-3.5 w-3.5 mr-1.5" />
                                ) : binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('LOOP:') || binding.placeholder.includes('{{#each')) ? (
                                  <ListOrdered className="h-3.5 w-3.5 mr-1.5" />
                                ) : binding.placeholder && typeof binding.placeholder === 'string' && (binding.placeholder.includes('IF:') || binding.placeholder.includes('{{#if')) ? (
                                  <SplitSquareVertical className="h-3.5 w-3.5 mr-1.5" />
                                ) : (
                                  <Hash className="h-3.5 w-3.5 mr-1.5" />
                                )}
                                {binding.placeholder && typeof binding.placeholder === 'string' 
                                  ? binding.placeholder.replace(/\[\[(FIELD|LOOP|IF):|\]\]/g, '')
                                                       .replace(/{{([#\/]?(each|if))?|\s?}}/g, '')
                                                       .trim()
                                  : 'Unknown token'}
                              </div>
                              
                              {isMapped && (
                                <div className="mt-2">
                                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                    {binding.selector}
                                  </Badge>
                                </div>
                              )}

                              {isSelected && !isMapped && (
                                <div className="mt-2 space-y-2">
                                  <p className="text-xs text-muted-foreground">Select a data field from the left panel</p>
                                  <Input
                                    value={binding.selector || ''}
                                    onChange={(e) => handleSelectorChange(binding.id, e.target.value)}
                                    placeholder="Or type a data field path..."
                                    className="h-8 text-sm mt-1"
                                  />
                                  <Button 
                                    size="sm" 
                                    className="w-full mt-1"
                                    disabled={!binding.selector}
                                    onClick={() => handleSaveBinding(binding)}
                                  >
                                    {updateBindingMutation.isPending && selectedBinding?.id === binding.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                    ) : (
                                      <Save className="h-3 w-3 mr-2" />
                                    )}
                                    Save Binding
                                  </Button>
                                </div>
                              )}

                              {isSelected && isMapped && (
                                <div className="mt-2 space-y-2">
                                  <div className="flex items-center">
                                    <Input
                                      value={binding.selector || ''}
                                      onChange={(e) => handleSelectorChange(binding.id, e.target.value)}
                                      className="h-8 text-sm"
                                    />
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="ml-2"
                                      onClick={() => handleSaveBinding(binding)}
                                    >
                                      {updateBindingMutation.isPending && selectedBinding?.id === binding.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Save className="h-3 w-3" />
                                      )}
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {isMapped && (
                            <Badge 
                              variant="secondary"
                              className="absolute top-2 right-2 text-xs bg-green-100 text-green-800 border-green-200"
                            >
                              Mapped
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Live Preview Section */}
          <Card>
            <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-semibold">Live Preview</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Interactive preview with drag & drop or click to bind</p>
                </div>
                <div className="flex space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => setPreviewKey(prev => prev + 1)}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                          Refresh
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Refresh the preview</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div 
                className="border rounded-md h-[500px] bg-white dark:bg-slate-900 flex flex-col"
                ref={previewRef}
              >
                {template?.htmlContent ? (
                  <div className="flex flex-col h-full">
                    {/* Template visualization with tokens */}
                    <div className="bg-gray-50 dark:bg-gray-900 border-b p-4 flex-shrink-0">
                      <div className="font-medium text-sm mb-2">Template Structure Visualization</div>
                      <div className="relative h-[150px] bg-white dark:bg-gray-800 rounded border overflow-hidden p-3">
                        {highlightedTokens.map(token => {
                          // Get binding for this token
                          const binding = bindings.find(b => 
                            b.placeholder === token.text ||
                            b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === token.text.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() ||
                            b.placeholder.replace(/{{|}}/g, '').trim() === token.text.replace(/{{|}}/g, '').trim()
                          );
                          
                          const isMapped = binding && binding.selector && binding.selector.trim() !== '';
                          const isActive = activeToken === token.id;
                          
                          // Set color based on mapping status and activity
                          let borderColor = 'rgba(59, 130, 246, 0.5)';
                          let bgColor = 'rgba(59, 130, 246, 0.1)';
                          
                          if (isMapped) {
                            borderColor = 'rgba(16, 185, 129, 0.5)';
                            bgColor = 'rgba(16, 185, 129, 0.1)';
                          } else {
                            borderColor = 'rgba(239, 68, 68, 0.5)';
                            bgColor = 'rgba(239, 68, 68, 0.1)';
                          }
                          
                          if (isActive) {
                            borderColor = 'rgba(59, 130, 246, 0.8)';
                            bgColor = 'rgba(59, 130, 246, 0.2)';
                          }
                          
                          // Display token name, stripped of syntax markers
                          const displayText = token.text
                            .replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '')
                            .replace(/{{(?:#(?:each|if))?|}}/g, '')
                            .trim();
                          
                          return (
                            <div
                              key={token.id}
                              className={`absolute rounded-sm border-2 cursor-pointer transition-all duration-150 ${
                                isActive ? 'shadow-md' : ''
                              }`}
                              style={{
                                left: `${token.position.x}px`,
                                top: `${token.position.y}px`,
                                width: `${token.position.width}px`,
                                height: `${token.position.height}px`,
                                borderColor,
                                backgroundColor: bgColor,
                                zIndex: isActive ? 20 : 10,
                                pointerEvents: 'auto'
                              }}
                              onClick={() => {
                                setActiveToken(token.id);
                                if (binding) {
                                  setSelectedBinding(binding);
                                }
                              }}
                            >
                              {/* Token label */}
                              <div className={`absolute top-0 left-0 transform -translate-y-full px-2 py-0.5 text-xs rounded ${
                                isMapped ? 'bg-green-50 text-green-700 border border-green-200' : 
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {isMapped ? '✓ ' : '! '}
                                {displayText}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Template HTML preview using iframe */}
                    <div className="flex-grow overflow-auto p-4">
                      <div className="relative h-full w-full">
                        <iframe
                          key={`preview-${previewKey}`}
                          className="w-full h-full border rounded"
                          srcDoc={getTemplateIframeContent()}
                          title="Template Preview"
                          sandbox="allow-same-origin"
                          ref={setupTemplatePreviewInteractivity}
                          onLoad={highlightPreviewPlaceholders}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-center p-10">
                    <div>
                      <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Template Content Not Available</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        No HTML content found for this template. Please make sure the template has HTML content.
                      </p>
                      <Button 
                        className="mt-4" 
                        size="sm" 
                        variant="outline"
                        onClick={refreshTokenHighlights}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Template
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}