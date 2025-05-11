import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Plus, Edit, Trash2, Search, CheckCircle, XCircle, Save, } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EducationCategory, EducationExample } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Types for the form data
interface CategoryFormData {
  name: string;
  description: string;
  type: string;
}

interface ExampleFormData {
  categoryId: number;
  content: string;
  isRecommended: boolean;
}

const EducationAdminPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // States for category management
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    type: 'achievement'
  });
  
  // States for example management
  const [exampleForm, setExampleForm] = useState<ExampleFormData>({
    categoryId: 0,
    content: '',
    isRecommended: false
  });
  const [editingExampleId, setEditingExampleId] = useState<number | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showAddExampleDialog, setShowAddExampleDialog] = useState(false);
  const [showEditExampleDialog, setShowEditExampleDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteExampleDialog, setShowDeleteExampleDialog] = useState(false);
  const [exampleToDelete, setExampleToDelete] = useState<number | null>(null);
  
  // Check auth
  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      setLocation('/auth');
    }
  }, [user, authLoading, setLocation]);
  
  // Fetch categories
  const { 
    data: categoriesData, 
    isLoading: isCategoriesLoading 
  } = useQuery({
    queryKey: ['/api/education/categories'],
    queryFn: async () => {
      const response = await fetch('/api/education/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch education categories');
      }
      return response.json();
    }
  });
  
  // Fetch examples when a category is selected
  const { 
    data: examplesData, 
    isLoading: isExamplesLoading 
  } = useQuery({
    queryKey: ['/api/education/examples', selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId 
        ? `/api/education/examples?categoryId=${selectedCategoryId}`
        : '/api/education/examples';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch education examples');
      }
      return response.json();
    },
    enabled: true // Always fetch examples even if no category is selected
  });
  
  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest('POST', '/api/education/categories', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/categories'] });
      toast({
        title: "Success",
        description: "Category created successfully",
      });
      setShowAddCategoryDialog(false);
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: CategoryFormData }) => {
      const res = await apiRequest('PUT', `/api/education/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/categories'] });
      toast({
        title: "Success",
        description: "Category updated successfully",
      });
      setShowEditCategoryDialog(false);
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/education/categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/categories'] });
      toast({
        title: "Success",
        description: "Category deleted successfully",
      });
      setShowDeleteCategoryDialog(false);
      setSelectedCategoryId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete category: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Create new example mutation
  const createExampleMutation = useMutation({
    mutationFn: async (data: ExampleFormData) => {
      const res = await apiRequest('POST', '/api/education/examples', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/examples'] });
      toast({
        title: "Success",
        description: "Example created successfully",
      });
      setShowAddExampleDialog(false);
      resetExampleForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create example: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update example mutation
  const updateExampleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: ExampleFormData }) => {
      const res = await apiRequest('PUT', `/api/education/examples/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/examples'] });
      toast({
        title: "Success",
        description: "Example updated successfully",
      });
      setShowEditExampleDialog(false);
      resetExampleForm();
      setEditingExampleId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update example: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete example mutation
  const deleteExampleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/education/examples/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education/examples'] });
      toast({
        title: "Success",
        description: "Example deleted successfully",
      });
      setShowDeleteExampleDialog(false);
      setExampleToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete example: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      type: 'achievement'
    });
  };
  
  const resetExampleForm = () => {
    setExampleForm({
      categoryId: selectedCategoryId || 0,
      content: '',
      isRecommended: false
    });
  };
  
  const handleAddCategory = () => {
    createCategoryMutation.mutate(categoryForm);
  };
  
  const handleEditCategory = () => {
    if (selectedCategoryId) {
      updateCategoryMutation.mutate({ id: selectedCategoryId, data: categoryForm });
    }
  };
  
  const handleDeleteCategory = () => {
    if (selectedCategoryId) {
      deleteCategoryMutation.mutate(selectedCategoryId);
    }
  };
  
  const handleAddExample = () => {
    if (exampleForm.categoryId) {
      createExampleMutation.mutate(exampleForm);
    } else {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
    }
  };
  
  const handleEditExample = () => {
    if (editingExampleId) {
      updateExampleMutation.mutate({ id: editingExampleId, data: exampleForm });
    }
  };
  
  const handleDeleteExample = () => {
    if (exampleToDelete) {
      deleteExampleMutation.mutate(exampleToDelete);
    }
  };
  
  const openEditCategoryDialog = (category: EducationCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description,
      type: category.type
    });
    setShowEditCategoryDialog(true);
  };
  
  const openEditExampleDialog = (example: EducationExample) => {
    setExampleForm({
      categoryId: example.categoryId,
      content: example.content,
      isRecommended: example.isRecommended
    });
    setEditingExampleId(example.id);
    setShowEditExampleDialog(true);
  };
  
  const openDeleteExampleDialog = (id: number) => {
    setExampleToDelete(id);
    setShowDeleteExampleDialog(true);
  };
  
  // Filter examples based on search query
  const filteredExamples = examplesData ? 
    examplesData.filter((example: EducationExample) => 
      example.content.toLowerCase().includes(searchQuery.toLowerCase())
    ) : [];
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-primary rounded-full"></div>
      </div>
    );
  }
  
  if (!user || !user.isAdmin) {
    return null;
  }
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => setLocation('/admin')} className="mr-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin
        </Button>
        <h1 className="text-3xl font-bold">Education Content Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Sidebar - Categories List */}
        <div className="col-span-1">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">Education Categories</CardTitle>
              <Button size="sm" onClick={() => {
                resetCategoryForm();
                setShowAddCategoryDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </CardHeader>
            <CardContent>
              {isCategoriesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {categoriesData?.data?.map((category: EducationCategory) => (
                      <div 
                        key={category.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedCategoryId === category.id 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-card hover:bg-muted'
                        }`}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{category.name}</h3>
                            <p className="text-sm truncate">{category.type}</p>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditCategoryDialog(category);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-7 w-7 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCategoryId(category.id);
                                setShowDeleteCategoryDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {categoriesData?.data?.length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">
                        No categories found. Create one to get started.
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Content - Examples List and Management */}
        <div className="col-span-1 md:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-xl">Education Examples</CardTitle>
                {selectedCategoryId && categoriesData?.data && (
                  <p className="text-sm text-muted-foreground">
                    For category: {
                      categoriesData.data.find((c: EducationCategory) => c.id === selectedCategoryId)?.name || 'Unknown'
                    }
                  </p>
                )}
              </div>
              <div className="flex space-x-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search examples..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button 
                  size="sm" 
                  onClick={() => {
                    resetExampleForm();
                    setExampleForm(prev => ({ ...prev, categoryId: selectedCategoryId || 0 }));
                    setShowAddExampleDialog(true);
                  }}
                  disabled={!selectedCategoryId}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isExamplesLoading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-primary rounded-full"></div>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50%]">Content</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Recommended</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExamples.map((example: EducationExample) => (
                        <TableRow key={example.id}>
                          <TableCell className="font-medium">{example.content}</TableCell>
                          <TableCell>
                            {categoriesData?.data?.find((c: EducationCategory) => c.id === example.categoryId)?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            {example.isRecommended ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditExampleDialog(example)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => openDeleteExampleDialog(example.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      
                      {filteredExamples.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                            {selectedCategoryId 
                              ? 'No examples found for this category. Add one to get started.'
                              : 'Please select a category to view examples.'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogDescription>
              Create a new education category to organize education examples.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input 
                id="name" 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Academic Achievements"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={categoryForm.type}
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="prize">Prize</SelectItem>
                  <SelectItem value="coursework">Coursework</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="study_abroad">Study Abroad</SelectItem>
                  <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe this category"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddCategory}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Creating...
                </>
              ) : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the details of this education category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input 
                id="edit-name" 
                value={categoryForm.name}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-type">Type</Label>
              <Select 
                value={categoryForm.type}
                onValueChange={(value) => setCategoryForm(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="achievement">Achievement</SelectItem>
                  <SelectItem value="prize">Prize</SelectItem>
                  <SelectItem value="coursework">Coursework</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="study_abroad">Study Abroad</SelectItem>
                  <SelectItem value="apprenticeship">Apprenticeship</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea 
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditCategory}
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Updating...
                </>
              ) : 'Update Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation Dialog */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This will also delete all examples associated with this category. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteCategory}
              disabled={deleteCategoryMutation.isPending}
            >
              {deleteCategoryMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Deleting...
                </>
              ) : 'Delete Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Example Dialog */}
      <Dialog open={showAddExampleDialog} onOpenChange={setShowAddExampleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Example</DialogTitle>
            <DialogDescription>
              Create a new education example for the selected category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="example-category">Category</Label>
              <Select 
                value={exampleForm.categoryId.toString()}
                onValueChange={(value) => setExampleForm(prev => ({ ...prev, categoryId: parseInt(value) }))}
              >
                <SelectTrigger id="example-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.data?.map((category: EducationCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="example-content">Content</Label>
              <Textarea 
                id="example-content"
                value={exampleForm.content}
                onChange={(e) => setExampleForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter the example content"
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is-recommended" 
                checked={exampleForm.isRecommended}
                onCheckedChange={(checked) => 
                  setExampleForm(prev => ({ ...prev, isRecommended: checked === true ? true : false }))
                }
              />
              <Label htmlFor="is-recommended">Recommended example</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAddExampleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddExample}
              disabled={createExampleMutation.isPending || !exampleForm.content.trim() || !exampleForm.categoryId}
            >
              {createExampleMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Creating...
                </>
              ) : 'Create Example'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Example Dialog */}
      <Dialog open={showEditExampleDialog} onOpenChange={setShowEditExampleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Example</DialogTitle>
            <DialogDescription>
              Update the details of this education example.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-example-category">Category</Label>
              <Select 
                value={exampleForm.categoryId.toString()}
                onValueChange={(value) => setExampleForm(prev => ({ ...prev, categoryId: parseInt(value) }))}
              >
                <SelectTrigger id="edit-example-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.data?.map((category: EducationCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-example-content">Content</Label>
              <Textarea 
                id="edit-example-content"
                value={exampleForm.content}
                onChange={(e) => setExampleForm(prev => ({ ...prev, content: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="edit-is-recommended" 
                checked={exampleForm.isRecommended}
                onCheckedChange={(checked) => 
                  setExampleForm(prev => ({ ...prev, isRecommended: checked === true ? true : false }))
                }
              />
              <Label htmlFor="edit-is-recommended">Recommended example</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowEditExampleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditExample}
              disabled={updateExampleMutation.isPending || !exampleForm.content.trim() || !exampleForm.categoryId}
            >
              {updateExampleMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Updating...
                </>
              ) : 'Update Example'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Example Confirmation Dialog */}
      <Dialog open={showDeleteExampleDialog} onOpenChange={setShowDeleteExampleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Example</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this example? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteExampleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteExample}
              disabled={deleteExampleMutation.isPending}
            >
              {deleteExampleMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Deleting...
                </>
              ) : 'Delete Example'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EducationAdminPage;