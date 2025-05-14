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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Types
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
  
  // Track the iframe element in state
  const [iframeElement, setIframeElement] = useState<HTMLIFrameElement | null>(null);
  
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [highlightedTokens, setHighlightedTokens] = useState<TemplateToken[]>([]);
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [filterText, setFilterText] = useState<string>('');
  const [dataFields, setDataFields] = useState<DataField[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState<number>(0);
  const [selectedBinding, setSelectedBinding] = useState<Binding | null>(null);
  const [previewClickedToken, setPreviewClickedToken] = useState<string | null>(null);
  const [showFieldSelector, setShowFieldSelector] = useState<boolean>(false);
  const [fieldSelectorPosition, setFieldSelectorPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "Binding updated",
        description: "The template binding has been updated successfully",
      });
      
      // Force refresh of the preview to show updated bindings
      setTimeout(() => {
        // Increment the key to force iframe reload
        setPreviewKey(prev => prev + 1);
        // Also call highlightPreviewPlaceholders after a brief delay to ensure
        // the iframe has had time to reload
        setTimeout(highlightPreviewPlaceholders, 300);
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error updating binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create new binding mutation
  const saveBindingMutation = useMutation({
    mutationFn: async (binding: Binding) => {
      const response = await fetch(`/api/templates/${templateId}/bindings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeholderToken: binding.placeholder,
          dataField: binding.selector,
          description: binding.description,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create binding');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate the query to fetch fresh data
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      
      toast({
        title: "Binding created",
        description: "The template binding has been created successfully",
      });
      
      // Force refresh of the preview to show updated bindings
      setTimeout(() => {
        // Increment the key to force iframe reload
        setPreviewKey(prev => prev + 1);
        // Also call highlightPreviewPlaceholders after a brief delay to ensure
        // the iframe has had time to reload
        setTimeout(highlightPreviewPlaceholders, 300);
      }, 500);
      
      return data;
    },
    onError: (error) => {
      toast({
        title: "Error creating binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  // Helper function to calculate match confidence between token and field
  const calculateMatchConfidence = (tokenName: string, field: DataField): number => {
    const fieldName = field.name.toLowerCase();
    const fieldPath = field.path.toLowerCase().replace(/\[\]\./g, '.'); // Simplify array paths
    const token = tokenName.toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (fieldName === token) {
      score += 100;
    } 
    // Partial matches
    else if (fieldName.includes(token) || token.includes(fieldName)) {
      score += 70;
    }
    
    // Path matches
    if (fieldPath.includes(token)) {
      score += 50;
    }
    
    // Common patterns
    if (token === 'name' && fieldPath.includes('firstName')) score += 30;
    if (token === 'email' && fieldPath.includes('contact.email')) score += 40;
    if (token === 'phone' && fieldPath.includes('contact.phone')) score += 40;
    if (token === 'address' && fieldPath.includes('location')) score += 30;
    if (token === 'title' && fieldPath.includes('jobTitle')) score += 40;
    
    return score;
  };

  // Intelligent matching with similarity calculations
  const performIntelligentMatching = (unmappedBindings: Binding[], flatFields: DataField[]): number => {
    // Track updates
    const updatedBindings: Binding[] = [...bindings];
    let updateCount = 0;
    
    // Try to match each unmapped binding
    for (const binding of unmappedBindings) {
      // Extract field name from placeholder
      const tokenName = binding.placeholder
        .replace(/\[\[FIELD:|\]\]/g, '')
        .replace(/{{|}}/g, '')
        .trim();
      
      // Calculate confidence for all fields
      const matches = flatFields.map(field => ({
        field,
        confidence: calculateMatchConfidence(tokenName, field)
      }))
      .filter(m => m.confidence > 30) // Only consider reasonable matches
      .sort((a, b) => b.confidence - a.confidence);
      
      // Take the best match if confidence is high enough
      if (matches.length > 0 && matches[0].confidence >= 70) {
        const bestMatch = matches[0].field;
        
        // Update the binding
        const index = updatedBindings.findIndex(b => b.id === binding.id);
        if (index !== -1) {
          updatedBindings[index] = { 
            ...binding, 
            selector: bestMatch.path,
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
      
      // Force refresh of the preview to show updated bindings
      setTimeout(() => {
        // Increment the key to force iframe reload
        setPreviewKey(prev => prev + 1);
        // Also call highlightPreviewPlaceholders after a brief delay to ensure
        // the iframe has had time to reload
        setTimeout(highlightPreviewPlaceholders, 300);
      }, 500);
    }
    
    return updateCount;
  };

  // Basic auto-match fields based on names and paths
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
        
      // Force refresh of the preview to show updated bindings
      setTimeout(() => {
        // Increment the key to force iframe reload
        setPreviewKey(prev => prev + 1);
        // Also call highlightPreviewPlaceholders after a brief delay to ensure
        // the iframe has had time to reload
        setTimeout(highlightPreviewPlaceholders, 300);
      }, 500);
      
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

  // Analyze the completion percentage
  const analyzeCompletion = () => {
    if (bindings.length === 0) return 0;
    
    const mappedCount = bindings.filter(b => b.selector && b.selector.trim() !== '').length;
    const percentage = Math.round((mappedCount / bindings.length) * 100);
    
    return percentage;
  };
  
  // Helper function to get icon based on field type
  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case 'string': return <Type className="h-3 w-3 text-blue-600" />;
      case 'array': return <ListOrdered className="h-3 w-3 text-amber-600" />;
      case 'object': return <Box className="h-3 w-3 text-slate-600" />;
      case 'number': return <Hash className="h-3 w-3 text-purple-600" />;
      case 'boolean': return <ToggleLeft className="h-3 w-3 text-green-600" />;
      case 'date': return <CalendarIcon className="h-3 w-3 text-pink-600" />;
      default: return <CircleDot className="h-3 w-3 text-gray-600" />;
    }
  };
  
  // Set up message listener for the iframe communication
  useEffect(() => {
    if (!iframeElement) return;
    
    const handleIframeMessage = (event: MessageEvent) => {
      // Skip messages from other sources
      if (!iframeElement.contentWindow || event.source !== iframeElement.contentWindow) return;
      
      // Handle token click events
      if (event.data.type === 'tokenClick') {
        const token = event.data.token;
        const fieldName = event.data.field || token.replace(/[{{\[\]}}]/g, '').trim();
        
        console.log('Token clicked:', token, 'field:', fieldName);
        
        // Find binding for this token
        const binding = bindings.find(b => 
          b.placeholder === token ||
          b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === token.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() ||
          b.placeholder.replace(/{{|}}/g, '').trim() === token.replace(/{{|}}/g, '').trim()
        );
        
        // Calculate position for the field selector (adjust for iframe)
        const iframeRect = iframeElement.getBoundingClientRect();
        const adjustedPosition = {
          x: iframeRect.left + event.data.x,
          y: iframeRect.top + event.data.y
        };
        
        // Show the field selector at the clicked position
        setPreviewClickedToken(token);
        setFieldSelectorPosition(adjustedPosition);
        setShowFieldSelector(true);
        
        if (binding) {
          // Set as active binding
          setSelectedBinding(binding);
          
          // Highlight this as the active token
          setActiveToken(token);
          
          // Log the current mapping status
          console.log('Existing binding found:', binding);
        } else {
          // Create a new binding for this token
          const newBinding: Binding = {
            id: 0, // Will be assigned by server
            templateId: parseInt(templateId),
            placeholder: token,
            selector: '',
            description: `Maps template field ${fieldName}`,
          };
          
          // Add to bindings - will be saved when a field is selected
          setBindings(prev => [...prev, newBinding]);
          setSelectedBinding(newBinding);
          
          toast({
            title: "New binding detected",
            description: `Creating a new binding for ${fieldName}. Click a field to map it.`
          });
        }
      }
    };
    
    // Add message listener to the window
    window.addEventListener('message', handleIframeMessage);
    
    // Clean up
    return () => {
      window.removeEventListener('message', handleIframeMessage);
    };
  }, [iframeElement, bindings, templateId]);

  // Inject highlighting and interaction code into the iframe
  const highlightPreviewPlaceholders = () => {
    if (!iframeElement || !iframeElement.contentWindow) return;
    
    // Get all bindings text for highlighting
    const placeholders = bindings.map(b => b.placeholder);
    
    // Enhanced detection of placeholder patterns for highlighting
    const script = `
      (function() {
        // Find and highlight template placeholders
        function highlightTokens() {
          const placeholders = ${JSON.stringify(placeholders)};
          const bindings = ${JSON.stringify(bindings)};
          
          // Find template tokens in the document
          function findTemplateTokens() {
            // Define token patterns to search for 
            const tokenPatterns = [
              { regex: /\\{\\{\\s*([^\\}\\{#\\/]+?)\\s*\\}\\}/g, type: 'handlebars' },  // {{ fieldName }}
              { regex: /\\[\\[FIELD:([^\\]]+)\\]\\]/g, type: 'bracket' },              // [[FIELD:fieldName]]
              { regex: /\\{field:([^\\}]+)\\}/g, type: 'brace' },                      // {field:fieldName}
              { regex: /\\$\\{([^\\}]+)\\}/g, type: 'template-literal' }               // \${fieldName}
            ];
            
            // Find all text nodes
            const textNodes = [];
            const treeWalker = document.createTreeWalker(
              document.body,
              NodeFilter.SHOW_TEXT,
              { acceptNode: node => NodeFilter.FILTER_ACCEPT },
              false
            );
            
            let node;
            while ((node = treeWalker.nextNode())) {
              textNodes.push(node);
            }
            
            // Process each text node
            textNodes.forEach(textNode => {
              if (!textNode.nodeValue || textNode.nodeValue.trim() === '') return;
              
              // Check for each token pattern
              tokenPatterns.forEach(pattern => {
                let matches;
                const text = textNode.nodeValue;
                const regex = pattern.regex;
                
                // Reset regex lastIndex
                regex.lastIndex = 0;
                
                // Find all matches in this text node
                while ((matches = regex.exec(text)) !== null) {
                  // Get the full token and the field name
                  const fullToken = matches[0];
                  const fieldName = matches[1].trim();
                  
                  // Check if this token is in our binding list
                  const binding = bindings.find(b => 
                    b.placeholder === fullToken || 
                    b.placeholder.includes(fieldName)
                  );
                  
                  // Replace this token with a span
                  replaceTokenInNode(textNode, fullToken, fieldName, binding);
                }
              });
            });
          }
          
          // Replace a token in a text node with an interactive span
          function replaceTokenInNode(textNode, fullToken, fieldName, binding) {
            const text = textNode.nodeValue;
            if (!text) return;
            
            // Check if binding exists
            const isMapped = binding && binding.selector && binding.selector.trim() !== '';
            
            // Split text around the token
            const parts = text.split(fullToken);
            if (parts.length < 2) return;
            
            // Create fragment to replace the text node
            const fragment = document.createDocumentFragment();
            
            // First part of text
            fragment.appendChild(document.createTextNode(parts[0]));
            
            // Create the token span
            for (let i = 0; i < parts.length - 1; i++) {
              if (i > 0) {
                fragment.appendChild(document.createTextNode(parts[i]));
              }
              
              // Create token element
              const span = document.createElement('span');
              span.className = 'template-token' + (isMapped ? ' token-mapped' : ' token-unmapped');
              span.setAttribute('data-token', fullToken);
              span.setAttribute('data-field', fieldName);
              
              // Create the display inside the token
              const tokenDisplay = document.createElement('span');
              tokenDisplay.className = 'token-display';
              
              // Create the token wrapper and badge
              if (isMapped) {
                // Mapped token
                tokenDisplay.innerHTML = \`
                  <span class="token-name">\${fieldName}</span>
                  <span class="token-badge mapped">✓</span>
                \`;
              } else {
                // Unmapped token
                tokenDisplay.innerHTML = \`
                  <span class="token-name">\${fieldName}</span>
                  <span class="token-badge unmapped">Map</span>
                \`;
              }
              
              span.appendChild(tokenDisplay);
              
              // Style the token
              span.style.backgroundColor = isMapped ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';
              span.style.border = isMapped ? '1px solid rgba(16, 185, 129, 0.5)' : '1px dashed rgba(239, 68, 68, 0.5)';
              span.style.borderRadius = '4px';
              span.style.padding = '2px 6px';
              span.style.margin = '0 2px';
              span.style.cursor = 'pointer';
              span.style.display = 'inline-flex';
              span.style.alignItems = 'center';
              span.style.justifyContent = 'center';
              span.style.position = 'relative';
              span.style.whiteSpace = 'nowrap';
              
              // Style internal elements
              tokenDisplay.style.display = 'flex';
              tokenDisplay.style.alignItems = 'center';
              tokenDisplay.style.gap = '4px';
              
              // Add event listener for interaction
              span.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                // Highlight this token
                span.style.boxShadow = '0 0 0 2px rgba(37, 99, 235, 0.5)';
                span.style.zIndex = '10';
                
                // Send message to parent window
                window.parent.postMessage({
                  type: 'tokenClick',
                  token: fullToken,
                  field: fieldName,
                  x: e.clientX + window.scrollX,
                  y: e.clientY + window.scrollY
                }, '*');
              });
              
              fragment.appendChild(span);
            }
            
            // Last part of text
            fragment.appendChild(document.createTextNode(parts[parts.length - 1]));
            
            // Replace the text node with our processed fragment
            textNode.parentNode.replaceChild(fragment, textNode);
          }
          
          // Add CSS for token styling
          function addTokenStyles() {
            const style = document.createElement('style');
            style.textContent = \`
              body { 
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; 
                line-height: 1.4;
                color: #333;
              }
              
              .template-token {
                transition: all 0.2s ease;
                font-size: 0.9em;
              }
              
              .template-token:hover {
                transform: translateY(-1px);
              }
              
              .token-name {
                font-family: monospace;
                font-size: 0.9em;
              }
              
              .token-badge {
                font-size: 0.7em;
                padding: 1px 4px;
                border-radius: 3px;
                font-weight: bold;
              }
              
              .token-badge.mapped {
                background-color: rgba(16, 185, 129, 0.2);
                color: rgb(4, 120, 87);
              }
              
              .token-badge.unmapped {
                background-color: rgba(239, 68, 68, 0.2);
                color: rgb(185, 28, 28);
              }
            \`;
            document.head.appendChild(style);
          }
          
          // Initialize the token highlighting
          addTokenStyles();
          findTemplateTokens();
          
          console.log('Enhanced token highlighting complete');
        }
        
        // Run the highlighter with a small delay to ensure DOM is fully loaded
        setTimeout(highlightTokens, 100);
      })();
    `;
    
    // Inject the script safely
    try {
      const iframeDoc = iframeElement.contentDocument || 
                       (iframeElement.contentWindow as any).document;
      
      // Create a script element instead of using eval
      const scriptEl = iframeDoc.createElement('script');
      scriptEl.textContent = script;
      iframeDoc.head.appendChild(scriptEl);
    } catch (error) {
      console.error('Failed to inject highlighting script:', error);
    }
  };
  
  // Set up when template or bindings change
  useEffect(() => {
    if (template) {
      setTemplateName(template.name);
      setTemplateHtml(template.htmlContent || template.html || '');
    }
    
    if (serverBindings) {
      const mappedBindings = mapBindings(serverBindings);
      setBindings(mappedBindings);
    }
    
    // Create data fields from resume schema
    if (resumeSchema) {
      // Simplified schema representation for the binding UI
      const fields: DataField[] = [
        {
          id: 'personal',
          name: 'Personal Info',
          path: 'personal',
          type: 'object',
          children: [
            { id: 'firstName', name: 'First Name', path: 'personal.firstName', type: 'string' },
            { id: 'lastName', name: 'Last Name', path: 'personal.lastName', type: 'string' },
            { id: 'email', name: 'Email', path: 'personal.email', type: 'string' },
            { id: 'phone', name: 'Phone', path: 'personal.phone', type: 'string' },
          ]
        },
        {
          id: 'work',
          name: 'Work Experience',
          path: 'work',
          type: 'array',
          children: [
            { id: 'title', name: 'Job Title', path: 'work[].title', type: 'string' },
            { id: 'company', name: 'Company', path: 'work[].company', type: 'string' },
            { id: 'startDate', name: 'Start Date', path: 'work[].startDate', type: 'date' },
            { id: 'endDate', name: 'End Date', path: 'work[].endDate', type: 'date' },
            { id: 'description', name: 'Description', path: 'work[].description', type: 'string' },
          ]
        },
        {
          id: 'education',
          name: 'Education',
          path: 'education',
          type: 'array',
          children: [
            { id: 'institution', name: 'Institution', path: 'education[].institution', type: 'string' },
            { id: 'degree', name: 'Degree', path: 'education[].degree', type: 'string' },
            { id: 'startDate', name: 'Start Date', path: 'education[].startDate', type: 'date' },
            { id: 'endDate', name: 'End Date', path: 'education[].endDate', type: 'date' },
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
    
    // Calculate completion percentage
    const percentage = analyzeCompletion();
    setCompletionPercentage(percentage);
  }, [template, serverBindings, resumeSchema]);

  // Field selector popup component
  const FieldSelectorPopup = () => {
    if (!showFieldSelector || !previewClickedToken) return null;
    
    // Local state for search filtering
    const [searchTerm, setSearchTerm] = useState("");
    
    // Extract token name for suggestions
    const tokenName = previewClickedToken
      ?.replace(/\[\[FIELD:|\]\]/g, '')
      ?.replace(/{{|}}/g, '')
      ?.trim() || '';
    
    // Get flat list of fields for the selector
    const flatFields = flattenDataFields(dataFields);
    
    // Filter fields based on search term
    const filteredFields = searchTerm 
      ? flatFields.filter(field => 
          field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          field.path.toLowerCase().includes(searchTerm.toLowerCase()))
      : flatFields;
    
    // Generate suggestions based on token name similarity
    const suggestedFields = flatFields.filter(field => {
      const fieldName = field.name.toLowerCase();
      const fieldPath = field.path.toLowerCase();
      const token = tokenName.toLowerCase();
      
      return fieldName === token || 
        fieldName.includes(token) || 
        fieldPath.includes(token) ||
        token.includes(fieldName);
    });
    
    // Find binding for the clicked token
    const binding = bindings.find(b => 
      b.placeholder === previewClickedToken ||
      b.placeholder.replace(/\[\[(?:FIELD|LOOP|IF):|\]\]/g, '').trim() === tokenName ||
      b.placeholder.replace(/{{|}}/g, '').trim() === tokenName
    );
    
    // Handle selecting a field
    const handleFieldSelect = (field: DataField) => {
      if (binding && binding.id !== 0) {
        // Update existing binding with selected field
        const updatedBinding = { ...binding, selector: field.path };
        setBindings(prev => prev.map(b => b.id === binding.id ? updatedBinding : b));
        
        // Save the binding to the server
        updateBindingMutation.mutate(updatedBinding);
        
        // Show success toast
        toast({
          title: "Field mapped",
          description: `"${tokenName}" mapped to "${field.name}"`
        });
      } else {
        // Create new binding if one doesn't exist yet or has a temporary ID
        const newBinding: Binding = {
          id: 0, // Temporary ID, will be assigned by server
          templateId: parseInt(templateId),
          placeholder: previewClickedToken || '',
          selector: field.path,
          description: `Maps template field ${tokenName} to ${field.name}`,
        };
        
        // Create binding on server first - don't try to update a binding with id=0
        saveBindingMutation.mutate(newBinding, {
          onSuccess: (data) => {
            // Add the server-created binding to our list
            if (data && data.id) {
              setBindings(prev => [
                ...prev.filter(b => !(b.id === 0 && b.placeholder === previewClickedToken)),
                {
                  id: data.id,
                  templateId: data.templateId,
                  placeholder: data.placeholderToken,
                  selector: data.dataField,
                  description: data.description || '',
                  isMapped: true
                }
              ]);
            }
          }
        });
        
        // Show immediate feedback toast
        toast({
          title: "Creating binding...",
          description: `Mapping "${tokenName}" to "${field.name}"`
        });
      }
      
      // Close field selector
      setShowFieldSelector(false);
    };
    
    return (
      <div
        className="fixed z-50 bg-white rounded-md border shadow-lg w-80"
        style={{
          top: `${fieldSelectorPosition.y}px`,
          left: `${fieldSelectorPosition.x - 160}px`, // Center it
          maxHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
          <div>
            <h3 className="text-sm font-medium">Map Token</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              <code className="bg-blue-50 text-blue-700 px-1 py-0.5 rounded font-mono">{tokenName}</code>
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7" 
            onClick={() => setShowFieldSelector(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search fields..."
              className="pl-8 h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {suggestedFields.length > 0 && !searchTerm && (
          <div className="px-2 py-2 border-b">
            <div className="flex items-center mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500 mr-1" />
              <span className="text-xs font-medium text-gray-500">Suggested Matches</span>
            </div>
            <div className="space-y-1 mt-1">
              {suggestedFields.slice(0, 3).map(field => (
                <div
                  key={`suggestion-${field.path}`}
                  className="px-2 py-1.5 text-sm rounded-sm bg-blue-50 hover:bg-blue-100 
                    cursor-pointer flex items-center border border-blue-100"
                  onClick={() => handleFieldSelect(field)}
                >
                  <span className="mr-1.5 h-3.5 w-3.5 flex-shrink-0">
                    {getFieldTypeIcon(field.type)}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium text-sm truncate">{field.name}</div>
                    <div className="font-mono text-xs text-blue-700 truncate">{field.path}</div>
                  </div>
                  <Check className="h-3.5 w-3.5 text-blue-600 ml-1" />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="overflow-y-auto" style={{ maxHeight: "250px" }}>
          <div className="p-2 space-y-1">
            {filteredFields.length > 0 ? (
              filteredFields.map(field => (
                <div
                  key={field.path}
                  className="px-2 py-1.5 text-sm rounded-sm hover:bg-gray-100 
                    cursor-pointer flex items-center"
                  onClick={() => handleFieldSelect(field)}
                >
                  <span className="mr-1.5 h-3.5 w-3.5 flex-shrink-0">
                    {getFieldTypeIcon(field.type)}
                  </span>
                  <div className="flex-1 overflow-hidden">
                    <div className="font-medium text-sm truncate">{field.name}</div>
                    <div className="font-mono text-xs text-gray-500 truncate">{field.path}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                No matching fields found
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-full p-0 bg-gray-50">
      {/* Field selector popup for interactive preview */}
      <FieldSelectorPopup />
      
      <div className="p-4 pb-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">Template Bindings</h1>
            <p className="text-gray-500 text-sm">
              Connect data fields to template placeholders for{' '}
              <span className="font-medium text-primary">{templateName}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={performBasicMatching}
              className="flex items-center"
              variant="outline"
              size="sm"
            >
              <WandSparkles className="w-4 h-4 mr-1.5" />
              Auto Match
            </Button>
              
            <Button
              onClick={() => {
                // Show loading state
                toast({
                  title: "AI Binding Analysis",
                  description: "Analyzing template tokens and suggesting field matches..."
                });
                
                // Simulate AI analysis with enhanced matching using similarity algorithms
                setTimeout(() => {
                  // Get unmapped bindings
                  const unmappedBindings = bindings.filter(b => !b.selector || b.selector.trim() === '');
                  
                  if (unmappedBindings.length === 0) {
                    toast({
                      title: "No unmapped tokens found",
                      description: "All template tokens have been mapped to data fields."
                    });
                    return;
                  }
                  
                  // Find best matches for each unmapped binding
                  const flatFields = flattenDataFields(dataFields);
                  const mappedCount = performIntelligentMatching(unmappedBindings, flatFields);
                  
                  // Show success message
                  toast({
                    title: "AI Suggestion Complete",
                    description: `Matched ${mappedCount} fields with high confidence.`
                  });
                  
                  // Force a complete refresh of the preview
                  setTimeout(() => {
                    // Increment the key to force iframe reload
                    setPreviewKey(prev => prev + 1);
                    // Also call highlightPreviewPlaceholders after a brief delay to ensure
                    // the iframe has had time to reload
                    setTimeout(highlightPreviewPlaceholders, 300);
                  }, 500);
                }, 1000);
              }}
              className="flex items-center"
              variant="secondary"
              size="sm"
            >
              <Bot className="w-4 h-4 mr-1.5" />
              AI Suggest
            </Button>
              
            <Link href="/admin/templates">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Templates
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="bg-white p-2 rounded-md border">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              <span className="font-medium">{bindings.length}</span> template fields found
              <span className="mx-1">•</span>
              <span className="font-medium">
                {bindings.filter(b => b.selector && b.selector.trim() !== '').length}
              </span> mapped
            </div>
            <div className="flex items-center space-x-2 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1.5 opacity-70"></div>
                <span>Mapped</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-1.5 opacity-70"></div>
                <span>Unmapped</span>
              </div>
            </div>
          </div>
          <div className="mt-2 mb-1">
            <div className="flex justify-between text-xs">
              <div className="text-gray-500">Mapping completion</div>
              <div className="font-medium">{completionPercentage}%</div>
            </div>
            <Progress value={completionPercentage} className="h-1 bg-gray-100" />
          </div>
        </div>
      </div>

      {isLoadingTemplate || isLoadingBindings ? (
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Left column: Web-App Fields */}
            <Card className="bg-white border rounded-md overflow-hidden">
              <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-medium">Web-App Fields</h2>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Filter fields..."
                    className="w-56 h-8 pl-8 text-sm"
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-72 overflow-auto">
                <div className="p-3">
                  {filterDataFields(dataFields, filterText).map(field => (
                    <div key={field.id} className="mb-3">
                      <div className="flex items-center text-sm font-medium mb-1">
                        {getFieldTypeIcon(field.type)}
                        <span className="ml-1.5">{field.name}</span>
                      </div>
                      
                      {field.children && field.children.length > 0 && (
                        <div className="pl-5 space-y-1.5">
                          {field.children.map(child => (
                            <div 
                              key={child.id}
                              className={`
                                rounded text-xs p-1.5 bg-blue-50 flex items-center cursor-pointer
                                border border-blue-100 hover:bg-blue-100
                                ${selectedBinding && selectedBinding.selector === child.path ? 'border-blue-400 ring-1 ring-blue-400' : ''}
                              `}
                              onClick={() => {
                                if (selectedBinding) {
                                  const updatedBinding = { ...selectedBinding, selector: child.path };
                                  setBindings(prev => prev.map(b => b.id === selectedBinding.id ? updatedBinding : b));
                                  updateBindingMutation.mutate(updatedBinding);
                                }
                              }}
                            >
                              <div className="mr-1.5">
                                {getFieldTypeIcon(child.type)}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">{child.name}</div>
                                <div className="text-gray-500 text-xs font-mono truncate" style={{ fontSize: '0.7rem' }}>
                                  {child.path}
                                </div>
                              </div>
                              {bindings.some(b => b.selector === child.path) && (
                                <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs ml-1">
                                  <Check className="h-3 w-3 mr-0.5" />
                                  Mapped
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
            
            {/* Right column: Template Placeholders */}
            <Card className="bg-white border rounded-md overflow-hidden">
              <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
                <h2 className="font-medium">Template Placeholders</h2>
                
                <Button 
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={highlightPreviewPlaceholders}
                >
                  <RefreshCw className="h-3 w-3 mr-1.5" />
                  Refresh Tokens
                </Button>
              </div>
              
              <div className="h-72 flex flex-col">
                <div className="flex-grow overflow-hidden">
                  <div className="h-full flex flex-col">
                    {/* Template structure visualization - small section at top */}
                    <div className="p-3 border-b bg-gray-50">
                      <h3 className="text-sm font-medium mb-1">Template Structure Visualization</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-pink-50 rounded p-2 border border-pink-100">
                          <div className="text-xs text-gray-500 mb-1">&#123; name &#125;</div>
                          <div className="border border-pink-300 rounded-sm p-1 bg-white"></div>
                        </div>
                        <div className="bg-pink-50 rounded p-2 border border-pink-100">
                          <div className="text-xs text-gray-500 mb-1">&#123; email &#125;</div>
                          <div className="border border-pink-300 rounded-sm p-1 bg-white"></div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Template placeholder list */}
                    <ScrollArea className="flex-grow overflow-auto">
                      <div className="p-3 space-y-1">
                        {bindings.map(binding => (
                          <div 
                            key={binding.id}
                            className={`
                              rounded border p-2 flex cursor-pointer
                              ${binding.selector ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} 
                              ${selectedBinding && selectedBinding.id === binding.id ? 'ring-2 ring-blue-500' : ''}
                              hover:bg-opacity-70
                            `}
                            onClick={() => setSelectedBinding(binding)}
                          >
                            <div className="flex-grow">
                              <div className="font-mono text-xs">
                                {binding.placeholder}
                              </div>
                              {binding.selector && (
                                <div className="mt-1 flex items-center">
                                  <span className="flex items-center text-xs text-green-700">
                                    <Check className="h-3 w-3 mr-1" />
                                    Mapped
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500 font-mono">
                                    {binding.selector}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Live Preview - Below both columns */}
          <Card className="bg-white border rounded-md overflow-hidden">
            <div className="px-4 py-2 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-medium">Live Preview</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewKey(prev => prev + 1)}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Refresh Preview
              </Button>
            </div>
            
            <div className="h-96 overflow-auto">
              {templateHtml ? (
                <div 
                  key={previewKey}
                  ref={previewRef}
                  className="preview-container h-full"
                >
                  <iframe 
                    srcDoc={templateHtml}
                    className="w-full h-full border-0"
                    ref={setIframeElement}
                    onLoad={() => highlightPreviewPlaceholders()}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center flex-col p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Template Content Not Available</h3>
                  <p className="text-sm text-gray-500 max-w-md">
                    No HTML content found for this template. Please make sure the template has HTML content.
                  </p>
                  <Button 
                    className="mt-4" 
                    size="sm" 
                    variant="outline"
                    onClick={highlightPreviewPlaceholders}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Template
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}