import React, { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useTemplate } from '@/hooks/use-templates';
import { 
  useTemplateBindings, 
  useUpdateBinding, 
  useDeleteBinding,
  useCreateBinding 
} from '@/hooks/use-template-bindings';
import { ChevronLeft, Edit2, Trash2, Save, Plus, X, HelpCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { TemplateBinding } from '@shared/schema';

const bindingFormSchema = z.object({
  placeholderToken: z.string().min(1, 'Placeholder is required'),
  dataField: z.string().min(1, 'Field path is required'),
  description: z.string().optional(),
});

type BindingFormValues = z.infer<typeof bindingFormSchema>;

const TemplateBindingsPage = () => {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState<Record<number, boolean>>({});
  const [addMode, setAddMode] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);

  const templateId = params.id;
  const { data: template, isLoading: isTemplateLoading } = useTemplate(Number(templateId));
  const { data: bindings, isLoading: isBindingsLoading } = useTemplateBindings(templateId);
  const updateBindingMutation = useUpdateBinding(templateId);
  const deleteBindingMutation = useDeleteBinding(templateId);
  const createBindingMutation = useCreateBinding(templateId);

  const form = useForm<BindingFormValues>({
    resolver: zodResolver(bindingFormSchema),
    defaultValues: {
      placeholderToken: '',
      dataField: '',
      description: '',
    },
  });

  const handleEditSave = async (bindingId: number, data: BindingFormValues) => {
    try {
      await updateBindingMutation.mutateAsync({
        id: bindingId,
        templateId: Number(templateId),
        placeholderToken: data.placeholderToken,
        dataField: data.dataField,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      setEditMode((prev) => ({ ...prev, [bindingId]: false }));
    } catch (error) {
      toast({
        title: 'Update failed',
        description: 'Failed to update template binding',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (bindingId: number) => {
    try {
      await deleteBindingMutation.mutateAsync(bindingId);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete template binding',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/templates')}
            className="mr-4"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-3xl font-bold">
            Template Bindings
          </h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setHelpDialogOpen(true)}
        >
          <HelpCircle className="h-4 w-4 mr-2" />
          Help
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>
            {isTemplateLoading ? (
              <Skeleton className="h-8 w-1/3" />
            ) : (
              template?.name || 'Template'
            )}
          </CardTitle>
          <CardDescription>
            Manage field-to-preview mappings for this template
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isBindingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : bindings && bindings.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placeholder</TableHead>
                  <TableHead>Field Path</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bindings.map((binding) => (
                  <TableRow key={binding.id}>
                    <TableCell className="font-mono">
                      {editMode[binding.id] ? (
                        <Input 
                          defaultValue={binding.placeholderToken}
                          onChange={(e) => form.setValue('placeholderToken', e.target.value)}
                        />
                      ) : (
                        binding.placeholderToken
                      )}
                    </TableCell>
                    <TableCell>
                      {editMode[binding.id] ? (
                        <Input 
                          defaultValue={binding.dataField}
                          onChange={(e) => form.setValue('dataField', e.target.value)}
                        />
                      ) : (
                        binding.dataField
                      )}
                    </TableCell>
                    <TableCell>
                      {editMode[binding.id] ? (
                        <Input 
                          defaultValue={binding.description || ''}
                          onChange={(e) => form.setValue('description', e.target.value)}
                        />
                      ) : (
                        binding.description || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {editMode[binding.id] ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                handleEditSave(binding.id, {
                                  placeholderToken: form.getValues('placeholderToken') || binding.placeholderToken,
                                  dataField: form.getValues('dataField') || binding.dataField,
                                  description: form.getValues('description') || binding.description || null,
                                });
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditMode((prev) => ({ ...prev, [binding.id]: false }))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                // Pre-fill the form with current values
                                form.setValue('placeholderToken', binding.placeholderToken);
                                form.setValue('dataField', binding.dataField);
                                form.setValue('description', binding.description || '');
                                setEditMode((prev) => ({ ...prev, [binding.id]: true }));
                              }}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(binding.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No bindings found for this template.</p>
              <p className="text-sm mt-2">Click on the "Add New Binding" button to create a binding.</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => navigate(`/admin/templates/${templateId}/advanced`)}
          >
            Edit Template
          </Button>
          <Button onClick={() => setAddMode(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Binding
          </Button>
        </CardFooter>
      </Card>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Template Bindings Help</DialogTitle>
            <DialogDescription>
              Understanding how to connect template fields with data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">What are template bindings?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Template bindings connect placeholders in your template HTML with actual data fields in the resume.
              </p>
            </div>
            <div>
              <h3 className="font-medium">Placeholder format</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Placeholders in your template should be in the format: <code>{'{{ placeholder_name }}'}</code>
              </p>
            </div>
            <div>
              <h3 className="font-medium">Field paths</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Field paths reference the resume data structure, such as:
              </p>
              <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                <li><code>personalInfo.name</code> - User's full name</li>
                <li><code>personalInfo.email</code> - User's email address</li>
                <li><code>personalInfo.phone</code> - User's phone number</li>
                <li><code>workHistory[0].jobTitle</code> - First job title</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setHelpDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add New Binding Dialog */}
      <Dialog open={addMode} onOpenChange={setAddMode}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Binding</DialogTitle>
            <DialogDescription>
              Connect a template placeholder with resume data
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(async (data) => {
              try {
                await createBindingMutation.mutateAsync({
                  placeholderToken: data.placeholderToken,
                  dataField: data.dataField,
                  description: data.description
                });
                setAddMode(false);
                form.reset();
              } catch (error) {
                toast({
                  title: 'Creation failed',
                  description: 'Failed to create template binding',
                  variant: 'destructive',
                });
              }
            })}>
              <FormField
                control={form.control}
                name="placeholderToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placeholder</FormLabel>
                    <FormControl>
                      <Input placeholder="{{ name }}" {...field} />
                    </FormControl>
                    <FormDescription>
                      The placeholder in your template HTML (without {{ }})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dataField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Field Path</FormLabel>
                    <FormControl>
                      <Input placeholder="personalInfo.name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The path to the data field in the resume structure
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describes what this binding is used for"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMode(false)}>
              Cancel
            </Button>
            <Button 
              onClick={form.handleSubmit(async (data) => {
                try {
                  await createBindingMutation.mutateAsync({
                    placeholderToken: data.placeholderToken,
                    dataField: data.dataField,
                    description: data.description || null
                  });
                  setAddMode(false);
                  form.reset();
                } catch (error) {
                  toast({
                    title: 'Creation failed',
                    description: 'Failed to create template binding',
                    variant: 'destructive',
                  });
                }
              })}
            >
              Add Binding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateBindingsPage;