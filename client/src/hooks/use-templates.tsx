import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResumeTemplate } from "@shared/schema";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

// Hook to fetch all templates
export const useTemplates = () => {
  return useQuery({
    queryKey: ["/api/templates"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
};

// Hook to fetch a single template by ID
export const useTemplate = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ["/api/templates", id],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook to fetch template versions
export const useTemplateVersions = (id: number | string | undefined) => {
  return useQuery({
    queryKey: ["/api/templates", id, "versions"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!id, // Only run query if id is provided
  });
};

// Hook to fetch a specific template version
export const useTemplateVersion = (id: number | string | undefined, versionNumber: number | undefined) => {
  return useQuery({
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
      const res = await apiRequest("POST", "/api/templates", template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
  });
};

// Hook for updating a template
export const useUpdateTemplate = (id: number | string | undefined) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (template: Partial<ResumeTemplate> & { changelog?: string }) => {
      const res = await apiRequest("PUT", `/api/templates/${id}`, template);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/templates", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/templates", id, "versions"] });
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