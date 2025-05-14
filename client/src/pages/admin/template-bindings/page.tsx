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
        
        // Add top 3 additional suggestions
        for (const field of flatFields) {
          // Skip the best match
          if (bestMatch && field.path === bestMatch.path) continue;
          
          let score = 0;
          
          // Calculate similarity scores based on simple patterns
          if (field.path.includes(fieldName.toLowerCase()) ||
              fieldName.toLowerCase().includes(field.path)) {
            score = 0.5;
          } else if (field.name.toLowerCase().includes(fieldName.toLowerCase()) ||
                    fieldName.toLowerCase().includes(field.name.toLowerCase())) {
            score = 0.4;
          }
          
          if (score > 0) {
            additionalSuggestions.push({ field, score });
          }
        }
        
        // Sort by score and take top 3
        additionalSuggestions.sort((a, b) => b.score - a.score);
        const topSuggestions = additionalSuggestions.slice(0, 3);
        
        // Add to suggestions list
        if (bestMatch) {
          suggestions.push({
            binding,
            suggestions: [
              { field: bestMatch, score: bestScore },
              ...topSuggestions
            ]
          });
        } else if (topSuggestions.length > 0) {
          suggestions.push({
            binding,
            suggestions: topSuggestions
          });
        }
      }
      
      // Set the suggestions and show the dialog
      setBindingSuggestions(suggestions);
      setShowSuggestionsDialog(true);
      
      // Set flag to remember we've made suggestions
      setAutoSuggestMade(true);
      
      // Finish processing
      setIsProcessingBindings(false);
      
      // If no suggestions, show a toast
      if (suggestions.length === 0) {
        toast({
          title: "No suggestions found",
          description: "Could not find any suitable field matches",
        });
      }
    } catch (err) {
      console.error("Error generating binding suggestions:", err);
      setIsProcessingBindings(false);
      toast({
        title: "Error generating suggestions",
        description: "An error occurred while analyzing template fields",
        variant: "destructive",
      });
    }
  };

  // Apply suggestions from AI binding suggestions
  const applySuggestions = (accepted: BindingSuggestion[]) => {
    if (accepted.length === 0) {
      setShowSuggestionsDialog(false);
      return;
    }
    
    // Update bindings with accepted suggestions
    const updatedBindings = [...bindings];
    
    for (const item of accepted) {
      const binding = item.binding;
      const bestSuggestion = item.suggestions[0];
      
      if (bestSuggestion) {
        // Find and update binding
        const index = updatedBindings.findIndex(b => b.id === binding.id);
        if (index !== -1) {
          updatedBindings[index] = {
            ...binding,
            selector: bestSuggestion.field.path,
            isMapped: true
          };
        }
      }
    }
    
    // Update bindings state
    setBindings(updatedBindings);
    
    // Save updated bindings
    updatedBindings
      .filter(b => b.selector && b.selector.trim() !== '')
      .forEach(b => {
        updateBindingMutation.mutate(b);
      });
    
    // Close dialog and show success message
    setShowSuggestionsDialog(false);
    
    toast({
      title: "Applied suggestions",
      description: `Updated ${accepted.length} bindings with suggested fields`,
    });
  };

  // Analyze the completion percentage
  const analyzeCompletion = () => {
    if (bindings.length === 0) return 0;
    
    const mappedCount = bindings.filter(b => b.selector && b.selector.trim() !== '').length;
    const percentage = Math.round((mappedCount / bindings.length) * 100);
    
    return percentage;
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
      if (!iframe.contentWindow || event.source !== iframe.contentWindow) return;
      
      // Handle token click events
      if (event.data.type === 'tokenClick') {
        const token = event.data.token;
        
        // Find binding for this token
        const binding = bindings.find(b => 
          b.placeholder === token ||
          b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === token.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() ||
          b.placeholder.replace(/{{|}}/g, '').trim() === token.replace(/{{|}}/g, '').trim()
        );
        
        if (binding) {
          // Set as active binding
          setSelectedBinding(binding);
          
          // Show the field selector at the clicked position
          setPreviewClickedToken(token);
          setFieldSelectorPosition({
            x: event.data.x,
            y: event.data.y
          });
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
    
    // Add event listener
    window.addEventListener('message', handleIframeMessage);
    
    // Return clean-up function
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  };

  // Inject highlighting and interaction code into the iframe
  const highlightPreviewPlaceholders = () => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return;
    
    // Get all bindings text for highlighting
    const placeholders = bindings.map(b => b.placeholder);
    
    // Simple detection of placeholder patterns for highlighting
    const script = `
      (function() {
        // Find and highlight template placeholders
        function highlightTokens() {
          const placeholders = ${JSON.stringify(placeholders)};
          const bindings = ${JSON.stringify(bindings)};
          
          // Helper to check if a string contains a placeholder
          function containsPlaceholder(text, placeholder) {
            return text.includes(placeholder);
          }
          
          // Find all text nodes
          function findTextNodes(element) {
            const textNodes = [];
            const treeWalker = document.createTreeWalker(
              element,
              NodeFilter.SHOW_TEXT,
              { acceptNode: node => NodeFilter.FILTER_ACCEPT },
              false
            );
            
            let node;
            while ((node = treeWalker.nextNode())) {
              textNodes.push(node);
            }
            
            return textNodes;
          }
          
          // Highlight a token in a text node
          function highlightToken(textNode, token) {
            const text = textNode.nodeValue;
            if (!text || !containsPlaceholder(text, token)) return false;
            
            // Replace the token with a highlighted span
            const binding = bindings.find(b => b.placeholder === token);
            const isMapped = binding && binding.selector && binding.selector.trim() !== '';
            
            const parts = text.split(token);
            if (parts.length < 2) return false;
            
            const span = document.createElement('span');
            span.setAttribute('data-token', token);
            span.textContent = token;
            span.style.backgroundColor = isMapped ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
            span.style.border = isMapped ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(239, 68, 68, 0.5)';
            span.style.borderRadius = '3px';
            span.style.padding = '1px 3px';
            span.style.cursor = 'pointer';
            span.style.display = 'inline-block';
            
            // Add event listener for interaction
            span.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              
              // Send message to parent window
              window.parent.postMessage({
                type: 'tokenClick',
                token: token,
                x: e.clientX + window.scrollX,
                y: e.clientY + window.scrollY
              }, '*');
            });
            
            const fragment = document.createDocumentFragment();
            fragment.appendChild(document.createTextNode(parts[0]));
            fragment.appendChild(span);
            
            if (parts.length > 2) {
              for (let i = 1; i < parts.length - 1; i++) {
                const nestedSpan = span.cloneNode(true);
                nestedSpan.textContent = token;
                nestedSpan.addEventListener('click', function(e) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  window.parent.postMessage({
                    type: 'tokenClick',
                    token: token,
                    x: e.clientX + window.scrollX,
                    y: e.clientY + window.scrollY
                  }, '*');
                });
                
                fragment.appendChild(nestedSpan);
                fragment.appendChild(document.createTextNode(parts[i]));
              }
            }
            
            fragment.appendChild(document.createTextNode(parts[parts.length - 1]));
            
            // Replace the text node with our processed fragment
            textNode.parentNode.replaceChild(fragment, textNode);
            return true;
          }
          
          // Process all text nodes in the body
          const textNodes = findTextNodes(document.body);
          
          // First pass - simple tokens (exact matches)
          for (const node of textNodes) {
            for (const placeholder of placeholders) {
              if (containsPlaceholder(node.nodeValue || '', placeholder)) {
                if (highlightToken(node, placeholder)) {
                  // If this node was processed, we need to re-find text nodes as DOM has changed
                  break;
                }
              }
            }
          }
          
          console.log('Highlighted tokens in template preview');
        }
        
        // Run the highlighter
        highlightTokens();
        
        // Add CSS for better rendering
        const style = document.createElement('style');
        style.textContent = \`
          body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
            line-height: 1.4;
            color: #333;
          }
        \`;
        document.head.appendChild(style);
      })();
    `;
    
    // Inject the script
    try {
      const iframeWindow = iframeRef.current.contentWindow;
      const scriptElement = iframeWindow.document.createElement('script');
      scriptElement.textContent = script;
      iframeWindow.document.body.appendChild(scriptElement);
    } catch (err) {
      console.error('Error injecting script into iframe:', err);
    }
  };

  // Generate HTML for the template preview iframe
  const getTemplateIframeContent = () => {
    if (!template) return '';
    
    const html = template.html || template.htmlContent || '';
    const css = template.css || template.cssContent || '';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${css}
            /* Additional styling for preview */
            body {
              padding: 1rem;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;
  };

  // Render a nested data field tree
  const renderDataFields = (fields: DataField[] = []) => {
    // Filter fields based on search text
    const filteredFields = filterText 
      ? filterDataFields(fields, filterText)
      : fields;
    
    if (filteredFields.length === 0) {
      return (
        <div className="px-4 py-8 text-center text-muted-foreground">
          {filterText ? (
            <>
              <Search className="h-5 w-5 mx-auto mb-2 text-muted-foreground/50" />
              <p>No fields matching "{filterText}"</p>
              <Button 
                variant="link" 
                className="mt-1 h-auto p-0" 
                onClick={() => setFilterText('')}
              >
                Clear search
              </Button>
            </>
          ) : (
            <>
              <p>No schema fields available</p>
            </>
          )}
        </div>
      );
    }
    
    const renderField = (field: DataField, level = 0) => {
      const isObject = field.type === 'object';
      const isArray = field.type === 'array';
      const hasChildren = isObject || isArray;
      
      return (
        <div key={field.path} className={level === 0 ? 'mb-3' : 'ml-3 mt-1'}>
          <div 
            className={`flex items-center px-2 py-1.5 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${
              selectedBinding?.selector === field.path ? 'bg-blue-50 dark:bg-blue-900' : ''
            }`}
            onClick={() => handleDataFieldSelect(field)}
          >
            <div className="flex-1 flex items-center">
              {hasChildren ? (
                <ChevronRight className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
              ) : (
                <span className="h-3.5 w-3.5 mr-1 flex-shrink-0">
                  {field.type === 'string' && <Type className="h-3.5 w-3.5 text-blue-600" />}
                  {field.type === 'number' && <Hash className="h-3.5 w-3.5 text-purple-600" />}
                  {field.type === 'boolean' && <ToggleLeft className="h-3.5 w-3.5 text-green-600" />}
                  {field.type === 'date' && <CalendarIcon className="h-3.5 w-3.5 text-amber-600" />}
                </span>
              )}
              <span className="text-sm font-medium">{field.name}</span>
            </div>
            <div className="text-xs font-mono text-muted-foreground truncate">{field.path}</div>
          </div>
          
          {hasChildren && field.children && field.children.length > 0 && (
            <div className="mt-1">
              {field.children.map(child => renderField(child, level + 1))}
            </div>
          )}
        </div>
      );
    };
    
    return filteredFields.map(field => renderField(field));
  };

  // Initialize on mount and when dependencies change
  useEffect(() => {
    // Set template name for UI display
    if (template) {
      setTemplateName(template.name);
      setTemplateHtml(template.html || template.htmlContent || '');
    }
    
    // Initialize bindings
    if (serverBindings) {
      setBindings(mapBindings(serverBindings));
    }
    
    // Initialize data fields from schema
    if (resumeSchema) {
      // Convert schema to field structure
      const fields: DataField[] = [
        {
          id: 'personal',
          name: 'Personal Information',
          path: 'personal',
          type: 'object',
          children: [
            { id: 'name', name: 'Full Name', path: 'personal.fullName', type: 'string' },
            { id: 'email', name: 'Email', path: 'personal.email', type: 'string' },
            { id: 'phone', name: 'Phone', path: 'personal.phone', type: 'string' },
            { id: 'address', name: 'Address', path: 'personal.address', type: 'string' },
          ]
        },
        {
          id: 'workHistory',
          name: 'Work History',
          path: 'workHistory',
          type: 'array',
          children: [
            { id: 'jobTitle', name: 'Job Title', path: 'workHistory[].jobTitle', type: 'string' },
            { id: 'company', name: 'Company', path: 'workHistory[].company', type: 'string' },
            { id: 'startDate', name: 'Start Date', path: 'workHistory[].startDate', type: 'date' },
            { id: 'endDate', name: 'End Date', path: 'workHistory[].endDate', type: 'date' },
            { id: 'description', name: 'Description', path: 'workHistory[].description', type: 'string' },
          ]
        },
        {
          id: 'education',
          name: 'Education',
          path: 'education',
          type: 'array',
          children: [
            { id: 'degree', name: 'Degree', path: 'education[].degree', type: 'string' },
            { id: 'school', name: 'School', path: 'education[].school', type: 'string' },
            { id: 'startDate', name: 'Start Date', path: 'education[].startDate', type: 'date' },
            { id: 'endDate', name: 'End Date', path: 'education[].endDate', type: 'date' },
            { id: 'description', name: 'Description', path: 'education[].description', type: 'string' },
          ]
        },
        {
          id: 'skills',
          name: 'Skills',
          path: 'skills',
          type: 'array',
          children: [
            { id: 'name', name: 'Skill Name', path: 'skills[].name', type: 'string' },
            { id: 'level', name: 'Skill Level', path: 'skills[].level', type: 'number' },
          ]
        },
        {
          id: 'summary',
          name: 'Professional Summary',
          path: 'summary',
          type: 'string',
        },
      ];
      
      setDataFields(fields);
    }
    
    // Initialize highlighted tokens
    refreshTokenHighlights();
    
    // Calculate completion percentage
    const percentage = analyzeCompletion();
    setCompletionPercentage(percentage);
  }, [template, serverBindings, resumeSchema]);

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
                  size="sm"
                  onClick={performBasicMatching}
                >
                  <WandSparkles className="h-4 w-4 mr-2" />
                  Auto Match
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Automatically match template fields to data fields based on names</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={autoSuggestBindings}
                  disabled={isProcessingBindings}
                >
                  {isProcessingBindings ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mr-2" />
                  )}
                  AI Suggest
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Get AI-powered suggestions for template field mappings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="secondary" size="sm" asChild>
            <Link href="/admin/templates">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Templates
            </Link>
          </Button>
        </div>
      </div>
      
      {/* Binding completion progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1.5">
          <div className="text-sm text-muted-foreground">Mapping completion</div>
          <div className="text-sm font-medium">{completionPercentage}%</div>
        </div>
        <Progress value={completionPercentage} />
      </div>
      
      {/* AI Suggestions Dialog */}
      <Dialog open={showSuggestionsDialog} onOpenChange={setShowSuggestionsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Binding Suggestions</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-grow">
            <div className="py-2">
              <BindingSuggestions
                suggestions={bindingSuggestions}
                onApply={applySuggestions}
              />
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowSuggestionsDialog(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isLoadingTemplate || isLoadingBindings ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side: Fields and Placeholders */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            {/* Web-App Fields */}
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
                <ScrollArea className="h-[300px] pr-2">
                  {renderDataFields(dataFields)}
                </ScrollArea>
              </div>
            </Card>
            
            {/* Template Placeholders */}
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
                <ScrollArea className="h-[300px] pr-2">
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

          {/* Right side: Live Preview */}
          <div className="w-full lg:w-2/3">
            <Card className="h-full">
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
              <div className="p-4 h-[calc(100%-56px)]">
                <div 
                  className="border rounded-md h-full bg-white dark:bg-slate-900 flex flex-col"
                  ref={previewRef}
                >
                  {template?.htmlContent || template?.html ? (
                    <div className="flex flex-col h-full">
                      {/* Template visualization with tokens (smaller at the top) */}
                      <div className="bg-gray-50 dark:bg-gray-900 border-b p-3 flex-shrink-0">
                        <div className="font-medium text-sm mb-2">Template Structure Visualization</div>
                        <div className="relative h-[120px] bg-white dark:bg-gray-800 rounded border overflow-hidden p-3">
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
                      
                      {/* Template HTML preview using iframe (takes most of the space) */}
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
        </div>
      )}
    </div>
  );
}