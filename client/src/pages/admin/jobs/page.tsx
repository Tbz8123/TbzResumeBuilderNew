import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Briefcase, 
  ChevronLeft, 
  Search, 
  Plus, 
  Pencil, 
  Trash, 
  Star,
  MoreHorizontal,
  X,
  Filter,
  Check,
  FileText
} from "lucide-react";
import { 
  JobTitle, 
  JobDescription,
  jobTitleSchema,
  jobDescriptionSchema
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const AdminJobsPage = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("titles");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  
  // Job Title State
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [deleteTitleDialog, setDeleteTitleDialog] = useState(false);

  // Job Description State
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [editingDescription, setEditingDescription] = useState<JobDescription | null>(null);
  const [deleteDescriptionDialog, setDeleteDescriptionDialog] = useState(false);
  const [selectedJobTitleId, setSelectedJobTitleId] = useState<number | null>(null);
  
  // Fetch job titles
  const { 
    data: jobTitles = [], 
    isLoading: isLoadingTitles 
  } = useQuery<JobTitle[]>({
    queryKey: ['/api/jobs/titles'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/jobs/titles');
      return await res.json();
    }
  });
  
  // Fetch job descriptions
  const { 
    data: jobDescriptions = [], 
    isLoading: isLoadingDescriptions 
  } = useQuery<JobDescription[]>({
    queryKey: ['/api/jobs/descriptions', selectedJobTitleId],
    queryFn: async () => {
      const url = selectedJobTitleId 
        ? `/api/jobs/descriptions?jobTitleId=${selectedJobTitleId}` 
        : '/api/jobs/descriptions';
      const res = await apiRequest('GET', url);
      return await res.json();
    },
    enabled: activeTab === "descriptions"
  });

  // Extract unique categories from job titles
  const categories = jobTitles
    .map((title) => title.category)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();

  // Filter job titles based on search query and category
  const filteredJobTitles = jobTitles.filter((title) => {
    const matchesSearch = title.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !categoryFilter || title.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter job descriptions based on search query
  const filteredJobDescriptions = jobDescriptions.filter((desc) => {
    return desc.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Create new job title mutation
  const createJobTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobTitleSchema>) => {
      const res = await apiRequest('POST', '/api/jobs/titles', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      setTitleDialogOpen(false);
      toast({
        title: "Success",
        description: "Job title created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create job title: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update job title mutation
  const updateJobTitleMutation = useMutation({
    mutationFn: async (data: JobTitle) => {
      const res = await apiRequest('PUT', `/api/jobs/titles/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      setTitleDialogOpen(false);
      setEditingTitle(null);
      toast({
        title: "Success",
        description: "Job title updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update job title: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete job title mutation
  const deleteJobTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/titles/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      setDeleteTitleDialog(false);
      setEditingTitle(null);
      toast({
        title: "Success",
        description: "Job title deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete job title: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create new job description mutation
  const createJobDescriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobDescriptionSchema>) => {
      const res = await apiRequest('POST', '/api/jobs/descriptions', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions'] });
      setDescriptionDialogOpen(false);
      toast({
        title: "Success",
        description: "Job description created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create job description: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update job description mutation
  const updateJobDescriptionMutation = useMutation({
    mutationFn: async (data: JobDescription) => {
      const res = await apiRequest('PUT', `/api/jobs/descriptions/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions'] });
      setDescriptionDialogOpen(false);
      setEditingDescription(null);
      toast({
        title: "Success",
        description: "Job description updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update job description: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete job description mutation
  const deleteJobDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/descriptions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions'] });
      setDeleteDescriptionDialog(false);
      setEditingDescription(null);
      toast({
        title: "Success",
        description: "Job description deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete job description: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Form for job title
  const titleForm = useForm<z.infer<typeof jobTitleSchema>>({
    resolver: zodResolver(jobTitleSchema),
    defaultValues: editingTitle ? {
      title: editingTitle.title,
      category: editingTitle.category,
    } : {
      title: "",
      category: "",
    }
  });

  // Form for job description
  const descriptionForm = useForm<z.infer<typeof jobDescriptionSchema>>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: editingDescription ? {
      content: editingDescription.content,
      jobTitleId: editingDescription.jobTitleId,
      isRecommended: editingDescription.isRecommended,
    } : {
      content: "",
      jobTitleId: selectedJobTitleId || 0,
      isRecommended: false,
    }
  });

  // Handle form submission for job title
  const handleTitleSubmit = (data: z.infer<typeof jobTitleSchema>) => {
    if (editingTitle) {
      updateJobTitleMutation.mutate({
        ...editingTitle,
        title: data.title,
        category: data.category,
      });
    } else {
      createJobTitleMutation.mutate(data);
    }
  };

  // Handle form submission for job description
  const handleDescriptionSubmit = (data: z.infer<typeof jobDescriptionSchema>) => {
    if (editingDescription) {
      updateJobDescriptionMutation.mutate({
        ...editingDescription,
        content: data.content,
        jobTitleId: data.jobTitleId,
        isRecommended: data.isRecommended,
      });
    } else {
      createJobDescriptionMutation.mutate(data);
    }
  };

  // Open edit dialog for job title
  const openEditTitleDialog = (title: JobTitle) => {
    setEditingTitle(title);
    titleForm.reset({
      title: title.title,
      category: title.category,
    });
    setTitleDialogOpen(true);
  };

  // Open delete dialog for job title
  const openDeleteTitleDialog = (title: JobTitle) => {
    setEditingTitle(title);
    setDeleteTitleDialog(true);
  };

  // Open edit dialog for job description
  const openEditDescriptionDialog = (description: JobDescription) => {
    setEditingDescription(description);
    descriptionForm.reset({
      content: description.content,
      jobTitleId: description.jobTitleId,
      isRecommended: description.isRecommended,
    });
    setDescriptionDialogOpen(true);
  };

  // Open delete dialog for job description
  const openDeleteDescriptionDialog = (description: JobDescription) => {
    setEditingDescription(description);
    setDeleteDescriptionDialog(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Button asChild variant="ghost" className="p-0 mr-2">
              <Link href="/admin/dashboard">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Job Titles & Descriptions</h1>
          </div>
          <p className="text-gray-500">
            Manage job titles and their associated descriptions for the resume wizard.
          </p>
        </div>
      </div>

      <Tabs 
        defaultValue="titles" 
        className="w-full"
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value);
          setSearchQuery("");
          setCategoryFilter(null);
        }}
      >
        <TabsList className="mb-6">
          <TabsTrigger value="titles" className="flex items-center">
            <Briefcase className="h-4 w-4 mr-2" />
            Job Titles
          </TabsTrigger>
          <TabsTrigger value="descriptions" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Job Descriptions
          </TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="relative w-full sm:w-1/3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Search ${activeTab === "titles" ? "job titles" : "descriptions"}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {activeTab === "titles" && (
              <Select
                value={categoryFilter || ""}
                onValueChange={(value) => setCategoryFilter(value || null)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeTab === "descriptions" && (
              <Select
                value={selectedJobTitleId?.toString() || ""}
                onValueChange={(value) => setSelectedJobTitleId(value ? parseInt(value) : null)}
              >
                <SelectTrigger className="w-full sm:w-40">
                  <div className="flex items-center">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="All Job Titles" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Job Titles</SelectItem>
                  {jobTitles.map((title) => (
                    <SelectItem key={title.id} value={title.id.toString()}>
                      {title.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Dialog open={activeTab === "titles" ? titleDialogOpen : descriptionDialogOpen} 
                   onOpenChange={(open) => {
                      if (activeTab === "titles") {
                        setTitleDialogOpen(open);
                        if (!open) setEditingTitle(null);
                      } else {
                        setDescriptionDialogOpen(open);
                        if (!open) setEditingDescription(null);
                      }
                      
                      if (!open) {
                        titleForm.reset({
                          title: "",
                          category: "",
                        });
                        descriptionForm.reset({
                          content: "",
                          jobTitleId: selectedJobTitleId || 0,
                          isRecommended: false,
                        });
                      }
                   }}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add {activeTab === "titles" ? "Job Title" : "Description"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingTitle || editingDescription ? "Edit" : "Add"} {activeTab === "titles" ? "Job Title" : "Job Description"}
                  </DialogTitle>
                  <DialogDescription>
                    {activeTab === "titles" 
                      ? "Job titles are used to categorize job descriptions and provide suggestions to users." 
                      : "Job descriptions provide sample content for users to use in their resumes."}
                  </DialogDescription>
                </DialogHeader>
                
                {activeTab === "titles" ? (
                  <Form {...titleForm}>
                    <form onSubmit={titleForm.handleSubmit(handleTitleSubmit)} className="space-y-6">
                      <FormField
                        control={titleForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Job Title</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Front-end Developer" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter a job title that users might search for
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={titleForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g. Technology, Healthcare, etc." 
                                {...field} 
                                list="categories"
                              />
                            </FormControl>
                            <datalist id="categories">
                              {categories.map((category) => (
                                <option key={category} value={category} />
                              ))}
                            </datalist>
                            <FormDescription>
                              Categorize this job title for easier filtering
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setTitleDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={titleForm.formState.isSubmitting}>
                          {editingTitle ? "Update" : "Create"} Job Title
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                ) : (
                  <Form {...descriptionForm}>
                    <form onSubmit={descriptionForm.handleSubmit(handleDescriptionSubmit)} className="space-y-6">
                      <FormField
                        control={descriptionForm.control}
                        name="jobTitleId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Associated Job Title</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a job title" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {jobTitles.map((title) => (
                                  <SelectItem key={title.id} value={title.id.toString()}>
                                    {title.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the job title this description applies to
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={descriptionForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description Content</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter job description..." 
                                {...field}
                                rows={7}
                              />
                            </FormControl>
                            <FormDescription>
                              Write a detailed job description that can be used as a template
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={descriptionForm.control}
                        name="isRecommended"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Recommended</FormLabel>
                              <FormDescription>
                                Recommended descriptions are highlighted to users
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDescriptionDialogOpen(false)}
                        >
                          Cancel
                        </Button>
                        <Button type="submit" disabled={descriptionForm.formState.isSubmitting}>
                          {editingDescription ? "Update" : "Create"} Description
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <TabsContent value="titles" className="mt-0">
          {isLoadingTitles ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredJobTitles.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No job titles found. Add a new job title to get started.</p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[400px]">Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredJobTitles.map((title) => (
                      <TableRow key={title.id}>
                        <TableCell className="font-medium">{title.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-100">
                            {title.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditTitleDialog(title)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteTitleDialog(title)}
                              title="Delete"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="mt-4 text-gray-500 text-sm">
                Showing {filteredJobTitles.length} of {jobTitles.length} job titles
              </div>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="descriptions" className="mt-0">
          {isLoadingDescriptions ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : filteredJobDescriptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No job descriptions found. Add a new description to get started.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredJobDescriptions.map((description) => {
                  const relatedJobTitle = jobTitles.find(t => t.id === description.jobTitleId);
                  return (
                    <Card key={description.id} className="overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <Badge variant="outline" className="bg-gray-100 mb-2">
                              {relatedJobTitle?.title || "Unknown Job Title"}
                            </Badge>
                            {description.isRecommended && (
                              <Badge variant="secondary" className="ml-2 bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1 fill-yellow-500 text-yellow-500" />
                                Recommended
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDescriptionDialog(description)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => openDeleteDescriptionDialog(description)}
                                className="text-red-600"
                              >
                                <Trash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-5 whitespace-pre-line">
                          {description.content}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-4 text-gray-500 text-sm">
                Showing {filteredJobDescriptions.length} of {jobDescriptions.length} job descriptions
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete job title confirmation dialog */}
      <Dialog open={deleteTitleDialog} onOpenChange={setDeleteTitleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Title</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the job title "{editingTitle?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteTitleDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingTitle && deleteJobTitleMutation.mutate(editingTitle.id)}
              disabled={deleteJobTitleMutation.isPending}
            >
              {deleteJobTitleMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete job description confirmation dialog */}
      <Dialog open={deleteDescriptionDialog} onOpenChange={setDeleteDescriptionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Job Description</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this job description? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDescriptionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingDescription && deleteJobDescriptionMutation.mutate(editingDescription.id)}
              disabled={deleteJobDescriptionMutation.isPending}
            >
              {deleteJobDescriptionMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminJobsPage;