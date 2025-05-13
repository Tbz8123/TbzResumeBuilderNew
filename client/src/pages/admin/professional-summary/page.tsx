import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Archive, 
  ArrowUpDown, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  ExternalLink, 
  FileText, 
  Import,
  Download as Export,
  MoreHorizontal, 
  Search, 
  Trash,
  Database,
  Plus,
  ClipboardCopy,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Link } from "wouter";

// Define the schema for professional summary titles
const professionalSummaryTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().optional(),
});

// Define the schema for professional summary descriptions
const professionalSummaryDescriptionSchema = z.object({
  content: z.string().min(10, "Content must be at least 10 characters"),
  isRecommended: z.boolean().default(false),
  professionalSummaryTitleId: z.number().int().positive(),
});

// Define types for our data
type ProfessionalSummaryTitle = {
  id: number;
  title: string;
  category: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

type ProfessionalSummaryDescription = {
  id: number;
  content: string;
  isRecommended: boolean;
  professionalSummaryTitleId: number;
  createdAt: Date;
  updatedAt: Date;
};

// Define pagination type
interface PaginatedTitlesResponse {
  data: ProfessionalSummaryTitle[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ProfessionalSummaryAdminPage() {
  // State for export/import in the parent component
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
  const queryClient = useQueryClient();
  
  // Handle exporting data
  const handleExportData = async (format: 'csv' | 'excel' | 'json') => {
    setIsExporting(true);
    let endpoint = '';
    let filename = '';
    let description = '';
    
    // Set the appropriate endpoint and filename based on format
    switch (format) {
      case 'csv':
        endpoint = '/api/professional-summary/export-csv';
        filename = 'professional_summary_export.csv';
        description = "Professional summary data has been exported to CSV";
        break;
      case 'excel':
        endpoint = '/api/professional-summary/export-excel';
        filename = 'professional_summary_export.xlsx';
        description = "Professional summary data has been exported to Excel";
        break;
      case 'json':
        endpoint = '/api/professional-summary/export-json';
        filename = 'professional_summary_export.json';
        description = "Professional summary data has been exported to JSON";
        break;
      default:
        endpoint = '/api/professional-summary/export-csv';
        filename = 'professional_summary_export.csv';
        description = "Professional summary data has been exported to CSV";
    }
    
    try {
      const res = await apiRequest('GET', endpoint);
      
      if (!res.ok) {
        throw new Error(`Failed to export ${format.toUpperCase()}`);
      }
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export successful',
        description: description,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : "Failed to export data",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Handle file import
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

    // Define interval at this scope so it's available in all handlers
    let statusCheckInterval: NodeJS.Timeout | null = null;
    
    // Function to check import status via polling
    const checkImportStatus = async () => {
      try {
        console.log("Checking import status...");
        const statusResponse = await fetch('/api/professional-summary/import-status', {
          credentials: 'include'
        });
        
        if (!statusResponse.ok) {
          console.error("Status check failed with status:", statusResponse.status);
          throw new Error('Failed to get import status');
        }
        
        const data = await statusResponse.json();
        console.log("Received status update:", data);
        
        // Update status with the latest information
        setUploadStatus({
          processed: data.processed || 0,
          created: data.created || 0,
          updated: data.updated || 0,
          deleted: data.deleted || 0,
          errors: data.errors || [],
          isComplete: data.isComplete || false,
          syncMode: data.syncMode
        });
        
        // If import is complete, stop polling and clean up
        if (data.isComplete) {
          console.log("Import complete, cleaning up");
          if (statusCheckInterval) {
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
          }
          
          setIsImporting(false);
          
          if (data.errors && data.errors.length > 0) {
            // If there were errors, show them
            toast({
              title: "Import Completed with Errors",
              description: `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Errors: ${data.errors.length}`,
              variant: "destructive",
            });
          } else {
            // Success message
            toast({
              title: "Import Successful",
              description: syncMode === 'full-sync'
                ? `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Deleted: ${data.deleted}`
                : `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}`,
            });
          }
          
          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/titles'] });
          queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/categories'] });
          
          // Clean up
          setUploadStatus(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } catch (error) {
        console.error("Status check error:", error);
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          statusCheckInterval = null;
        }
        
        setIsImporting(false);
        
        toast({
          title: "Import Status Check Failed",
          description: error instanceof Error ? error.message : "Failed to check import status",
          variant: "destructive",
        });
        
        setUploadStatus(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      // Use our new unified import endpoint
      const endpoint = '/api/professional-summary/import';
      
      console.log(`Sending file to ${endpoint}?mode=${syncMode}`);
      
      // Send the file to our new endpoint with query params instead of form fields
      const response = await fetch(`${endpoint}?mode=${syncMode}`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        // Handle HTTP error
        console.error("Upload failed with status:", response.status);
        let errorMessage = "Failed to import data";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If can't parse JSON, use generic message
        }
        
        setIsImporting(false);
        setUploadStatus(null);
        
        toast({
          title: "Import Failed",
          description: errorMessage,
          variant: "destructive",
        });
        
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        console.log("Upload successful, starting status polling");
        
        // Start polling for import status
        // Check immediately, then every second
        await checkImportStatus(); 
        statusCheckInterval = setInterval(checkImportStatus, 1000);
        
        console.log("Polling started");
        
        // Safety cleanup after 5 minutes in case something goes wrong
        setTimeout(() => {
          if (statusCheckInterval) {
            console.log("Safety timeout triggered");
            clearInterval(statusCheckInterval);
            statusCheckInterval = null;
            setIsImporting(false);
            setUploadStatus(null);
          }
        }, 5 * 60 * 1000);
      }
    } catch (error) {
      console.error("Error during import:", error);
      
      // Clear any polling intervals if they exist
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
      }
      
      setIsImporting(false);
      setUploadStatus(null);
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const { toast } = useToast();
  
  return (
    <div className="container mx-auto py-8 px-4">
        {/* Hidden file input is defined later in the code */}
        
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin/home">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Professional Summary</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-2xl font-bold">Professional Summary Management</h1>
            <p className="text-muted-foreground">
              Add, edit, and manage professional summary titles and descriptions
            </p>
          </div>
          
          <div className="mt-4 flex space-x-2 sm:mt-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Export className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Export Format</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExportData('csv')} disabled={isExporting}>
                  <FileText className="h-4 w-4 mr-2" />
                  CSV File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('excel')} disabled={isExporting}>
                  <FileText className="h-4 w-4 mr-2" />
                  Excel File
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportData('json')} disabled={isExporting}>
                  <Database className="h-4 w-4 mr-2" />
                  JSON File
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Import className="mr-2 h-4 w-4" />
                  Import Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Import Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5">
                  <Select
                    defaultValue="update-only"
                    onValueChange={(value) => setSyncMode(value as 'update-only' | 'full-sync')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sync Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="update-only">
                        Update Only
                        <span className="block text-xs text-muted-foreground">Add new or update existing records</span>
                      </SelectItem>
                      <SelectItem value="full-sync">
                        Full Sync
                        <span className="block text-xs text-muted-foreground">Add, update, and delete records</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            />
          </div>
        </div>
        
        {/* Show import progress */}
        {isImporting && uploadStatus && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Import Progress</CardTitle>
              <CardDescription>
                {uploadStatus.isComplete 
                  ? "Import completed successfully" 
                  : "Importing your data, please wait..."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processed: {uploadStatus.processed}</span>
                  {uploadStatus.isComplete && (
                    <span className="font-medium">Complete!</span>
                  )}
                </div>
                <Progress value={uploadStatus.isComplete ? 100 : 
                  (uploadStatus.processed > 0 ? (uploadStatus.processed / (uploadStatus.processed + 1)) * 100 : 0)} 
                />
                <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                  <div>
                    <span className="font-medium text-green-500">Created: </span>
                    <span>{uploadStatus.created}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-500">Updated: </span>
                    <span>{uploadStatus.updated}</span>
                  </div>
                  {uploadStatus.syncMode === 'full-sync' && (
                    <div>
                      <span className="font-medium text-red-500">Deleted: </span>
                      <span>{uploadStatus.deleted}</span>
                    </div>
                  )}
                </div>
                
                {uploadStatus.errors.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-red-500 mb-2">Errors ({uploadStatus.errors.length})</h4>
                    <ScrollArea className="h-24 rounded-md border">
                      <div className="p-4">
                        {uploadStatus.errors.map((error, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">Row {error.row}: </span>
                            <span>{error.message}</span>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        <ProfessionalSummaryAdmin />
      </div>
  );
}

function ProfessionalSummaryAdmin() {
  const queryClient = useQueryClient();
  
  // Local state for search filtering and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isAddTitleOpen, setIsAddTitleOpen] = useState(false);
  const [selectedTitle, setSelectedTitle] = useState<ProfessionalSummaryTitle | null>(null);
  const [isAddDescriptionOpen, setIsAddDescriptionOpen] = useState(false);
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [isEditDescriptionOpen, setIsEditDescriptionOpen] = useState(false);
  const [isDeleteTitleOpen, setIsDeleteTitleOpen] = useState(false);
  const [isDeleteDescriptionOpen, setIsDeleteDescriptionOpen] = useState(false);
  const [editingTitleData, setEditingTitleData] = useState<ProfessionalSummaryTitle | null>(null);
  const [editingDescriptionData, setEditingDescriptionData] = useState<ProfessionalSummaryDescription | null>(null);
  
  // Export/Import state
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
  
  // Fetch categories for dropdown menus
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/professional-summary/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/professional-summary/categories");
      if (!res.ok) {
        throw new Error("Failed to fetch categories");
      }
      return await res.json();
    }
  });
  
  // Fetch professional summary titles with pagination and search
  const { data: titlesData, isLoading: isLoadingTitles } = useQuery<PaginatedTitlesResponse>({
    queryKey: ['/api/professional-summary/titles', page, searchTerm],
    queryFn: async () => {
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : '';
      const res = await apiRequest('GET', `/api/professional-summary/titles?page=${page}&limit=10${searchParam}`);
      if (!res.ok) {
        throw new Error('Failed to fetch professional summary titles');
      }
      return await res.json();
    },
  });
  
  // Extract titles and pagination information
  const professionalSummaryTitles = titlesData?.data || [];
  const totalPages = titlesData?.pagination?.totalPages || 1;
  
  // Fetch professional summary descriptions for selected title
  const { data: professionalSummaryDescriptions = [], isLoading: isLoadingDescriptions } = useQuery({
    queryKey: ['/api/professional-summary/descriptions/by-title', selectedTitle?.id],
    queryFn: async () => {
      if (!selectedTitle) return [];
      
      const res = await apiRequest('GET', `/api/professional-summary/descriptions/by-title/${selectedTitle.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch professional summary descriptions');
      }
      return await res.json();
    },
    enabled: !!selectedTitle,
  });
  
  // Function to handle selecting a title
  const handleSelectTitle = (title: ProfessionalSummaryTitle) => {
    setSelectedTitle(title);
  };
  
  // Toast hook
  const { toast } = useToast();
  
  // Mutations for titles
  const createTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryTitleSchema>) => {
      const res = await apiRequest('POST', '/api/professional-summary/titles', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create professional summary title');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/titles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/categories'] });
      setIsAddTitleOpen(false);
      toast({
        title: 'Success',
        description: 'Professional summary title created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create professional summary title',
        variant: 'destructive',
      });
    },
  });
  
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof professionalSummaryTitleSchema> }) => {
      const res = await apiRequest('PUT', `/api/professional-summary/titles/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update professional summary title');
      }
      return await res.json();
    },
    onSuccess: (updatedTitle) => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/titles'] });
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/categories'] });
      setIsEditTitleOpen(false);
      
      // If the updated title is the selected one, update the selection
      if (selectedTitle && selectedTitle.id === updatedTitle.id) {
        setSelectedTitle(updatedTitle);
      }
      
      toast({
        title: 'Success',
        description: 'Professional summary title updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update professional summary title',
        variant: 'destructive',
      });
    },
  });
  
  const deleteTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/professional-summary/titles/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete professional summary title');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/titles'] });
      
      // If the deleted title is the selected one, clear the selection
      if (selectedTitle && selectedTitle.id === deletedId) {
        setSelectedTitle(null);
      }
      
      setIsDeleteTitleOpen(false);
      toast({
        title: 'Success',
        description: 'Professional summary title deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete professional summary title',
        variant: 'destructive',
      });
    },
  });
  
  // Mutations for descriptions
  const createDescriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryDescriptionSchema>) => {
      const res = await apiRequest('POST', '/api/professional-summary/descriptions', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create professional summary description');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/descriptions/by-title', selectedTitle?.id] });
      setIsAddDescriptionOpen(false);
      toast({
        title: 'Success',
        description: 'Professional summary description created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create professional summary description',
        variant: 'destructive',
      });
    },
  });
  
  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof professionalSummaryDescriptionSchema> }) => {
      const res = await apiRequest('PUT', `/api/professional-summary/descriptions/${id}`, data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update professional summary description');
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/descriptions/by-title', selectedTitle?.id] });
      setIsEditDescriptionOpen(false);
      toast({
        title: 'Success',
        description: 'Professional summary description updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update professional summary description',
        variant: 'destructive',
      });
    },
  });
  
  const deleteDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/professional-summary/descriptions/${id}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete professional summary description');
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/descriptions/by-title', selectedTitle?.id] });
      setIsDeleteDescriptionOpen(false);
      toast({
        title: 'Success',
        description: 'Professional summary description deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete professional summary description',
        variant: 'destructive',
      });
    },
  });
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      {/* Left panel: Professional Summary Titles */}
      <div className="col-span-1 space-y-4 md:col-span-1">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Professional Summary Titles</CardTitle>
              <Dialog open={isAddTitleOpen} onOpenChange={setIsAddTitleOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Professional Summary Title</DialogTitle>
                    <DialogDescription>
                      Create a new professional summary title.
                    </DialogDescription>
                  </DialogHeader>
                  <AddProfessionalSummaryTitleForm
                    onSubmit={(data) => createTitleMutation.mutate(data)}
                    isSubmitting={createTitleMutation.isPending}
                    categories={categories}
                  />
                </DialogContent>
              </Dialog>
            </div>
            <CardDescription>
              Manage professional summary titles
            </CardDescription>
            <div className="mt-2">
              <Input
                placeholder="Search titles..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1); // Reset page when search changes
                }}
                className="w-full"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isLoadingTitles ? (
              <div className="space-y-2 p-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
              </div>
            ) : professionalSummaryTitles.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No professional summary titles found</p>
              </div>
            ) : (
              <ul className="divide-y">
                {professionalSummaryTitles.map((title) => (
                  <li
                    key={title.id}
                    className={`cursor-pointer p-4 ${selectedTitle?.id === title.id ? 'bg-accent' : 'hover:bg-muted'}`}
                    onClick={() => handleSelectTitle(title)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{title.title}</p>
                        <p className="text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs mr-1">
                            {title.category}
                          </Badge>
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleData(title);
                              setIsEditTitleOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTitleData(title);
                              setIsDeleteTitleOpen(true);
                            }}
                            className="text-red-600"
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
      
      {/* Right panel: Professional Summary Descriptions */}
      <div className="col-span-1 space-y-4 md:col-span-3">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  {selectedTitle ? `Descriptions for "${selectedTitle.title}"` : 'Professional Summary Descriptions'}
                </CardTitle>
                <CardDescription>
                  {selectedTitle
                    ? `Manage descriptions for ${selectedTitle.title}`
                    : 'Select a professional summary title to view and manage its descriptions'}
                </CardDescription>
              </div>
              {selectedTitle && (
                <Dialog open={isAddDescriptionOpen} onOpenChange={setIsAddDescriptionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-1" />
                      Add Description
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Description</DialogTitle>
                      <DialogDescription>
                        Create a new description for "{selectedTitle.title}".
                      </DialogDescription>
                    </DialogHeader>
                    <AddProfessionalSummaryDescriptionForm
                      onSubmit={(data) => createDescriptionMutation.mutate({
                        ...data,
                        professionalSummaryTitleId: selectedTitle.id,
                      })}
                      isSubmitting={createDescriptionMutation.isPending}
                      titleId={selectedTitle.id}
                    />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {!selectedTitle ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Select a professional summary title to view its descriptions</p>
              </div>
            ) : isLoadingDescriptions ? (
              <div className="space-y-4 p-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : professionalSummaryDescriptions.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-sm text-muted-foreground">No descriptions found for this professional summary title</p>
                <p className="mt-2 text-sm">
                  <Button
                    variant="link"
                    onClick={() => setIsAddDescriptionOpen(true)}
                  >
                    Add a description
                  </Button>
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {professionalSummaryDescriptions.map((description: ProfessionalSummaryDescription) => (
                  <div key={description.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="mb-2 flex items-center">
                          {description.isRecommended && (
                            <Badge variant="secondary" className="mr-2 bg-purple-100 hover:bg-purple-100">
                              Expert Recommended
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            ID: {description.id}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm">
                          {description.content}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDescriptionData(description);
                            setIsEditDescriptionOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingDescriptionData(description);
                            setIsDeleteDescriptionOpen(true);
                          }}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Delete</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(description.content);
                            toast({
                              title: "Copied",
                              description: "Description copied to clipboard",
                              duration: 2000,
                            });
                          }}
                        >
                          <ClipboardCopy className="h-4 w-4" />
                          <span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Edit Title Dialog */}
      <Dialog open={isEditTitleOpen} onOpenChange={setIsEditTitleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Professional Summary Title</DialogTitle>
            <DialogDescription>
              Edit the professional summary title details.
            </DialogDescription>
          </DialogHeader>
          {editingTitleData && (
            <EditProfessionalSummaryTitleForm
              title={editingTitleData}
              onSubmit={(data) => updateTitleMutation.mutate({ id: editingTitleData.id, data })}
              isSubmitting={updateTitleMutation.isPending}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Description Dialog */}
      <Dialog open={isEditDescriptionOpen} onOpenChange={setIsEditDescriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Description</DialogTitle>
            <DialogDescription>
              Edit the professional summary description.
            </DialogDescription>
          </DialogHeader>
          {editingDescriptionData && (
            <EditProfessionalSummaryDescriptionForm
              description={editingDescriptionData}
              onSubmit={(data) => updateDescriptionMutation.mutate({
                id: editingDescriptionData.id,
                data: {
                  ...data,
                  professionalSummaryTitleId: editingDescriptionData.professionalSummaryTitleId,
                },
              })}
              isSubmitting={updateDescriptionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Title Confirmation Dialog */}
      <AlertDialog open={isDeleteTitleOpen} onOpenChange={setIsDeleteTitleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Professional Summary Title</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingTitleData?.title}"? This action will also delete all associated descriptions and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editingTitleData && deleteTitleMutation.mutate(editingTitleData.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteTitleMutation.isPending}
            >
              {deleteTitleMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Description Confirmation Dialog */}
      <AlertDialog open={isDeleteDescriptionOpen} onOpenChange={setIsDeleteDescriptionOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Description</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this description? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => editingDescriptionData && deleteDescriptionMutation.mutate(editingDescriptionData.id)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDescriptionMutation.isPending}
            >
              {deleteDescriptionMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AddProfessionalSummaryTitleForm({
  onSubmit,
  isSubmitting,
  categories,
}: {
  onSubmit: (data: z.infer<typeof professionalSummaryTitleSchema>) => void;
  isSubmitting: boolean;
  categories: string[];
}) {
  const form = useForm<z.infer<typeof professionalSummaryTitleSchema>>({
    resolver: zodResolver(professionalSummaryTitleSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Software Developer" {...field} />
              </FormControl>
              <FormDescription>
                Enter the professional summary title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., Information Technology, Marketing, etc." 
                  {...field} 
                  list="categories-list"
                />
              </FormControl>
              <datalist id="categories-list">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <FormDescription>
                Enter a category for the professional summary title
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
                  placeholder="Optional description for the professional summary title"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Add an optional description for this professional summary title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditProfessionalSummaryTitleForm({
  title,
  onSubmit,
  isSubmitting,
  categories,
}: {
  title: ProfessionalSummaryTitle;
  onSubmit: (data: z.infer<typeof professionalSummaryTitleSchema>) => void;
  isSubmitting: boolean;
  categories: string[];
}) {
  const form = useForm<z.infer<typeof professionalSummaryTitleSchema>>({
    resolver: zodResolver(professionalSummaryTitleSchema),
    defaultValues: {
      title: title.title,
      category: title.category,
      description: title.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                Update the professional summary title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <FormControl>
                <Input {...field} list="categories-list" />
              </FormControl>
              <datalist id="categories-list">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <FormDescription>
                Update the category
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
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Update the optional description
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function AddProfessionalSummaryDescriptionForm({
  onSubmit,
  isSubmitting,
  titleId,
}: {
  onSubmit: (data: z.infer<typeof professionalSummaryDescriptionSchema>) => void;
  isSubmitting: boolean;
  titleId: number;
}) {
  const form = useForm<z.infer<typeof professionalSummaryDescriptionSchema>>({
    resolver: zodResolver(professionalSummaryDescriptionSchema),
    defaultValues: {
      content: "",
      isRecommended: false,
      professionalSummaryTitleId: titleId,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the professional summary description content"
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Enter the content for the professional summary description
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isRecommended"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Expert Recommended</FormLabel>
                <FormDescription>
                  Mark this description as recommended by experts
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function EditProfessionalSummaryDescriptionForm({
  description,
  onSubmit,
  isSubmitting,
}: {
  description: ProfessionalSummaryDescription;
  onSubmit: (data: z.infer<typeof professionalSummaryDescriptionSchema>) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<z.infer<typeof professionalSummaryDescriptionSchema>>({
    resolver: zodResolver(professionalSummaryDescriptionSchema),
    defaultValues: {
      content: description.content,
      isRecommended: description.isRecommended,
      professionalSummaryTitleId: description.professionalSummaryTitleId,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Update the content for the professional summary description
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isRecommended"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Expert Recommended</FormLabel>
                <FormDescription>
                  Mark this description as recommended by experts
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
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}