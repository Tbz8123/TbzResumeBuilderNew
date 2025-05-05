import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTemplate } from "@/hooks/use-templates";
import { useToast } from "@/hooks/use-toast";
import { Editor } from "@monaco-editor/react";
import { Save, RotateCw, ArrowLeft } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Default template for new creations
const defaultTemplate = `<svg width="800" height="1000" viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="1000" fill="#ffffff"/>
  <rect width="250" height="1000" fill="#5E17EB"/>
  <circle cx="125" cy="150" r="80" fill="#ffffff"/>
  <rect x="280" y="120" width="480" height="40" fill="#4A11C0"/>
  <rect x="280" y="180" width="480" height="20" fill="#dddddd"/>
  <rect x="280" y="220" width="480" height="20" fill="#dddddd"/>
  <rect x="280" y="260" width="480" height="20" fill="#dddddd"/>
  <rect x="280" y="320" width="200" height="30" fill="#5E17EB"/>
  <rect x="280" y="370" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="395" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="420" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="445" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="490" width="200" height="30" fill="#5E17EB"/>
  <rect x="280" y="540" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="565" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="590" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="615" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="660" width="200" height="30" fill="#5E17EB"/>
  <rect x="280" y="710" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="735" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="760" width="480" height="15" fill="#dddddd"/>
  <rect x="280" y="785" width="480" height="15" fill="#dddddd"/>
  <rect x="50" y="280" width="150" height="25" fill="#ffffff"/>
  <rect x="50" y="330" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="355" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="380" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="430" width="150" height="25" fill="#ffffff"/>
  <rect x="50" y="480" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="505" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="530" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="580" width="150" height="25" fill="#ffffff"/>
  <rect x="50" y="630" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="655" width="150" height="15" fill="#ffffff"/>
  <rect x="50" y="680" width="150" height="15" fill="#ffffff"/>
</svg>`;

// Category options for the select dropdown
const categoryOptions = [
  { value: "professional", label: "Professional" },
  { value: "creative", label: "Creative" },
  { value: "simple", label: "Simple" },
  { value: "modern", label: "Modern" },
  { value: "executive", label: "Executive" },
];

// Form data type definition
type FormData = {
  name: string;
  description: string;
  category: string;
  svgContent: string;
  isActive: boolean;
  isPopular: boolean;
  primaryColor: string;
  secondaryColor: string;
  thumbnailUrl: string | null;
};

const CreateNewTemplateAdminPage = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("editor");
  const [previewKey, setPreviewKey] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "professional",
    svgContent: defaultTemplate,
    isActive: true,
    isPopular: false,
    primaryColor: "#5E17EB",
    secondaryColor: "#4A11C0",
    thumbnailUrl: null,
  });
  
  // Mutation hook for creating a new template
  const createTemplateMutation = useCreateTemplate();
  
  const refreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };
  
  const handleEditorChange = (value: string | undefined) => {
    setFormData(prev => ({ ...prev, svgContent: value || "" }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log("CREATING NEW TEMPLATE:", formData);
      
      await createTemplateMutation.mutateAsync(formData);
      
      toast({
        title: "Template Created",
        description: "Your new template has been successfully created",
      });
      
      navigate("/admin/templates");
    } catch (error) {
      console.error("Template creation error:", error);
      toast({
        title: "Error",
        description: `Failed to create template: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/templates")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            Create New Template
          </h1>
        </div>
        <Button 
          onClick={handleSubmit}
          className="bg-primary"
          disabled={createTemplateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {createTemplateMutation.isPending
            ? "Creating..."
            : "Create Template"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Template Details</CardTitle>
            <CardDescription>
              Basic information about your template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Modern Professional"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => handleSelectChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe this template..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="primaryColor"
                      name="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      placeholder="#5E17EB"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="secondaryColor"
                      name="secondaryColor"
                      type="color"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      name="secondaryColor"
                      value={formData.secondaryColor}
                      onChange={handleChange}
                      placeholder="#4A11C0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("isActive", checked as boolean)
                    }
                  />
                  <Label htmlFor="isActive">Active (visible to users)</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPopular"
                    checked={formData.isPopular}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange("isPopular", checked as boolean)
                    }
                  />
                  <Label htmlFor="isPopular">Popular (featured status)</Label>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Template Design</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshPreview}
                >
                  <RotateCw className="h-4 w-4 mr-1" />
                  Refresh Preview
                </Button>
              </div>
            </div>
            <CardDescription>
              Edit the SVG code directly to customize the template design
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">SVG Code Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              
              <TabsContent value="editor" className="border rounded-md mt-4">
                <div className="h-[800px] w-full">
                  <Editor
                    height="100%"
                    defaultLanguage="xml"
                    value={formData.svgContent}
                    onChange={handleEditorChange}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      wordWrap: "on",
                      scrollBeyondLastLine: false,
                    }}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="mt-4">
                <div className="flex justify-center border rounded-md p-4 bg-gray-50 min-h-[800px] overflow-auto">
                  <div 
                    key={previewKey}
                    dangerouslySetInnerHTML={{ __html: formData.svgContent }} 
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => navigate("/admin/templates")}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-primary"
              disabled={createTemplateMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {createTemplateMutation.isPending
                ? "Creating..."
                : "Create Template"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CreateNewTemplateAdminPage;