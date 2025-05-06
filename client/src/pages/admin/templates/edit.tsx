import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useTemplate, 
  useUpdateTemplate, 
  useCreateTemplate 
} from "@/hooks/use-templates";
import { Editor } from "@monaco-editor/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, RotateCw, Eye } from "lucide-react";

type FormData = {
  name: string;
  description: string;
  category: string;
  svgContent: string;
  pdfContent?: string;  // Base64 encoded PDF content
  isActive: boolean;
  isPopular: boolean;
  primaryColor: string;
  secondaryColor: string;
  thumbnailUrl: string | null;
  changelog?: string;
};

const defaultTemplate = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="1120" viewBox="0 0 800 1120" xmlns="http://www.w3.org/2000/svg">
  <!-- Header Section -->
  <rect x="0" y="0" width="800" height="120" fill="#5E17EB" />
  
  <!-- Profile Picture Placeholder -->
  <circle cx="80" cy="60" r="40" fill="#FFFFFF" />
  
  <!-- Name and Title -->
  <text x="140" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="#FFFFFF">John Doe</text>
  <text x="140" y="80" font-family="Arial" font-size="16" fill="#CCCCFF">Software Engineer</text>
  
  <!-- Contact Information -->
  <text x="500" y="40" font-family="Arial" font-size="12" fill="#FFFFFF">john.doe@example.com</text>
  <text x="500" y="60" font-family="Arial" font-size="12" fill="#FFFFFF">(123) 456-7890</text>
  <text x="500" y="80" font-family="Arial" font-size="12" fill="#FFFFFF">github.com/johndoe</text>
  <text x="500" y="100" font-family="Arial" font-size="12" fill="#FFFFFF">linkedin.com/in/johndoe</text>
  
  <!-- Main Content -->
  <rect x="0" y="120" width="800" height="1000" fill="#FFFFFF" />
  
  <!-- Summary Section -->
  <text x="40" y="160" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Professional Summary</text>
  <line x1="40" y1="170" x2="760" y2="170" stroke="#5E17EB" stroke-width="2" />
  <text x="40" y="200" font-family="Arial" font-size="14" fill="#333333">
    Experienced software engineer with over 5 years of expertise in full-stack development.
    Skilled in JavaScript, React, Node.js, and cloud technologies. Passionate about creating
    user-centered solutions and mentoring junior developers.
  </text>
  
  <!-- Experience Section -->
  <text x="40" y="250" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Work Experience</text>
  <line x1="40" y1="260" x2="760" y2="260" stroke="#5E17EB" stroke-width="2" />
  
  <!-- Job 1 -->
  <text x="40" y="290" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Senior Software Engineer</text>
  <text x="40" y="310" font-family="Arial" font-size="14" fill="#666666">Tech Solutions Inc. | Jan 2020 - Present</text>
  <text x="40" y="335" font-family="Arial" font-size="14" fill="#333333">• Led development of microservices architecture for payment processing system</text>
  <text x="40" y="355" font-family="Arial" font-size="14" fill="#333333">• Implemented CI/CD pipelines reducing deployment time by 40%</text>
  <text x="40" y="375" font-family="Arial" font-size="14" fill="#333333">• Mentored junior developers and conducted code reviews</text>
  
  <!-- Job 2 -->
  <text x="40" y="405" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Software Developer</text>
  <text x="40" y="425" font-family="Arial" font-size="14" fill="#666666">Digital Innovations Co. | June 2017 - Dec 2019</text>
  <text x="40" y="450" font-family="Arial" font-size="14" fill="#333333">• Developed frontend components using React and Redux</text>
  <text x="40" y="470" font-family="Arial" font-size="14" fill="#333333">• Collaborated with UX/UI designers to implement responsive designs</text>
  <text x="40" y="490" font-family="Arial" font-size="14" fill="#333333">• Participated in agile development process and sprint planning</text>
  
  <!-- Education Section -->
  <text x="40" y="540" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Education</text>
  <line x1="40" y1="550" x2="760" y2="550" stroke="#5E17EB" stroke-width="2" />
  
  <text x="40" y="580" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Bachelor of Science in Computer Science</text>
  <text x="40" y="600" font-family="Arial" font-size="14" fill="#666666">University of Technology | Graduated: May 2017</text>
  
  <!-- Skills Section -->
  <text x="40" y="650" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Skills</text>
  <line x1="40" y1="660" x2="760" y2="660" stroke="#5E17EB" stroke-width="2" />
  
  <!-- Skill Bubbles - Row 1 -->
  <g>
    <rect x="40" y="680" width="100" height="30" rx="15" fill="#E8E0FF" />
    <text x="90" y="700" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">JavaScript</text>
  </g>
  <g>
    <rect x="150" y="680" width="80" height="30" rx="15" fill="#E8E0FF" />
    <text x="190" y="700" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">React</text>
  </g>
  <g>
    <rect x="240" y="680" width="80" height="30" rx="15" fill="#E8E0FF" />
    <text x="280" y="700" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">Node.js</text>
  </g>
  <g>
    <rect x="330" y="680" width="100" height="30" rx="15" fill="#E8E0FF" />
    <text x="380" y="700" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">TypeScript</text>
  </g>
  
  <!-- Skill Bubbles - Row 2 -->
  <g>
    <rect x="40" y="720" width="60" height="30" rx="15" fill="#E8E0FF" />
    <text x="70" y="740" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">AWS</text>
  </g>
  <g>
    <rect x="110" y="720" width="80" height="30" rx="15" fill="#E8E0FF" />
    <text x="150" y="740" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">Docker</text>
  </g>
  <g>
    <rect x="200" y="720" width="140" height="30" rx="15" fill="#E8E0FF" />
    <text x="270" y="740" font-family="Arial" font-size="12" text-anchor="middle" fill="#5E17EB">CI/CD Pipelines</text>
  </g>
  
  <!-- Projects Section -->
  <text x="40" y="790" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Projects</text>
  <line x1="40" y1="800" x2="760" y2="800" stroke="#5E17EB" stroke-width="2" />
  
  <text x="40" y="830" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">E-commerce Platform</text>
  <text x="40" y="850" font-family="Arial" font-size="14" fill="#333333">Developed a full-stack e-commerce site with React, Node.js, and MongoDB.</text>
  <text x="40" y="870" font-family="Arial" font-size="14" fill="#333333">Implemented secure payment processing and order management.</text>
  
  <text x="40" y="900" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Task Management App</text>
  <text x="40" y="920" font-family="Arial" font-size="14" fill="#333333">Created a collaborative task management tool with real-time updates.</text>
  <text x="40" y="940" font-family="Arial" font-size="14" fill="#333333">Used WebSockets and React for responsive UI/UX.</text>
  
  <!-- Certifications Section -->
  <text x="40" y="990" font-family="Arial" font-size="18" font-weight="bold" fill="#5E17EB">Certifications</text>
  <line x1="40" y1="1000" x2="760" y2="1000" stroke="#5E17EB" stroke-width="2" />
  
  <text x="40" y="1030" font-family="Arial" font-size="14" fill="#333333">• AWS Certified Solutions Architect</text>
  <text x="40" y="1055" font-family="Arial" font-size="14" fill="#333333">• Google Cloud Professional Developer</text>
