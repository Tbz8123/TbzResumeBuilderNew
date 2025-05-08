import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTemplates } from '@/hooks/use-templates';
import { useResume } from '@/contexts/ResumeContext';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResumeTemplate } from '@shared/schema';

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TemplateSelectionModal: React.FC<TemplateSelectionModalProps> = ({ 
  open, 
  onOpenChange
}) => {
  const { data: templates, isLoading } = useTemplates();
  const { selectedTemplateId, setSelectedTemplateId } = useResume();
  const [currentFilter, setCurrentFilter] = useState<string>('ALL');
  const [tempSelectedId, setTempSelectedId] = useState<number | null>(null);
  
  // Initialize temp selection with the current template
  useEffect(() => {
    if (selectedTemplateId) {
      setTempSelectedId(selectedTemplateId);
    }
  }, [selectedTemplateId, open]);
  
  // Filter templates based on the selected category
  const filteredTemplates = React.useMemo(() => {
    if (!templates || !Array.isArray(templates)) return [];
    
    if (currentFilter === 'ALL') {
      return templates;
    }
    
    return templates.filter(template => {
      const category = template.category?.toLowerCase() || '';
      return category === currentFilter.toLowerCase();
    });
  }, [templates, currentFilter]);
  
  const handleTemplateSelect = (templateId: number) => {
    setTempSelectedId(templateId);
  };
  
  const handleConfirm = () => {
    if (tempSelectedId !== null) {
      setSelectedTemplateId(tempSelectedId);
      // Store in localStorage for persistence
      localStorage.setItem('selectedTemplateId', tempSelectedId.toString());
    }
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden">
        <div className="flex flex-col h-[90vh] max-h-[700px]">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <DialogTitle className="text-xl font-bold">Change Template</DialogTitle>
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Category filter tabs */}
            <Tabs 
              defaultValue="ALL" 
              value={currentFilter} 
              onValueChange={setCurrentFilter}
              className="mt-4"
            >
              <TabsList className="w-full justify-start space-x-2 bg-transparent p-0">
                <TabsTrigger 
                  value="ALL"
                  className={`rounded-full px-4 py-1 text-sm ${
                    currentFilter === 'ALL' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ALL
                </TabsTrigger>
                <TabsTrigger 
                  value="UNIQUE"
                  className={`rounded-full px-4 py-1 text-sm ${
                    currentFilter === 'UNIQUE' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  UNIQUE
                </TabsTrigger>
                <TabsTrigger 
                  value="MODERN"
                  className={`rounded-full px-4 py-1 text-sm ${
                    currentFilter === 'MODERN' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  MODERN
                </TabsTrigger>
                <TabsTrigger 
                  value="CLASSIC"
                  className={`rounded-full px-4 py-1 text-sm ${
                    currentFilter === 'CLASSIC' 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  CLASSIC
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Template Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <div 
                    key={template.id}
                    className={`relative cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                      tempSelectedId === template.id 
                        ? 'border-primary shadow-md' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {/* Template Preview Image */}
                    <div className="aspect-[210/297] w-full bg-white">
                      {template.thumbnailUrl ? (
                        <img 
                          src={template.thumbnailUrl} 
                          alt={template.name} 
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder-template.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                          No preview available
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Indicator */}
                    {tempSelectedId === template.id && (
                      <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-full">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Action Buttons */}
          <div className="border-t p-4 flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-full"
            >
              Back
            </Button>
            <Button 
              variant="default" 
              onClick={handleConfirm}
              className="bg-primary text-white rounded-full"
              disabled={tempSelectedId === null}
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;