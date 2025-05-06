import React, { useState, useEffect, useRef } from 'react';
import { ResumeTemplate } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { ResumeData } from './TemplateEngine';
import { Editor } from '@monaco-editor/react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Button,
  ButtonProps
} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save, 
  RotateCw, 
  Code, 
  Palette, 
  Eye, 
  FileText, 
  Image, 
  Settings, 
  Download, 
  Upload, 
  Plus,
  PlusCircle,
  Layers,
  RefreshCw
} from 'lucide-react';
import TemplateEngine from './TemplateEngine';
import TemplateForm from './TemplateForm';

// Default sample data for quick testing
const defaultResumeData: ResumeData = {
  personalInfo: {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john.doe@example.com',
    phone: '(123) 456-7890',
    address: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Experienced software engineer with a passion for creating elegant solutions to complex problems.',
  },
  workExperience: [
    {
      company: 'Tech Company Inc.',
      position: 'Senior Software Engineer',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Led development of web applications using React and Node.js.',
      achievements: [
        'Implemented CI/CD pipeline that reduced deployment time by 75%',
        'Mentored junior developers, improving team productivity by 30%'
      ]
    },
    {
      company: 'Digital Solutions LLC',
      position: 'Software Developer',
      startDate: '2017-06',
      endDate: '2019-12',
      description: 'Developed and maintained web applications for clients.',
      achievements: [
        'Created responsive web interfaces using modern frontend frameworks'
      ]
    }
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2013-09',
      endDate: '2017-05',
      gpa: '3.8/4.0',
      achievements: ['Dean\'s List', 'Computer Science Club President']
    }
  ],
  skills: [
    { name: 'JavaScript', level: 90 },
    { name: 'React', level: 85 },
    { name: 'Node.js', level: 80 },
    { name: 'TypeScript', level: 75 },
    { name: 'HTML/CSS', level: 85 }
  ]
};

interface TemplateBuilderProps {
  template: ResumeTemplate;
  onSave: (updatedTemplate: Partial<ResumeTemplate>) => Promise<void>;
  isNew?: boolean;
}

interface EditorTab {
  id: string;
  label: string;
  icon: React.ReactNode;
  language: string;
  getValue: (template: ResumeTemplate) => string;
  setValue: (value: string | undefined) => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template,
  onSave,
  isNew = false
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('html-editor');
  const [previewTab, setPreviewTab] = useState('html-preview');
  const [previewKey, setPreviewKey] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData>(defaultResumeData);
  
  // Template content state
  const [htmlContent, setHtmlContent] = useState(template.htmlContent || '');
  const [cssContent, setCssContent] = useState(template.cssContent || '');
  const [jsContent, setJsContent] = useState(template.jsContent || '');
  const [svgContent, setSvgContent] = useState(template.svgContent || '');
  const [pdfContent, setPdfContent] = useState<string | null>(template.pdfContent);
  
  // Template metadata
  const [name, setName] = useState(template.name || '');
  const [description, setDescription] = useState(template.description || '');
  const [category, setCategory] = useState(template.category || 'professional');
  const [isActive, setIsActive] = useState(template.isActive);
  const [isPopular, setIsPopular] = useState(template.isPopular);
  const [primaryColor, setPrimaryColor] = useState(template.primaryColor || '#5E17EB');
  const [secondaryColor, setSecondaryColor] = useState(template.secondaryColor || '#4A11C0');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(template.thumbnailUrl);
  const [changelog, setChangelog] = useState('');
  
  // Auto-save functionality
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  
  // Set up editor tabs
  const editorTabs: EditorTab[] = [
    {
      id: 'html-editor',
      label: 'HTML',
      icon: <FileText className="h-4 w-4 mr-1" />,
      language: 'html',
      getValue: (t) => t.htmlContent || '',
      setValue: setHtmlContent
    },
    {
      id: 'css-editor',
      label: 'CSS',
      icon: <Palette className="h-4 w-4 mr-1" />,
      language: 'css',
      getValue: (t) => t.cssContent || '',
      setValue: setCssContent
    },
    {
      id: 'js-editor',
      label: 'JavaScript',
      icon: <Code className="h-4 w-4 mr-1" />,
      language: 'javascript',
      getValue: (t) => t.jsContent || '',
      setValue: setJsContent
    },
    {
      id: 'svg-editor',
      label: 'SVG',
      icon: <Image className="h-4 w-4 mr-1" />,
      language: 'xml',
      getValue: (t) => t.svgContent || '',
      setValue: setSvgContent
    }
  ];
  
