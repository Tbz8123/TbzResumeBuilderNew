import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

// UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Search,
  X,
  CheckCircle,
  XCircle,
  ChevronRight,
  ChevronLeft,
  FileText,
  RefreshCw,
  FolderHeart
} from "lucide-react";

// Load environment variables
const API_BASE_URL = "/api/professional-summary";

// Define the schema for professional summary titles
const professionalSummaryTitleSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
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
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin/home">
              <Button variant="outline" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Professional Summary Management</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage professional summary titles and their descriptions
          </p>
        </div>
      </div>

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
  
  // Fetch categories for dropdown menus
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ["/api/professional-summary/categories"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/professional-summary/categories");
      return await res.json();
    },
  });
  
  // Fetch professional summary titles with pagination
  const { 
    data: titlesData, 
    isLoading: isLoadingTitles,
    isError: isErrorTitles,
  } = useQuery<PaginatedTitlesResponse>({
    queryKey: ["/api/professional-summary/titles", page, searchTerm],
    queryFn: async () => {
      const res = await apiRequest(
        "GET", 
        `/api/professional-summary/titles?page=${page}&limit=10${searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : ""}`
      );
      return await res.json();
    },
  });
  
  // Titles from the API
  const titles = titlesData?.data || [];
  
  // Total pages from pagination data
  const totalPages = titlesData?.pagination?.totalPages || 1;
  
  // Fetch descriptions for selected title
  const { 
    data: descriptions = [],
    isLoading: isLoadingDescriptions,
    isError: isErrorDescriptions,
  } = useQuery<ProfessionalSummaryDescription[]>({
    queryKey: ["/api/professional-summary/descriptions", selectedTitle?.id],
    queryFn: async () => {
      if (!selectedTitle) return [];
      const res = await apiRequest("GET", `/api/professional-summary/descriptions?titleId=${selectedTitle.id}`);
      return await res.json();
    },
    enabled: !!selectedTitle,
  });
  
  // Mutation for creating a new professional summary title
  const createTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryTitleSchema>) => {
      const res = await apiRequest("POST", "/api/professional-summary/titles", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsAddTitleOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/professional-summary/titles"] });
      toast({
        title: "Success",
        description: "Professional summary title created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create professional summary title",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a professional summary title
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof professionalSummaryTitleSchema> }) => {
      const res = await apiRequest("PATCH", `/api/professional-summary/titles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setIsEditTitleOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/professional-summary/titles"] });
      if (selectedTitle) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/professional-summary/descriptions", selectedTitle.id] 
        });
      }
      toast({
        title: "Success",
        description: "Professional summary title updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update professional summary title",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a professional summary title
  const deleteTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/professional-summary/titles/${id}`);
    },
    onSuccess: () => {
      setIsDeleteTitleOpen(false);
      if (selectedTitle && editingTitleData && selectedTitle.id === editingTitleData.id) {
        setSelectedTitle(null);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/professional-summary/titles"] });
      toast({
        title: "Success",
        description: "Professional summary title deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete professional summary title",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for creating a new professional summary description
  const createDescriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryDescriptionSchema>) => {
      const res = await apiRequest("POST", "/api/professional-summary/descriptions", data);
      return await res.json();
    },
    onSuccess: () => {
      setIsAddDescriptionOpen(false);
      if (selectedTitle) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/professional-summary/descriptions", selectedTitle.id] 
        });
      }
      toast({
        title: "Success",
        description: "Professional summary description created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create professional summary description",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for updating a professional summary description
  const updateDescriptionMutation = useMutation({
    mutationFn: async ({ 
      id, 
      data 
    }: { 
      id: number; 
      data: Omit<z.infer<typeof professionalSummaryDescriptionSchema>, "professionalSummaryTitleId"> 
    }) => {
      const res = await apiRequest("PATCH", `/api/professional-summary/descriptions/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      setIsEditDescriptionOpen(false);
      if (selectedTitle) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/professional-summary/descriptions", selectedTitle.id] 
        });
      }
      toast({
        title: "Success",
        description: "Professional summary description updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update professional summary description",
        variant: "destructive",
      });
    },
  });
  
  // Mutation for deleting a professional summary description
  const deleteDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/professional-summary/descriptions/${id}`);
    },
    onSuccess: () => {
      setIsDeleteDescriptionOpen(false);
      if (selectedTitle) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/professional-summary/descriptions", selectedTitle.id] 
        });
      }
      toast({
        title: "Success",
        description: "Professional summary description deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete professional summary description",
        variant: "destructive",
      });
    },
  });
  
  // Select a professional summary title
  const handleSelectTitle = (title: ProfessionalSummaryTitle) => {
    setSelectedTitle(title);
  };
  
  // Handle pagination navigation
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
  };
  
  // Generate pagination UI
  const renderPagination = () => {
    const pages = [];
    const maxButtons = 5;
    
    // Start page number
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    
    // End page number
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage < maxButtons - 1) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Create pagination items
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(page - 1);
              }}
              className={page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
          
          {startPage > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(1);
                  }}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {startPage > 2 && <PaginationEllipsis />}
            </>
          )}
          
          {pages}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <PaginationEllipsis />}
              <PaginationItem>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(totalPages);
                  }}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}
          
          <PaginationItem>
            <PaginationNext
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(page + 1);
              }}
              className={page >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };
  
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Professional Summary Titles */}
        <div className="col-span-1 border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Professional Summary Titles</h2>
            <Dialog open={isAddTitleOpen} onOpenChange={setIsAddTitleOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Title
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

          <div className="mb-4">
            <h3 className="text-xs uppercase font-semibold text-gray-500 mb-2">Search Professional Summary Titles</h3>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search professional summary titles..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1); // Reset to first page on search
                    }}
                  />
                  {searchTerm && (
                    <X
                      className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 cursor-pointer"
                      onClick={() => {
                        setSearchTerm("");
                        setPage(1);
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <ScrollArea className="h-[480px]">
            {isLoadingTitles ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : titles.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No professional summary titles found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {titles.map((title) => (
                  <div
                    key={title.id}
                    className={`p-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors ${
                      selectedTitle?.id === title.id ? "bg-gray-100 border-l-4 border-primary" : ""
                    }`}
                    onClick={() => handleSelectTitle(title)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{title.title}</h3>
                        <p className="text-xs text-muted-foreground">{title.category}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
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
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          {totalPages > 1 && (
            <div className="mt-4 flex justify-center">
              {renderPagination()}
            </div>
          )}
          
          {/* Edit Title Dialog */}
          <Dialog open={isEditTitleOpen} onOpenChange={setIsEditTitleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Professional Summary Title</DialogTitle>
                <DialogDescription>
                  Update the professional summary title details.
                </DialogDescription>
              </DialogHeader>
              {editingTitleData && (
                <EditProfessionalSummaryTitleForm
                  title={editingTitleData}
                  onSubmit={(data) => 
                    updateTitleMutation.mutate({ id: editingTitleData.id, data })
                  }
                  isSubmitting={updateTitleMutation.isPending}
                  categories={categories}
                />
              )}
            </DialogContent>
          </Dialog>
          
          {/* Delete Title Dialog */}
          <Dialog open={isDeleteTitleOpen} onOpenChange={setIsDeleteTitleOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Professional Summary Title</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this professional summary title?
                  This will also delete all associated descriptions.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteTitleOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (editingTitleData) {
                      deleteTitleMutation.mutate(editingTitleData.id);
                    }
                  }}
                  disabled={deleteTitleMutation.isPending}
                >
                  {deleteTitleMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Right Column - Professional Summary Descriptions */}
        <div className="col-span-2 border rounded-lg p-4 bg-white shadow-sm">
          {selectedTitle ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{selectedTitle.title}</h2>
                  <p className="text-sm text-muted-foreground">Category: {selectedTitle.category}</p>
                </div>
                <Dialog open={isAddDescriptionOpen} onOpenChange={setIsAddDescriptionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-9">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Description
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Professional Summary Description</DialogTitle>
                      <DialogDescription>
                        Create a new description for {selectedTitle.title}.
                      </DialogDescription>
                    </DialogHeader>
                    <AddProfessionalSummaryDescriptionForm
                      onSubmit={(data) => 
                        createDescriptionMutation.mutate({
                          ...data,
                          professionalSummaryTitleId: selectedTitle.id,
                        })
                      }
                      isSubmitting={createDescriptionMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-medium mb-3">Descriptions</h3>
                {isLoadingDescriptions ? (
                  <div className="flex justify-center py-10">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : descriptions.length === 0 ? (
                  <div className="text-center py-10 border rounded-md bg-gray-50">
                    <p className="text-gray-500">No descriptions found for this professional summary title.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Get started by adding a description using the "Add Description" button.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {descriptions.map((description) => (
                      <Card key={description.id} className="overflow-hidden">
                        <CardHeader className="py-3 px-4 bg-gray-50">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {description.isRecommended && (
                                <Badge variant="outline" className="bg-purple-100 text-purple-800 font-medium border-purple-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Expert Recommended
                                </Badge>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingDescriptionData(description);
                                    setIsEditDescriptionOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingDescriptionData(description);
                                    setIsDeleteDescriptionOpen(true);
                                  }}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent className="p-4">
                          <p className="whitespace-pre-wrap">{description.content}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Edit Description Dialog */}
              <Dialog open={isEditDescriptionOpen} onOpenChange={setIsEditDescriptionOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Edit Professional Summary Description</DialogTitle>
                    <DialogDescription>
                      Update the professional summary description.
                    </DialogDescription>
                  </DialogHeader>
                  {editingDescriptionData && (
                    <EditProfessionalSummaryDescriptionForm
                      description={editingDescriptionData}
                      onSubmit={(data) => 
                        updateDescriptionMutation.mutate({ 
                          id: editingDescriptionData.id, 
                          data 
                        })
                      }
                      isSubmitting={updateDescriptionMutation.isPending}
                    />
                  )}
                </DialogContent>
              </Dialog>
              
              {/* Delete Description Dialog */}
              <Dialog open={isDeleteDescriptionOpen} onOpenChange={setIsDeleteDescriptionOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Professional Summary Description</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to delete this description?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsDeleteDescriptionOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (editingDescriptionData) {
                          deleteDescriptionMutation.mutate(editingDescriptionData.id);
                        }
                      }}
                      disabled={deleteDescriptionMutation.isPending}
                    >
                      {deleteDescriptionMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[480px] text-center">
              <FileText className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium">No Professional Summary Title Selected</h3>
              <p className="text-muted-foreground mt-1 max-w-md">
                Select a professional summary title from the left panel to view and manage its descriptions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Form to add a new professional summary title
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a category for the professional summary title
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Form to edit an existing professional summary title
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Select a category for the professional summary title
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
              <FormMessage />
            </FormItem>
          )}
        />
        
        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Form to add a new professional summary description
function AddProfessionalSummaryDescriptionForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (
    data: Omit<z.infer<typeof professionalSummaryDescriptionSchema>, "professionalSummaryTitleId">
  ) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<Omit<z.infer<typeof professionalSummaryDescriptionSchema>, "professionalSummaryTitleId">>({
    resolver: zodResolver(
      professionalSummaryDescriptionSchema.omit({ professionalSummaryTitleId: true })
    ),
    defaultValues: {
      content: "",
      isRecommended: false,
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
                  placeholder="Enter the professional summary content..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Write a description for this professional summary title.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isRecommended"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <div className="space-y-1 leading-none">
                <FormLabel>Recommended</FormLabel>
                <FormDescription>
                  Mark this as a recommended professional summary
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
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Form to edit an existing professional summary description
function EditProfessionalSummaryDescriptionForm({
  description,
  onSubmit,
  isSubmitting,
}: {
  description: ProfessionalSummaryDescription;
  onSubmit: (
    data: Omit<z.infer<typeof professionalSummaryDescriptionSchema>, "professionalSummaryTitleId">
  ) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<Omit<z.infer<typeof professionalSummaryDescriptionSchema>, "professionalSummaryTitleId">>({
    resolver: zodResolver(
      professionalSummaryDescriptionSchema.omit({ professionalSummaryTitleId: true })
    ),
    defaultValues: {
      content: description.content,
      isRecommended: description.isRecommended || false,
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
                  placeholder="Enter the professional summary content..."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isRecommended"
          render={({ field }) => (
            <FormItem className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <div className="space-y-1 leading-none">
                <FormLabel>Recommended</FormLabel>
                <FormDescription>
                  Mark this as a recommended professional summary
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
            {isSubmitting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}