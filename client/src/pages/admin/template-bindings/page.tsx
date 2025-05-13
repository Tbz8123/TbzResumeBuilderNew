import { useEffect, useState, useRef } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Loader2, Save, ArrowLeft, Search, ChevronRight, 
  ChevronLeft, Code, AlertTriangle, Settings, Check, 
  Filter, WandSparkles, Eye, Lightbulb, RefreshCw 
} from 'lucide-react';
import { Link } from 'wouter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  const [showWizardDialog, setShowWizardDialog] = useState<boolean>(false);
  const [autoSuggestMade, setAutoSuggestMade] = useState<boolean>(false);

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

  // Parse form data structure - simplified example
  useEffect(() => {
    const mockDataFields: DataField[] = [
      {
        id: 'name',
        name: 'Name',
        path: 'name',
        type: 'string',
        description: 'Full name of the user'
      },
      {
        id: 'contact',
        name: 'Contact',
        path: 'contact',
        type: 'object',
        children: [
          {
            id: 'contact.email',
            name: 'Email',
            path: 'contact.email',
            type: 'string',
            description: 'Email address'
          },
          {
            id: 'contact.phone',
            name: 'Phone',
            path: 'contact.phone',
            type: 'string',
            description: 'Phone number'
          },
          {
            id: 'contact.address',
            name: 'Address',
            path: 'contact.address',
            type: 'object',
            children: [
              {
                id: 'contact.address.street',
                name: 'Street',
                path: 'contact.address.street',
                type: 'string'
              },
              {
                id: 'contact.address.city',
                name: 'City',
                path: 'contact.address.city',
                type: 'string'
              },
            ]
          }
        ]
      },
      {
        id: 'sections',
        name: 'Sections',
        path: 'sections',
        type: 'object',
        children: [
          {
            id: 'sections.experience',
            name: 'Experience',
            path: 'sections.experience',
            type: 'array',
            children: [
              {
                id: 'sections.experience[].company',
                name: 'Company',
                path: 'sections.experience[].company',
                type: 'string'
              },
              {
                id: 'sections.experience[].title',
                name: 'Title',
                path: 'sections.experience[].title',
                type: 'string'
              },
              {
                id: 'sections.experience[].startDate',
                name: 'Start Date',
                path: 'sections.experience[].startDate',
                type: 'date'
              },
              {
                id: 'sections.experience[].endDate',
                name: 'End Date',
                path: 'sections.experience[].endDate',
                type: 'date'
              },
              {
                id: 'sections.experience[].description',
                name: 'Description',
                path: 'sections.experience[].description',
                type: 'string'
              }
            ]
          },
          {
            id: 'sections.education',
            name: 'Education',
            path: 'sections.education',
            type: 'array',
            children: [
              {
                id: 'sections.education[].institution',
                name: 'Institution',
                path: 'sections.education[].institution',
                type: 'string'
              },
              {
                id: 'sections.education[].degree',
                name: 'Degree',
                path: 'sections.education[].degree',
                type: 'string'
              },
              {
                id: 'sections.education[].year',
                name: 'Year',
                path: 'sections.education[].year',
                type: 'number'
              },
              {
                id: 'sections.education[].description',
                name: 'Description',
                path: 'sections.education[].description',
                type: 'string'
              }
            ]
          },
          {
            id: 'sections.skills',
            name: 'Skills',
            path: 'sections.skills',
            type: 'array',
            children: [
              {
                id: 'sections.skills[].name',
                name: 'Name',
                path: 'sections.skills[].name',
                type: 'string'
              },
              {
                id: 'sections.skills[].level',
                name: 'Level',
                path: 'sections.skills[].level',
                type: 'number'
              }
            ]
          }
        ]
      },
      {
        id: 'professionalSummary',
        name: 'Professional Summary',
        path: 'professionalSummary',
        type: 'string',
        description: 'Brief professional summary'
      },
    ];
    
    setDataFields(mockDataFields);
  }, []);

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

  // Auto-suggest bindings based on naming patterns
  const autoSuggestBindings = () => {
    if (!bindings.length || !dataFields.length) return;
    
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

  // Handle token click in the preview
  const handleTokenClick = (tokenId: string) => {
    const token = highlightedTokens.find(t => t.id === tokenId);
    if (!token) return;
    
    setActiveToken(tokenId);
    
    // Find the binding that corresponds to this token
    const text = token.text;
    const matchingBinding = bindings.find(b => b.placeholder === text);
    
    if (matchingBinding) {
      setSelectedBinding(matchingBinding);
      
      // Scroll to the binding in the list
      const element = document.getElementById(`binding-${matchingBinding.id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Wizard mode navigation
  const nextWizardStep = () => {
    if (wizardStep < bindings.length - 1) {
      setWizardStep(prev => prev + 1);
      
      // Select the binding for the current step
      setSelectedBinding(bindings[wizardStep + 1]);
      
      // Find corresponding token and highlight it
      const binding = bindings[wizardStep + 1];
      if (binding && binding.placeholder && typeof binding.placeholder === 'string') {
        const token = highlightedTokens.find(t => t.text === binding.placeholder);
        if (token) {
          setActiveToken(token.id);
        }
      }
    } else {
      // End of wizard
      setWizardMode(false);
      setShowWizardDialog(true);
    }
  };

  const prevWizardStep = () => {
    if (wizardStep > 0) {
      setWizardStep(prev => prev - 1);
      
      // Select the binding for the current step
      setSelectedBinding(bindings[wizardStep - 1]);
      
      // Find corresponding token and highlight it
      const binding = bindings[wizardStep - 1];
      if (binding && binding.placeholder && typeof binding.placeholder === 'string') {
        const token = highlightedTokens.find(t => t.text === binding.placeholder);
        if (token) {
          setActiveToken(token.id);
        }
      }
    }
  };

  const startWizard = () => {
    setWizardMode(true);
    setWizardStep(0);
    
    // Select the first binding
    if (bindings.length > 0) {
      setSelectedBinding(bindings[0]);
      
      // Find corresponding token and highlight it
      if (bindings[0]?.placeholder && typeof bindings[0].placeholder === 'string') {
        const token = highlightedTokens.find(t => t.text === bindings[0].placeholder);
        if (token) {
          setActiveToken(token.id);
        }
      }
    }
  };

  // Apply binding from data field
  const handleApplyDataField = (fieldPath: string) => {
    if (!selectedBinding) return;
    
    // Update the binding with the selected data field
    setBindings(prevBindings =>
      prevBindings.map(binding =>
        binding.id === selectedBinding.id 
          ? { ...binding, selector: fieldPath, isMapped: true } 
          : binding
      )
    );
    
    // Save the binding
    updateBindingMutation.mutate({
      ...selectedBinding,
      selector: fieldPath
    });
    
    // In wizard mode, automatically go to next step
    if (wizardMode) {
      nextWizardStep();
    }
  };

  const isLoading = isLoadingTemplate || isLoadingBindings;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Filtered data fields based on search
  const filteredDataFields = filterText 
    ? filterDataFields(dataFields, filterText) 
    : dataFields;

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/templates" className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Templates
          </Link>
          <h1 className="text-3xl font-bold">{templateName} - Bindings</h1>
          <p className="text-muted-foreground">Interactive template binding interface</p>
        </div>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={refreshTokenHighlights}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Refresh the token highlights
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
                >
                  <WandSparkles className="h-4 w-4 mr-1" />
                  Auto-suggest
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Automatically suggest bindings based on field names
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
                >
                  <Lightbulb className="h-4 w-4 mr-1" />
                  Wizard
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Step-by-step guided binding configuration
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center space-x-2">
          <Progress value={completionPercentage} className="h-2" />
          <span className="text-sm font-medium">{completionPercentage}%</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {bindings.filter(b => b.selector && b.selector.trim() !== '').length} of {bindings.length} fields mapped
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left column: Binding controls with two-column layout */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <Tabs defaultValue="tokens" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="tokens" className="flex-1">Template Tokens</TabsTrigger>
                <TabsTrigger value="preview-tokens" className="flex-1">Highlighted Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="tokens" className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search placeholders..." 
                    className="h-8"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-[550px] pr-4">
                  <div className="space-y-3">
                    {bindings.map(binding => {
                      const isSelected = selectedBinding?.id === binding.id;
                      
                      return (
                        <div 
                          key={binding.id}
                          id={`binding-${binding.id}`}
                          className={`border rounded-md p-3 relative ${
                            isSelected ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
                          }`}
                          onClick={() => setSelectedBinding(binding)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Badge variant={binding.selector ? "default" : "outline"} className="h-5 px-1">
                                  {binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.indexOf('FIELD:') >= 0 ? 'FIELD' : 
                                   binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.indexOf('LOOP:') >= 0 ? 'LOOP' : 
                                   binding.placeholder && typeof binding.placeholder === 'string' && binding.placeholder.indexOf('IF:') >= 0 ? 'IF' : 'TOKEN'}
                                </Badge>
                                <div className="font-medium text-sm truncate">
                                  {binding.placeholder && typeof binding.placeholder === 'string' 
                                    ? binding.placeholder.replace(/\[\[(FIELD|LOOP|IF):|\]\]/g, '') 
                                    : ''}
                                </div>
                              </div>
                              
                              <div className="mt-2 flex items-center space-x-2">
                                <div className="flex-1">
                                  <Input
                                    value={binding.selector || ''}
                                    onChange={e => handleSelectorChange(binding.id, e.target.value)}
                                    placeholder="Select a data field..."
                                    className="h-8 text-sm"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleSaveBinding(binding)}
                                  disabled={updateBindingMutation.isPending}
                                  className="h-8 px-2"
                                >
                                  {updateBindingMutation.isPending && selectedBinding?.id === binding.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : binding.selector ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Save className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          {binding.selector && (
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
              </TabsContent>
              
              <TabsContent value="preview-tokens" className="border-t">
                <div className="p-4 bg-slate-50">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-medium text-sm">Token Positions</h3>
                    <Badge variant="outline" className="h-5 text-xs">Visual representation</Badge>
                  </div>
                  
                  <div className="relative h-[550px] border rounded bg-white overflow-hidden">
                    {highlightedTokens.map((token) => {
                      const isActive = activeToken === token.id;
                      const matchingBinding = bindings.find(b => b.placeholder === token.text);
                      const isMapped = matchingBinding && matchingBinding.selector && matchingBinding.selector.trim() !== '';
                      
                      return (
                        <div
                          key={token.id}
                          className={`absolute cursor-pointer transition-all hover:border-2 ${
                            isActive ? 'border-2 border-primary' : 'border border-dashed'
                          } ${isMapped ? 'border-green-500' : 'border-yellow-500'}`}
                          style={{
                            left: `${token.position.x}px`,
                            top: `${token.position.y}px`,
                            width: `${token.position.width}px`,
                            height: `${token.position.height}px`,
                            backgroundColor: isMapped ? 'rgba(34, 197, 94, 0.1)' : token.color,
                          }}
                          onClick={() => handleTokenClick(token.id)}
                        >
                          <div className={`absolute -bottom-6 left-0 text-xs whitespace-nowrap px-1 py-0.5 rounded ${
                            isMapped ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {token.text.substring(0, 20)}{token.text.length > 20 ? '...' : ''}
                          </div>
                          
                          {isMapped && (
                            <div className="absolute -top-6 left-0 text-xs bg-green-100 text-green-800 px-1 py-0.5 rounded whitespace-nowrap">
                              {matchingBinding?.selector}
                            </div>
                          )}
                          
                          <div className="absolute -right-2 -top-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-5 w-5 rounded-full bg-white border shadow-sm hover:bg-primary hover:text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTokenClick(token.id);
                              }}
                            >
                              <Settings className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Right column: Data fields selection and preview */}
        <div className="space-y-4">
          <Tabs defaultValue="data-fields" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="data-fields" className="flex-1">Resume Data Fields</TabsTrigger>
              <TabsTrigger value="live-preview" className="flex-1">Live Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="data-fields" className="border rounded-md mt-2">
              <div className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search data fields..." 
                    className="h-8"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                  />
                </div>
                
                <ScrollArea className="h-[550px] pr-4">
                  <div className="space-y-3">
                    {selectedBinding && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-md">
                        <h3 className="font-medium text-sm mb-1">Currently Mapping</h3>
                        <div className="text-xs text-muted-foreground mb-2">
                          {selectedBinding.placeholder}
                        </div>
                        <div className="flex items-center text-sm">
                          <span className="mr-2">Current value:</span>
                          {selectedBinding.selector ? (
                            <Badge className="font-mono">{selectedBinding.selector}</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Not mapped</Badge>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {renderDataFields(filteredDataFields)}
                    
                    {filteredDataFields.length === 0 && (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />
                        <h3 className="font-medium">No matching fields</h3>
                        <p className="text-sm text-muted-foreground">
                          Try a different search term
                        </p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
            
            <TabsContent value="live-preview" className="border rounded-md overflow-hidden mt-2">
              <div className="bg-secondary px-4 py-2 flex items-center justify-between">
                <span className="font-medium">Live Preview</span>
                <Badge variant="outline" className="h-5 text-xs">
                  Updates as you bind
                </Badge>
              </div>
              <div className="h-[600px] w-full overflow-auto bg-white" ref={previewRef}>
                <iframe
                  key={previewKey}
                  src={`/api/templates/${templateId}?preview=true`}
                  className="h-full w-full border-0"
                  title="Template Preview"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Wizard mode navigation */}
      {wizardMode && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full border shadow-lg p-1 flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={prevWizardStep}
            disabled={wizardStep === 0}
            className="rounded-full"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="px-4 text-sm font-medium">
            Step {wizardStep + 1} of {bindings.length}
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={nextWizardStep}
            className="rounded-full"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setWizardMode(false)}
            className="rounded-full"
          >
            Cancel
          </Button>
        </div>
      )}
      
      {/* Wizard completion dialog */}
      <Dialog open={showWizardDialog} onOpenChange={setShowWizardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Binding Wizard Complete!</DialogTitle>
            <DialogDescription>
              You've successfully completed the binding wizard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Progress value={completionPercentage} className="h-2" />
            <p className="text-sm mt-2">
              {completionPercentage}% of template tokens are now mapped.
            </p>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowWizardDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
  
  // Helper function to render data fields recursively
  function renderDataFields(fields: DataField[], level = 0) {
    return fields.map(field => (
      <div key={field.id} className="space-y-1">
        <div 
          className={`flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-slate-50 ${
            level > 0 ? 'ml-4' : ''
          }`}
        >
          <div className="flex-1">
            <div className="flex items-center">
              {field.type === 'array' ? (
                <Badge variant="outline" className="mr-2 bg-blue-50 text-blue-800 border-blue-200">Array</Badge>
              ) : field.type === 'object' ? (
                <Badge variant="outline" className="mr-2 bg-purple-50 text-purple-800 border-purple-200">Object</Badge>
              ) : (
                <Badge variant="outline" className="mr-2 bg-green-50 text-green-800 border-green-200">{field.type}</Badge>
              )}
              <span className="font-medium text-sm">{field.name}</span>
            </div>
            
            {field.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{field.description}</p>
            )}
            
            <code className="text-xs text-muted-foreground mt-1 font-mono block">{field.path}</code>
          </div>
          
          {field.type !== 'object' && field.type !== 'array' && (
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7"
              disabled={!selectedBinding}
              onClick={() => handleApplyDataField(field.path)}
            >
              Apply
            </Button>
          )}
        </div>
        
        {field.children && field.children.length > 0 && (
          <div className="border-l-2 border-slate-200 pl-2 ml-3 mt-1">
            {renderDataFields(field.children, level + 1)}
          </div>
        )}
      </div>
    ));
  }
}