  // Refresh preview to show latest changes
  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };
  
  // Function to handle uploading PDF files
  const handlePdfUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Content = event.target?.result as string;
        // Remove prefix like "data:application/pdf;base64," to store just the content
        const base64Data = base64Content.split(',')[1];
        setPdfContent(base64Data);
        toast({
          title: "PDF Uploaded",
          description: "PDF file has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle auto-saving changes
  const autoSaveChanges = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    setIsAutoSaving(true);
    
    autoSaveTimerRef.current = setTimeout(async () => {
      if (!isNew) {
        try {
          await handleSave(true);
        } catch (error) {
          console.error("Auto-save failed:", error);
        } finally {
          setIsAutoSaving(false);
        }
      } else {
        setIsAutoSaving(false);
      }
    }, 3000); // 3 second debounce
  };
  
  // Handle saving template changes
  const handleSave = async (isAutoSave: boolean = false) => {
    try {
      const templateData: Partial<ResumeTemplate> = {
        name,
        description,
        category,
        svgContent,
        htmlContent,
        cssContent,
        jsContent,
        pdfContent,
        isActive,
        isPopular,
        primaryColor,
        secondaryColor,
        thumbnailUrl,
        changelog: isAutoSave ? 'Auto-saved changes' : (changelog || 'Updated template')
      };
      
      await onSave(templateData);
      
      if (!isAutoSave) {
        toast({
          title: "Template Saved",
          description: isNew ? "Template created successfully." : "Template updated successfully.",
        });
        setChangelog('');
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: `Error: ${(error as Error).message}`,
        variant: "destructive"
      });
      throw error; // Re-throw to handle in the auto-save logic
    }
  };
  
  // Combine HTML, CSS, and JS for rendering
  const getCombinedPreview = (): ResumeTemplate => {
    return {
      ...template,
      htmlContent,
      cssContent,
      jsContent,
      svgContent,
      pdfContent
    } as ResumeTemplate;
  };
  
  // Generate thumbnail from template content
  const generateThumbnail = () => {
    // This would typically capture current preview and convert to image
    // For simplicity, we're just notifying the user
    toast({
      title: "Thumbnail Generation",
      description: "Thumbnail generation will be implemented soon.",
    });
  };
  
  // Reset form to original template
  const resetToOriginal = () => {
    setHtmlContent(template.htmlContent || '');
    setCssContent(template.cssContent || '');
    setJsContent(template.jsContent || '');
    setSvgContent(template.svgContent || '');
    setPdfContent(template.pdfContent);
    setName(template.name);
    setDescription(template.description);
    setCategory(template.category);
    setIsActive(template.isActive);
    setIsPopular(template.isPopular);
    setPrimaryColor(template.primaryColor || '#5E17EB');
    setSecondaryColor(template.secondaryColor || '#4A11C0');
    setThumbnailUrl(template.thumbnailUrl);
    
    toast({
      title: "Form Reset",
      description: "Template has been reset to its original state.",
    });
  };
  
  return (
    <div className="template-builder w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">
            {isNew ? "Create New Template" : `Edit Template: ${template.name}`}
          </h2>
          <p className="text-gray-500">
            Use the editor to modify the template code and preview changes in real-time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isAutoSaving && (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
              Auto-saving...
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={refreshPreview}
          >
            <RotateCw className="h-4 w-4 mr-1" />
            Refresh Preview
          </Button>
          <Button onClick={() => handleSave()}>
            <Save className="h-4 w-4 mr-1" />
            Save Template
          </Button>
        </div>
      </div>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[800px] border rounded-lg">
        {/* Left Panel: Editors */}
        <ResizablePanel defaultSize={50}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="px-4 pt-4">
              <TabsList className="grid w-full grid-cols-4">
                {editorTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {editorTabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="flex-grow p-4">
                <div className="h-full border rounded">
                  <Editor
                    height="100%"
                    defaultLanguage={tab.language}
                    value={tab.getValue(getCombinedPreview() as ResumeTemplate)}
                    onChange={(value) => {
                      tab.setValue(value);
                      autoSaveChanges();
                    }}
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
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Right Panel: Preview and Settings */}
        <ResizablePanel defaultSize={50}>
          <Tabs value={activeTab === 'settings' ? 'settings' : 'preview'} className="h-full flex flex-col">
            <div className="px-4 pt-4">
              <TabsList>
                <TabsTrigger value="preview" onClick={() => setActiveTab('html-editor')}>
                  <Eye className="h-4 w-4 mr-1" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="settings" onClick={() => setActiveTab('settings')}>
                  <Settings className="h-4 w-4 mr-1" />
                  Template Settings
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="preview" className="flex-grow p-4">
              <Card className="h-full flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Template Preview</CardTitle>
                    <Tabs value={previewTab} onValueChange={setPreviewTab} className="mt-0">
                      <TabsList>
                        <TabsTrigger value="html-preview">HTML</TabsTrigger>
                        <TabsTrigger value="svg-preview">SVG</TabsTrigger>
                        <TabsTrigger value="pdf-preview">PDF</TabsTrigger>
                        <TabsTrigger value="data-form">Data Form</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <CardDescription>
                    View how the template will appear to users
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="h-full">
                    <TabsContent value="html-preview" className="h-full">
                      <TemplateEngine 
                        template={getCombinedPreview()}
                        data={resumeData}
                        previewMode="html"
                        key={`html-${previewKey}`}
                      />
                    </TabsContent>
                    
                    <TabsContent value="svg-preview" className="h-full">
                      <TemplateEngine 
                        template={getCombinedPreview()}
                        data={resumeData}
                        previewMode="svg"
                        key={`svg-${previewKey}`}
                      />
                    </TabsContent>
                    
                    <TabsContent value="pdf-preview" className="h-full">
                      {pdfContent ? (
                        <TemplateEngine 
                          template={getCombinedPreview()}
                          data={resumeData}
                          previewMode="pdf"
                          key={`pdf-${previewKey}`}
                        />
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-md">
                          <div className="mb-4 p-3 rounded-full bg-gray-100">
                            <Upload className="h-10 w-10 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium mb-2">No PDF Available</h3>
                          <p className="text-sm text-gray-500 mb-4 max-w-md">
                            Upload a PDF version of this template for better rendering and download options.
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              id="pdf-upload"
                              type="file"
                              accept=".pdf"
                              onChange={handlePdfUpload}
                              className="hidden"
                            />
                            <Label 
                              htmlFor="pdf-upload" 
                              className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                            >
                              <PlusCircle className="h-4 w-4 mr-2" />
                              Upload PDF
                            </Label>
                            <Button variant="outline" onClick={refreshPreview}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Refresh
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="data-form" className="h-full overflow-auto">
                      <TemplateForm data={resumeData} onChange={setResumeData} />
                    </TabsContent>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="flex-grow p-4">
              <Card className="h-full overflow-auto">
                <CardHeader>
                  <CardTitle>Template Settings</CardTitle>
                  <CardDescription>
                    Configure template metadata and display options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter template name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="template-description">Description</Label>
                    <Textarea
                      id="template-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this template"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="template-category">Category</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="template-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="creative">Creative</SelectItem>
                          <SelectItem value="tech">Tech</SelectItem>
                          <SelectItem value="executive">Executive</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="entry">Entry Level</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="changelog">Changelog</Label>
                      <Input
                        id="changelog"
                        value={changelog}
                        onChange={(e) => setChangelog(e.target.value)}
                        placeholder="Description of changes (optional)"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary-color">Primary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="primary-color"
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          placeholder="#RRGGBB"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="secondary-color">Secondary Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="secondary-color"
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          placeholder="#RRGGBB"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          id="is-active"
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is-active">
                          Active (visible to users)
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          id="is-popular"
                          type="checkbox"
                          checked={isPopular}
                          onChange={(e) => setIsPopular(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="is-popular">
                          Featured (marked as popular)
                        </Label>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="pdf-upload-settings">PDF Template</Label>
                      <Input
                        id="pdf-upload-settings"
                        type="file"
                        accept=".pdf"
                        onChange={handlePdfUpload}
                        className="cursor-pointer"
                      />
                      {pdfContent && (
                        <p className="text-sm text-green-600 font-medium">
                          PDF file uploaded successfully!
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="thumbnail">Thumbnail Preview</Label>
                    <div className="border rounded-md p-4 flex flex-col items-center">
                      {thumbnailUrl ? (
                        <img 
                          src={thumbnailUrl} 
                          alt={name} 
                          className="max-h-32 object-contain mb-4"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 flex items-center justify-center mb-4">
                          <FileText className="h-10 w-10 text-gray-400" />
                        </div>
                      )}
                      
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={generateThumbnail}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          Generate Thumbnail
                        </Button>
                        <Input
                          id="thumbnail-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setThumbnailUrl(event.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <Label
                          htmlFor="thumbnail-upload"
                          className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Upload Image
                        </Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={resetToOriginal}>
                      Reset to Original
                    </Button>
                    <Button onClick={() => handleSave()}>
                      <Save className="h-4 w-4 mr-1" />
                      Save Template
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TemplateBuilder;