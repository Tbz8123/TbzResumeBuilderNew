import { useState, useEffect } from "react";
import { useTemplates } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ResumeTemplate } from "@shared/schema";
import {
  ImageIcon,
  Pencil,
  Plus,
  Search,
  Star,
  StarOff,
  Trash,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

const FreshLooksShowcase = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [templateToDelete, setTemplateToDelete] = useState<ResumeTemplate | null>(null);
  const [showcaseSelections, setShowcaseSelections] = useState<Record<number, boolean>>({});
  const [isUpdatingShowcase, setIsUpdatingShowcase] = useState(false);

  // Fetch templates using the custom hook
  const {
    data: templates,
    isLoading,
    error,
    refetch,
  } = useTemplates();

  useEffect(() => {
    // Initialize showcase selections based on isPopular flag
    if (templates && Array.isArray(templates)) {
      const initialSelections: Record<number, boolean> = {};
      templates.forEach((template) => {
        initialSelections[template.id] = template.isPopular || false;
      });
      setShowcaseSelections(initialSelections);
    }
  }, [templates]);

  // Filter templates based on search, category, and active status
  const filteredTemplates = Array.isArray(templates) && templates.length > 0 
    ? templates.filter((template: ResumeTemplate) => {
        const matchesSearch = 
          searchTerm === '' || 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCategory = 
          categoryFilter === 'all' || 
          template.category === categoryFilter;
        
        const matchesStatus = 
          activeTab === 'all' || 
          (activeTab === 'active' && template.isActive) || 
          (activeTab === 'inactive' && !template.isActive) ||
          (activeTab === 'popular' && template.isPopular) ||
          (activeTab === 'showcase' && showcaseSelections[template.id]);
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : [];

  // Handle toggling a template in the showcase
  const handleShowcaseToggle = (templateId: number) => {
    setShowcaseSelections((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  // Save showcase changes to all templates
  const saveShowcaseChanges = async () => {
    try {
      setIsUpdatingShowcase(true);
      
      // Create an array of templates to update with their new isPopular status
      const updatePromises = Object.entries(showcaseSelections).map(async ([id, isSelected]) => {
        const templateId = parseInt(id);
        const template = templates && Array.isArray(templates) 
          ? templates.find((t: ResumeTemplate) => t.id === templateId)
          : null;
        
        if (template && template.isPopular !== isSelected) {
          return apiRequest('PATCH', `/api/templates/${templateId}`, {
            isPopular: isSelected
          });
        }
        return null;
      });
      
      // Execute all updates in parallel
      await Promise.all(updatePromises.filter(Boolean));
      
      // Invalidate templates cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: "Showcase updated",
        description: "The showcase templates have been updated successfully.",
      });
      
      // Refetch templates
      refetch();
    } catch (err) {
      console.error("Error updating showcase:", err);
      toast({
        title: "Update failed",
        description: "There was an error updating the showcase templates.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingShowcase(false);
    }
  };

  const handleDeleteTemplate = async (template: ResumeTemplate) => {
    try {
      await apiRequest('DELETE', `/api/templates/${template.id}`);
      
      // Invalidate templates cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      
      toast({
        title: "Template deleted",
        description: `Template "${template.name}" has been deleted successfully.`,
      });
      
      // Refetch templates
      refetch();
    } catch (err) {
      console.error("Error deleting template:", err);
      
      toast({
        title: "Deletion failed",
        description: "There was an error deleting the template.",
        variant: "destructive",
      });
    } finally {
      setTemplateToDelete(null);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Showcase Fresh Looks</h1>
          <p className="text-gray-500">Select templates to feature in the "Fresh Looks" showcase section</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={saveShowcaseChanges} 
            disabled={isUpdatingShowcase}
            className="bg-primary text-white"
          >
            {isUpdatingShowcase ? "Saving..." : "Save Changes"}
          </Button>
          <Button onClick={() => navigate('/admin/templates/new')} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Templates</CardTitle>
          <CardDescription>
            Select templates to showcase in the "Fresh Looks" section
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
              <TabsList>
                <TabsTrigger value="all">All Templates</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="showcase">Selected for Showcase</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search templates..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="simple">Simple</SelectItem>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="tech">Tech</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <TabsContent value={activeTab} className="border rounded-md mt-4 p-0">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-center">Include in Showcase</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTemplates?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-24 text-center">
                            No templates found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredTemplates?.map((template: ResumeTemplate) => (
                          <TableRow key={template.id}>
                            <TableCell>
                              {template.thumbnailUrl ? (
                                <div className="w-20 h-28 relative rounded overflow-hidden border">
                                  <img 
                                    src={template.thumbnailUrl} 
                                    alt={template.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-20 h-28 bg-gray-100 rounded flex items-center justify-center border">
                                  <ImageIcon className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-medium">{template.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize">
                                {template.category || "Uncategorized"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className={template.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                              >
                                {template.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {template.createdAt && format(new Date(template.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-center">
                              <Checkbox 
                                checked={showcaseSelections[template.id] || false}
                                onCheckedChange={() => handleShowcaseToggle(template.id)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => navigate(`/admin/templates/preview/${template.id}`)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  onClick={() => navigate(`/admin/templates/edit/${template.id}`)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" onClick={() => setTemplateToDelete(template)}>
                                      <Trash className="h-4 w-4 text-red-500" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete template "{template.name}". This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction 
                                        className="bg-red-600 text-white hover:bg-red-700"
                                        onClick={() => handleDeleteTemplate(template)}
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Showcase Preview</CardTitle>
            <CardDescription>
              This is how your selected templates will look in the "Fresh Looks" showcase section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-black p-8 rounded-lg">
              <h3 className="text-white text-2xl font-bold mb-4 text-center">Showcase Fresh Looks</h3>
              <p className="text-gray-300 text-center mb-8">Check out our newest template designs created by award-winning designers</p>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                {filteredTemplates
                  .filter(template => showcaseSelections[template.id])
                  .slice(0, 5)
                  .map((template) => (
                    <div 
                      key={template.id}
                      style={{
                        position: 'relative',
                        overflow: 'hidden',
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        aspectRatio: '3/4',
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
                      }}
                    >
                      {template.thumbnailUrl ? (
                        <img 
                          src={template.thumbnailUrl} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                  ))}
                
                {Array.from({ length: Math.max(0, 5 - filteredTemplates.filter(template => showcaseSelections[template.id]).length) }).map((_, index) => (
                  <div 
                    key={`empty-${index}`}
                    className="flex items-center justify-center bg-gray-800"
                    style={{
                      borderRadius: '12px',
                      aspectRatio: '3/4',
                      border: '2px dashed #4a4a4a',
                    }}
                  >
                    <p className="text-gray-500 text-sm">Select a template</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FreshLooksShowcase;