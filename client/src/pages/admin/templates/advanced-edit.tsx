import React from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  useTemplate, 
  useUpdateTemplate,
  useCreateTemplate
} from '@/hooks/use-templates';
import { ResumeTemplate } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import TemplateBuilder, { defaultResumeTemplate } from '@/components/resume/TemplateBuilder';

const AdvancedTemplateEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  
  // Check if we're creating a new template - either via /admin/templates/new (no id) 
  // or via /admin/templates/:id/advanced where id is 'new'
  const isNewTemplate = id === 'new' || location === '/admin/templates/new';
  
  // Fetch template data if editing an existing template
  const { data: templateData, isLoading, error } = useTemplate(
    isNewTemplate ? undefined : id
  );
  
  // Debug log template data
  useEffect(() => {
    if (templateData) {
      console.log("Template data loaded:", {
        id: templateData.id,
        name: templateData.name,
        htmlContent: templateData.htmlContent ? templateData.htmlContent.substring(0, 100) + '...' : null,
        svgContent: templateData.svgContent ? templateData.svgContent.substring(0, 100) + '...' : null,
        cssContent: templateData.cssContent ? templateData.cssContent.substring(0, 100) + '...' : null,
        jsContent: templateData.jsContent ? templateData.jsContent.substring(0, 100) + '...' : null,
        displayScale: templateData.displayScale,
        width: templateData.width,
        height: templateData.height
      });
    }
  }, [templateData]);
  
  // Set up mutations for create/update
  const updateTemplateMutation = useUpdateTemplate(isNewTemplate ? undefined : id);
  const createTemplateMutation = useCreateTemplate();
  
  // Handle template save
  const handleSaveTemplate = async (templateData: Partial<ResumeTemplate>) => {
    try {
      if (isNewTemplate) {
        await createTemplateMutation.mutateAsync(templateData as any);
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
        // Navigate to the templates list after creation
        navigate('/admin/templates/management');
      } else {
        await updateTemplateMutation.mutateAsync(templateData);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save template: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in the component
    }
  };
  
  // Handle error state
  if (error && !isNewTemplate) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/templates/management')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-red-500">Error Loading Template</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">
            {(error as Error).message}
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/templates/management')}
            className="mt-4"
          >
            Return to Templates
          </Button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading && !isNewTemplate) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  // Create final template for editing based on new/existing state
  const finalTemplate = isNewTemplate 
    ? defaultResumeTemplate 
    : templateData || defaultResumeTemplate;
    
  console.log("Loading template for editing:", {
    isNewTemplate,
    templateId: id,
    templateData,
    finalTemplate
  });

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/templates/management')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <TemplateBuilder 
        template={finalTemplate}
        onSave={handleSaveTemplate}
        isNew={isNewTemplate}
      />
    </div>
  );
};

export default AdvancedTemplateEditPage;