import React, { useState, useEffect } from "react";
import { 
  useTemplateBindings, 
  useCreateBinding, 
  useUpdateBinding, 
  useDeleteBinding, 
  useDeleteAllBindings 
} from "@/hooks/use-template-bindings";
import { TemplatePlaceholders } from "./TemplatePlaceholders";
import { ResumeDataFields } from "./ResumeDataFields";
import { TemplateBinding } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash, Save, Plus, ArrowRight, RefreshCw, Link2, Unlink } from "lucide-react";

interface TemplateBindingInterfaceProps {
  templateId: string;
}

export function TemplateBindingInterface({ templateId }: TemplateBindingInterfaceProps) {
  const [activeTab, setActiveTab] = useState("placeholders");
  const [selectedPlaceholder, setSelectedPlaceholder] = useState<string | null>(null);
  const [selectedDataField, setSelectedDataField] = useState<string | null>(null);
  const [bindingDescription, setBindingDescription] = useState("");
  const [editingBinding, setEditingBinding] = useState<TemplateBinding | null>(null);
  
  // Query to fetch existing bindings for this template
  const { 
    data: bindings, 
    isLoading: isLoadingBindings,
    isError: bindingsError 
  } = useTemplateBindings(templateId);
  
  // Mutations for creating, updating, and deleting bindings
  const createBindingMutation = useCreateBinding(templateId);
  const updateBindingMutation = useUpdateBinding(templateId);
  const deleteBindingMutation = useDeleteBinding(templateId);
  const deleteAllBindingsMutation = useDeleteAllBindings(templateId);
  
  // Reset editing state when changing templates
  useEffect(() => {
    setSelectedPlaceholder(null);
    setSelectedDataField(null);
    setBindingDescription("");
    setEditingBinding(null);
  }, [templateId]);
  
  // When a binding is selected for editing, update the form state
  useEffect(() => {
    if (editingBinding) {
      setSelectedPlaceholder(editingBinding.placeholderToken);
      setSelectedDataField(editingBinding.dataField);
      setBindingDescription(editingBinding.description || "");
    }
  }, [editingBinding]);
  
  // Find an existing binding for the selected placeholder
  const findExistingBinding = (placeholder: string) => {
    if (!bindings) return null;
    return bindings.find(binding => binding.placeholderToken === placeholder);
  };
  
  // Handle placeholder selection
  const handleSelectPlaceholder = (placeholder: string) => {
    setSelectedPlaceholder(placeholder);
    
    // Check if this placeholder already has a binding
    const existingBinding = findExistingBinding(placeholder);
    if (existingBinding) {
      setEditingBinding(existingBinding);
      setSelectedDataField(existingBinding.dataField);
      setBindingDescription(existingBinding.description || "");
    } else {
      setEditingBinding(null);
      // Don't clear the data field or description to make it easier to create multiple bindings
    }
    
    // Switch to the data fields tab
    setActiveTab("dataFields");
  };
  
  // Handle data field selection
  const handleSelectDataField = (dataField: string) => {
    setSelectedDataField(dataField);
  };
  
  // Handle saving the binding
  const handleSaveBinding = () => {
    if (!selectedPlaceholder || !selectedDataField) return;
    
    const bindingData = {
      placeholderToken: selectedPlaceholder,
      dataField: selectedDataField,
      description: bindingDescription,
    };
    
    if (editingBinding) {
      // Update existing binding
      updateBindingMutation.mutate({
        ...editingBinding,
        ...bindingData,
      });
    } else {
      // Create new binding
      createBindingMutation.mutate(bindingData);
    }
    
    // Clear the form
    setSelectedPlaceholder(null);
    setSelectedDataField(null);
    setBindingDescription("");
    setEditingBinding(null);
    
    // Switch to the mappings tab to see the result
    setActiveTab("mappings");
  };
  
  // Handle deleting a binding
  const handleDeleteBinding = (bindingId: number) => {
    deleteBindingMutation.mutate(bindingId);
    
    // If we were editing this binding, clear the form
    if (editingBinding && editingBinding.id === bindingId) {
      setSelectedPlaceholder(null);
      setSelectedDataField(null);
      setBindingDescription("");
      setEditingBinding(null);
    }
  };
  
  // Handle deleting all bindings for this template
  const handleDeleteAllBindings = () => {
    deleteAllBindingsMutation.mutate();
    
    // Clear the form
    setSelectedPlaceholder(null);
    setSelectedDataField(null);
    setBindingDescription("");
    setEditingBinding(null);
  };
  
  // Handle editing a binding
  const handleEditBinding = (binding: TemplateBinding) => {
    setEditingBinding(binding);
    setActiveTab("placeholders");
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Template Binding Interface</CardTitle>
        <CardDescription>
          Visually connect template placeholders to resume data fields without writing any code
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="placeholders">Template Placeholders</TabsTrigger>
            <TabsTrigger value="dataFields">Data Fields</TabsTrigger>
            <TabsTrigger value="mappings">Mappings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="placeholders">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Select a placeholder from your template. These are markers like <code>{"{{name}}"}</code>, <code>{"[[SECTION]]"}</code>, or <code>{"data-field='email'"}</code>.
              </div>
              
              <TemplatePlaceholders
                templateId={templateId}
                onSelectPlaceholder={handleSelectPlaceholder}
                selectedPlaceholder={selectedPlaceholder || undefined}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="dataFields">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground mb-4">
                {selectedPlaceholder ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                    <span>Selected placeholder:</span>
                    <Badge variant="outline" className="font-mono">
                      {selectedPlaceholder}
                    </Badge>
                    {findExistingBinding(selectedPlaceholder) && (
                      <Badge className="ml-auto" variant="secondary">Already mapped</Badge>
                    )}
                  </div>
                ) : (
                  <div>Select a placeholder first, then choose a data field to connect it to.</div>
                )}
              </div>
              
              {selectedPlaceholder && (
                <>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Select a data field to bind to the placeholder.
                    </div>
                    
                    <ResumeDataFields onSelectDataField={handleSelectDataField} />
                    
                    {selectedDataField && (
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-md">
                          <span>Selected data field:</span>
                          <Badge variant="outline" className="font-mono">
                            {selectedDataField}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <label htmlFor="description" className="text-sm font-medium">
                            Description (optional)
                          </label>
                          <Textarea
                            id="description"
                            placeholder="Add a descriptive note about this binding"
                            value={bindingDescription}
                            onChange={(e) => setBindingDescription(e.target.value)}
                            className="resize-none"
                          />
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setSelectedPlaceholder(null);
                              setSelectedDataField(null);
                              setBindingDescription("");
                              setEditingBinding(null);
                              setActiveTab("placeholders");
                            }}
                          >
                            Cancel
                          </Button>
                          
                          <Button
                            type="button"
                            onClick={handleSaveBinding}
                            disabled={
                              !selectedPlaceholder ||
                              !selectedDataField ||
                              createBindingMutation.isPending ||
                              updateBindingMutation.isPending
                            }
                          >
                            {(createBindingMutation.isPending || updateBindingMutation.isPending) && (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            {editingBinding ? "Update Binding" : "Create Binding"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="mappings">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Current Bindings</h3>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("placeholders")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add New Binding
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={!bindings || bindings.length === 0}>
                        <Trash className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove all bindings for this template. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAllBindings}>
                          {deleteAllBindingsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="mr-2 h-4 w-4" />
                          )}
                          Delete All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              {isLoadingBindings ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : bindingsError ? (
                <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-sm text-destructive">
                  Error loading bindings. Please try again.
                </div>
              ) : !bindings || bindings.length === 0 ? (
                <div className="p-6 flex flex-col items-center justify-center text-center border border-dashed rounded-lg">
                  <div className="mb-2 p-3 bg-primary/10 rounded-full">
                    <Link2 className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-1">No bindings yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start by selecting a placeholder and connecting it to a data field.
                  </p>
                  <Button onClick={() => setActiveTab("placeholders")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Binding
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Placeholder</TableHead>
                        <TableHead>
                          <div className="flex items-center">
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Data Field
                          </div>
                        </TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[120px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bindings.map((binding) => (
                        <TableRow key={binding.id}>
                          <TableCell className="font-mono text-xs">
                            {binding.placeholderToken}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {binding.dataField}
                          </TableCell>
                          <TableCell className="text-sm">
                            {binding.description || <span className="text-muted-foreground italic">No description</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditBinding(binding)}
                              >
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete this binding?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will remove the binding between <code>{binding.placeholderToken}</code> and <code>{binding.dataField}</code>.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteBinding(binding.id)}>
                                      {deleteBindingMutation.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash className="mr-2 h-4 w-4" />
                                      )}
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {bindings ? `${bindings.length} bindings defined` : 'Loading bindings...'}
        </div>
      </CardFooter>
    </Card>
  );
}