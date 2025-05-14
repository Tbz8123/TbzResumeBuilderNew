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
  Filter, WandSparkles, Lightbulb, RefreshCw, Bot
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BindingSuggestions, BindingSuggestion } from '@/components/templates/BindingSuggestions';

// Types
interface Binding {
  id: number;
  templateId: number;
  placeholder: string;
  selector: string;
  isMapped?: boolean;
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
  const { data: template, isLoading: isLoadingTemplate } = useQuery<{
    id: number;
    name: string;
    description: string;
    category: string;
    isActive: boolean;
    htmlContent: string;
  }>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  // Fetch template bindings
  const { data: bindingsData, isLoading: isLoadingBindings } = useQuery<Binding[]>({
    queryKey: [`/api/templates/${templateId}/bindings`],
    enabled: !!templateId,
  });
  
  // Fetch resume schema
  const { data: resumeSchema, isLoading: isLoadingSchema } = useQuery<Record<string, any>>({
    queryKey: [`/api/templates/${templateId}/schema`],
    enabled: !!templateId,
  });
  
  // Fetch general resume schema as fallback
  const { data: generalResumeSchema, isLoading: isLoadingGeneralSchema } = useQuery<Record<string, any>>({
    queryKey: ['/api/resume/schema'],
    enabled: !!templateId,
  });

  // Update template bindings mutation
  const updateBindingMutation = useMutation({
    mutationFn: async (binding: Binding) => {
      const response = await fetch(`/api/templates/${templateId}/bindings/${binding.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selector: binding.selector,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update binding');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      // Force preview refresh
      setPreviewKey(prev => prev + 1);
      refreshTokenHighlights();
      updateCompletionPercentage();
      
      toast({
        title: 'Success',
        description: 'Template binding updated',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update template binding',
        variant: 'destructive',
      });
    },
  });

  // Initialize data on component mount
  useEffect(() => {
    if (bindingsData && Array.isArray(bindingsData)) {
      setBindings(bindingsData);
      
      // Calculate completion percentage
      updateCompletionPercentage();
    }
  }, [bindingsData]);

  useEffect(() => {
    if (template) {
      if (typeof template === 'object' && 'name' in template) {
        setTemplateName(template.name as string);
      }
      
      if (template.htmlContent) {
        setTemplateHtml(template.htmlContent);
        extractTemplateTokens(template.htmlContent);
      }
    }
  }, [template]);

  // Auto-suggest bindings when template and bindings are loaded
  useEffect(() => {
    if (template && bindings && bindings.length > 0 && !autoSuggestMade) {
      autoSuggestBindings();
      setAutoSuggestMade(true);
    }
  }, [template, bindings]);

  // Parse resume schema into data fields
  useEffect(() => {
    // Use template-specific schema or fall back to general schema
    const schema = resumeSchema || generalResumeSchema;
    
    if (!schema) {
      console.log('No schema available, loading default fields');
      // Default fields as fallback if both schemas are unavailable
      const defaultFields: DataField[] = [
        {
          id: 'firstName',
          name: 'First Name',
          path: 'firstName',
          type: 'string',
          description: 'First name'
        },
        {
          id: 'surname',
          name: 'Last Name',
          path: 'surname',
          type: 'string', 
          description: 'Last name'
        },
        {
          id: 'email',
          name: 'Email',
          path: 'email',
          type: 'string',
          description: 'Email address'
        },
        {
          id: 'professionalSummary',
          name: 'Professional Summary',
          path: 'professionalSummary',
          type: 'string',
          description: 'Professional summary'
        }
      ];
      setDataFields(defaultFields);
      return;
    }
    
    // Convert schema to data fields format
    const convertedFields: DataField[] = [];
    
    // Helper function to format field names from camelCase
    const formatFieldName = (name: string) => {
      return name
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
    };
    
    // Process each top-level property
    Object.entries(schema).forEach(([key, fieldSchema]: [string, any]) => {
      if (typeof fieldSchema === 'object' && fieldSchema !== null) {
        const field: DataField = {
          id: key,
          name: fieldSchema.description || formatFieldName(key),
          path: key,
          type: fieldSchema.type as any,
          description: fieldSchema.description || ''
        };
        
        // Handle arrays with items
        if (fieldSchema.type === 'array' && fieldSchema.items) {
          // For arrays like workExperience
          if (fieldSchema.items.type === 'object' && fieldSchema.items.properties) {
            field.children = [];
            
            // Add child fields for each property in the array items
            Object.entries(fieldSchema.items.properties).forEach(([childKey, childValue]: [string, any]) => {
              field.children?.push({
                id: `${key}[0].${childKey}`,
                name: childValue.description || formatFieldName(childKey),
                path: `${key}[0].${childKey}`,
                type: childValue.type as any,
                description: childValue.description || ''
              });
            });
          } else {
            // Simple array of primitive values
            field.children = [{
              id: `${key}[0]`,
              name: `${formatFieldName(key)} Item`,
              path: `${key}[0]`,
              type: fieldSchema.items.type as any,
              description: `Individual ${key} item`
            }];
          }
        }
        
        convertedFields.push(field);
      }
    });
    
    console.log('Generated data fields from schema:', convertedFields);
    setDataFields(convertedFields);
  }, [resumeSchema, generalResumeSchema]);

  // Extract tokens from template HTML
  const extractTemplateTokens = (html: string) => {
    if (!html) return;
    
    // This is a simplified version - in a real application, 
    // we would inject JavaScript into the preview that reports back token positions
    const tokenRegex = /\[\[(FIELD|LOOP|IF):(.*?)\]\]/g;
    let match;
    const tokens: TemplateToken[] = [];
    let id = 0;
    
    while ((match = tokenRegex.exec(html)) !== null) {
      const type = match[1].toLowerCase() as 'field' | 'loop' | 'conditional';
      const text = match[0];
      const fieldName = match[2];
      
      tokens.push({
        id: `token-${id++}`,
        text,
        type,
        position: generateMockPosition(),
        color: tokenColors[id % tokenColors.length],
        isMapped: false
      });
    }
    
    setHighlightedTokens(tokens);
    simulateTokenPositions();
  };
  
  // In a real app, this would come from the preview iframe
  const generateMockPosition = () => {
    return {
      x: Math.floor(Math.random() * 400) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      width: Math.floor(Math.random() * 100) + 100,
      height: Math.floor(Math.random() * 30) + 20
    };
  };
  
  // Simulate getting token positions from the rendered template
  const simulateTokenPositions = () => {
    // In a real implementation, we would inject JavaScript into the iframe
    // that reports back the positions of all tokens in the document
    setTimeout(() => {
      setHighlightedTokens(prev => prev.map(token => ({
        ...token,
        position: generateMockPosition()
      })));
    }, 500);
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
        
        // Add to suggestions if we found a match
        if (bestMatch && bestScore > 0.4) {
          suggestions.push({
            binding,
            suggestedField: bestMatch.path,
            confidence: bestScore
          });
        }
      }
      
      // Update UI with suggestions
      if (suggestions.length > 0) {
        // Sort by confidence
        suggestions.sort((a, b) => b.confidence - a.confidence);
        
        // Show suggestions dialog
        setBindingSuggestions(suggestions);
        setShowSuggestionsDialog(true);
      } else {
        // Use basic matching as fallback
        performBasicMatching();
      }
    } catch (error) {
      console.error("Error in auto-suggest bindings:", error);
      toast({
        title: "Auto-suggestion failed",
        description: "There was an error processing the template fields. Using basic matching instead.",
        variant: "destructive",
      });
      
      // Fallback to basic matching
      performBasicMatching();
    } finally {
      setIsProcessingBindings(false);
    }
  };
  
  // Handle accepting a single binding suggestion
  const handleAcceptSuggestion = (binding: Binding) => {
    // Update binding in state
    setBindings(prevBindings => 
      prevBindings.map(b => b.id === binding.id ? binding : b)
    );
    
    // Save to backend
    updateBindingMutation.mutate(binding);
  };
  
  // Handle accepting all binding suggestions
  const handleAcceptAllSuggestions = () => {
    const updatedBindings = [...bindings];
    let madeChanges = false;
    
    bindingSuggestions.forEach(suggestion => {
      const bindingIndex = updatedBindings.findIndex(b => b.id === suggestion.binding.id);
      if (bindingIndex !== -1) {
        updatedBindings[bindingIndex] = {
          ...updatedBindings[bindingIndex],
          selector: suggestion.suggestedField,
          isMapped: true
        };
        madeChanges = true;
        
        // Save each binding to backend
        updateBindingMutation.mutate({
          ...updatedBindings[bindingIndex],
          selector: suggestion.suggestedField
        });
      }
    });
    
    if (madeChanges) {
      setBindings(updatedBindings);
      toast({
        title: "AI-powered binding suggestions applied",
        description: `Successfully mapped ${bindingSuggestions.length} template fields automatically`,
      });
      updateCompletionPercentage();
      setShowSuggestionsDialog(false);
    }
  };
  
  // Handle dismissing a binding suggestion
  const handleDismissSuggestion = (bindingId: number) => {
    setBindingSuggestions(prevSuggestions => 
      prevSuggestions.filter(s => s.binding.id !== bindingId)
    );
  };
  
  // Basic matching as fallback
  const performBasicMatching = () => {
    const updatedBindings = [...bindings];
    let madeChanges = false;
    
    // Flatten data fields for easier matching
    const flatDataFields = flattenDataFields(dataFields);
    
    updatedBindings.forEach((binding, index) => {
      // Skip already mapped bindings
      if (binding.selector && binding.selector.trim() !== '') return;
      
      // Extract the field name from placeholder - assumes format like [[FIELD:name]]
      if (!binding.placeholder || typeof binding.placeholder !== 'string') return;
      
      const fieldMatch = binding.placeholder.match(/\[\[(?:FIELD|LOOP|IF):([^\]]+)\]\]/);
      if (!fieldMatch) return;
      
      const fieldName = fieldMatch[1];
      
      // Look for exact matches first
      const exactMatch = flatDataFields.find(field => 
        field.path === fieldName || 
        field.name.toLowerCase() === fieldName.toLowerCase()
      );
      
      if (exactMatch) {
        updatedBindings[index] = {
          ...binding,
          selector: exactMatch.path,
          isMapped: true
        };
        madeChanges = true;
      }
      // Try fuzzy matching
      else {
        const fuzzyMatches = flatDataFields.filter(field =>
          field.path.includes(fieldName) ||
          fieldName.includes(field.path) ||
          field.path.replace(/\./g, '').includes(fieldName) ||
          fieldName.includes(field.path.replace(/\./g, ''))
        );
        
        if (fuzzyMatches.length === 1) {
          updatedBindings[index] = {
            ...binding,
            selector: fuzzyMatches[0].path,
            isMapped: true
          };
          madeChanges = true;
        }
      }
    });
    
    if (madeChanges) {
      setBindings(updatedBindings);
      toast({
        title: "Auto-suggested bindings",
        description: "Some bindings were automatically suggested based on field names",
      });
      updateCompletionPercentage();
    }
  };
  
  // Helper to flatten nested data fields for easier searching
  const flattenDataFields = (fields: DataField[]): DataField[] => {
    let result: DataField[] = [];
    
    fields.forEach(field => {
      result.push(field);
      if (field.children && field.children.length > 0) {
        result = [...result, ...flattenDataFields(field.children)];
      }
    });
    
    return result;
  };

  // Filter data fields based on search text
  const filterDataFields = (fields: DataField[], searchText: string): DataField[] => {
    if (!searchText) return fields;
    
    return fields.filter(field => {
      const matchesSearch = 
        field.name.toLowerCase().includes(searchText.toLowerCase()) ||
        field.path.toLowerCase().includes(searchText.toLowerCase()) ||
        (field.description && field.description.toLowerCase().includes(searchText.toLowerCase()));
      
      const hasMatchingChildren = field.children && 
        filterDataFields(field.children, searchText).length > 0;
      
      return matchesSearch || hasMatchingChildren;
    }).map(field => {
      if (field.children) {
        return {
          ...field,
          children: filterDataFields(field.children, searchText)
        };
      }
      return field;
    });
  };

  // Update completion percentage
  const updateCompletionPercentage = () => {
    if (!bindings.length) return;
    
    const mappedBindings = bindings.filter(binding => 
      binding.selector && binding.selector.trim() !== ''
    );
    
    const percentage = Math.round((mappedBindings.length / bindings.length) * 100);
    setCompletionPercentage(percentage);
  };

  // Refresh the token highlights in the preview
  const refreshTokenHighlights = () => {
    // In a real implementation, this would communicate with the preview iframe
    // to synchronize the token highlights with the current bindings
    setPreviewKey(prev => prev + 1);
    simulateTokenPositions();
  };

  // Handle binding selection and update
  const handleSelectorChange = (bindingId: number, newSelector: string) => {
    setBindings(prevBindings =>
      prevBindings.map(binding =>
        binding.id === bindingId ? { ...binding, selector: newSelector, isMapped: newSelector !== '' } : binding
      )
    );
  };

  const handleSaveBinding = (binding: Binding) => {
    updateBindingMutation.mutate(binding);
  };

  // Handle binding selection for data field mapping
  const handleBindingSelection = (binding: Binding, tokenId?: string) => {
    setSelectedBinding(binding);
    if (tokenId) {
      setActiveToken(tokenId);
    }
  };

  // Start wizard mode
  const startWizard = () => {
    setWizardMode(true);
    
    // Find the first unmapped binding
    const unmappedBindings = bindings.filter(b => !b.selector || b.selector.trim() === '');
    if (unmappedBindings.length > 0) {
      setSelectedBinding(unmappedBindings[0]);
      
      // Find the token that corresponds to this binding
      const token = highlightedTokens.find(t => t.text === unmappedBindings[0].placeholder);
      if (token) {
        setActiveToken(token.id);
      }
      
      setWizardStep(0);
    } else {
      toast({
        title: "All bindings mapped",
        description: "All tokens have been mapped to data fields",
      });
    }
  };

  // Navigate to the next binding in wizard mode
  const goToNextBinding = () => {
    const unmappedBindings = bindings.filter(b => !b.selector || b.selector.trim() === '');
    if (wizardStep < unmappedBindings.length - 1) {
      setWizardStep(prev => prev + 1);
      setSelectedBinding(unmappedBindings[wizardStep + 1]);
      
      // Find the token that corresponds to this binding
      const token = highlightedTokens.find(t => t.text === unmappedBindings[wizardStep + 1].placeholder);
      if (token) {
        setActiveToken(token.id);
      }
    } else {
      setWizardMode(false);
      toast({
        title: "Wizard completed",
        description: "You've gone through all unmapped bindings",
      });
    }
  };

  // Handle data field selection for binding
  const handleDataFieldSelect = (field: DataField) => {
    if (!selectedBinding) return;
    
    // Update the binding with the selected field
    const updatedBindings = bindings.map(binding => 
      binding.id === selectedBinding.id 
        ? { ...binding, selector: field.path, isMapped: true } 
        : binding
    );
    
    setBindings(updatedBindings);
    
    // Update the selected binding
    setSelectedBinding({ ...selectedBinding, selector: field.path, isMapped: true });
    
    // Save the binding
    handleSaveBinding({ ...selectedBinding, selector: field.path });
    
    // If in wizard mode, go to the next binding
    if (wizardMode) {
      goToNextBinding();
    }
  };

  // Render a single data field
  const renderDataField = (field: DataField, level = 0) => {
    const isMapped = bindings.some(binding => binding.selector === field.path);
    
    return (
      <div key={field.id} style={{ marginLeft: `${level * 16}px` }}>
        <div 
          className={`py-2 px-3 my-1 rounded-md cursor-pointer hover:bg-slate-100 
            ${isMapped ? 'bg-green-50 border border-green-200' : 'border border-slate-200'}`}
          onClick={() => handleDataFieldSelect(field)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="mr-2">
                {field.type === 'object' ? (
                  <div className="w-4 h-4 rounded-full bg-blue-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-blue-800">O</span>
                  </div>
                ) : field.type === 'array' ? (
                  <div className="w-4 h-4 rounded-full bg-amber-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-amber-800">A</span>
                  </div>
                ) : field.type === 'string' ? (
                  <div className="w-4 h-4 rounded-full bg-green-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-green-800">S</span>
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-purple-200 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-purple-800">{field.type.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium">{field.name}</div>
                <div className="text-xs text-muted-foreground">{field.path}</div>
              </div>
            </div>
            {isMapped && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Mapped
              </Badge>
            )}
          </div>
        </div>
        
        {field.children && field.children.length > 0 && (
          <div className="ml-4 pl-2 border-l-2 border-slate-200">
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

  return (
    <div className="container py-6">
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
                  onClick={performBasicMatching} // Use direct matching
                  size="sm"
                  className="gap-1"
                >
                  <Lightbulb className="h-4 w-4" />
                  Auto Match
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Use AI to intelligently map template fields to data fields</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={wizardMode ? "default" : "outline"}
                  size="sm"
                  onClick={startWizard}
                  className="gap-1"
                >
                  <WandSparkles className="h-4 w-4" />
                  Wizard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guide through all bindings one by one</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Link href="/admin/templates">
            <Button variant="ghost" size="sm" className="gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to Templates
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
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
              <div className="px-4 py-3 border-b bg-blue-50">
                <h2 className="font-semibold text-blue-900">Your Web-App Fields</h2>
                <p className="text-xs text-blue-600 mt-0.5">resumeData Schema</p>
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
              <div className="px-4 py-3 border-b bg-purple-50">
                <h2 className="font-semibold text-purple-900">Template Placeholders</h2>
                <p className="text-xs text-purple-600 mt-0.5">Detected in your HTML</p>
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
                                binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.includes('FIELD:') ? 'bg-blue-100 text-blue-800' : 
                                binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.includes('LOOP:') ? 'bg-amber-100 text-amber-800' : 
                                binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.includes('IF:') ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                <Code className="h-3.5 w-3.5 mr-1.5" />
                                {binding.placeholder && typeof binding.placeholder === 'string' 
                                  ? binding.placeholder.replace(/\[\[(FIELD|LOOP|IF):|\]\]/g, '') 
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
            <div className="px-4 py-3 border-b bg-gradient-to-r from-slate-50 to-slate-100">
              <h2 className="font-semibold">Live Preview</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Interactive preview with drag & drop or click to bind</p>
            </div>
            <div className="p-4">
              <div 
                className="border rounded-md h-[400px] bg-white"
                ref={previewRef}
              >
                <div className="h-full flex items-center justify-center text-center p-10">
                  <div>
                    <AlertTriangle className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Preview Not Available</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      Live preview will be enabled once the feature is fully implemented. For now, please use the
                      two-column interface above to bind your data fields to the template placeholders.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}