import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Briefcase, 
  ChevronLeft,
  ChevronRight, 
  Search, 
  Plus, 
  Pencil, 
  Trash, 
  Star,
  MoreHorizontal,
  X,
  Filter,
  Check,
  FileText,
  Upload,
  Save
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
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
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

  const selectJobTitle = (title: JobTitle) => {
    setSelectedJobTitleId(title.id);
    setSearchQuery("");
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel: Job Titles */}
        <div className="md:col-span-1">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold">🔍 Search Job Titles</h3>
                  <Button 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={() => {
                      setEditingTitle(null);
                      setTitleDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Title
                  </Button>
                </div>
                <div className="relative w-full">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search job titles..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {activeTab === "titles" && (
                  <div className="mt-2">
                    <Select
                      value={categoryFilter || "all_categories"}
                      onValueChange={(value) => setCategoryFilter(value === "all_categories" ? null : value)}
                    >
                      <SelectTrigger className="w-full">
                        <div className="flex items-center">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="All Categories" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all_categories">All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              
              <ScrollArea className="h-[480px]">
                {isLoadingTitles ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : filteredJobTitles.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No job titles found.</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {filteredJobTitles.map((title) => (
                      <li 
                        key={title.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                          selectedJobTitleId === title.id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => selectJobTitle(title)}
                      >
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="font-medium truncate">{title.title}</p>
                            <Badge variant="outline" className="bg-gray-100 mt-1 text-xs">
                              {title.category}
                            </Badge>
                          </div>
                        </div>
                        {selectedJobTitleId === title.id && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              
              {/* Pagination - to be implemented */}
              <div className="p-3 border-t flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Pagination will be implemented in the next update",
                    });
                  }}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Prev</span>
                </Button>
                
                <span className="text-sm text-gray-500">
                  Page 1 of 1
                </span>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    toast({
                      title: "Coming Soon",
                      description: "Pagination will be implemented in the next update",
                    });
                  }}
                >
                  <span className="mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Panel: Job Descriptions */}
        <div className="md:col-span-2">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold">
                    {selectedJobTitleId ? (
                      <>📝 Job Descriptions for "{jobTitles.find(t => t.id === selectedJobTitleId)?.title}"</>
                    ) : (
                      <>📝 Job Descriptions</>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center gap-1"
                      onClick={() => {
                        if (!selectedJobTitleId) {
                          toast({
                            title: "Select a Job Title",
                            description: "Please select a job title first",
                            variant: "destructive",
                          });
                          return;
                        }
                        // TODO: Add CSV upload functionality
                        toast({
                          title: "Coming Soon",
                          description: "Bulk CSV upload will be available soon",
                        });
                      }}
                    >
                      <Upload className="h-4 w-4" />
                      Bulk CSV Upload
                    </Button>
                    
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        if (!selectedJobTitleId) {
                          toast({
                            title: "Select a Job Title",
                            description: "Please select a job title first",
                            variant: "destructive",
                          });
                          return;
                        }
                        setEditingDescription(null);
                        setDescriptionDialogOpen(true);
                      }}
                      disabled={!selectedJobTitleId}
                    >
                      <Plus className="h-4 w-4" />
                      Add Description
                    </Button>
                  </div>
                </div>
                
                {selectedJobTitleId && (
                  <div className="relative w-full mb-2">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Search descriptions..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              {!selectedJobTitleId ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="bg-gray-100 p-6 rounded-full mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Select a Job Title</h3>
                  <p className="text-gray-500 max-w-md">
                    Choose a job title from the left panel to view, add, or edit its descriptions.
                  </p>
                </div>
              ) : isLoadingDescriptions ? (
                <div className="flex justify-center py-16">
                  <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : filteredJobDescriptions.length === 0 ? (
                <div className="text-center py-16">
                  <h3 className="text-lg font-medium mb-2">No descriptions found</h3>
                  <p className="text-gray-500 mb-4">
                    This job title doesn't have any descriptions yet.
                  </p>
                  <Button 
                    onClick={() => {
                      setEditingDescription(null);
                      setDescriptionDialogOpen(true);
                    }}
                    className="flex items-center gap-2 mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    Add Description
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[490px]">
                    <div className="p-4 grid gap-3">
                      {filteredJobDescriptions.map((description) => (
                        <Card key={description.id} className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {description.isRecommended && (
                                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                                      <Star className="h-3 w-3 fill-current mr-1" />
                                      Recommended
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {description.content}
                                </p>
                              </div>
                              <div className="flex flex-shrink-0 gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditDescriptionDialog(description);
                                  }}
                                  title="Edit"
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDescriptionDialog(description);
                                  }}
                                  title="Delete"
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="p-3 border-t flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement delete selected functionality
                        toast({
                          title: "Coming Soon",
                          description: "Multi-select delete will be available soon",
                        });
                      }}
                    >
                      <Trash className="h-4 w-4 mr-1" />
                      Delete Selected
                    </Button>
                    
                    <Button 
                      size="sm"
                      onClick={() => {
                        // TODO: Implement CSV export functionality
                        toast({
                          title: "Coming Soon",
                          description: "CSV export will be available soon",
                        });
                      }}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
            
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