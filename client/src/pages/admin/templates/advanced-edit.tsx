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
  
  // Check for error state
  if (error) {
    console.error("Error loading template:", error);
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <h3 className="text-red-800 font-semibold">Error loading template</h3>
          <p className="text-red-600">{error.message || "Failed to load template data. Please try again."}</p>
          <Button 
            variant="outline" 
            onClick={() => navigate('/admin/templates/management')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }

  // Handle loading state with skeleton
  if (isLoading && !isNewTemplate) {
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
        
        <div className="p-6 bg-white shadow-md rounded-lg animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-32 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
              <div className="h-64 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Prepare the template for editing
  const finalTemplate = isNewTemplate 
    ? defaultResumeTemplate 
    : templateData 
      ? {
          // We create a complete and typed object that merges default values with the server data
          id: templateData.id,
          name: templateData.name || 'Untitled Template',
          description: templateData.description || '',
          category: templateData.category || 'professional',
          svgContent: templateData.svgContent || defaultResumeTemplate.svgContent,
          htmlContent: templateData.htmlContent || defaultResumeTemplate.htmlContent,
          cssContent: templateData.cssContent || defaultResumeTemplate.cssContent,
          jsContent: templateData.jsContent || defaultResumeTemplate.jsContent,
          pdfContent: templateData.pdfContent,
          isActive: templateData.isActive ?? true,
          isPopular: templateData.isPopular ?? false,
          thumbnailUrl: templateData.thumbnailUrl,
          primaryColor: templateData.primaryColor || '#5E17EB',
          secondaryColor: templateData.secondaryColor || '#4A11C0',
          displayScale: templateData.displayScale || '0.22',
          width: templateData.width || 800,
          height: templateData.height || 1100,
          aspectRatio: templateData.aspectRatio || '0.73',
          createdAt: templateData.createdAt || new Date(),
          updatedAt: templateData.updatedAt || new Date()
        } as ResumeTemplate
      : defaultResumeTemplate;
    
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