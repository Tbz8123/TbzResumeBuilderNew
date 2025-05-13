import { useEffect, useState } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

interface Binding {
  id: number;
  templateId: number;
  placeholder: string;
  selector: string;
}

export default function TemplateBindingsPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const { toast } = useToast();
  const [bindings, setBindings] = useState<Binding[]>([]);
  const [templateName, setTemplateName] = useState<string>('');
  const [previewKey, setPreviewKey] = useState<number>(0);

  // Fetch template data
  const { data: template, isLoading: isLoadingTemplate } = useQuery<{
    id: number;
    name: string;
    description: string;
    category: string;
    isActive: boolean;
  }>({
    queryKey: [`/api/templates/${templateId}`],
    enabled: !!templateId,
  });

  // Fetch template bindings
  const { data: bindingsData, isLoading: isLoadingBindings } = useQuery<Binding[]>({
    queryKey: [`/api/templates/${templateId}/bindings`],
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
      // Force iframe refresh
      setPreviewKey(prev => prev + 1);
      
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

  useEffect(() => {
    if (bindingsData && Array.isArray(bindingsData)) {
      setBindings(bindingsData);
    }
  }, [bindingsData]);

  useEffect(() => {
    if (template && typeof template === 'object' && 'name' in template) {
      setTemplateName(template.name as string);
    }
  }, [template]);

  const handleSelectorChange = (bindingId: number, newSelector: string) => {
    setBindings(prevBindings =>
      prevBindings.map(binding =>
        binding.id === bindingId ? { ...binding, selector: newSelector } : binding
      )
    );
  };

  const handleSaveBinding = (binding: Binding) => {
    updateBindingMutation.mutate(binding);
  };

  const isLoading = isLoadingTemplate || isLoadingBindings;

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/templates" className="mb-2 flex items-center text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Templates
          </Link>
          <h1 className="text-3xl font-bold">{templateName} - Bindings</h1>
          <p className="text-muted-foreground">Map form fields to template elements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left column: Binding controls */}
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="mb-4 text-xl font-semibold">Binding Configuration</h2>
            <div className="space-y-4">
              {bindings.map(binding => (
                <div key={binding.id} className="grid grid-cols-[1fr,2fr,auto] gap-2">
                  <div className="font-medium text-muted-foreground truncate flex items-center">
                    {binding.placeholder}
                  </div>
                  <Input
                    value={binding.selector}
                    onChange={e => handleSelectorChange(binding.id, e.target.value)}
                    placeholder="CSS Selector (e.g. #fullName)"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSaveBinding(binding)}
                    disabled={updateBindingMutation.isPending}
                  >
                    {updateBindingMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: Template preview */}
        <div>
          <Card className="overflow-hidden">
            <div className="bg-secondary px-4 py-2 font-medium">Live Preview</div>
            <div className="h-[600px] w-full overflow-auto bg-white p-4">
              <iframe
                key={previewKey}
                src={`/api/templates/${templateId}?preview=true`}
                className="h-full w-full border-0"
                title="Template Preview"
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}