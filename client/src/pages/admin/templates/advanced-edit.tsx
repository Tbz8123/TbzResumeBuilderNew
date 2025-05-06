import React, { useEffect } from 'react';
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
  
  // Create a properly typed template for editing
  let editableTemplate: ResumeTemplate;
  
  if (isNewTemplate) {
    // If creating a new template, use the default template
    editableTemplate = defaultResumeTemplate;
  } else if (templateData) {
    // If editing an existing template, start with the default and override with the data
    // We need to create a clean copy with proper types
    editableTemplate = {
      ...defaultResumeTemplate,
      id: templateData.id,
      name: templateData.name || '',
      description: templateData.description || '',
      category: templateData.category || 'professional',
      isActive: templateData.isActive ?? true,
      isPopular: templateData.isPopular ?? false,
      primaryColor: templateData.primaryColor || '#5E17EB',
      secondaryColor: templateData.secondaryColor || '#4A11C0',
      
      // Content fields
      htmlContent: templateData.htmlContent || '',
      cssContent: templateData.cssContent || '',
      jsContent: templateData.jsContent || '',
      svgContent: templateData.svgContent || '',
      pdfContent: templateData.pdfContent,
      
      // Dimension fields (must be numbers for the schema)
      width: templateData.width || 800,
      height: templateData.height || 1100,
      displayScale: templateData.displayScale || '0.22',
      aspectRatio: templateData.aspectRatio || '0.73',
      
      // Thumbnail
      thumbnailUrl: templateData.thumbnailUrl,
      
      // Dates
      createdAt: templateData.createdAt || new Date(),
      updatedAt: templateData.updatedAt || new Date(),
    };
  } else {
    // Fallback to default if no data
    editableTemplate = defaultResumeTemplate;
  }
  
  const finalTemplate = editableTemplate;
    
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