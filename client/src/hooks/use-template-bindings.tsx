import { 
  useQuery, 
  useMutation, 
  UseQueryResult,
  UseMutationResult 
} from "@tanstack/react-query";
import { TemplateBinding } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type PlaceholdersResponse = {
  placeholders: string[];
  counts: {
    svg: number;
    html: number;
    css: number;
    js: number;
    total: number;
  };
};

type BindingInput = {
  placeholderToken: string;
  dataField: string;
  description?: string | null;
};

/**
 * Hook to detect placeholders in a template
 */
export function usePlaceholderDetection(templateId?: string): UseQueryResult<PlaceholdersResponse> {
  return useQuery({
    queryKey: [`/api/templates/${templateId}/placeholders`],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateId}/placeholders`);
      if (!response.ok) {
        throw new Error("Failed to detect placeholders");
      }
      return response.json();
    },
    enabled: !!templateId,
  });
}

/**
 * Hook to get bindings for a template
 */
export function useTemplateBindings(templateId?: string): UseQueryResult<TemplateBinding[]> {
  return useQuery({
    queryKey: [`/api/templates/${templateId}/bindings`],
    queryFn: async () => {
      const response = await fetch(`/api/templates/${templateId}/bindings`);
      if (!response.ok) {
        throw new Error("Failed to fetch template bindings");
      }
      return response.json();
    },
    enabled: !!templateId,
  });
}

/**
 * Hook to create a new binding
 */
export function useCreateBinding(templateId?: string): UseMutationResult<TemplateBinding, Error, BindingInput> {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: BindingInput) => {
      const res = await apiRequest("POST", `/api/templates/${templateId}/bindings`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "Binding created",
        description: "The binding has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to update a binding
 */
export function useUpdateBinding(templateId?: string): UseMutationResult<TemplateBinding, Error, TemplateBinding> {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (data: TemplateBinding) => {
      const res = await apiRequest("PUT", `/api/templates/${templateId}/bindings/${data.id}`, {
        placeholderToken: data.placeholderToken,
        dataField: data.dataField,
        description: data.description,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "Binding updated",
        description: "The binding has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete a binding
 */
export function useDeleteBinding(templateId?: string): UseMutationResult<void, Error, number> {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (bindingId: number) => {
      await apiRequest("DELETE", `/api/templates/${templateId}/bindings/${bindingId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "Binding deleted",
        description: "The binding has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete binding",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Hook to delete all bindings for a template
 */
export function useDeleteAllBindings(templateId?: string): UseMutationResult<void, Error, void> {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/templates/${templateId}/bindings`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/templates/${templateId}/bindings`] });
      toast({
        title: "All bindings deleted",
        description: "All bindings have been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete bindings",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}