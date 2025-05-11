import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Skill, SkillCategory, skillSchema, skillCategorySchema } from "@shared/schema";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
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

export default function SkillsAdminPage() {
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deleteSkillDialogOpen, setDeleteSkillDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<SkillCategory | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  
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
  
  // Forms
  const categoryForm = useForm<z.infer<typeof skillCategorySchema>>({
    resolver: zodResolver(skillCategorySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });
  
  const skillForm = useForm<z.infer<typeof skillSchema>>({
    resolver: zodResolver(skillSchema),
    defaultValues: {
      name: "",
      categoryId: 0,
      description: "",
      isRecommended: false,
    },
  });
  
  // Set form values when editing
  useEffect(() => {
    if (editingCategory) {
      categoryForm.reset({
        name: editingCategory.name,
        description: editingCategory.description,
      });
    }
  }, [editingCategory, categoryForm]);
  
  useEffect(() => {
    if (editingSkill) {
      skillForm.reset({
        name: editingSkill.name,
        categoryId: editingSkill.categoryId,
        description: editingSkill.description || "",
        isRecommended: editingSkill.isRecommended,
      });
    } else if (selectedCategory) {
      skillForm.reset({
        name: "",
        categoryId: selectedCategory.id,
        description: "",
        isRecommended: false,
      });
    }
  }, [editingSkill, skillForm, selectedCategory]);
  
  // Fetch skill categories
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    queryKey: ['/api/skills/categories', page, categorySearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      
      if (categorySearchQuery) {
        params.append('search', categorySearchQuery);
      }
      
      const res = await fetch(`/api/skills/categories?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch skill categories');
      }
      return await res.json();
    },
  });
  
  // Derive categories and total pages from data
  const categories = categoriesData || [];
  useEffect(() => {
    if (categoriesData && 'total' in categoriesData) {
      setTotalPages(Math.ceil(categoriesData.total / 10) || 1);
    }
  }, [categoriesData]);
  
  // Fetch skills for selected category
  const { data: skillsData = [], isLoading: isLoadingSkills } = useQuery({
    queryKey: ['/api/skills', selectedCategory?.id],
    queryFn: async () => {
      if (!selectedCategory) return [];
      
      const res = await fetch(`/api/skills?categoryId=${selectedCategory.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch skills');
      }
      return await res.json();
    },
    enabled: !!selectedCategory,
  });
  
  // Filter skills based on search query
  const filteredSkills = searchQuery
    ? skillsData.filter((skill: Skill) => 
        skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : skillsData;
  
  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof skillCategorySchema>) => {
      const res = await apiRequest('POST', '/api/skills/categories', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
      toast({
        title: "Success",
        description: "Skill category created successfully",
      });
      setCategoryDialogOpen(false);
      categoryForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: SkillCategory) => {
      const res = await apiRequest('PUT', `/api/skills/categories/${data.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
      
      // If this is the selected category, update it
      if (selectedCategory?.id === updatedCategory.id) {
        setSelectedCategory(updatedCategory);
      }
      
      toast({
        title: "Success",
        description: "Skill category updated successfully",
      });
      setCategoryDialogOpen(false);
      setEditingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/skills/categories/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
      
      // Clear selection if the deleted category was selected
      if (selectedCategory?.id === deletingCategory?.id) {
        setSelectedCategory(null);
      }
      
      toast({
        title: "Success",
        description: "Skill category deleted successfully",
      });
      setDeleteCategoryDialogOpen(false);
      setDeletingCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const createSkillMutation = useMutation({
    mutationFn: async (data: z.infer<typeof skillSchema>) => {
      const res = await apiRequest('POST', '/api/skills', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      toast({
        title: "Success",
        description: "Skill created successfully",
      });
      setSkillDialogOpen(false);
      skillForm.reset({
        name: "",
        categoryId: selectedCategory?.id || 0,
        description: "",
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
  
  const updateSkillMutation = useMutation({
    mutationFn: async (data: Skill) => {
      const res = await apiRequest('PUT', `/api/skills/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      toast({
        title: "Success",
        description: "Skill updated successfully",
      });
      setSkillDialogOpen(false);
      setEditingSkill(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteSkillMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/skills/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      toast({
        title: "Success",
        description: "Skill deleted successfully",
      });
      setDeleteSkillDialogOpen(false);
      setDeletingSkill(null);
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
        endpoint = '/api/skills/export/csv';
        filename = 'skills_data_export.csv';
        description = "Skills data has been exported to CSV";
        break;
      case 'excel':
        endpoint = '/api/skills/export/excel';
        filename = 'skills_data_export.xlsx';
        description = "Skills data has been exported to Excel";
        break;
      case 'json':
        endpoint = '/api/skills/export/json';
        filename = 'skills_data_export.json';
        description = "Skills data has been exported to JSON";
        break;
      default:
        endpoint = '/api/skills/export/csv';
        filename = 'skills_data_export.csv';
        description = "Skills data has been exported to CSV";
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
      const eventSource = new EventSource('/api/skills/import/csv-status');
      
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
              description: syncMode === 'full-sync' 
                ? `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Deleted: ${data.deleted}, Errors: ${data.errors.length}`
                : `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Errors: ${data.errors.length}`,
              variant: "destructive",
            });
          } else {
            toast({
              title: "Import Successful",
              description: syncMode === 'full-sync'
                ? `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Deleted: ${data.deleted}`
                : `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}`,
            });
          }
          
          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/skills/categories'] });
          queryClient.invalidateQueries({ queryKey: ['/api/skills'] });
          
          // Hide loading after a delay to ensure user sees the result
          setTimeout(() => {
            setIsImporting(false);
          }, 1500);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsImporting(false);
        toast({
          title: "Import Error",
          description: "An error occurred while monitoring the import process",
          variant: "destructive",
        });
      };

      // Upload the file
      const uploadResponse = await fetch('/api/skills/import/csv', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload file');
      }

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setIsImporting(false);
      toast({
        title: "Import Error",
        description: error instanceof Error ? error.message : 'An error occurred during import',
        variant: "destructive",
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
            <h1 className="text-3xl font-bold">Skills Management</h1>
          </div>
          <p className="text-gray-500">
            Manage skills and their categories for the resume wizard.
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
                <div className="px-2 py-2">
                  <div className="mb-2 text-sm font-medium">Sync Mode:</div>
                  <RadioGroup 
                    value={syncMode} 
                    onValueChange={(value) => setSyncMode(value as 'update-only' | 'full-sync')}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update-only" id="update-only" />
                      <Label htmlFor="update-only">Update Only</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full-sync" id="full-sync" />
                      <Label htmlFor="full-sync">Full Sync (may delete items)</Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      id="file-upload"
                      ref={fileInputRef}
                      accept=".csv,.xlsx,.xls,.json"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                    <Button 
                      onClick={() => fileInputRef.current?.click()} 
                      className="w-full"
                      variant="outline"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button
            onClick={() => {
              setEditingCategory(null);
              setCategoryDialogOpen(true);
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Category
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
          
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Processed</div>
              <div className="text-xl font-semibold">{uploadStatus.processed}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Created</div>
              <div className="text-xl font-semibold">{uploadStatus.created}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Updated</div>
              <div className="text-xl font-semibold">{uploadStatus.updated}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{uploadStatus.syncMode === 'full-sync' ? 'Deleted' : 'Errors'}</div>
              <div className="text-xl font-semibold">{uploadStatus.syncMode === 'full-sync' ? uploadStatus.deleted : uploadStatus.errors.length}</div>
            </div>
          </div>
          
          {uploadStatus.errors.length > 0 && (
            <div className="mt-2">
              <div className="text-sm font-semibold mb-1">Errors ({uploadStatus.errors.length}):</div>
              <ScrollArea className="h-40 w-full rounded-md border">
                <div className="p-2">
                  {uploadStatus.errors.map((error, i) => (
                    <div key={i} className="text-sm text-destructive mb-2 p-2 border border-destructive/20 rounded bg-destructive/5">
                      <div className="flex items-center gap-1 mb-1 font-medium">
                        <span className="bg-destructive text-white px-1.5 py-0.5 rounded text-xs">Row {error.row}</span>
                        <span className="text-destructive/70 text-xs">Error #{i+1}</span>
                      </div>
                      <div className="pl-1 whitespace-normal break-words">
                        {error.message}
                      </div>
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
        {/* Left Panel: Skill Categories */}
        <div className="md:col-span-1">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold flex items-center">
                    <Search className="h-5 w-5 mr-2 text-gray-500" />
                    Search Categories
                  </h2>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Category
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search skill categories..."
                    value={categorySearchQuery}
                    onChange={(e) => setCategorySearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isLoadingCategories ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading categories...</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-muted-foreground">No categories found</p>
                  <Button 
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryDialogOpen(true);
                    }}
                    variant="outline"
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add New Category
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-320px)]">
                  <div>
                    {categories.map((category: SkillCategory) => (
                      <div
                        key={category.id}
                        className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${selectedCategory?.id === category.id ? 'bg-gray-50' : ''}`}
                        onClick={() => setSelectedCategory(category)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{category.name}</h3>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {category.description}
                            </p>
                          </div>
                          <div className="flex">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingCategory(category);
                                setCategoryDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingCategory(category);
                                setDeleteCategoryDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {totalPages > 1 && (
                <div className="flex justify-between p-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Prev
                  </Button>
                  <span className="text-sm py-2">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Skills */}
        <div className="md:col-span-2">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-semibold flex items-center">
                    {selectedCategory ? (
                      <>Skills for <span className="text-primary ml-1">{selectedCategory.name}</span></>
                    ) : (
                      <>Select a Category</>
                    )}
                  </h2>
                  {selectedCategory && (
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSearchQuery('');
                        }}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Clear
                      </Button>
                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => {
                          setEditingSkill(null);
                          setSkillDialogOpen(true);
                        }}
                        disabled={!selectedCategory}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Skill
                      </Button>
                    </div>
                  )}
                </div>
                {selectedCategory && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      className="pl-9"
                      placeholder="Search skills..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {!selectedCategory ? (
                <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-280px)]">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Select a Category</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Choose a skill category from the list on the left to view, add, or edit skills in that category.
                  </p>
                </div>
              ) : isLoadingSkills ? (
                <div className="p-8 text-center h-[calc(100vh-280px)] flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">Loading skills...</p>
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="p-8 text-center h-[calc(100vh-280px)] flex flex-col items-center justify-center">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <Search className="h-10 w-10 text-gray-400" />
                  </div>
                  {searchQuery ? (
                    <>
                      <h3 className="text-xl font-medium mb-2">No matching skills found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search term or add a new skill.
                      </p>
                      <Button
                        onClick={() => {
                          setSearchQuery('');
                        }}
                        variant="outline"
                        className="mr-2"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <h3 className="text-xl font-medium mb-2">No skills in this category</h3>
                      <p className="text-muted-foreground mb-4">
                        Add your first skill to get started.
                      </p>
                    </>
                  )}
                  <Button
                    onClick={() => {
                      setEditingSkill(null);
                      setSkillDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Skill
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Skill Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[200px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSkills.map((skill: Skill) => (
                        <TableRow key={skill.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{skill.name}</div>
                              {skill.description && (
                                <div className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {skill.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {skill.isRecommended ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                <Star className="h-3 w-3 mr-1 fill-green-800" />
                                Recommended
                              </Badge>
                            ) : (
                              <Badge variant="outline">Standard</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => {
                                setEditingSkill(skill);
                                setSkillDialogOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setDeletingSkill(skill);
                                setDeleteSkillDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Skill Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? "Edit Skill Category" : "Add Skill Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? "Update the details for this skill category." 
                : "Create a new skill category to organize skills."}
            </DialogDescription>
          </DialogHeader>

          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit((data) => {
              if (editingCategory) {
                updateCategoryMutation.mutate({
                  ...editingCategory,
                  name: data.name,
                  description: data.description,
                });
              } else {
                createCategoryMutation.mutate(data);
              }
            })}>
              <div className="space-y-4 mb-4">
                <FormField
                  control={categoryForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Technical Skills" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Technical skills related to software development, computer science, and programming languages."
                          className="min-h-[100px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setCategoryDialogOpen(false);
                    setEditingCategory(null);
                    categoryForm.reset();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createCategoryMutation.isPending || updateCategoryMutation.isPending}>
                  {(createCategoryMutation.isPending || updateCategoryMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCategory ? "Update Category" : "Create Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Skill Dialog */}
      <Dialog open={skillDialogOpen} onOpenChange={setSkillDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkill ? "Edit Skill" : "Add Skill"}
            </DialogTitle>
            <DialogDescription>
              {editingSkill 
                ? "Update the details for this skill." 
                : "Create a new skill in the selected category."}
            </DialogDescription>
          </DialogHeader>

          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit((data) => {
              if (editingSkill) {
                updateSkillMutation.mutate({
                  ...editingSkill,
                  name: data.name,
                  categoryId: data.categoryId,
                  description: data.description || "",
                  isRecommended: data.isRecommended,
                });
              } else {
                createSkillMutation.mutate(data);
              }
            })}>
              <div className="space-y-4 mb-4">
                <FormField
                  control={skillForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Name</FormLabel>
                      <FormControl>
                        <Input placeholder="JavaScript" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={skillForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select 
                        defaultValue={field.value.toString()} 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        disabled={!editingSkill && !!selectedCategory}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category: SkillCategory) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={skillForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="A high-level programming language used primarily for web development."
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={skillForm.control}
                  name="isRecommended"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Recommended Skill</FormLabel>
                        <FormDescription>
                          Highlight this as a recommended skill for this category
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
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSkillDialogOpen(false);
                    setEditingSkill(null);
                    skillForm.reset();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSkillMutation.isPending || updateSkillMutation.isPending}>
                  {(createSkillMutation.isPending || updateSkillMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingSkill ? "Update Skill" : "Create Skill"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{deletingCategory?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingCategory) {
                  deleteCategoryMutation.mutate(deletingCategory.id);
                }
              }}
            >
              {deleteCategoryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Skill Confirmation */}
      <AlertDialog open={deleteSkillDialogOpen} onOpenChange={setDeleteSkillDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the skill "{deletingSkill?.name}". 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingSkill) {
                  deleteSkillMutation.mutate(deletingSkill.id);
                }
              }}
            >
              {deleteSkillMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".csv,.xlsx,.xls,.json"
        onChange={handleFileImport}
      />
    </div>
  );
}