</svg>`;

const categoryOptions = [
  { value: "professional", label: "Professional" },
  { value: "creative", label: "Creative" },
  { value: "tech", label: "Tech" },
  { value: "executive", label: "Executive" },
  { value: "minimal", label: "Minimal" },
  { value: "entry", label: "Entry Level" },
];

const AdminTemplateEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("editor");
  const [previewKey, setPreviewKey] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    category: "professional",
    svgContent: defaultTemplate,
    pdfContent: null,
    isActive: true,
    isPopular: false,
    primaryColor: "#5E17EB",
    secondaryColor: "#4A11C0",
    thumbnailUrl: null,
    changelog: "",
  });
  
  // Explicitly check URL path (more reliable than derived state)
  const isNewTemplate = id === "new";
  const isEditingTemplate = !isNewTemplate;
  
  // Only load template data if we're editing an existing template
  const { data: template, isLoading } = useTemplate(isEditingTemplate ? id : undefined);
  const updateTemplateMutation = useUpdateTemplate(isEditingTemplate ? id : undefined);
  const createTemplateMutation = useCreateTemplate();
  
  useEffect(() => {
    if (template && isEditingTemplate) {
      setFormData({
        name: template.name || "",
        description: template.description || "",
        category: template.category || "professional",
        svgContent: template.svgContent || defaultTemplate,
        pdfContent: template.pdfContent || null,
        isActive: template.isActive ?? true,
        isPopular: template.isPopular ?? false,
        primaryColor: template.primaryColor || "#5E17EB",
        secondaryColor: template.secondaryColor || "#4A11C0",
        thumbnailUrl: template.thumbnailUrl || null,
        changelog: "",
      });
    }
  }, [template, isEditingTemplate]);
  
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
      // Basic validation
      if (!formData.name.trim() || !formData.description.trim()) {
        toast({
          title: "Validation Error",
          description: "Template name and description are required",
          variant: "destructive",
        });
        return;
      }
      
      if (!formData.svgContent || formData.svgContent.trim().length < 50) {
        toast({
          title: "Invalid Template Content",
          description: "Template content is too short or missing. Please add valid HTML/SVG content.",
          variant: "destructive",
        });
        return;
      }
      
      // Check which path we're on - new or edit
      const isCreatingTemplate = id === "new";
      
      // Create a clean submission to avoid validation issues
      const submissionData = {
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim(),
        // Keep SVG content as is (whitespace may be important in HTML/SVG)
        category: formData.category || "professional",
        changelog: formData.changelog?.trim() || "Updated template"
      };
      
      console.log(`Template action: ${isCreatingTemplate ? "CREATE" : "UPDATE"}`);
      
      if (isCreatingTemplate) {
        // CREATE NEW TEMPLATE
        console.log("Creating new template");
        await createTemplateMutation.mutateAsync(submissionData);
        toast({
          title: "Template Created",
          description: "The new template has been successfully created",
        });
        navigate("/admin/templates");
      } else {
        // UPDATE EXISTING TEMPLATE
        console.log(`Updating template ID: ${id}`);
        if (!id) {
          throw new Error("Template ID is required for updates");
        }
        await updateTemplateMutation.mutateAsync(submissionData);
        toast({
          title: "Template Updated",
          description: "The template has been successfully updated",
        });
        navigate("/admin/templates");
      }
    } catch (error) {
      const action = id === "new" ? "create" : "update";
      console.error(`Failed to ${action} template:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} template: ${(error as Error).message}`,
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
            {isEditingTemplate ? "Edit Resume Template" : "Create New Template"}
          </h1>
        </div>
        <Button 
          onClick={handleSubmit}
          className="bg-primary"
          disabled={updateTemplateMutation.isPending || createTemplateMutation.isPending}
        >
          <Save className="h-4 w-4 mr-2" />
          {updateTemplateMutation.isPending || createTemplateMutation.isPending
            ? "Saving..."
            : "Save Template"}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
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

                {isEditingTemplate && (
                  <div className="space-y-2">
                    <Label htmlFor="changelog">
                      Changelog <span className="text-gray-500 text-sm">(Optional)</span>
                    </Label>
                    <Textarea
                      id="changelog"
                      name="changelog"
                      value={formData.changelog}
                      onChange={handleChange}
                      placeholder="Describe your changes..."
                      rows={2}
                    />
                  </div>
                )}
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
                      defaultLanguage="html"
                      value={formData.svgContent}
                      onChange={handleEditorChange}
                      options={{
                        minimap: { enabled: false },
                        automaticLayout: true,
                        wordWrap: "on",
                        scrollBeyondLastLine: false,
                        lineNumbers: "on",
                        renderWhitespace: "boundary",
                        folding: true,
                        formatOnPaste: true,
                        fontSize: 14,
                        tabSize: 2,
                      }}
                      onMount={(editor, monaco) => {
                        // Auto-format on mount for cleaner code view
                        setTimeout(() => {
                          editor.getAction('editor.action.formatDocument')?.run();
                        }, 300);
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
                disabled={updateTemplateMutation.isPending || createTemplateMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {updateTemplateMutation.isPending || createTemplateMutation.isPending
                  ? "Saving..."
                  : "Save Template"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminTemplateEditPage;