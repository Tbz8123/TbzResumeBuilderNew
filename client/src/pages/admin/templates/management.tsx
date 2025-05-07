import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { 
  useTemplates, 
  useDeleteTemplate
} from '@/hooks/use-templates';
import { ResumeTemplate } from '@shared/schema';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Input 
} from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  History, 
  Download, 
  FileText, 
  Code, 
  AlertTriangle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import TemplateEngine from '@/components/resume/TemplateEngine';

// Template export options
interface ExportOptions {
  format: 'pdf' | 'docx' | 'json';
  templateId: number;
}

const AdminTemplateManagementPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<ResumeTemplate | null>(null);
  const [exportOptions, setExportOptions] = useState<ExportOptions | null>(null);

  // Fetch templates data
  const { data: templates, isLoading } = useTemplates();
  const deleteTemplateMutation = useDeleteTemplate();

  // Handle template deletion
  const handleDeleteTemplate = async () => {
    if (confirmDeleteId) {
      try {
        await deleteTemplateMutation.mutateAsync(confirmDeleteId);
        toast({
          title: 'Template Deleted',
          description: 'The template has been successfully deleted',
        });
        setConfirmDeleteId(null);
      } catch (error) {
        toast({
          title: 'Error',
          description: `Failed to delete template: ${(error as Error).message}`,
          variant: 'destructive',
        });
      }
    }
  };

  // Handle template export
  const handleExport = async (format: 'pdf' | 'docx' | 'json', templateId: number) => {
    try {
      // For PDF, we can use the existing API
      if (format === 'pdf') {
        const response = await fetch(`/api/templates/${templateId}/export/pdf`);
        if (!response.ok) {
          throw new Error('Failed to export template');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Create a link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `template-${templateId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: 'Export Successful',
          description: 'Template has been exported as PDF',
        });
      } else {
        // For other formats, we'll need additional API endpoints
        setExportOptions({ format, templateId });
      }
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: `Could not export template: ${(error as Error).message}`,
        variant: 'destructive',
      });
    }
  };

  // Filter templates based on search, category, and active status
  const filteredTemplates = Array.isArray(templates) && templates.length > 0 
    ? templates.filter((template: ResumeTemplate) => {
        const matchesSearch = 
          searchTerm === '' || 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesCategory = 
          categoryFilter === 'all' || 
          template.category === categoryFilter;
        
        const matchesStatus = 
          activeTab === 'all' || 
          (activeTab === 'active' && template.isActive) || 
          (activeTab === 'inactive' && !template.isActive) ||
          (activeTab === 'popular' && template.isPopular);
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
    : [];

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Template Management</h1>
          <p className="text-gray-500">Manage and customize resume templates</p>
        </div>
        <Button onClick={() => navigate('/admin/templates/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Templates</CardTitle>
          <CardDescription>
            View, edit and manage all resume templates
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
                    <SelectItem value="tech">Tech</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
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
                        <TableHead>ID</TableHead>
                        <TableHead>Preview</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
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
                            <TableCell>{template.id}</TableCell>
                            <TableCell className="p-2">
                              <div 
                                className="h-16 w-16 border rounded cursor-pointer overflow-hidden"
                                onClick={() => setPreviewTemplate(template)}
                              >
                                {template.thumbnailUrl ? (
                                  <img 
                                    src={template.thumbnailUrl} 
                                    alt={template.name} 
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      console.error('Error loading thumbnail:', e);
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent) {
                                        parent.innerHTML = '<div class="w-full h-full flex items-center justify-center bg-gray-50"><svg class="h-6 w-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg></div>';
                                      }
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                    <FileText className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {template.description}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col space-y-1">
                                {template.isActive ? (
                                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                                    Inactive
                                  </Badge>
                                )}
                                
                                {template.isPopular && (
                                  <Badge variant="default" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {new Date(template.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/templates/${template.id}`)}
                                  title="Edit Template"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setPreviewTemplate(template)}
                                  title="Preview Template"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => navigate(`/admin/templates/${template.id}/versions`)}
                                  title="Version History"
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon" 
                                  onClick={() => navigate(`/admin/templates/${template.id}/advanced`)}
                                  title="Advanced Edit"
                                >
                                  <Code className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleExport('pdf', template.id)}
                                  title="Export Template"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => setConfirmDeleteId(template.id)}
                                  title="Delete Template"
                                >
                                  <Trash2 className="h-4 w-4" />
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteId !== null} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              Confirm Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteTemplate}
              disabled={deleteTemplateMutation.isPending}
            >
              {deleteTemplateMutation.isPending ? 'Deleting...' : 'Delete Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Preview Dialog */}
      <Dialog open={previewTemplate !== null} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col space-y-4 mt-4">
            <Tabs defaultValue="html-preview" className="w-full">
              <TabsList>
                <TabsTrigger value="html-preview">
                  <FileText className="h-4 w-4 mr-2" />
                  HTML Preview
                </TabsTrigger>
                <TabsTrigger value="svg-preview">
                  <Code className="h-4 w-4 mr-2" />
                  SVG Preview
                </TabsTrigger>
                {previewTemplate?.pdfContent && (
                  <TabsTrigger value="pdf-preview">
                    <Download className="h-4 w-4 mr-2" />
                    PDF Preview
                  </TabsTrigger>
                )}
              </TabsList>
              
              <TabsContent value="html-preview" className="border rounded-md h-[calc(80vh-200px)] overflow-hidden admin-preview">
                {previewTemplate && (
                  <TemplateEngine 
                    template={previewTemplate} 
                    previewMode="html"
                    scale={0.4}
                  />
                )}
              </TabsContent>
              
              <TabsContent value="svg-preview" className="border rounded-md h-[calc(80vh-200px)] overflow-hidden admin-preview">
                {previewTemplate && (
                  <TemplateEngine 
                    template={previewTemplate} 
                    previewMode="svg"
                    scale={0.4}
                  />
                )}
              </TabsContent>
              
              {previewTemplate?.pdfContent && (
                <TabsContent value="pdf-preview" className="border rounded-md h-[calc(80vh-200px)] overflow-hidden admin-preview">
                  <TemplateEngine 
                    template={previewTemplate} 
                    previewMode="pdf"
                    scale={0.4}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/templates/${previewTemplate?.id}`)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
              <Button 
                variant="outline" 
                onClick={() => navigate(`/admin/templates/${previewTemplate?.id}/advanced`)}
              >
                <Code className="h-4 w-4 mr-2" />
                Advanced Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => handleExport('pdf', previewTemplate?.id as number)}
              >
                <Download className="h-4 w-4 mr-2" />
                Export as PDF
              </Button>
            </div>
            <Button 
              variant="default" 
              onClick={() => setPreviewTemplate(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Options Dialog */}
      <Dialog open={exportOptions !== null} onOpenChange={(open) => !open && setExportOptions(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Template</DialogTitle>
            <DialogDescription>
              Select the format you want to export this template to.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              onClick={() => handleExport('pdf', exportOptions?.templateId as number)}
              className="justify-start"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
            <Button 
              variant="outline"
              className="justify-start"
              onClick={() => {
                toast({
                  title: "Feature in Development",
                  description: "DOCX export will be available soon.",
                });
                setExportOptions(null);
              }}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as DOCX
            </Button>
            <Button
              variant="outline"
              className="justify-start"
              onClick={() => {
                toast({
                  title: "Feature in Development",
                  description: "JSON data export will be available soon.",
                });
                setExportOptions(null);
              }}
            >
              <Code className="h-4 w-4 mr-2" />
              Export Data as JSON
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setExportOptions(null)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTemplateManagementPage;