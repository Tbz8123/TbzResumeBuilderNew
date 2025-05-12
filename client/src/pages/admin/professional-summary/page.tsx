import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ProfessionalSummaryTitle, ProfessionalSummaryDescription, professionalSummaryTitleSchema, professionalSummaryDescriptionSchema } from "@shared/schema";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  FileText,
  RefreshCw,
  FolderHeart
} from "lucide-react";

// Load environment variables
const API_BASE_URL = "/api/professional-summary";

// Types for API responses
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
  // Auth query to check if user is admin
  const { data: user } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user");
      return await res.json();
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <h1 className="text-xl font-bold mb-4">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <Button asChild className="mt-4">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return <ProfessionalSummaryAdmin />;
}

function ProfessionalSummaryAdmin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTitleId, setSelectedTitleId] = useState<number | null>(null);
  const [isAddTitleOpen, setIsAddTitleOpen] = useState(false);
  const [isEditTitleOpen, setIsEditTitleOpen] = useState(false);
  const [titleToEdit, setTitleToEdit] = useState<ProfessionalSummaryTitle | null>(null);
  const [isAddDescriptionOpen, setIsAddDescriptionOpen] = useState(false);
  const [isEditDescriptionOpen, setIsEditDescriptionOpen] = useState(false);
  const [descriptionToEdit, setDescriptionToEdit] = useState<ProfessionalSummaryDescription | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFormat, setUploadFormat] = useState<"json" | "csv">("csv");
  const [uploadResults, setUploadResults] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: [`${API_BASE_URL}/categories`],
    queryFn: async () => {
      const res = await apiRequest("GET", `${API_BASE_URL}/categories`);
      return await res.json();
    },
  });

  // Fetch professional summary titles with pagination
  const {
    data: titlesData,
    isLoading: isLoadingTitles,
    error: titlesError,
    refetch: refetchTitles,
  } = useQuery<PaginatedTitlesResponse>({
    queryKey: [`${API_BASE_URL}/titles`, page, searchTerm, selectedCategory],
    queryFn: async () => {
      const searchParams = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (searchTerm) {
        searchParams.append("search", searchTerm);
      }

      if (selectedCategory !== "all") {
        searchParams.append("category", selectedCategory);
      }

      const res = await apiRequest(
        "GET",
        `${API_BASE_URL}/titles?${searchParams.toString()}`
      );
      return await res.json();
    },
  });

  // Fetch descriptions for selected title
  const {
    data: descriptions = [],
    isLoading: isLoadingDescriptions,
    refetch: refetchDescriptions,
  } = useQuery<ProfessionalSummaryDescription[]>({
    queryKey: [`${API_BASE_URL}/descriptions/by-title`, selectedTitleId],
    queryFn: async () => {
      if (!selectedTitleId) return [];
      const res = await apiRequest(
        "GET",
        `${API_BASE_URL}/descriptions/by-title/${selectedTitleId}`
      );
      return await res.json();
    },
    enabled: !!selectedTitleId,
  });

  // Mutation to create a new professional summary title
  const createTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryTitleSchema>) => {
      const res = await apiRequest("POST", `${API_BASE_URL}/titles`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary title created successfully",
      });
      setIsAddTitleOpen(false);
      refetchTitles();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create professional summary title",
        variant: "destructive",
      });
      console.error("Error creating professional summary title:", error);
    },
  });

  // Mutation to update a professional summary title
  const updateTitleMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof professionalSummaryTitleSchema>;
    }) => {
      const res = await apiRequest("PUT", `${API_BASE_URL}/titles/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary title updated successfully",
      });
      setIsEditTitleOpen(false);
      setTitleToEdit(null);
      refetchTitles();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update professional summary title",
        variant: "destructive",
      });
      console.error("Error updating professional summary title:", error);
    },
  });

  // Mutation to delete a professional summary title
  const deleteTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_BASE_URL}/titles/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary title deleted successfully",
      });
      if (selectedTitleId === deleteTitleMutation.variables) {
        setSelectedTitleId(null);
      }
      refetchTitles();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete professional summary title",
        variant: "destructive",
      });
      console.error("Error deleting professional summary title:", error);
    },
  });

  // Mutation to create a new professional summary description
  const createDescriptionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof professionalSummaryDescriptionSchema>) => {
      const res = await apiRequest("POST", `${API_BASE_URL}/descriptions`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary description created successfully",
      });
      setIsAddDescriptionOpen(false);
      refetchDescriptions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create professional summary description",
        variant: "destructive",
      });
      console.error("Error creating professional summary description:", error);
    },
  });

  // Mutation to update a professional summary description
  const updateDescriptionMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: z.infer<typeof professionalSummaryDescriptionSchema>;
    }) => {
      const res = await apiRequest(
        "PUT",
        `${API_BASE_URL}/descriptions/${id}`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary description updated successfully",
      });
      setIsEditDescriptionOpen(false);
      setDescriptionToEdit(null);
      refetchDescriptions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update professional summary description",
        variant: "destructive",
      });
      console.error("Error updating professional summary description:", error);
    },
  });

  // Mutation to delete a professional summary description
  const deleteDescriptionMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `${API_BASE_URL}/descriptions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Professional summary description deleted successfully",
      });
      refetchDescriptions();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete professional summary description",
        variant: "destructive",
      });
      console.error("Error deleting professional summary description:", error);
    },
  });

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const reader = new FileReader();

      reader.onload = async (e) => {
        const content = e.target?.result as string;
        let data: any;

        if (uploadFormat === "json") {
          // For JSON files, parse the content
          try {
            data = { jsonData: JSON.parse(content) };
          } catch (error) {
            toast({
              title: "Error",
              description: "Invalid JSON file format",
              variant: "destructive",
            });
            setIsUploading(false);
            return;
          }
        } else {
          // For CSV files, send the raw content
          data = { csvData: content };
        }

        try {
          const res = await apiRequest(
            "POST",
            `${API_BASE_URL}/import/${uploadFormat}`,
            data
          );
          const result = await res.json();
          setUploadResults(result);
          toast({
            title: "Upload Complete",
            description: `Added ${result.titlesAdded} titles and ${result.descriptionsAdded} descriptions`,
          });
          refetchTitles();
          if (selectedTitleId) {
            refetchDescriptions();
          }
        } catch (error) {
          console.error("Upload error:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to process the uploaded file",
            variant: "destructive",
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the file",
          variant: "destructive",
        });
      };

      if (uploadFormat === "json") {
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Professional Summary Management</h1>
          <p className="text-gray-500">
            Manage professional summary titles and descriptions
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a
                  href={`${API_BASE_URL}/export/csv`}
                  download="professional-summaries-export.csv"
                >
                  CSV
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`${API_BASE_URL}/export/json`}
                  download="professional-summaries-export.json"
                >
                  JSON
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href={`${API_BASE_URL}/export/excel`}
                  download="professional-summaries-export.xlsx"
                >
                  Excel
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setUploadFormat("csv");
                  fileInputRef.current?.click();
                }}
              >
                CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setUploadFormat("json");
                  fileInputRef.current?.click();
                }}
              >
                JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept={
              uploadFormat === "json" ? ".json" : ".csv"
            }
            className="hidden"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Professional Summary Titles */}
        <div className="col-span-1 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Professional Summary Titles</h2>
            <Dialog open={isAddTitleOpen} onOpenChange={setIsAddTitleOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
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

          <div className="mb-4 flex gap-2">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search titles..."
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
            <Select
              value={selectedCategory}
              onValueChange={(value) => {
                setSelectedCategory(value);
                setPage(1); // Reset to first page on category change
              }}
            >
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: string) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoadingTitles ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin h-6 w-6 border-2 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
          ) : titlesError ? (
            <div className="text-center p-4 text-red-500">
              Error loading professional summary titles
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-md border mb-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {titlesData?.data && titlesData.data.length > 0 ? (
                      titlesData.data.map((title) => (
                        <TableRow
                          key={title.id}
                          className={
                            selectedTitleId === title.id
                              ? "bg-purple-50"
                              : undefined
                          }
                        >
                          <TableCell
                            className="font-medium cursor-pointer"
                            onClick={() => setSelectedTitleId(title.id)}
                          >
                            {title.title}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{title.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setTitleToEdit(title);
                                    setIsEditTitleOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedTitleId(title.id);
                                  }}
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Descriptions
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-500"
                                  onClick={() => {
                                    if (
                                      window.confirm(
                                        `Are you sure you want to delete "${title.title}"? This will also delete all associated descriptions.`
                                      )
                                    ) {
                                      deleteTitleMutation.mutate(title.id);
                                    }
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-gray-500"
                        >
                          No professional summary titles found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {titlesData?.pagination && titlesData.pagination.totalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page > 1) setPage(page - 1);
                        }}
                        className={page === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: titlesData.pagination.totalPages }, (_, i) => i + 1).map(
                      (pageNumber) => (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setPage(pageNumber);
                            }}
                            isActive={pageNumber === page}
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (page < titlesData.pagination.totalPages)
                            setPage(page + 1);
                        }}
                        className={
                          page === titlesData.pagination.totalPages
                            ? "pointer-events-none opacity-50"
                            : ""
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>

        {/* Right Column - Descriptions */}
        <div className="col-span-2 border rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {selectedTitleId ? (
                <>
                  Professional Summary Descriptions
                  {titlesData?.data && (
                    <span className="text-sm font-normal ml-2 text-gray-500">
                      for{" "}
                      {titlesData.data.find((t) => t.id === selectedTitleId)?.title}
                    </span>
                  )}
                </>
              ) : (
                "Select a title to view descriptions"
              )}
            </h2>
            {selectedTitleId && (
              <Dialog
                open={isAddDescriptionOpen}
                onOpenChange={setIsAddDescriptionOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Description
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Professional Summary Description</DialogTitle>
                    <DialogDescription>
                      Create a new professional summary description for{" "}
                      {
                        titlesData?.data.find((t) => t.id === selectedTitleId)
                          ?.title
                      }
                      .
                    </DialogDescription>
                  </DialogHeader>
                  <AddProfessionalSummaryDescriptionForm
                    onSubmit={(data) =>
                      createDescriptionMutation.mutate({
                        ...data,
                        professionalSummaryTitleId: selectedTitleId as number,
                      })
                    }
                    isSubmitting={createDescriptionMutation.isPending}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>

          {!selectedTitleId ? (
            <div className="flex flex-col items-center justify-center h-60 text-gray-500">
              <FolderHeart className="h-12 w-12 mb-2 text-gray-300" />
              <p>Select a professional summary title to view descriptions</p>
            </div>
          ) : isLoadingDescriptions ? (
            <div className="flex justify-center items-center h-60">
              <div className="animate-spin h-6 w-6 border-2 border-purple-500 rounded-full border-t-transparent"></div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4 pr-4">
                {descriptions.length > 0 ? (
                  descriptions.map((description) => (
                    <div
                      key={description.id}
                      className={`border rounded-lg p-4 ${
                        description.isRecommended
                          ? "border-purple-300 bg-purple-50"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          {description.isRecommended && (
                            <Badge className="mb-2 bg-purple-500">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => {
                                setDescriptionToEdit(description);
                                setIsEditDescriptionOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-500"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    "Are you sure you want to delete this description?"
                                  )
                                ) {
                                  deleteDescriptionMutation.mutate(
                                    description.id
                                  );
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">
                        {description.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-8 text-gray-500">
                    No descriptions found for this title. Add one using the
                    button above.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </div>

      {/* Edit Professional Summary Title Dialog */}
      <Dialog open={isEditTitleOpen} onOpenChange={setIsEditTitleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Professional Summary Title</DialogTitle>
            <DialogDescription>
              Update the professional summary title details.
            </DialogDescription>
          </DialogHeader>
          {titleToEdit && (
            <EditProfessionalSummaryTitleForm
              title={titleToEdit}
              onSubmit={(data) =>
                updateTitleMutation.mutate({
                  id: titleToEdit.id,
                  data,
                })
              }
              isSubmitting={updateTitleMutation.isPending}
              categories={categories}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Professional Summary Description Dialog */}
      <Dialog open={isEditDescriptionOpen} onOpenChange={setIsEditDescriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Professional Summary Description</DialogTitle>
            <DialogDescription>
              Update the professional summary description details.
            </DialogDescription>
          </DialogHeader>
          {descriptionToEdit && (
            <EditProfessionalSummaryDescriptionForm
              description={descriptionToEdit}
              onSubmit={(data) =>
                updateDescriptionMutation.mutate({
                  id: descriptionToEdit.id,
                  data: {
                    ...data,
                    professionalSummaryTitleId: descriptionToEdit.professionalSummaryTitleId,
                  },
                })
              }
              isSubmitting={updateDescriptionMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Results Dialog */}
      <Dialog
        open={!!uploadResults}
        onOpenChange={(open) => {
          if (!open) setUploadResults(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Complete</DialogTitle>
            <DialogDescription>
              Results of your file upload.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>
                Added {uploadResults?.titlesAdded} professional summary titles and{" "}
                {uploadResults?.descriptionsAdded} descriptions
              </span>
            </div>
            {uploadResults?.errors && uploadResults.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-500 mb-2 flex items-center">
                  <XCircle className="h-5 w-5 mr-1" />
                  Errors
                </h3>
                <div className="bg-red-50 p-3 rounded-md max-h-40 overflow-y-auto text-sm">
                  <ul className="list-disc pl-5 space-y-1">
                    {uploadResults.errors.map((error: string, idx: number) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                setUploadResults(null);
              }}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
                <Input placeholder="e.g. Software Developer" {...field} />
              </FormControl>
              <FormDescription>
                The job title or role for this professional summary.
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The category this professional summary belongs to.
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
                  placeholder="A brief description of this job title or role"
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
                Saving...
              </>
            ) : (
              "Save"
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
                <Input {...field} />
              </FormControl>
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
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                <Textarea {...field} />
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
                  placeholder="Enter the professional summary content here..."
                  className="min-h-[150px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Write a professional summary that could be used on a resume.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="isRecommended"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
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
                Saving...
              </>
            ) : (
              "Save"
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
                  className="min-h-[150px]"
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
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
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