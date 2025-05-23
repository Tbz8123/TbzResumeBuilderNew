import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Skill, 
  SkillCategory, 
  JobTitle, 
  SkillJobTitle,
  skillSchema, 
  skillCategorySchema,
  skillJobTitleSchema
} from "@shared/schema";
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
  Code,
  Briefcase,
  ExternalLink,
  FolderOpen,
  Import
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function SkillsAdminPage() {
  const { toast } = useToast();
  
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [jobTitleSearchQuery, setJobTitleSearchQuery] = useState("");
  const [skillJobTitleSearchQuery, setSkillJobTitleSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | null>(null);
  const [selectedJobTitle, setSelectedJobTitle] = useState<JobTitle | null>(null);
  const [selectedSkillJobTitle, setSelectedSkillJobTitle] = useState<SkillJobTitle | null>(null);
  const [page, setPage] = useState(1);
  const [jobTitlePage, setJobTitlePage] = useState(1);
  const [skillJobTitlePage, setSkillJobTitlePage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [jobTitleTotalPages, setJobTitleTotalPages] = useState(1);
  const [skillJobTitleTotalPages, setSkillJobTitleTotalPages] = useState(1);
  const [useSkillJobTitles, setUseSkillJobTitles] = useState(true); // Toggle between job titles and skill job titles
  const [isCopyingJobTitles, setIsCopyingJobTitles] = useState(false);
  
  // Dialog state
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillJobTitleDialogOpen, setSkillJobTitleDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SkillCategory | null>(null);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [editingSkillJobTitle, setEditingSkillJobTitle] = useState<SkillJobTitle | null>(null);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [deleteSkillDialogOpen, setDeleteSkillDialogOpen] = useState(false);
  const [deleteSkillJobTitleDialogOpen, setDeleteSkillJobTitleDialogOpen] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState<SkillCategory | null>(null);
  const [deletingSkill, setDeletingSkill] = useState<Skill | null>(null);
  const [deletingSkillJobTitle, setDeletingSkillJobTitle] = useState<SkillJobTitle | null>(null);
  
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
  
  const skillJobTitleForm = useForm<z.infer<typeof skillJobTitleSchema>>({
    resolver: zodResolver(skillJobTitleSchema),
    defaultValues: {
      title: "",
      category: "",
      description: "",
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
  
  // Set form values when editing skill job titles
  useEffect(() => {
    if (editingSkillJobTitle) {
      skillJobTitleForm.reset({
        title: editingSkillJobTitle.title,
        category: editingSkillJobTitle.category,
        description: editingSkillJobTitle.description || "",
      });
    }
  }, [editingSkillJobTitle, skillJobTitleForm]);
  
  // Helper function to get a category ID for a job title
  const getCategoryIdForJobTitle = (jobTitle: JobTitle): number => {
    // Map job title categories to skill categories
    // This is a temporary solution during transition
    const categoryMappings: Record<string, number> = {
      'Technology': 1,
      'Development': 1,
      'Data': 1,
      'Design': 5,
      'Management': 3,
      'Marketing': 4,
      'Sales': 4,
      'Support': 6,
      'Finance': 2,
      'HR': 3,
      'Legal': 2,
      'Operations': 3,
      'Product': 1,
      'Research': 1
    };
    
    // Use the mapping or fall back to a default category (1 for Technical)
    return categoryMappings[jobTitle.category] || 1;
  };

  useEffect(() => {
    if (editingSkill) {
      skillForm.reset({
        name: editingSkill.name,
        categoryId: editingSkill.categoryId,
        description: editingSkill.description || "",
        isRecommended: editingSkill.isRecommended,
      });
    } else if (useSkillJobTitles && selectedSkillJobTitle) {
      // For skill job title selected, use an appropriate category
      const suggestedCategoryId = getCategoryIdForJobTitle(selectedSkillJobTitle);
      console.log(`Initializing form for skill job title: ${selectedSkillJobTitle.title} with category ID: ${suggestedCategoryId}`);
      skillForm.reset({
        name: "",
        categoryId: suggestedCategoryId,
        description: "",
        isRecommended: true, // Default to recommended for new skills added to job titles
      });
    } else if (selectedJobTitle) {
      // For job title selected, use an appropriate category
      // This is needed until we fully transition to job-title based skills
      const suggestedCategoryId = getCategoryIdForJobTitle(selectedJobTitle);
      skillForm.reset({
        name: "",
        categoryId: suggestedCategoryId,
        description: "",
        isRecommended: false,
      });
    } else if (selectedCategory) {
      skillForm.reset({
        name: "",
        categoryId: selectedCategory.id,
        description: "",
        isRecommended: false,
      });
    }
  }, [editingSkill, skillForm, selectedCategory, selectedJobTitle]);
  
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
  
  // Fetch job titles
  const { data: jobTitlesData, isLoading: isLoadingJobTitles } = useQuery({
    queryKey: ['/api/jobs/titles', jobTitlePage, jobTitleSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', jobTitlePage.toString());
      params.append('limit', '10');
      
      if (jobTitleSearchQuery) {
        params.append('search', jobTitleSearchQuery);
      }
      
      const res = await fetch(`/api/jobs/titles?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch job titles');
      }
      return await res.json();
    },
  });
  
  // Fetch skill job titles (separate from job descriptions titles)
  const { data: skillJobTitlesData, isLoading: isLoadingSkillJobTitles } = useQuery({
    queryKey: ['/api/skills/job-titles', skillJobTitlePage, skillJobTitleSearchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', skillJobTitlePage.toString());
      params.append('limit', '10');
      
      if (skillJobTitleSearchQuery) {
        params.append('search', skillJobTitleSearchQuery);
      }
      
      const res = await fetch(`/api/skills/job-titles?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch skill job titles');
      }
      return await res.json();
    },
    enabled: useSkillJobTitles, // Only fetch when we're using skill job titles
  });
  
  // Derive categories and total pages from data
  const categories = categoriesData || [];
  useEffect(() => {
    if (categoriesData && 'total' in categoriesData) {
      setTotalPages(Math.ceil(categoriesData.total / 10) || 1);
    }
  }, [categoriesData]);
  
  // Derive job titles and their total pages from data
  const jobTitles = jobTitlesData?.data || [];
  useEffect(() => {
    if (jobTitlesData && jobTitlesData.total) {
      setJobTitleTotalPages(Math.ceil(jobTitlesData.total / 10) || 1);
    }
  }, [jobTitlesData]);
  
  // Derive skill job titles and their total pages from data
  const skillJobTitles = skillJobTitlesData?.data || [];
  useEffect(() => {
    if (skillJobTitlesData && skillJobTitlesData.pagination?.total) {
      setSkillJobTitleTotalPages(Math.ceil(skillJobTitlesData.pagination.total / 10) || 1);
    }
  }, [skillJobTitlesData]);
  
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
  
  // Fetch skills for selected job title
  const { data: jobTitleSkillsData = [], isLoading: isLoadingJobTitleSkills } = useQuery({
    queryKey: ['/api/skills/by-job-title', selectedJobTitle?.id],
    queryFn: async () => {
      if (!selectedJobTitle) return [];
      
      const res = await fetch(`/api/skills/by-job-title/${selectedJobTitle.id}`);
      if (!res.ok) {
        throw new Error('Failed to fetch skills for job title');
      }
      return await res.json();
    },
    enabled: !!selectedJobTitle,
  });
  
  // Fetch skills for selected skill job title
  const { data: skillJobTitleSkillsData = [], isLoading: isLoadingSkillJobTitleSkills, refetch: refetchSkillJobTitleSkills } = useQuery({
    queryKey: ['/api/skills/by-skill-job-title', selectedSkillJobTitle?.id],
    queryFn: async () => {
      if (!selectedSkillJobTitle) return [];
      
      console.log(`Fetching skills for skill job title ID: ${selectedSkillJobTitle.id}`);
      const res = await fetch(`/api/skills/by-skill-job-title/${selectedSkillJobTitle.id}?t=${Date.now()}`); // Add timestamp to prevent caching
      if (!res.ok) {
        throw new Error('Failed to fetch skills for skill job title');
      }
      const data = await res.json();
      console.log(`Fetched ${data.length} skills for skill job title ID: ${selectedSkillJobTitle.id}`);
      console.log("Skills data:", data);
      return data;
    },
    enabled: !!selectedSkillJobTitle && useSkillJobTitles,
    staleTime: 0, // Always revalidate when requested
    refetchOnWindowFocus: true,
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
      console.log("Creating skill with data:", data);
      
      // Prepare the standard skill data (name, categoryId, description, isRecommended)
      const skillData = {
        name: data.name,
        categoryId: data.categoryId,
        description: data.description || null,
        isRecommended: data.isRecommended || false
      };
      
      let url = '/api/skills';
      
      // If we're associating with a skill job title, use a different endpoint
      if (useSkillJobTitles && selectedSkillJobTitle) {
        console.log(`Creating skill for skill job title: ${selectedSkillJobTitle.id} - ${selectedSkillJobTitle.title}`);
        
        // First, check if a skill with this name already exists
        console.log(`Checking if skill with name "${skillData.name}" already exists`);
        try {
          // Check for existing skills with this name
          const checkRes = await apiRequest('GET', `/api/skills/search?name=${encodeURIComponent(skillData.name)}`);
          const existingSkills = await checkRes.json();
          
          let skillId;
          
          if (existingSkills && existingSkills.length > 0) {
            // Use the existing skill
            console.log(`Found existing skill with name "${skillData.name}", ID: ${existingSkills[0].id}`);
            skillId = existingSkills[0].id;
          } else {
            // Create a new skill
            const createRes = await apiRequest('POST', '/api/skills', skillData);
            const newSkill = await createRes.json();
            skillId = newSkill.id;
            console.log(`Created new skill with name "${skillData.name}", ID: ${skillId}`);
          }
          
          if (skillId) {
            // Create the association with the skill job title
            console.log(`Creating association between skill ${skillId} and skill job title ${selectedSkillJobTitle.id}`);
            try {
              const associationRes = await apiRequest(
                'POST', 
                `/api/skills/job-titles/${selectedSkillJobTitle.id}/skills`,
                { 
                  skillId: skillId,
                  isRecommended: data.isRecommended || false 
                }
              );
              
              // Return a successful result with the skill data
              return {
                id: skillId,
                name: skillData.name,
                categoryId: skillData.categoryId,
                description: skillData.description,
                isRecommended: data.isRecommended || false
              };
            } catch (associationError) {
              // Handle the case where the association already exists
              if (associationError.message && associationError.message.includes('already exists')) {
                console.log(`Association already exists between skill ${skillId} and job title ${selectedSkillJobTitle.id}`);
                
                // Update the existing association instead
                try {
                  const updateRes = await apiRequest(
                    'PUT', 
                    `/api/skills/job-titles/${selectedSkillJobTitle.id}/skills/${skillId}`,
                    { isRecommended: data.isRecommended || false }
                  );
                  console.log(`Updated existing association for skill ${skillId}`);
                  
                  // Return a successful result
                  return {
                    id: skillId,
                    name: skillData.name,
                    categoryId: skillData.categoryId,
                    description: skillData.description,
                    isRecommended: data.isRecommended || false
                  };
                } catch (updateError) {
                  console.error("Error updating association:", updateError);
                  throw new Error("Failed to update skill association");
                }
              }
              
              console.error("Error creating association:", associationError);
              throw new Error("Failed to associate skill with job title");
            }
          }
          
          throw new Error("Failed to create or find skill");
        } catch (error) {
          console.error("Error in skill creation process:", error);
          throw error;
        }
      } else if (selectedJobTitle) {
        // For regular job titles, we'll pass the jobTitleId as a query parameter
        console.log(`Creating skill for job title: ${selectedJobTitle.id} - ${selectedJobTitle.title}`);
        const res = await apiRequest('POST', '/api/skills', {
          ...skillData,
          jobTitleId: selectedJobTitle.id
        });
        return await res.json();
      } else {
        // Regular skill creation without association
        const res = await apiRequest('POST', '/api/skills', skillData);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Explicitly refetch the data instead of just invalidating
      if (useSkillJobTitles && selectedSkillJobTitle) {
        // Directly refetch the skill job title skills
        refetchSkillJobTitleSkills();
        console.log("Refetching skills for skill job title");
      } else if (selectedJobTitle) {
        // Invalidate the job title skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills/by-job-title', selectedJobTitle.id] });
      }
      if (selectedCategory) {
        // Invalidate the category skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      }
      
      toast({
        title: "Success",
        description: useSkillJobTitles && selectedSkillJobTitle
          ? `Skill added to ${selectedSkillJobTitle.title} successfully`
          : selectedJobTitle 
            ? `Skill added to ${selectedJobTitle.title} successfully`
            : "Skill created successfully",
      });
      
      setSkillDialogOpen(false);
      skillForm.reset({
        name: "",
        categoryId: useSkillJobTitles && selectedSkillJobTitle
          ? getCategoryIdForJobTitle(selectedSkillJobTitle)
          : selectedJobTitle 
            ? getCategoryIdForJobTitle(selectedJobTitle)
            : selectedCategory?.id || 0,
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
      console.log("Updating skill:", data);
      
      // Prepare the standard skill data for update
      const skillData = {
        id: data.id,
        name: data.name,
        categoryId: data.categoryId,
        description: data.description || null,
        isRecommended: data.isRecommended || false
      };
      
      // Update the skill in the skills table
      const res = await apiRequest('PUT', `/api/skills/${data.id}`, skillData);
      const updatedSkill = await res.json();
      
      // If we're in skill job title mode, we also need to update the relationship's isRecommended flag
      if (useSkillJobTitles && selectedSkillJobTitle) {
        console.log(`Updating association between skill ${data.id} and skill job title ${selectedSkillJobTitle.id}`);
        
        try {
          // Update the relationship's isRecommended status
          const updateRelationRes = await apiRequest(
            'PUT', 
            `/api/skills/job-titles/${selectedSkillJobTitle.id}/skills/${data.id}`,
            { isRecommended: data.isRecommended || false }
          );
          console.log("Relationship updated successfully");
        } catch (error) {
          console.error("Error updating skill relationship:", error);
          // We don't throw here as the skill was successfully updated
        }
      }
      
      return updatedSkill;
    },
    onSuccess: () => {
      // Invalidate the appropriate queries
      if (useSkillJobTitles && selectedSkillJobTitle) {
        // Invalidate the skill job title skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills/by-skill-job-title', selectedSkillJobTitle.id] });
      } else if (selectedJobTitle) {
        // Invalidate the job title skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills/by-job-title', selectedJobTitle.id] });
      }
      
      // Always invalidate the category skills
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      }
      
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
      console.log(`Deleting skill with ID: ${id}`);
      
      // If we're in the skill job title mode, we need to remove the association first
      if (useSkillJobTitles && selectedSkillJobTitle && deletingSkill) {
        console.log(`Removing skill ${id} from skill job title ${selectedSkillJobTitle.id}`);
        
        try {
          // Remove the association between skill and skill job title
          const removeRes = await apiRequest(
            'DELETE', 
            `/api/skills/job-titles/${selectedSkillJobTitle.id}/skills/${id}`
          );
          console.log("Association removed successfully");
          
          // We don't delete the actual skill, just remove the association
          return { success: true };
        } catch (error) {
          console.error("Error removing skill association:", error);
          throw new Error("Failed to remove skill association");
        }
      } else {
        // Regular skill deletion
        const res = await apiRequest('DELETE', `/api/skills/${id}`);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Invalidate the appropriate queries
      if (useSkillJobTitles && selectedSkillJobTitle) {
        // Invalidate the skill job title skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills/by-skill-job-title', selectedSkillJobTitle.id] });
      } else if (selectedJobTitle) {
        // Invalidate the job title skills query
        queryClient.invalidateQueries({ queryKey: ['/api/skills/by-job-title', selectedJobTitle.id] });
      }
      
      // Always invalidate the category skills
      if (selectedCategory) {
        queryClient.invalidateQueries({ queryKey: ['/api/skills', selectedCategory?.id] });
      }
      
      toast({
        title: "Success",
        description: useSkillJobTitles && selectedSkillJobTitle 
          ? "Skill removed from job title successfully"
          : "Skill deleted successfully",
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
  
  // Skill Job Title Mutations
  const createSkillJobTitleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof skillJobTitleSchema>) => {
      const res = await apiRequest('POST', '/api/skills/job-titles', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/job-titles'] });
      toast({
        title: "Success",
        description: "Skill job title created successfully",
      });
      setSkillJobTitleDialogOpen(false);
      skillJobTitleForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateSkillJobTitleMutation = useMutation({
    mutationFn: async (data: SkillJobTitle) => {
      const res = await apiRequest('PUT', `/api/skills/job-titles/${data.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedJobTitle) => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/job-titles'] });
      
      // If this is the selected job title, update it
      if (selectedSkillJobTitle?.id === updatedJobTitle.id) {
        setSelectedSkillJobTitle(updatedJobTitle);
      }
      
      toast({
        title: "Success",
        description: "Skill job title updated successfully",
      });
      setSkillJobTitleDialogOpen(false);
      setEditingSkillJobTitle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const deleteSkillJobTitleMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('DELETE', `/api/skills/job-titles/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/job-titles'] });
      
      // Clear selection if the deleted job title was selected
      if (selectedSkillJobTitle?.id === deletingSkillJobTitle?.id) {
        setSelectedSkillJobTitle(null);
      }
      
      toast({
        title: "Success",
        description: "Skill job title deleted successfully",
      });
      setDeleteSkillJobTitleDialogOpen(false);
      setDeletingSkillJobTitle(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation to copy job titles from jobs page to skills page
  const copyJobTitlesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/skills/copy-job-titles', {});
      return await res.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/skills/job-titles'] });
      
      toast({
        title: "Success",
        description: `Successfully copied ${result.stats.created} job titles (${result.stats.skipped} already existed)`,
      });
      setIsCopyingJobTitles(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setIsCopyingJobTitles(false);
    },
  });

  // Form submit handler for skill job titles
  const onSkillJobTitleFormSubmit = (data: z.infer<typeof skillJobTitleSchema>) => {
    // Format data to handle nulls
    const formattedData = {
      ...data,
      description: data.description || '',
      title: data.title || '',
      category: data.category || '',
    };
    
    if (editingSkillJobTitle) {
      // Update existing skill job title
      updateSkillJobTitleMutation.mutate({
        ...editingSkillJobTitle,
        ...formattedData
      });
    } else {
      // Create new skill job title
      createSkillJobTitleMutation.mutate(formattedData);
    }
  };
  
  // Handlers for skill job title skills
  const handleAddSkillToSkillJobTitle = () => {
    console.log("Adding skill for skill job title:", selectedSkillJobTitle);
    setEditingSkill(null);
    setSkillDialogOpen(true);
  };
  
  const handleEditSkillForSkillJobTitle = (skill: any) => {
    console.log("Editing skill for skill job title:", skill);
    setEditingSkill(skill);
    setSkillDialogOpen(true);
  };
  
  const handleDeleteSkillFromSkillJobTitle = (skill: any) => {
    console.log("Deleting skill from skill job title:", skill);
    setDeletingSkill(skill);
    setDeleteSkillDialogOpen(true);
  };

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
        {/* Left Panel: Job Titles */}
        <div className="md:col-span-1">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Search className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Search Job Titles</h2>
                  </div>
                  <Button 
                    variant="default" 
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={() => {
                      setSkillJobTitleDialogOpen(true);
                      setEditingSkillJobTitle(null);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Title
                  </Button>
                </div>
                
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder="Search job titles..."
                    value={useSkillJobTitles ? skillJobTitleSearchQuery : jobTitleSearchQuery}
                    onChange={(e) => useSkillJobTitles 
                      ? setSkillJobTitleSearchQuery(e.target.value) 
                      : setJobTitleSearchQuery(e.target.value)
                    }
                  />
                </div>
              </div>

              {useSkillJobTitles ? (
                // Skill Job Titles Section
                <>
                  <div className="flex justify-between items-center p-4 border-b">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSkillJobTitleDialogOpen(true);
                          setEditingSkillJobTitle(null);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Custom Job Title
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setIsCopyingJobTitles(true);
                          copyJobTitlesMutation.mutate();
                        }}
                        disabled={isCopyingJobTitles || copyJobTitlesMutation.isPending}
                      >
                        {isCopyingJobTitles || copyJobTitlesMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Copying...
                          </>
                        ) : (
                          <>
                            <Import className="h-4 w-4 mr-1" />
                            Copy From Job Titles
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                
                  {isLoadingSkillJobTitles ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading skill job titles...</p>
                    </div>
                  ) : skillJobTitles.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No custom job titles found</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => {
                          setSkillJobTitleDialogOpen(true);
                          setEditingSkillJobTitle(null);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add a custom job title
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-16rem)]">
                      <div className="p-4">
                        {skillJobTitles.map((jobTitle: any) => (
                          <div
                            key={jobTitle.id}
                            className={`py-2 px-3 mb-2 rounded-md cursor-pointer ${
                              selectedSkillJobTitle?.id === jobTitle.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            }`}
                            onClick={() => {
                              if (selectedSkillJobTitle?.id === jobTitle.id) {
                                setSelectedSkillJobTitle(null);
                              } else {
                                setSelectedSkillJobTitle(jobTitle);
                                setSelectedCategory(null);
                                setSelectedJobTitle(null);
                              }
                            }}
                          >
                            <div className="font-medium">{jobTitle.title}</div>
                            <div className="text-xs opacity-70">{jobTitle.category}</div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 float-right -mt-6"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSkillJobTitle(jobTitle);
                                    setSkillJobTitleDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingSkillJobTitle(jobTitle);
                                    setDeleteSkillJobTitleDialogOpen(true);
                                  }}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {/* Pagination for skill job titles */}
                  <div className="p-4 border-t flex items-center justify-between">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSkillJobTitlePage((prev) => Math.max(prev - 1, 1))}
                      disabled={skillJobTitlePage === 1 || isLoadingSkillJobTitles}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Page {skillJobTitlePage} of {skillJobTitleTotalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSkillJobTitlePage((prev) => prev + 1)}
                      disabled={skillJobTitlePage >= skillJobTitleTotalPages || isLoadingSkillJobTitles}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                // Standard Job Titles Section
                <>
                  {isLoadingJobTitles ? (
                    <div className="p-8 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                      <p className="mt-2 text-muted-foreground">Loading job titles...</p>
                    </div>
                  ) : jobTitles.length === 0 ? (
                    <div className="p-8 text-center">
                      <p className="text-muted-foreground">No job titles found</p>
                      <Button 
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setSkillJobTitleDialogOpen(true);
                          setEditingSkillJobTitle(null);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Job Title
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="h-[calc(100vh-320px)]">
                      <div className="divide-y">
                        {jobTitles.map((jobTitle: JobTitle) => (
                          <div
                            key={jobTitle.id}
                            className={`py-4 px-6 cursor-pointer hover:bg-gray-50 transition-colors ${selectedJobTitle?.id === jobTitle.id ? 'bg-gray-50' : ''}`}
                            onClick={() => setSelectedJobTitle(jobTitle)}
                          >
                            <div className="font-medium text-lg">{jobTitle.title}</div>
                            <div className="mt-1">
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-normal">
                                {jobTitle.category}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}

                  {jobTitleTotalPages > 1 && (
                    <div className="flex justify-between p-4 border-t">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setJobTitlePage(Math.max(1, jobTitlePage - 1))}
                        disabled={jobTitlePage === 1}
                        className="text-gray-500"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Prev
                      </Button>
                      <span className="text-sm py-2 text-gray-500">
                        Page {jobTitlePage} of {jobTitleTotalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setJobTitlePage(Math.min(jobTitleTotalPages, jobTitlePage + 1))}
                        disabled={jobTitlePage === jobTitleTotalPages}
                        className="text-gray-500"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
              {/* End of useSkillJobTitles section */}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Skills */}
        <div className="md:col-span-2">
          <Card className="shadow-md h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <h3 className="text-lg font-semibold">
                    {useSkillJobTitles && selectedSkillJobTitle ? (
                      <>🛠️ Skills for "{selectedSkillJobTitle.title}"</>
                    ) : selectedJobTitle ? (
                      <>🛠️ Skills for "{selectedJobTitle.title}"</>
                    ) : (
                      <>🛠️ Skills</>
                    )}
                  </h3>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="outline"
                          disabled={!selectedJobTitle}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          Export
                          <ChevronDown className="h-4 w-4 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleExportData('csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleExportData('json')}>
                          <FileJson className="h-4 w-4 mr-2" />
                          Export as JSON
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        setSearchQuery('');
                      }}
                      disabled={!(selectedJobTitle || (useSkillJobTitles && selectedSkillJobTitle)) || !searchQuery}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Clear Search
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="default"
                      onClick={() => {
                        setEditingSkill(null);
                        setSkillDialogOpen(true);
                      }}
                      disabled={!(selectedJobTitle || (useSkillJobTitles && selectedSkillJobTitle))}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Skill
                    </Button>
                  </div>
                
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    className="pl-9"
                    placeholder={selectedJobTitle ? "Search skills..." : "Select a job title first..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={!selectedJobTitle}
                  />
                </div>
              </div>

              {(!selectedJobTitle && !selectedSkillJobTitle) ? (
                <div className="flex flex-col items-center justify-center p-8 h-[calc(100vh-280px)]">
                  <div className="rounded-full bg-gray-100 p-3 mb-4">
                    <Briefcase className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Select a Job Title</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Choose a job title from the list on the left to view, add, or edit skills for that job.
                  </p>
                </div>
              ) : (isLoadingJobTitleSkills || isLoadingSkillJobTitleSkills) ? (
                <div className="p-8 text-center h-[calc(100vh-280px)] flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                  <p className="mt-2 text-muted-foreground">
                    Loading skills for {selectedJobTitle?.title || selectedSkillJobTitle?.title || "selected job"}...
                  </p>
                </div>
              ) : (useSkillJobTitles && selectedSkillJobTitle ? 
                  skillJobTitleSkillsData?.length === 0 : 
                  jobTitleSkillsData?.length === 0) ? (
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
                      <h3 className="text-xl font-medium mb-2">No skills for this job title</h3>
                      <p className="text-muted-foreground mb-4">
                        Add skills for this job title to get started.
                      </p>
                    </>
                  )}
                  <Button
                    onClick={handleAddSkillToSkillJobTitle}
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
                      {/* Debug output to check data */}
                      <TableRow>
                        <TableCell colSpan={3} className="bg-muted/20 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <div>Mode: {useSkillJobTitles ? 'Skill Job Titles' : 'Regular Job Titles'}</div>
                              <div>Selected Job Title: {selectedSkillJobTitle?.title || selectedJobTitle?.title || 'None'}</div>
                              <div>Selected Job Title ID: {selectedSkillJobTitle?.id || selectedJobTitle?.id || 'None'}</div>
                              <div>Skills Count: {useSkillJobTitles && selectedSkillJobTitle 
                                ? skillJobTitleSkillsData?.length || 0 
                                : jobTitleSkillsData?.length || 0} skills</div>
                              {useSkillJobTitles && selectedSkillJobTitle && (
                                <div className="mt-1 pt-1 border-t border-dashed border-gray-200">
                                  <div>First skills: {
                                    skillJobTitleSkillsData && skillJobTitleSkillsData.length > 0 
                                    ? skillJobTitleSkillsData.slice(0, 2).map((s: any) => `${s.name} (${s.id})`).join(', ')
                                    : 'None'
                                  }</div>
                                </div>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (useSkillJobTitles && selectedSkillJobTitle) {
                                  console.log(`Manually refetching skills for skill job title ID: ${selectedSkillJobTitle.id}`);
                                  
                                  // Force a refetch by invalidating the cache
                                  queryClient.invalidateQueries({ 
                                    queryKey: ['/api/skills/by-skill-job-title', selectedSkillJobTitle.id] 
                                  });
                                  
                                  // Then explicitly refetch
                                  refetchSkillJobTitleSkills();
                                }
                              }}
                              className="ml-2"
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Refresh Skills List
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Display Empty State if No Skills - Fixed Condition */}
                      {useSkillJobTitles && selectedSkillJobTitle && 
                        skillJobTitleSkillsData && skillJobTitleSkillsData.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center py-8">
                              <div className="flex flex-col items-center justify-center">
                                <div className="text-lg font-medium">No skills found</div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  Add skills to this job title using the button above.
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      }

                      {/* Add a row specifically for display debug info */}
                      <TableRow className="bg-purple-50">
                        <TableCell colSpan={3} className="text-xs">
                          <div className="text-purple-700 font-mono">
                            <div>Data Length: {useSkillJobTitles && selectedSkillJobTitle ? skillJobTitleSkillsData?.length : jobTitleSkillsData?.length} skills</div>
                            <div>First 3 skills: {
                              useSkillJobTitles && selectedSkillJobTitle && skillJobTitleSkillsData?.length > 0 
                                ? skillJobTitleSkillsData.slice(0, 3).map((s: any) => s.name).join(', ') 
                                : 'None'
                            }</div>
                          </div>
                        </TableCell>
                      </TableRow>
                      
                      {/* Actual skills list - corrected to ensure proper rendering */}
                      {(useSkillJobTitles && selectedSkillJobTitle && skillJobTitleSkillsData
                        ? [...skillJobTitleSkillsData] 
                        : jobTitleSkillsData ? [...jobTitleSkillsData] : [])
                        .filter((skill: Skill) => !searchQuery.trim() || 
                          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase()))
                        )
                        .map((skill: Skill) => (
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
                              onClick={() => handleEditSkillForSkillJobTitle(skill)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteSkillFromSkillJobTitle(skill)}
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
                : selectedJobTitle 
                  ? `Create a new skill for the job title "${selectedJobTitle.title}".`
                  : "Create a new skill in the selected category."}
            </DialogDescription>
          </DialogHeader>

          <Form {...skillForm}>
            <form onSubmit={skillForm.handleSubmit((data) => {
              // Ensure we have valid data with defaults for nullable fields
              const formattedData = {
                ...data,
                description: data.description || "",
                isRecommended: data.isRecommended === true,
              };
              
              if (editingSkill) {
                updateSkillMutation.mutate({
                  ...editingSkill,
                  name: formattedData.name,
                  categoryId: formattedData.categoryId,
                  description: formattedData.description,
                  isRecommended: formattedData.isRecommended,
                });
              } else {
                createSkillMutation.mutate(formattedData);
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
                      <div className="flex items-center space-x-2">
                        <FormLabel>Category</FormLabel>
                        {selectedJobTitle && !useSkillJobTitles && (
                          <Badge variant="outline" className="bg-muted/50">
                            For {selectedJobTitle.title}
                          </Badge>
                        )}
                        {useSkillJobTitles && selectedSkillJobTitle && (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">
                            For {selectedSkillJobTitle.title}
                          </Badge>
                        )}
                      </div>
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
                          value={field.value || ''}
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
                          checked={field.value || false}
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

      {/* Skill Job Title Dialog */}
      <Dialog open={skillJobTitleDialogOpen} onOpenChange={setSkillJobTitleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSkillJobTitle ? 'Edit Job Title' : 'Add Job Title'}
            </DialogTitle>
            <DialogDescription>
              {editingSkillJobTitle 
                ? 'Update the job title details below.'
                : 'Enter the details for the new job title below.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...skillJobTitleForm}>
            <form onSubmit={skillJobTitleForm.handleSubmit(onSkillJobTitleFormSubmit)} className="space-y-6">
              <FormField
                control={skillJobTitleForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter job title..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={skillJobTitleForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Technology">Technology</SelectItem>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Data">Data</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Support">Support</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Legal">Legal</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                        <SelectItem value="Research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={skillJobTitleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter job title description..." 
                        className="resize-none h-24"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSkillJobTitleDialogOpen(false);
                    setEditingSkillJobTitle(null);
                    skillJobTitleForm.reset();
                  }}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createSkillJobTitleMutation.isPending || updateSkillJobTitleMutation.isPending}>
                  {(createSkillJobTitleMutation.isPending || updateSkillJobTitleMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingSkillJobTitle ? 'Save Changes' : 'Create Job Title'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Skill Job Title Dialog */}
      <AlertDialog open={deleteSkillJobTitleDialogOpen} onOpenChange={setDeleteSkillJobTitleDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Title</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the job title "{deletingSkillJobTitle?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (deletingSkillJobTitle) {
                  deleteSkillJobTitleMutation.mutate(deletingSkillJobTitle.id);
                }
              }}
            >
              {deleteSkillJobTitleMutation.isPending && (
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