import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResumeTemplate, ResumeTemplateVersion } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

// Hook to fetch all templates
export const useTemplates = () => {
  return useQuery({
    queryKey: ["/api/templates"],
    queryFn: getQueryFn({ on401: "returnNull" }), // Allow non-authenticated access for public display
  });
};

// Hook to fetch a single template by ID
export const useTemplate = (id: number | string | undefined) => {
  return useQuery<ResumeTemplate>({
    queryKey: ["/api/templates", id],
    queryFn: getQueryFn({ on401: "returnNull" }), // Allow non-authenticated access for public display
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook to fetch template versions
export const useTemplateVersions = (id: number | string | undefined) => {
  return useQuery<ResumeTemplateVersion[]>({
    queryKey: ["/api/templates", id, "versions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook to fetch a specific template version
export const useTemplateVersion = (id: number | string | undefined, versionNumber: number | undefined) => {
  return useQuery<ResumeTemplateVersion>({
    queryKey: ["/api/templates", id, "versions", versionNumber],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id && !!versionNumber, // Only run query if both params are provided
  });
};

// Hook for creating a new template
export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Omit<ResumeTemplate, "id" | "createdAt" | "updatedAt">) => {
      // Remove any undefined fields that might cause validation errors
      const cleanedTemplate = Object.fromEntries(
        Object.entries(template).filter(([_, v]) => v !== undefined)
      );
      
      const res = await apiRequest("POST", "/api/templates", cleanedTemplate);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create template");
      }
      
      const createdTemplate = await res.json();
      
      // Automatically generate a thumbnail for the new template
      try {
        await generateThumbnail(createdTemplate.id);
        console.log(`Auto-generated thumbnail for new template ID: ${createdTemplate.id}`);
      } catch (thumbnailError) {
        console.error("Failed to auto-generate thumbnail:", thumbnailError);
        // Continue anyway, since the template was created successfully
      }
      
      return createdTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });
};

// Helper function to generate a thumbnail
async function generateThumbnail(templateId: number): Promise<string> {
  const res = await apiRequest("POST", `/api/templates/${templateId}/generate-preview`, {
    sourceType: 'html', // Default to HTML rendering
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to generate thumbnail");
  }
  
  const data = await res.json();
  return data.thumbnailUrl;
}

// Hook for updating a template
export const useUpdateTemplate = (id: number | string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Partial<ResumeTemplate> & { changelog?: string, regenerateThumbnail?: boolean }) => {
      if (!id) {
        throw new Error("Template ID is required for updates");
      }
      
      // For better error handling in case id is not a valid number or string
      if (typeof id !== 'number' && typeof id !== 'string') {
        throw new Error("Invalid template ID format");
      }
      
      // Extract regenerateThumbnail flag and remove it from the data to send
      const { regenerateThumbnail = true, ...templateData } = template;
      
      // Remove any undefined fields that might cause validation errors
      const cleanedTemplate = Object.fromEntries(
        Object.entries(templateData).filter(([_, v]) => v !== undefined)
      );
      
      console.log(`Updating template with ID: ${id}, data:`, cleanedTemplate);
      
      const res = await apiRequest("PUT", `/api/templates/${id}`, cleanedTemplate);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update template");
      }
      
      const updatedTemplate = await res.json();
      
      // Check if we should regenerate the thumbnail (default is true)
      // Always regenerate if HTML or CSS content was updated
      const shouldRegenerateThumbnail = regenerateThumbnail || 
        template.htmlContent !== undefined || 
        template.cssContent !== undefined;
        
      if (shouldRegenerateThumbnail) {
        try {
          // Add a small delay to ensure the template update is fully saved
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Generate new thumbnail
          await generateThumbnail(Number(id));
          console.log(`Auto-generated thumbnail for updated template ID: ${id}`);
        } catch (thumbnailError) {
          console.error("Failed to auto-generate thumbnail after update:", thumbnailError);
          // Continue anyway, since the template was updated successfully
        }
      }
      
      return updatedTemplate;
    },
    onSuccess: () => {
      if (id) {
        queryClient.invalidateQueries({ queryKey: ["/api/templates", id] });
        queryClient.invalidateQueries({ queryKey: ["/api/templates", id, "versions"] });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });
};

// Hook for deleting a template
export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number | string) => {
      await apiRequest("DELETE", `/api/templates/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });
};

// Hook for restoring a template version
export const useRestoreTemplateVersion = (id: number | string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (versionNumber: number) => {
      const res = await apiRequest("POST", `/api/templates/${id}/versions/${versionNumber}/restore`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates", id, "versions"] });
    },
  });
};