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
import { ArrowLeft, Plus, Edit, Trash2, Search, CheckCircle, XCircle, Save, Star, StarHalf } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SkillCategory, Skill } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

// Types for the form data
interface CategoryFormData {
  name: string;
  description: string;
}

interface SkillFormData {
  categoryId: number;
  name: string;
  description: string;
  isRecommended: boolean;
}

const AdminSkillsPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // States for category management
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [categoryForm, setCategoryForm] = useState<CategoryFormData>({
    name: '',
    description: ''
  });
  
  // States for skill management
  const [skillForm, setSkillForm] = useState<SkillFormData>({
    categoryId: 0,
    name: '',
    description: '',
    isRecommended: false
  });
  const [editingSkillId, setEditingSkillId] = useState<number | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  
  // Dialog states
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [showEditCategoryDialog, setShowEditCategoryDialog] = useState(false);
  const [showAddSkillDialog, setShowAddSkillDialog] = useState(false);
  const [showEditSkillDialog, setShowEditSkillDialog] = useState(false);
  const [showDeleteCategoryDialog, setShowDeleteCategoryDialog] = useState(false);
  const [showDeleteSkillDialog, setShowDeleteSkillDialog] = useState(false);
  const [skillToDelete, setSkillToDelete] = useState<number | null>(null);
  
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
    queryKey: ['/api/skills/categories'],
    queryFn: async () => {
      const response = await fetch('/api/skills/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch skill categories');
      }
      return response.json();
    }
  });
  
  // Fetch skills
  const { 
    data: skillsData, 
    isLoading: isSkillsLoading 
  } = useQuery({
    queryKey: ['/api/skills', selectedCategoryId],
    queryFn: async () => {
      const url = selectedCategoryId 
        ? `/api/skills?categoryId=${selectedCategoryId}`
        : '/api/skills';
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      return response.json();
    },
    enabled: true // Always fetch skills even if no category is selected
  });
  
  // Create new category mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const res = await apiRequest('POST', '/api/skills/categories', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
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
      const res = await apiRequest('PUT', `/api/skills/categories/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
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
      const res = await apiRequest('DELETE', `/api/skills/categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
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
  
  // Create new skill mutation
  const createSkillMutation = useMutation({
    mutationFn: async (data: SkillFormData) => {
      const res = await apiRequest('POST', '/api/skills', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Success",
        description: "Skill created successfully",
      });
      setShowAddSkillDialog(false);
      resetSkillForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create skill: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Update skill mutation
  const updateSkillMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: SkillFormData }) => {
      const res = await apiRequest('PUT', `/api/skills/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
      setShowEditSkillDialog(false);
      resetSkillForm();
      setEditingSkillId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update skill: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete skill mutation
  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/skills/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });
      setShowDeleteSkillDialog(false);
      setSkillToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete skill: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Helper functions
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: ''
    });
  };
  
  const resetSkillForm = () => {
    setSkillForm({
      categoryId: selectedCategoryId || 0,
      name: '',
      description: '',
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
  
  const handleAddSkill = () => {
    if (skillForm.categoryId) {
      createSkillMutation.mutate(skillForm);
    } else {
      toast({
        title: "Error",
        description: "Please select a category",
        variant: "destructive",
      });
    }
  };
  
  const handleEditSkill = () => {
    if (editingSkillId) {
      updateSkillMutation.mutate({ id: editingSkillId, data: skillForm });
    }
  };
  
  const handleDeleteSkill = () => {
    if (skillToDelete) {
      deleteSkillMutation.mutate(skillToDelete);
    }
  };
  
  const openEditCategoryDialog = (category: SkillCategory) => {
    setCategoryForm({
      name: category.name,
      description: category.description
    });
    setShowEditCategoryDialog(true);
  };
  
  const openEditSkillDialog = (skill: Skill) => {
    setSkillForm({
      categoryId: skill.categoryId,
      name: skill.name,
      description: skill.description || '',
      isRecommended: skill.isRecommended
    });
    setEditingSkillId(skill.id);
    setShowEditSkillDialog(true);
  };
  
  const openDeleteSkillDialog = (id: number) => {
    setSkillToDelete(id);
    setShowDeleteSkillDialog(true);
  };
  
  // Filter skills based on search query
  const filteredSkills = skillsData?.data ? 
    skillsData.data.filter((skill: Skill) => 
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
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
        <h1 className="text-3xl font-bold">Skills Management</h1>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Sidebar - Categories List */}
        <div>
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xl font-bold">Skill Categories</h2>
            <Button 
              size="sm" 
              variant="default"
              className="bg-cyan-600 hover:bg-cyan-700"
              onClick={() => {
                resetCategoryForm();
                setShowAddCategoryDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
          
          <div className="bg-white shadow rounded-md border">
            {isCategoriesLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-cyan-500 rounded-full"></div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="divide-y">
                  {categoriesData?.data?.map((category: SkillCategory) => (
                    <div 
                      key={category.id}
                      className={`px-4 py-3 ${
                        selectedCategoryId === category.id 
                          ? 'bg-gray-100'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedCategoryId(category.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{category.name}</h3>
                          <p className="text-sm text-gray-500">
                            {category.skills?.length || 0} skills
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditCategoryDialog(category);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500"
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
                    <div className="text-center py-4 text-gray-500">
                      No categories found. Create one to get started.
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
        
        {/* Right Content - Skills List and Management */}
        <div>
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-xl font-bold">Skills</h2>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search skills..."
                  className="pl-8 h-9 w-48 md:w-56"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                size="sm"
                variant="default"
                className="bg-cyan-600 hover:bg-cyan-700"
                onClick={() => {
                  resetSkillForm();
                  setSkillForm(prev => ({ ...prev, categoryId: selectedCategoryId || 0 }));
                  setShowAddSkillDialog(true);
                }}
                disabled={!selectedCategoryId}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-md border">
            {isSkillsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-cyan-500 rounded-full"></div>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-280px)]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Skill Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Recommended</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSkills.map((skill: Skill) => {
                      return (
                        <TableRow key={skill.id}>
                          <TableCell className="font-medium">
                            {skill.name}
                          </TableCell>
                          <TableCell>
                            {skill.category?.name || ''}
                          </TableCell>
                          <TableCell>
                            {skill.isRecommended ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300" />
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => openEditSkillDialog(skill)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500"
                                onClick={() => openDeleteSkillDialog(skill.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    
                    {filteredSkills.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                          {selectedCategoryId ? 'No skills found for this category. Add one to get started.' : 'Select a category to view and manage skills.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
      
      {/* Add Category Dialog */}
      <Dialog open={showAddCategoryDialog} onOpenChange={setShowAddCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill Category</DialogTitle>
            <DialogDescription>
              Create a new category to organize skills.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g., Programming Languages"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this category"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetCategoryForm();
                setShowAddCategoryDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!categoryForm.name || !categoryForm.description}
              onClick={handleAddCategory}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={showEditCategoryDialog} onOpenChange={setShowEditCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill Category</DialogTitle>
            <DialogDescription>
              Update the details for this skill category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetCategoryForm();
                setShowEditCategoryDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!categoryForm.name || !categoryForm.description}
              onClick={handleEditCategory}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Confirmation Dialog */}
      <Dialog open={showDeleteCategoryDialog} onOpenChange={setShowDeleteCategoryDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This will also delete all skills associated with this category.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteCategoryDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteCategory}
            >
              Delete Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Skill Dialog */}
      <Dialog open={showAddSkillDialog} onOpenChange={setShowAddSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a new skill to the selected category.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={skillForm.categoryId.toString()}
                onValueChange={(value) => setSkillForm({ ...skillForm, categoryId: parseInt(value) })}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.data?.map((category: SkillCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skill-name">Skill Name</Label>
              <Input
                id="skill-name"
                placeholder="e.g., JavaScript"
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="skill-description">Description (Optional)</Label>
              <Textarea
                id="skill-description"
                placeholder="Brief description of this skill"
                value={skillForm.description}
                onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-recommended"
                checked={skillForm.isRecommended}
                onCheckedChange={(checked) => 
                  setSkillForm({ ...skillForm, isRecommended: checked as boolean })
                }
              />
              <Label htmlFor="is-recommended">Mark as recommended skill</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetSkillForm();
                setShowAddSkillDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!skillForm.name || !skillForm.categoryId}
              onClick={handleAddSkill}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Skill Dialog */}
      <Dialog open={showEditSkillDialog} onOpenChange={setShowEditSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update the details for this skill.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-categoryId">Category</Label>
              <Select
                value={skillForm.categoryId.toString()}
                onValueChange={(value) => setSkillForm({ ...skillForm, categoryId: parseInt(value) })}
              >
                <SelectTrigger id="edit-categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categoriesData?.data?.map((category: SkillCategory) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-skill-name">Skill Name</Label>
              <Input
                id="edit-skill-name"
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-skill-description">Description (Optional)</Label>
              <Textarea
                id="edit-skill-description"
                value={skillForm.description}
                onChange={(e) => setSkillForm({ ...skillForm, description: e.target.value })}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-is-recommended"
                checked={skillForm.isRecommended}
                onCheckedChange={(checked) => 
                  setSkillForm({ ...skillForm, isRecommended: checked as boolean })
                }
              />
              <Label htmlFor="edit-is-recommended">Mark as recommended skill</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                resetSkillForm();
                setShowEditSkillDialog(false);
                setEditingSkillId(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              disabled={!skillForm.name || !skillForm.categoryId}
              onClick={handleEditSkill}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Skill Confirmation Dialog */}
      <Dialog open={showDeleteSkillDialog} onOpenChange={setShowDeleteSkillDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this skill?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteSkillDialog(false);
                setSkillToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteSkill}
            >
              Delete Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSkillsPage;