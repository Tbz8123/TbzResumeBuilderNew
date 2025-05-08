import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { JobTitle, JobDescription } from '@shared/schema';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Alert, AlertDescription } from '@/components/ui/alert';

const JobsManagementPage: React.FC = () => {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedJobTitleId, setSelectedJobTitleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('titles');
  
  // Dialog states
  const [isAddTitleDialogOpen, setIsAddTitleDialogOpen] = useState(false);
  const [isEditTitleDialogOpen, setIsEditTitleDialogOpen] = useState(false);
  const [isDeleteTitleDialogOpen, setIsDeleteTitleDialogOpen] = useState(false);
  const [isAddDescriptionDialogOpen, setIsAddDescriptionDialogOpen] = useState(false);
  const [isEditDescriptionDialogOpen, setIsEditDescriptionDialogOpen] = useState(false);
  const [isDeleteDescriptionDialogOpen, setIsDeleteDescriptionDialogOpen] = useState(false);
  
  // Form states
  const [titleFormData, setTitleFormData] = useState<{
    title: string;
    category: string;
    id?: number;
  }>({ title: '', category: '' });
  
  const [descriptionFormData, setDescriptionFormData] = useState<{
    content: string;
    isRecommended: boolean;
    jobTitleId: number;
    id?: number;
  }>({ content: '', isRecommended: false, jobTitleId: 0 });
  
  // Queries
  const {
    data: jobTitles = [],
    isLoading: isLoadingTitles,
    error: titlesError
  } = useQuery<JobTitle[]>({
    queryKey: ['/api/jobs/titles'],
  });
  
  const {
    data: selectedJobTitle,
    isLoading: isLoadingSelectedTitle,
  } = useQuery<JobTitle & { descriptions: JobDescription[] }>({
    queryKey: ['/api/jobs/titles', selectedJobTitleId],
    enabled: !!selectedJobTitleId,
  });
  
  // Mutations
  const createJobTitleMutation = useMutation({
    mutationFn: async (data: { title: string; category: string }) => {
      const res = await apiRequest('POST', '/api/jobs/titles', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create job title');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      setIsAddTitleDialogOpen(false);
      setTitleFormData({ title: '', category: '' });
      toast({
        title: 'Success',
        description: 'Job title created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateJobTitleMutation = useMutation({
    mutationFn: async (data: { id: number; title: string; category: string }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest('PUT', `/api/jobs/titles/${id}`, updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update job title');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      if (selectedJobTitleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles', selectedJobTitleId] });
      }
      setIsEditTitleDialogOpen(false);
      setTitleFormData({ title: '', category: '' });
      toast({
        title: 'Success',
        description: 'Job title updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const deleteJobTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/titles/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete job title');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      setIsDeleteTitleDialogOpen(false);
      setSelectedJobTitleId(null);
      toast({
        title: 'Success',
        description: 'Job title deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const createJobDescriptionMutation = useMutation({
    mutationFn: async (data: { content: string; isRecommended: boolean; jobTitleId: number }) => {
      const res = await apiRequest('POST', '/api/jobs/descriptions', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create job description');
      }
      return await res.json();
    },
    onSuccess: () => {
      if (selectedJobTitleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles', selectedJobTitleId] });
      }
      setIsAddDescriptionDialogOpen(false);
      setDescriptionFormData({ content: '', isRecommended: false, jobTitleId: selectedJobTitleId || 0 });
      toast({
        title: 'Success',
        description: 'Job description created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const updateJobDescriptionMutation = useMutation({
    mutationFn: async (data: { id: number; content: string; isRecommended: boolean; jobTitleId: number }) => {
      const { id, ...updateData } = data;
      const res = await apiRequest('PUT', `/api/jobs/descriptions/${id}`, updateData);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update job description');
      }
      return await res.json();
    },
    onSuccess: () => {
      if (selectedJobTitleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles', selectedJobTitleId] });
      }
      setIsEditDescriptionDialogOpen(false);
      setDescriptionFormData({ content: '', isRecommended: false, jobTitleId: selectedJobTitleId || 0 });
      toast({
        title: 'Success',
        description: 'Job description updated successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const deleteJobDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/descriptions/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete job description');
      }
      return await res.json();
    },
    onSuccess: () => {
      if (selectedJobTitleId) {
        queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles', selectedJobTitleId] });
      }
      setIsDeleteDescriptionDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Job description deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Event Handlers
  const handleAddJobTitle = (e: React.FormEvent) => {
    e.preventDefault();
    createJobTitleMutation.mutate(titleFormData);
  };
  
  const handleEditJobTitle = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleFormData.id) {
      updateJobTitleMutation.mutate({
        id: titleFormData.id,
        title: titleFormData.title,
        category: titleFormData.category,
      });
    }
  };
  
  const handleDeleteJobTitle = () => {
    if (titleFormData.id) {
      deleteJobTitleMutation.mutate(titleFormData.id);
    }
  };
  
  const handleAddJobDescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedJobTitleId) {
      createJobDescriptionMutation.mutate({
        ...descriptionFormData,
        jobTitleId: selectedJobTitleId,
      });
    }
  };
  
  const handleEditJobDescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (descriptionFormData.id) {
      updateJobDescriptionMutation.mutate({
        id: descriptionFormData.id,
        content: descriptionFormData.content,
        isRecommended: descriptionFormData.isRecommended,
        jobTitleId: descriptionFormData.jobTitleId,
      });
    }
  };
  
  const handleDeleteJobDescription = () => {
    if (descriptionFormData.id) {
      deleteJobDescriptionMutation.mutate(descriptionFormData.id);
    }
  };
  
  const openEditTitleDialog = (title: JobTitle) => {
    setTitleFormData({
      id: title.id,
      title: title.title,
      category: title.category,
    });
    setIsEditTitleDialogOpen(true);
  };
  
  const openDeleteTitleDialog = (title: JobTitle) => {
    setTitleFormData({
      id: title.id,
      title: title.title,
      category: title.category,
    });
    setIsDeleteTitleDialogOpen(true);
  };
  
  const openEditDescriptionDialog = (description: JobDescription) => {
    setDescriptionFormData({
      id: description.id,
      content: description.content,
      isRecommended: description.isRecommended,
      jobTitleId: description.jobTitleId,
    });
    setIsEditDescriptionDialogOpen(true);
  };
  
  const openDeleteDescriptionDialog = (description: JobDescription) => {
    setDescriptionFormData({
      id: description.id,
      content: description.content,
      isRecommended: description.isRecommended,
      jobTitleId: description.jobTitleId,
    });
    setIsDeleteDescriptionDialogOpen(true);
  };
  
  const handleJobTitleSelect = (titleId: string) => {
    setSelectedJobTitleId(parseInt(titleId));
    setActiveTab('descriptions');
  };
  
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-8">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          className="mr-4 flex items-center"
          onClick={() => setLocation('/')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
        <h1 className="text-3xl font-bold">Job Titles & Descriptions Management</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="titles">Job Titles</TabsTrigger>
          <TabsTrigger value="descriptions" disabled={!selectedJobTitleId}>
            Job Descriptions {selectedJobTitle?.title ? `for "${selectedJobTitle.title}"` : ''}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="titles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>All Job Titles</CardTitle>
                <CardDescription>
                  Manage all job titles that will be available for users to select.
                </CardDescription>
              </div>
              <Dialog open={isAddTitleDialogOpen} onOpenChange={setIsAddTitleDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="ml-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Job Title
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Job Title</DialogTitle>
                    <DialogDescription>
                      Create a new job title that will be available for users.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddJobTitle}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Job Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g. Software Engineer"
                          value={titleFormData.title}
                          onChange={(e) => setTitleFormData({ ...titleFormData, title: e.target.value })}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input
                          id="category"
                          placeholder="e.g. Technology"
                          value={titleFormData.category}
                          onChange={(e) => setTitleFormData({ ...titleFormData, category: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddTitleDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createJobTitleMutation.isPending}>
                        {createJobTitleMutation.isPending ? 'Creating...' : 'Create Job Title'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {titlesError ? (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>Failed to load job titles. Please try again.</AlertDescription>
                </Alert>
              ) : null}
              
              {isLoadingTitles ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobTitles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No job titles found. Add your first job title to get started.
                          </TableCell>
                        </TableRow>
                      ) : (
                        jobTitles.map((title) => (
                          <TableRow key={title.id}>
                            <TableCell>{title.id}</TableCell>
                            <TableCell 
                              className="font-medium cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
                              onClick={() => handleJobTitleSelect(title.id.toString())}
                            >
                              {title.title}
                            </TableCell>
                            <TableCell>{title.category}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditTitleDialog(title)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteTitleDialog(title)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="descriptions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>
                  Descriptions for "{selectedJobTitle?.title || ''}"
                </CardTitle>
                <CardDescription>
                  Manage all descriptions available for this job title.
                </CardDescription>
              </div>
              <Dialog
                open={isAddDescriptionDialogOpen}
                onOpenChange={setIsAddDescriptionDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button className="ml-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Description
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Job Description</DialogTitle>
                    <DialogDescription>
                      Create a new job description for "{selectedJobTitle?.title || ''}".
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddJobDescription}>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="content">Description</Label>
                        <Textarea
                          id="content"
                          placeholder="e.g. Led cross-functional teams to deliver product features, increasing efficiency by 25%."
                          value={descriptionFormData.content}
                          onChange={(e) =>
                            setDescriptionFormData({
                              ...descriptionFormData,
                              content: e.target.value,
                            })
                          }
                          className="min-h-[120px]"
                          required
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="recommended"
                          checked={descriptionFormData.isRecommended}
                          onCheckedChange={(checked) =>
                            setDescriptionFormData({
                              ...descriptionFormData,
                              isRecommended: checked,
                            })
                          }
                        />
                        <Label htmlFor="recommended">Mark as Recommended</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDescriptionDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createJobDescriptionMutation.isPending}
                      >
                        {createJobDescriptionMutation.isPending
                          ? 'Creating...'
                          : 'Create Description'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="job-title-select">Select Job Title</Label>
                <Select
                  value={selectedJobTitleId?.toString() || ""}
                  onValueChange={handleJobTitleSelect}
                >
                  <SelectTrigger id="job-title-select" className="w-full md:w-[300px]">
                    <SelectValue placeholder="Select a job title" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobTitles.map((title) => (
                      <SelectItem key={title.id} value={title.id.toString()}>
                        {title.title} ({title.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isLoadingSelectedTitle ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Recommended</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!selectedJobTitle?.descriptions ||
                      selectedJobTitle.descriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center">
                            No descriptions found for this job title. Add your first description.
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedJobTitle.descriptions.map((description) => (
                          <TableRow key={description.id}>
                            <TableCell>{description.id}</TableCell>
                            <TableCell>{description.content}</TableCell>
                            <TableCell>
                              {description.isRecommended ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                  Recommended
                                </span>
                              ) : (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                  Regular
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDescriptionDialog(description)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openDeleteDescriptionDialog(description)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Job Title Dialog */}
      <Dialog open={isEditTitleDialogOpen} onOpenChange={setIsEditTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Title</DialogTitle>
            <DialogDescription>
              Update the details of this job title.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditJobTitle}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Job Title</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g. Software Engineer"
                  value={titleFormData.title}
                  onChange={(e) => setTitleFormData({ ...titleFormData, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  placeholder="e.g. Technology"
                  value={titleFormData.category}
                  onChange={(e) => setTitleFormData({ ...titleFormData, category: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditTitleDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateJobTitleMutation.isPending}>
                {updateJobTitleMutation.isPending ? 'Updating...' : 'Update Job Title'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Job Title Dialog */}
      <Dialog open={isDeleteTitleDialogOpen} onOpenChange={setIsDeleteTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Title</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{titleFormData.title}"? This action cannot be undone, and all associated descriptions will also be deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteTitleDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteJobTitle}
              disabled={deleteJobTitleMutation.isPending}
            >
              {deleteJobTitleMutation.isPending ? 'Deleting...' : 'Delete Job Title'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Job Description Dialog */}
      <Dialog open={isEditDescriptionDialogOpen} onOpenChange={setIsEditDescriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Job Description</DialogTitle>
            <DialogDescription>
              Update the content of this job description.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditJobDescription}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Description</Label>
                <Textarea
                  id="edit-content"
                  value={descriptionFormData.content}
                  onChange={(e) =>
                    setDescriptionFormData({
                      ...descriptionFormData,
                      content: e.target.value,
                    })
                  }
                  className="min-h-[120px]"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-recommended"
                  checked={descriptionFormData.isRecommended}
                  onCheckedChange={(checked) =>
                    setDescriptionFormData({
                      ...descriptionFormData,
                      isRecommended: checked,
                    })
                  }
                />
                <Label htmlFor="edit-recommended">Mark as Recommended</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDescriptionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateJobDescriptionMutation.isPending}>
                {updateJobDescriptionMutation.isPending ? 'Updating...' : 'Update Description'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Job Description Dialog */}
      <Dialog open={isDeleteDescriptionDialogOpen} onOpenChange={setIsDeleteDescriptionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Job Description</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job description? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4 max-h-24 overflow-y-auto border p-2 rounded-md">
            {descriptionFormData.content}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDescriptionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteJobDescription}
              disabled={deleteJobDescriptionMutation.isPending}
            >
              {deleteJobDescriptionMutation.isPending ? 'Deleting...' : 'Delete Description'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobsManagementPage;