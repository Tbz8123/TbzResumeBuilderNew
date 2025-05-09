import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { JobTitle, JobDescription, jobTitleSchema, jobDescriptionSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Search, 
  Plus, 
  Pencil, 
  Trash, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Upload, 
  Save,
  Check,
  X,
  Download,
  Loader2,
  RefreshCw,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  FileJson,
  Code
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function JobsAdminPage() {
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [titleSearchQuery, setTitleSearchQuery] = useState("");
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // Dialog state
  const [titleDialogOpen, setTitleDialogOpen] = useState(false);
  const [descriptionDialogOpen, setDescriptionDialogOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState<JobTitle | null>(null);
  const [editingDescription, setEditingDescription] = useState<JobDescription | null>(null);
  const [deleteTitleDialogOpen, setDeleteTitleDialogOpen] = useState(false);
  const [deleteDescriptionDialogOpen, setDeleteDescriptionDialogOpen] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState<JobTitle | null>(null);
  const [deletingDescription, setDeletingDescription] = useState<JobDescription | null>(null);
  
  // CSV Export/Import functions
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncMode, setSyncMode] = useState<'update-only' | 'full-sync'>('update-only');
  const [uploadStatus, setUploadStatus] = useState<{
    processed: number;
    created: number;
    updated: number;
    deleted: number;
    errors: Array<{ row: number; message: string }>;
    isComplete: boolean;
    syncMode?: string;
  } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Categories list for filtering and suggestions
  const [categories, setCategories] = useState<string[]>([]);
  
  // Forms
  const titleForm = useForm<z.infer<typeof jobTitleSchema>>({
    resolver: zodResolver(jobTitleSchema),
    defaultValues: {
      title: "",
      category: "",
    },
  });
  
  const descriptionForm = useForm<z.infer<typeof jobDescriptionSchema>>({
    resolver: zodResolver(jobDescriptionSchema),
    defaultValues: {
      content: "",
      jobTitleId: 0,
      isRecommended: false,
    },
  });
  
  // Set form values when editing
  useEffect(() => {
    if (editingTitle) {
      titleForm.reset({
        title: editingTitle.title,
        category: editingTitle.category,
      });
    }
  }, [editingTitle, titleForm]);
  
  useEffect(() => {
    if (editingDescription) {
      descriptionForm.reset({
        content: editingDescription.content,
        jobTitleId: editingDescription.jobTitleId,
        isRecommended: editingDescription.isRecommended,
      });
    } else if (selectedJobTitle) {
      descriptionForm.reset({
        content: "",
        jobTitleId: selectedJobTitle.id,
        isRecommended: false,
      });
    }
  }, [editingDescription, descriptionForm, selectedJobTitle]);
  
  // Fetch job titles
  const { data: jobTitlesData, isLoading: isLoadingTitles } = useQuery({
    queryKey: ['/api/jobs/titles', page, titleSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (titleSearchQuery) {
        params.append('search', titleSearchQuery);
      }
      
      if (categoryFilter) {
        params.append('category', categoryFilter);
      }
      
      const res = await fetch(`/api/jobs/titles?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch job titles');
      }
      return await res.json();
    },
  });
  
  // Derive job titles and total pages from data
  const jobTitles = jobTitlesData?.data || [];
  useEffect(() => {
    if (jobTitlesData) {
      setTotalPages(Math.ceil(jobTitlesData.total / 10) || 1);
    }
  }, [jobTitlesData]);
  
  // Extract unique categories
  useEffect(() => {
    const uniqueCategories = [...new Set(jobTitles.map(title => title.category))].filter(Boolean);
    setCategories(uniqueCategories);
  }, [jobTitles]);
  
  // Fetch job descriptions for selected job title
  const { data: jobDescriptions = [], isLoading: isLoadingDescriptions } = useQuery({
    queryKey: ['/api/jobs/descriptions', selectedJobTitle?.id],
    queryFn: async () => {
      if (!selectedJobTitle) return [];
      
      const res = await fetch(`/api/jobs/descriptions?jobTitleId=${selectedJobTitle.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch job descriptions');
      }
      return await res.json();
    },
    enabled: !!selectedJobTitle,
  });
  
  // Filter job descriptions based on search query
  const filteredJobDescriptions = searchQuery
    ? jobDescriptions.filter(desc => 
        desc.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : jobDescriptions;
  
  // Mutations
  const createTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobTitleSchema>) => {
      const res = await apiRequest('POST', '/api/jobs/titles', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      toast({
        title: "Success",
        description: "Job title created successfully",
      });
      setTitleDialogOpen(false);
      titleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateTitleMutation = useMutation({
    mutationFn: async (data: JobTitle) => {
      const res = await apiRequest('PUT', `/api/jobs/titles/${data.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedTitle) => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      
      // If this is the selected title, update it
      if (selectedJobTitle?.id === updatedTitle.id) {
        setSelectedJobTitle(updatedTitle);
      }
      
      toast({
        title: "Success",
        description: "Job title updated successfully",
      });
      setTitleDialogOpen(false);
      setEditingTitle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/titles/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
      
      // Clear selection if the deleted title was selected
      if (selectedJobTitle?.id === deletingTitle?.id) {
        setSelectedJobTitle(null);
      }
      
      toast({
        title: "Success",
        description: "Job title deleted successfully",
      });
      setDeleteTitleDialogOpen(false);
      setDeletingTitle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createDescriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jobDescriptionSchema>) => {
      const res = await apiRequest('POST', '/api/jobs/descriptions', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions', selectedJobTitle?.id] });
      toast({
        title: "Success",
        description: "Job description created successfully",
      });
      setDescriptionDialogOpen(false);
      descriptionForm.reset({
        content: "",
        jobTitleId: selectedJobTitle?.id || 0,
        isRecommended: false,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateDescriptionMutation = useMutation({
    mutationFn: async (data: JobDescription) => {
      const res = await apiRequest('PUT', `/api/jobs/descriptions/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions', selectedJobTitle?.id] });
      toast({
        title: "Success",
        description: "Job description updated successfully",
      });
      setDescriptionDialogOpen(false);
      setEditingDescription(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/jobs/descriptions/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions', selectedJobTitle?.id] });
      toast({
        title: "Success",
        description: "Job description deleted successfully",
      });
      setDeleteDescriptionDialogOpen(false);
      setDeletingDescription(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle data export in different formats
  const handleExportData = async (format: 'csv' | 'excel' | 'json') => {
    setIsExporting(true);
    let endpoint = '';
    let filename = '';
    let description = '';
    
    // Set the appropriate endpoint and filename based on format
    switch (format) {
      case 'csv':
        endpoint = '/api/jobs/export-csv';
        filename = 'job_data_export.csv';
        description = "Job data has been exported to CSV";
        break;
      case 'excel':
        endpoint = '/api/jobs/export-excel';
        filename = 'job_data_export.xlsx';
        description = "Job data has been exported to Excel";
        break;
      case 'json':
        endpoint = '/api/jobs/export-json';
        filename = 'job_data_export.json';
        description = "Job data has been exported to JSON";
        break;
      default:
        endpoint = '/api/jobs/export-csv';
        filename = 'job_data_export.csv';
        description = "Job data has been exported to CSV";
    }
    
    try {
      const res = await apiRequest('GET', endpoint);
      
      if (!res.ok) {
        throw new Error(`Failed to export ${format.toUpperCase()}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: description,
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : `An error occurred during ${format} export`,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file import (CSV, Excel, JSON)
  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Validate file format
    if (!['csv', 'xlsx', 'xls', 'json'].includes(fileExt)) {
      toast({
        title: "Invalid File Format",
        description: "Please upload a CSV, Excel, or JSON file",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    setIsImporting(true);
    setUploadStatus({
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      isComplete: false,
      syncMode
    });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('syncMode', syncMode);
      
      // Start SSE connection for real-time updates
      const eventSource = new EventSource('/api/jobs/import-csv-status');
      
      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setUploadStatus(prev => ({
          ...prev!,
          processed: data.processed,
          created: data.created,
          updated: data.updated,
          deleted: data.deleted || 0,
          errors: data.errors,
          isComplete: data.isComplete
        }));
        
        if (data.isComplete) {
          eventSource.close();
          
          if (data.errors.length > 0) {
            toast({
              title: "Import Completed with Errors",
              description: `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Errors: ${data.errors.length}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Import Successful",
              description: `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}`,
            });
          }
          
          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/jobs/titles'] });
          if (selectedJobTitle) {
            queryClient.invalidateQueries({ queryKey: ['/api/jobs/descriptions', selectedJobTitle.id] });
          }
          
          setIsImporting(false);
          setUploadStatus(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };
      
      eventSource.onerror = () => {
        eventSource.close();
        setIsImporting(false);
        toast({
          title: "Import Failed",
          description: "Lost connection to server during import",
          variant: "destructive",
        });
      };
      
      // Submit the file
      // We need to use fetch directly for FormData to ensure the browser sets the correct multipart boundary
      const res = await fetch('/api/jobs/import-csv', {
        method: 'POST',
        credentials: 'include',
        body: formData
        // Important: Do NOT set Content-Type header - browser will set it automatically with the correct boundary
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to import CSV');
      }
    } catch (error) {
      setIsImporting(false);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An error occurred during import",
        variant: "destructive",
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Form handlers
  const handleTitleSubmit = (data: z.infer<typeof jobTitleSchema>) => {
    if (editingTitle) {
      updateTitleMutation.mutate({ ...editingTitle, ...data });
    } else {
      createTitleMutation.mutate(data);
    }
  };
  
  const handleDescriptionSubmit = (data: z.infer<typeof jobDescriptionSchema>) => {
    if (editingDescription) {
      updateDescriptionMutation.mutate({ ...editingDescription, ...data });
    } else {
      createDescriptionMutation.mutate(data);
    }
  };
  
  // Dialog handlers
  const openEditTitleDialog = (title: JobTitle) => {
    setEditingTitle(title);
    setTitleDialogOpen(true);
  };
  
  const openDeleteTitleDialog = (title: JobTitle) => {
    setDeletingTitle(title);
    setDeleteTitleDialogOpen(true);
  };
  
  const openEditDescriptionDialog = (description: JobDescription) => {
    setEditingDescription(description);
    setDescriptionDialogOpen(true);
  };
  
  const openDeleteDescriptionDialog = (description: JobDescription) => {
    setDeletingDescription(description);
    setDeleteDescriptionDialogOpen(true);
  };
  
  const selectJobTitle = (title: JobTitle) => {
    setSelectedJobTitle(title);
    setSearchQuery("");
  };
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Button asChild variant="ghost" className="p-0 mr-2">
              <Link href="/admin/home">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Job Titles & Descriptions</h1>
          </div>
          <p className="text-gray-500">
            Manage job titles and their associated descriptions for the resume wizard.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 md:mt-0">
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  Export Data
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choose format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportData('csv')}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('excel')}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel Format
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('json')}>
                  <Code className="h-4 w-4 mr-2" />
                  JSON Format
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isImporting}
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Import Data
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Choose file format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV, Excel, or JSON File
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs text-muted-foreground">
                  Supports .csv, .xlsx, .xls, and .json files
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={handleFileImport}
              disabled={isImporting}
            />
          </div>
          
          <Button
            onClick={() => {
              setEditingTitle(null);
              setTitleDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Job Title
          </Button>
        </div>
      </div>
      
      {/* File Import Status */}
      {uploadStatus && (
        <div className="mb-6 p-4 border rounded-lg bg-background">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">File Import Progress</h3>
            {uploadStatus.isComplete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setUploadStatus(null)}
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all" 
                style={{ 
                  width: `${uploadStatus.isComplete ? 100 : (uploadStatus.processed > 0 ? (uploadStatus.processed / (uploadStatus.processed + 10)) * 100 : 20)}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Processed</div>
              <div className="text-xl font-semibold">{uploadStatus.processed}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-xl font-semibold">{uploadStatus.created}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Errors</div>
              <div className="text-xl font-semibold">{uploadStatus.errors.length}</div>
            </div>
          </div>
          
          {uploadStatus.errors.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-semibold mb-1">Errors:</div>
              <ScrollArea className="h-24 w-full rounded-md border">
                <div className="p-2">
                  {uploadStatus.errors.map((error, i) => (
                    <div key={i} className="text-sm text-destructive mb-1">
                      Row {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {uploadStatus.isComplete && (
            <div className="mt-4 text-center">
              <Button onClick={() => setUploadStatus(null)} variant="outline" className="gap-2">
                <Check className="h-4 w-4" />
                Close
              </Button>
            </div>
          )}
        </div>
      )}

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
                    value={titleSearchQuery}
                    onChange={(e) => setTitleSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <ScrollArea className="h-[480px]">
                {isLoadingTitles ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : jobTitles.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-gray-500">No job titles found.</p>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {jobTitles.map((title) => (
                      <li 
                        key={title.id}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                          selectedJobTitle?.id === title.id ? 'bg-blue-50' : ''
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
                        {selectedJobTitle?.id === title.id && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </ScrollArea>
              
              {/* Pagination */}
              <div className="p-3 border-t flex items-center justify-between">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="ml-1">Prev</span>
                </Button>
                
                <span className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </span>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
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
                    {selectedJobTitle ? (
                      <>📝 Job Descriptions for "{selectedJobTitle.title}"</>
                    ) : (
                      <>📝 Job Descriptions</>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex items-center gap-1"
                          disabled={isExporting}
                        >
                          <Download className="h-4 w-4" />
                          {isExporting ? "Exporting..." : "Export Format"}
                          <ChevronDown className="h-3 w-3 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleExportData('csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          CSV Format
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportData('excel')}>
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Excel Format
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportData('json')}>
                          <Code className="h-4 w-4 mr-2" />
                          JSON Format
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <div className="relative">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex items-center gap-1"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                        disabled={isImporting}
                      >
                        <Upload className="h-4 w-4" />
                        {isImporting ? "Importing..." : "Import File"}
                      </Button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv,.xlsx,.xls,.json"
                        className="hidden"
                        onChange={handleFileImport}
                        disabled={isImporting}
                      />
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => {
                        if (!selectedJobTitle) {
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
                      disabled={!selectedJobTitle}
                    >
                      <Plus className="h-4 w-4" />
                      Add Description
                    </Button>
                  </div>
                </div>
                
                {selectedJobTitle && (
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
              
              {!selectedJobTitle && !uploadStatus ? (
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
              ) : uploadStatus ? (
                <div className="text-center py-16 px-8">
                  <h3 className="text-lg font-medium mb-2">Importing Data</h3>
                  <p className="text-gray-500 mb-6">
                    Please wait while we process your file. This may take a few moments.
                  </p>
                  
                  <div className="max-w-md mx-auto space-y-4">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ 
                          width: `${(uploadStatus.processed / (uploadStatus.processed + 10)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-500">
                      <div>Processed: {uploadStatus.processed}</div>
                      <div>Created: {uploadStatus.created}</div>
                      <div>Updated: {uploadStatus.updated}</div>
                    </div>
                    
                    {uploadStatus.errors.length > 0 && (
                      <div className="mt-4 text-left">
                        <p className="text-sm font-medium text-red-500 mb-2">Errors:</p>
                        <div className="bg-red-50 p-3 rounded text-sm text-red-700 max-h-32 overflow-y-auto">
                          {uploadStatus.errors.slice(0, 5).map((error, i) => (
                            <div key={i} className="mb-1">
                              Row {error.row}: {error.message}
                            </div>
                          ))}
                          {uploadStatus.errors.length > 5 && (
                            <div className="mt-1 text-center">
                              ...and {uploadStatus.errors.length - 5} more errors
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
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
      
      {/* Add/Edit Job Title Dialog */}
      <Dialog open={titleDialogOpen} onOpenChange={(open) => {
        setTitleDialogOpen(open);
        if (!open) setEditingTitle(null);
        if (!open) {
          titleForm.reset({
            title: "",
            category: "",
          });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTitle ? "Edit" : "Add"} Job Title
            </DialogTitle>
            <DialogDescription>
              Job titles are used to categorize job descriptions and provide suggestions to users.
            </DialogDescription>
          </DialogHeader>
          
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
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Job Description Dialog */}
      <Dialog open={descriptionDialogOpen} onOpenChange={(open) => {
        setDescriptionDialogOpen(open);
        if (!open) setEditingDescription(null);
        if (!open) {
          descriptionForm.reset({
            content: "",
            jobTitleId: selectedJobTitle?.id || 0,
            isRecommended: false,
          });
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingDescription ? "Edit" : "Add"} Job Description
            </DialogTitle>
            <DialogDescription>
              Job descriptions provide sample content for users to use in their resumes.
            </DialogDescription>
          </DialogHeader>
          
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
                      Choose which job title this description belongs to
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
                        placeholder="Describe responsibilities and achievements..." 
                        className="h-32 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Write a professional job description. Use action verbs and quantifiable achievements.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={descriptionForm.control}
                name="isRecommended"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Recommended</FormLabel>
                      <FormDescription>
                        Mark this description as recommended to prioritize it in search results
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
        </DialogContent>
      </Dialog>
      
      {/* Delete Job Title Confirmation Dialog */}
      <AlertDialog open={deleteTitleDialogOpen} onOpenChange={setDeleteTitleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the job title "{deletingTitle?.title}" and all of its associated descriptions.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingTitle(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingTitle && deleteTitleMutation.mutate(deletingTitle.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Job Description Confirmation Dialog */}
      <AlertDialog open={deleteDescriptionDialogOpen} onOpenChange={setDeleteDescriptionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this job description. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDescription(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingDescription && deleteDescriptionMutation.mutate(deletingDescription.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
