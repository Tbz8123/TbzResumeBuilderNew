import React, { useState, useEffect, useCallback } from 'react';
import { ResumeTemplate } from '@shared/schema';
import MonacoEditor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Palette, Code, Image, Save, Eye, RefreshCw, Download, RotateCw, PlusCircle, MinusCircle, Maximize2, Camera, Upload, ImageIcon, Link2, Mail, Phone, MapPin, Briefcase, GraduationCap } from 'lucide-react';
import { TemplateBindingInterface } from '@/components/templates/TemplateBindingInterface';
import { ResumeData, defaultResumeData } from './TemplateEngine';
import TemplateEngine from './TemplateEngine';
import { LiveProvider, LivePreview, LiveError } from 'react-live';
import * as framerMotion from 'framer-motion';
import indexCss from '../../index.css?raw';
import templatePreviewCss from '../../styles/template-preview.css?raw';

export const defaultResumeTemplate: ResumeTemplate = {
  id: 0,
  name: 'New Template',
  description: 'A new resume template',
  category: 'professional',
  svgContent: '<svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white" /><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16">Create your template here</text></svg>',
  htmlContent: '<!DOCTYPE html>\n<html>\n<head>\n  <meta charset="utf-8">\n  <title>Resume Template</title>\n</head>\n<body>\n  <div class="resume">\n    <header>\n      <h1>{{personalInfo.name}}</h1>\n      <p class="title">{{personalInfo.title}}</p>\n      <div class="contact-info">\n        <p>Email: {{personalInfo.email}}</p>\n        <p>Phone: {{personalInfo.phone}}</p>\n      </div>\n    </header>\n    <main>\n      <p>Create your template here</p>\n    </main>\n  </div>\n</body>\n</html>',
  cssContent: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}\n\nbody {\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n  color: #333;\n  background-color: white;\n}\n\n.resume {\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}\n\nheader {\n  text-align: center;\n  margin-bottom: 30px;\n}\n\nh1 {\n  font-size: 28px;\n  margin-bottom: 5px;\n}\n\n.title {\n  font-size: 18px;\n  color: #666;\n  margin-bottom: 15px;\n}\n\n.contact-info {\n  display: flex;\n  justify-content: center;\n  gap: 20px;\n}\n\nmain {\n  display: grid;\n  grid-template-columns: 1fr;\n  gap: 20px;\n}',
  jsContent: 'document.addEventListener("DOMContentLoaded", function() {\n  console.log("Resume template loaded");\n  \n  // You can add dynamic functionality to your template here\n});\n',
  pdfContent: null,
  isActive: true,
  isPopular: false,
  thumbnailUrl: null,
  primaryColor: '#0070f3',
  secondaryColor: '#ffffff',
  displayScale: '0.22',
  width: 800,
  height: 1100,
  aspectRatio: '0.73',
  createdAt: new Date(),
  updatedAt: new Date(),
  reactFramerContent: null,
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
  setValue: (value: string) => void;
}

const TemplateBuilder: React.FC<TemplateBuilderProps> = ({
  template = defaultResumeTemplate,
  onSave,
  isNew = false
}) => {
  const { toast } = useToast();
  
  // Template metadata states
  const [name, setName] = useState<string>(template.name || '');
  const [description, setDescription] = useState<string>(template.description || '');
  const [category, setCategory] = useState<string>(template.category || 'professional');
  
  // Template content states
  const [htmlContent, setHtmlContent] = useState<string>(template.htmlContent || '');
  const [cssContent, setCssContent] = useState<string>(template.cssContent || '');
  const [jsContent, setJsContent] = useState<string>(template.jsContent || '');
  const [svgContent, setSvgContent] = useState<string>(template.svgContent || '');
  const [displayScale, setDisplayScale] = useState<string>(template.displayScale || '0.22');
  
  // Dimension controls
  const [width, setWidth] = useState<string>(template.width?.toString() || '800');
  const [height, setHeight] = useState<string>(template.height?.toString() || '1100');
  const [aspectRatio, setAspectRatio] = useState<string>(template.aspectRatio || '0.73');
  const [preserveRatio, setPreserveRatio] = useState<boolean>(true);
  
  // Code section visibility controls
  const [htmlEnabled, setHtmlEnabled] = useState<boolean>(true);
  const [cssEnabled, setCssEnabled] = useState<boolean>(true);
  const [jsEnabled, setJsEnabled] = useState<boolean>(true);
  
  // Derived states
  const [previewMode, setPreviewMode] = useState<'html' | 'svg'>('html');
  const [previewKey, setPreviewKey] = useState<number>(0);
  const [previewScale, setPreviewScale] = useState<number>(0.8);
  const [activeTab, setActiveTab] = useState<string>('html-editor');
  const [saving, setSaving] = useState<boolean>(false);
  const [autoApply, setAutoApply] = useState<boolean>(true);
  
  // Thumbnail state
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(template.thumbnailUrl);
  const [generatingThumbnail, setGeneratingThumbnail] = useState<boolean>(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState<boolean>(false);
  const [thumbnailSourceType, setThumbnailSourceType] = useState<'html' | 'svg'>('html');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // New editors
  const [reactFramerContent, setReactFramerContent] = useState<string>(template.reactFramerContent || "");
  const [threeFiberContent, setThreeFiberContent] = useState<string>("");
  const [svelteKitContent, setSvelteKitContent] = useState<string>("");
  const [reactGptContent, setReactGptContent] = useState<string>("");
  const [reactPdfContent, setReactPdfContent] = useState<string>("");
  const [svelteKit2Content, setSvelteKit2Content] = useState<string>("");
  const [nextjsContent, setNextjsContent] = useState<string>("");
  const [remixContent, setRemixContent] = useState<string>("");
  const [gptChat, setGptChat] = useState<string>("");
  const [gptResponse, setGptResponse] = useState<string>("");
  const [gptLoading, setGptLoading] = useState<boolean>(false);
  
  // Preview source state
  const [previewSource, setPreviewSource] = useState<string>('html');
  
  // Reset state when template changes
  useEffect(() => {
    // Metadata fields
    setName(template.name || '');
    setDescription(template.description || '');
    setCategory(template.category || 'professional');
    
    // Content fields
    setHtmlContent(template.htmlContent || '');
    setCssContent(template.cssContent || '');
    setJsContent(template.jsContent || '');
    setSvgContent(template.svgContent || '');
    setDisplayScale(template.displayScale || '0.22');
    
    // Dimension fields
    setWidth(template.width?.toString() || '800');
    setHeight(template.height?.toString() || '1100');
    setAspectRatio(template.aspectRatio || '0.73');
    
    // Thumbnail
    setThumbnailUrl(template.thumbnailUrl);
    
    // New editors
    setReactFramerContent(template.reactFramerContent || "");
    setThreeFiberContent("");
    setSvelteKitContent("");
    setReactGptContent("");
    setReactPdfContent("");
    setSvelteKit2Content("");
    setNextjsContent("");
    setRemixContent("");
    setGptChat("");
    setGptResponse("");
    setGptLoading(false);
    
    console.log("Template loaded:", template);
  }, [template]);
  
  // Compiled template for preview
  const compiledTemplate = useCallback(() => {
    // Only include enabled code sections
    const compiledHtmlContent = htmlEnabled ? htmlContent : '';
    const compiledCssContent = cssEnabled ? cssContent : '';
    const compiledJsContent = jsEnabled ? jsContent : '';
    
    // Convert dimension values to numbers
    const widthNum = parseInt(width);
    const heightNum = parseInt(height);
    
    return {
      ...template,
      // Template content
      htmlContent: compiledHtmlContent,
      cssContent: compiledCssContent,
      jsContent: compiledJsContent,
      svgContent,
      
      // Template metadata
      name,
      description,
      category,
      
      // Template dimensions
      displayScale,
      width: widthNum || 800,
      height: heightNum || 1100,
      aspectRatio
    };
  }, [
    template, 
    htmlContent, cssContent, jsContent, svgContent, 
    htmlEnabled, cssEnabled, jsEnabled,
    name, description, category,
    displayScale, width, height, aspectRatio
  ]);
  
  // Set up editor tabs
  const editorTabs: EditorTab[] = [
    {
      id: 'html-editor',
      label: 'HTML',
      icon: <FileText className="h-4 w-4 mr-1" />,
      language: 'html',
      getValue: (t) => t.htmlContent || '',
      setValue: (value: string) => setHtmlContent(value)
    },
    {
      id: 'css-editor',
      label: 'CSS',
      icon: <Palette className="h-4 w-4 mr-1" />,
      language: 'css',
      getValue: (t) => t.cssContent || '',
      setValue: (value: string) => setCssContent(value)
    },
    {
      id: 'js-editor',
      label: 'JavaScript',
      icon: <Code className="h-4 w-4 mr-1" />,
      language: 'javascript',
      getValue: (t) => t.jsContent || '',
      setValue: (value: string) => setJsContent(value)
    },
    {
      id: 'svg-editor',
      label: 'SVG',
      icon: <Image className="h-4 w-4 mr-1" />,
      language: 'xml',
      getValue: (t) => t.svgContent || '',
      setValue: (value: string) => setSvgContent(value)
    },
    {
      id: 'bindings-editor',
      label: 'Bindings',
      icon: <Link2 className="h-4 w-4 mr-1" />,
      language: 'json',
      getValue: (t) => '', // Not used for bindings tab
      setValue: (value: string) => {} // Not used for bindings tab
    }
  ];
  
  // New tabs
  const advancedEditorTabs: EditorTab[] = [
    ...editorTabs,
    {
      id: 'react-framer-editor',
      label: 'React + Tailwind + Framer Motion',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => reactFramerContent, setValue: setReactFramerContent
    },
    {
      id: 'three-fiber-editor',
      label: 'React Three Fiber + Drei + Tailwind',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => threeFiberContent, setValue: setThreeFiberContent
    },
    {
      id: 'sveltekit-editor',
      label: 'SvelteKit + Tailwind + Motion One',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'svelte',
      getValue: () => svelteKitContent, setValue: setSvelteKitContent
    },
    {
      id: 'react-gpt-editor',
      label: 'React + Tailwind + Monaco + GPT',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => reactGptContent, setValue: setReactGptContent
    },
    {
      id: 'react-pdf-editor',
      label: 'React + Tailwind + html2pdf/Puppeteer/PDFKit',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => reactPdfContent, setValue: setReactPdfContent
    },
    {
      id: 'sveltekit2-editor',
      label: 'SvelteKit + Tailwind + Motion One',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'svelte',
      getValue: () => svelteKit2Content, setValue: setSvelteKit2Content
    },
    {
      id: 'nextjs-editor',
      label: 'Next.js + Tailwind + Framer Motion',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => nextjsContent, setValue: setNextjsContent
    },
    {
      id: 'remix-editor',
      label: 'Remix + Tailwind + Framer Motion',
      icon: <Code className="h-4 w-4 mr-1" />, language: 'javascript',
      getValue: () => remixContent, setValue: setRemixContent
    },
  ];
  
  // Refresh preview to show latest changes
  const refreshPreview = () => {
    setPreviewKey((prev) => prev + 1);
  };
  
  // Auto-apply changes to preview
  useEffect(() => {
    if (autoApply) {
      const timeout = setTimeout(() => {
        refreshPreview();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [htmlContent, cssContent, jsContent, svgContent, autoApply]);
  
  // Validate form before saving
  const validateForm = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check required fields based on schema validation requirements
    if (!name || name.length < 3) {
      errors.push('Name must be at least 3 characters');
    }
    
    if (!description || description.length < 10) {
      errors.push('Description must be at least 10 characters');
    }
    
    if (!svgContent || svgContent.length < 50) {
      errors.push('SVG content must be at least 50 characters');
    }
    
    if (!category || category.length < 2) {
      errors.push('Category must be at least 2 characters');
    }

    // Additional SVG content validation
    if (svgContent && svgContent.length > 0) {
      if (!svgContent.includes('<svg')) {
        errors.push('SVG content must contain an <svg> tag');
      }
    }
    
    return { 
      isValid: errors.length === 0,
      errors 
    };
  };

  // Helper to check editor content status
  const getEditorStatus = (content: string, minLength: number): 'empty' | 'invalid' | 'valid' => {
    if (!content || content.trim().length === 0) return 'empty';
    if (content.length < minLength) return 'invalid';
    return 'valid';
  }
  
  // SVG content status for UI feedback
  const svgContentStatus = getEditorStatus(svgContent, 50);
  
  // Save template changes
  const handleSave = async () => {
    try {
      // Validate form before proceeding
      const { isValid, errors } = validateForm();
      
      if (!isValid) {
        toast({
          title: 'Validation Error',
          description: (
            <div className="space-y-2">
              <p>Please fix the following errors:</p>
              <ul className="list-disc pl-4">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ),
          variant: 'destructive',
        });
        return;
      }
      
      setSaving(true);
      
      // Convert string values to numbers for database
      const widthVal = parseInt(width);
      const heightVal = parseInt(height);
      
      const updatedTemplate: Partial<ResumeTemplate> = {
        // Metadata
        name,
        description,
        category,
        
        // Content
        htmlContent,
        cssContent,
        jsContent,
        svgContent,
        
        // Display settings
        displayScale,
        width: widthVal || 800,
        height: heightVal || 1100,
        aspectRatio,
        
        // Thumbnail (only include if already exists, otherwise use API endpoints)
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
        // Advanced editors
        reactFramerContent,
      };
      
      console.log("Saving template:", updatedTemplate);
      
      await onSave(updatedTemplate);
      
      toast({
        title: isNew ? 'Template created' : 'Template saved',
        description: `Template "${name}" has been ${isNew ? 'created' : 'updated'} successfully.`,
      });
    } catch (error) {
      console.error("Save error:", error);
      toast({
        title: 'Error saving template',
        description: `Failed to save template: ${(error as Error).message}`,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  const getCurrentEditorValue = (tabId: string): string => {
    const tab = editorTabs.find(t => t.id === tabId);
    if (!tab) return '';
    return tab.getValue(template);
  };
  
  const handleEditorChange = (value: string | undefined, tabId: string) => {
    const tab = editorTabs.find(t => t.id === tabId);
    if (!tab || !value) return;
    
    tab.setValue(value);
  };
  
  // Handle thumbnail generation
  const handleGenerateThumbnail = async () => {
    if (!template.id) {
      toast({
        title: 'Save Required',
        description: 'Please save the template first before generating a thumbnail.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setGeneratingThumbnail(true);
      
      const response = await fetch(`/api/templates/${template.id}/generate-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sourceType: thumbnailSourceType }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate thumbnail: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setThumbnailUrl(data.thumbnailUrl);
        toast({
          title: 'Thumbnail Generated',
          description: 'Template preview image has been created successfully.',
        });
      } else {
        throw new Error(data.message || 'Failed to generate thumbnail');
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      toast({
        title: 'Thumbnail Generation Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setGeneratingThumbnail(false);
    }
  };
  
  // Handle thumbnail upload
  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!template.id) {
      toast({
        title: 'Save Required',
        description: 'Please save the template first before uploading a thumbnail.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload a JPEG, PNG, or WebP image file.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'The image file must be less than 5MB.',
        variant: 'destructive',
      });
      return;
    }
    
    // Upload the file
    try {
      setUploadingThumbnail(true);
      
      const formData = new FormData();
      formData.append('previewImage', file);
      
      const response = await fetch(`/api/templates/${template.id}/upload-preview`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload thumbnail: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setThumbnailUrl(data.thumbnailUrl);
        toast({
          title: 'Thumbnail Uploaded',
          description: 'Template preview image has been uploaded successfully.',
        });
      } else {
        throw new Error(data.message || 'Failed to upload thumbnail');
      }
    } catch (error) {
      console.error('Thumbnail upload error:', error);
      toast({
        title: 'Thumbnail Upload Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setUploadingThumbnail(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Utility to clean user code for react-live
  function prepareLiveCode(rawCode: string): string {
    // Remove import/export statements
    let code = rawCode.replace(/^\s*import[^;]+;?/gm, '');
    code = code.replace(/^\s*export\s+default\s+/gm, '');
    code = code.replace(/^\s*export\s+\{[^}]+\};?/gm, '');
    // If ResumeTemplate is defined, append render call if not present
    if (/function\s+ResumeTemplate/.test(code) && !/render\(/.test(code)) {
      code += '\nrender(<ResumeTemplate />);';
    }
    return code;
  }
  
  // Custom wrapper to inject Tailwind and custom CSS into the live preview
  const TailwindLivePreview = (props: any) => {
    const ref = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      // Remove Tailwind CDN injection
      // Only inject app's built CSS
      if (ref.current && !ref.current.querySelector('#app-index-css')) {
        const style = document.createElement('style');
        style.id = 'app-index-css';
        style.innerHTML = indexCss;
        ref.current.appendChild(style);
      }
      if (ref.current && !ref.current.querySelector('#app-template-preview-css')) {
        const style = document.createElement('style');
        style.id = 'app-template-preview-css';
        style.innerHTML = templatePreviewCss;
        ref.current.appendChild(style);
      }
    }, []);
    return (
      <div ref={ref} className="h-full w-full bg-white rounded-lg p-4 overflow-auto">
        <LivePreview {...props} />
        <LiveError className="text-red-500 mt-2 text-xs" />
      </div>
    );
  };
  
  // Return rendered component
  return (
    <div className="template-builder h-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full border rounded-lg"
      >
        {/* Editor Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">Template Editor</h3>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={refreshPreview}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh preview</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Save
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Save template changes</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="flex-1 flex flex-col h-[calc(100%-60px)]"
            >
              <div className="mb-2">
                <select
                  className="w-full border rounded p-2 bg-white text-left"
                  value={activeTab}
                  onChange={e => setActiveTab(e.target.value)}
                >
                  {advancedEditorTabs.map(tab => (
                    <option key={tab.id} value={tab.id}>{tab.label}</option>
                  ))}
                </select>
              </div>
              {advancedEditorTabs.map((tab) => (
                <TabsContent 
                  key={tab.id} 
                  value={tab.id}
                  className="flex-1 overflow-hidden px-4 pb-4 h-[calc(100%-48px)]"
                >
                  <Card className="h-full flex flex-col">
                    {/* Show validation notification for SVG editor tab */}
                    {tab.id === 'svg-editor' && svgContentStatus !== 'valid' && (
                      <div className={`px-4 py-2 text-sm ${svgContentStatus === 'empty' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>
                        {svgContentStatus === 'empty' ? (
                          <p>SVG content is required. Please add an SVG template with at least 50 characters.</p>
                        ) : (
                          <p>SVG content must be at least 50 characters and contain an &lt;svg&gt; tag.</p>
                        )}
                      </div>
                    )}
                    <CardContent className="p-0 flex-1">
                      {/* Advanced Editors */}
                      {tab.id === 'react-framer-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="javascript"
                            value={reactFramerContent}
                            onChange={value => setReactFramerContent(value || "")}
                            theme="vs-dark"
                          />
                          <LiveProvider
                            code={prepareLiveCode(reactFramerContent)}
                            scope={{ React, ...framerMotion, Mail, Phone, MapPin, Briefcase, GraduationCap }}
                            noInline={true}
                          >
                            <TailwindLivePreview />
                          </LiveProvider>
                        </div>
                      )}
                      {tab.id === 'three-fiber-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="javascript"
                            value={threeFiberContent}
                            onChange={value => setThreeFiberContent(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[Three Fiber Canvas/WebGL Preview Here]</div>
                        </div>
                      )}
                      {tab.id === 'sveltekit-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="svelte"
                            value={svelteKitContent}
                            onChange={value => setSvelteKitContent(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[SvelteKit Preview (iframe or placeholder)]</div>
                        </div>
                      )}
                      {tab.id === 'react-gpt-editor' && (
                        <div className="h-full flex flex-col md:flex-row">
                          <div className="flex-1">
                            <MonacoEditor
                              height="300px"
                              language="javascript"
                              value={reactGptContent}
                              onChange={value => setReactGptContent(value || "")}
                              theme="vs-dark"
                            />
                          </div>
                          <div className="w-full md:w-1/3 p-2 border-l bg-gray-50">
                            <div className="font-bold mb-2">GPT Bot</div>
                            <textarea
                              className="w-full border rounded p-2 mb-2"
                              rows={3}
                              value={gptChat}
                              onChange={e => setGptChat(e.target.value)}
                              placeholder="Ask GPT for code help..."
                            />
                            <Button
                              size="sm"
                              className="mb-2"
                              onClick={async () => {
                                setGptLoading(true);
                                // Call your GPT API here
                                setTimeout(() => {
                                  setGptResponse('This is a mock GPT response.');
                                  setGptLoading(false);
                                }, 1000);
                              }}
                              disabled={gptLoading}
                            >
                              {gptLoading ? 'Loading...' : 'Ask GPT'}
                            </Button>
                            <div className="text-xs text-gray-600">{gptResponse}</div>
                          </div>
                        </div>
                      )}
                      {tab.id === 'react-pdf-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="javascript"
                            value={reactPdfContent}
                            onChange={value => setReactPdfContent(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[PDF Preview/Generation Placeholder]</div>
                        </div>
                      )}
                      {tab.id === 'sveltekit2-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="svelte"
                            value={svelteKit2Content}
                            onChange={value => setSvelteKit2Content(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[SvelteKit (2) Preview Placeholder]</div>
                        </div>
                      )}
                      {tab.id === 'nextjs-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="javascript"
                            value={nextjsContent}
                            onChange={value => setNextjsContent(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[Next.js Preview Placeholder]</div>
                        </div>
                      )}
                      {tab.id === 'remix-editor' && (
                        <div className="h-full flex flex-col">
                          <MonacoEditor
                            height="300px"
                            language="javascript"
                            value={remixContent}
                            onChange={value => setRemixContent(value || "")}
                            theme="vs-dark"
                          />
                          <div className="mt-2">[Remix Preview Placeholder]</div>
                        </div>
                      )}
                      {/* Default: existing editors */}
                      {!(tab.id.startsWith('react-') || tab.id.startsWith('three-') || tab.id.startsWith('svelte') || tab.id.startsWith('nextjs') || tab.id.startsWith('remix')) && (
                        <MonacoEditor
                          height="100%"
                          language={tab.language}
                          value={getCurrentEditorValue(tab.id)}
                          onChange={(value) => handleEditorChange(value, tab.id)}
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            tabSize: 2,
                            wordWrap: 'on'
                          }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </ResizablePanel>
        
        {/* Preview Panel */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <div className="h-full flex flex-col">
            <div className="border-b p-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Template Preview</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center gap-2 mb-2">
                    <label htmlFor="preview-source" className="text-sm font-medium">Preview Source:</label>
                    <select
                      id="preview-source"
                      className="border rounded p-1 text-sm"
                      value={previewSource}
                      onChange={e => setPreviewSource(e.target.value)}
                    >
                      <option value="html">HTML</option>
                      <option value="svg">SVG</option>
                      <option value="react-framer-editor">React + Tailwind + Framer Motion</option>
                      <option value="three-fiber-editor">React Three Fiber + Drei + Tailwind</option>
                      <option value="sveltekit-editor">SvelteKit + Tailwind + Motion One</option>
                      <option value="react-gpt-editor">React + Tailwind + Monaco + GPT</option>
                      <option value="react-pdf-editor">React + Tailwind + html2pdf/Puppeteer/PDFKit</option>
                      <option value="sveltekit2-editor">SvelteKit + Tailwind + Motion One (2)</option>
                      <option value="nextjs-editor">Next.js + Tailwind + Framer Motion</option>
                      <option value="remix-editor">Remix + Tailwind + Framer Motion</option>
                    </select>
                  </div>
                  
                  <Tabs value={previewMode} onValueChange={(value) => setPreviewMode(value as 'html' | 'svg')}>
                    <TabsList>
                      <TabsTrigger value="html">
                        <FileText className="h-4 w-4 mr-1" />
                        HTML
                      </TabsTrigger>
                      <TabsTrigger value="svg">
                        <Image className="h-4 w-4 mr-1" />
                        SVG
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setPreviewScale(ps => Math.min(ps + 0.1, 1.5))}
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zoom in</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setPreviewScale(ps => Math.max(ps - 0.1, 0.3))}
                        >
                          <MinusCircle className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Zoom out</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setPreviewScale(0.8)}
                        >
                          <Maximize2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Reset zoom</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              {/* Template Metadata Section */}
              <div className="flex flex-wrap gap-4 border-t pt-3">
                <div className="flex flex-col space-y-1 w-full md:w-1/3">
                  <label htmlFor="template-name" className="text-sm font-medium flex items-center">
                    Template Name: 
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="text"
                    id="template-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`rounded ${name.length < 3 ? 'border-red-500' : 'border-gray-300'} text-primary focus:ring-primary`}
                    placeholder="Enter template name (min 3 chars)"
                  />
                  {name.length > 0 && name.length < 3 && (
                    <p className="text-red-500 text-xs">Name must be at least 3 characters</p>
                  )}
                </div>
                
                <div className="flex flex-col space-y-1 w-full md:w-1/3">
                  <label htmlFor="template-category" className="text-sm font-medium flex items-center">
                    Category:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <select
                    id="template-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  >
                    <option value="professional">Professional</option>
                    <option value="creative">Creative</option>
                    <option value="tech">Tech</option>
                    <option value="executive">Executive</option>
                    <option value="minimal">Minimal</option>
                    <option value="entry">Entry Level</option>
                  </select>
                </div>
                
                <div className="flex flex-col space-y-1 w-full">
                  <label htmlFor="template-description" className="text-sm font-medium flex items-center">
                    Description:
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input 
                    type="text"
                    id="template-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={`rounded ${description.length < 10 ? 'border-red-500' : 'border-gray-300'} text-primary focus:ring-primary`}
                    placeholder="Brief description of this template (min 10 chars)"
                  />
                  {description.length > 0 && description.length < 10 && (
                    <p className="text-red-500 text-xs">Description must be at least 10 characters</p>
                  )}
                </div>
              </div>
                            
              {/* Dimension Controls */}
              <div className="flex flex-wrap gap-4 border-t pt-3">
                <div className="flex flex-col space-y-1">
                  <label htmlFor="template-width" className="text-sm font-medium">
                    Width (px):
                  </label>
                  <input 
                    type="number"
                    id="template-width"
                    min="400" 
                    max="1200" 
                    step="10"
                    value={width}
                    onChange={(e) => {
                      setWidth(e.target.value);
                      if (preserveRatio) {
                        setHeight(Math.round(parseInt(e.target.value) / parseFloat(aspectRatio)).toString());
                      }
                    }}
                    className="w-20 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label htmlFor="template-height" className="text-sm font-medium">
                    Height (px):
                  </label>
                  <input 
                    type="number"
                    id="template-height"
                    min="600" 
                    max="1800" 
                    step="10"
                    value={height}
                    onChange={(e) => {
                      setHeight(e.target.value);
                      if (preserveRatio) {
                        setWidth(Math.round(parseInt(e.target.value) * parseFloat(aspectRatio)).toString());
                      }
                    }}
                    className="w-20 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                <div className="flex flex-col space-y-1">
                  <label htmlFor="aspect-ratio" className="text-sm font-medium">
                    Aspect Ratio:
                  </label>
                  <div className="flex items-center">
                    <input 
                      type="number"
                      id="aspect-ratio"
                      min="0.3" 
                      max="1.5" 
                      step="0.01"
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-20 rounded border-gray-300 text-primary focus:ring-primary"
                      disabled={!preserveRatio}
                    />
                    <div className="flex items-center ml-3">
                      <input 
                        type="checkbox"
                        id="preserve-ratio"
                        checked={preserveRatio}
                        onChange={(e) => setPreserveRatio(e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary mr-1"
                      />
                      <label htmlFor="preserve-ratio" className="text-xs">
                        Lock ratio
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1 ml-auto">
                  <label htmlFor="display-scale" className="text-sm font-medium">
                    Display Scale:
                  </label>
                  <div className="flex items-center">
                    <input 
                      type="number"
                      id="display-scale"
                      min="0.1" 
                      max="0.5" 
                      step="0.01"
                      value={displayScale}
                      onChange={(e) => setDisplayScale(e.target.value)}
                      className="w-16 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <input
                      type="range"
                      min="0.1"
                      max="0.5"
                      step="0.01"
                      value={displayScale}
                      onChange={(e) => setDisplayScale(e.target.value)}
                      className="w-32 ml-2"
                    />
                  </div>
                </div>
              </div>
              
              {/* Thumbnail Management */}
              <div className="flex flex-wrap gap-4 border-t pt-3">
                <div className="flex flex-col space-y-2 w-full">
                  <label className="text-sm font-medium flex items-center">
                    Template Thumbnail
                  </label>
                  
                  <div className="flex flex-wrap gap-3 items-start">
                    {/* Thumbnail Preview */}
                    <div className="flex flex-col items-center gap-2">
                      <div 
                        className="w-32 h-44 border rounded flex items-center justify-center overflow-hidden bg-gray-50"
                      >
                        {thumbnailUrl ? (
                          <img 
                            src={thumbnailUrl} 
                            alt="Template thumbnail"
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              console.error('Error loading thumbnail:', e);
                              toast({
                                title: 'Error loading thumbnail',
                                description: 'The thumbnail could not be displayed.',
                                variant: 'destructive',
                              });
                            }}
                          />
                        ) : (
                          <ImageIcon className="w-10 h-10 text-gray-300" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">Preview</span>
                    </div>
                    
                    {/* Thumbnail Actions */}
                    <div className="flex flex-col gap-3 mt-2">
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-2 border rounded p-2 bg-gray-50">
                          <span className="text-xs font-medium">Generate From:</span>
                          <select 
                            className="text-xs border rounded p-1"
                            onChange={(e) => setThumbnailSourceType(e.target.value as 'html' | 'svg')}
                            value={thumbnailSourceType}
                          >
                            <option value="html">HTML+CSS</option>
                            <option value="svg">SVG</option>
                          </select>
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateThumbnail}
                          disabled={generatingThumbnail || !template.id}
                          className="flex items-center"
                        >
                          {generatingThumbnail ? (
                            <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4 mr-1" />
                          )}
                          Generate Thumbnail
                        </Button>
                        
                        {/* Hidden file input for upload */}
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleThumbnailUpload}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingThumbnail || !template.id}
                          className="flex items-center"
                        >
                          {uploadingThumbnail ? (
                            <RotateCw className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4 mr-1" />
                          )}
                          Upload Image
                        </Button>
                      </div>
                      
                      {/* Help text */}
                      <p className="text-xs text-gray-500 max-w-md">
                        Generate a thumbnail from {thumbnailSourceType === 'html' ? 'HTML+CSS content' : 'SVG content'}, or upload your own image (JPG, PNG, WebP, max 5MB).
                        Select the source type from the dropdown, then click "Generate Thumbnail". Save the template first before managing thumbnails.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Code Section Toggles */}
              <div className="flex items-center gap-4 border-t pt-3">
                <div className="flex items-center space-x-2">
                  <label htmlFor="html-toggle" className="text-sm font-medium">
                    HTML
                  </label>
                  <input 
                    type="checkbox"
                    id="html-toggle"
                    checked={htmlEnabled}
                    onChange={(e) => setHtmlEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor="css-toggle" className="text-sm font-medium">
                    CSS
                  </label>
                  <input 
                    type="checkbox"
                    id="css-toggle"
                    checked={cssEnabled}
                    onChange={(e) => setCssEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label htmlFor="js-toggle" className="text-sm font-medium">
                    JavaScript
                  </label>
                  <input 
                    type="checkbox"
                    id="js-toggle"
                    checked={jsEnabled}
                    onChange={(e) => setJsEnabled(e.target.checked)}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              <Card className="h-full">
                <CardContent className="p-2 h-full relative">
                  <div className="w-full h-full overflow-hidden bg-white admin-preview">
                    {previewSource === 'html' || previewSource === 'svg' ? (
                      <TemplateEngine
                        key={previewKey}
                        template={compiledTemplate()}
                        data={defaultResumeData}
                        previewMode={previewSource as 'html' | 'svg'}
                        scale={previewScale}
                        className="h-full"
                      />
                    ) : previewSource === 'react-framer-editor' ? (
                      <LiveProvider
                        code={prepareLiveCode(reactFramerContent)}
                        scope={{ React, ...framerMotion, Mail, Phone, MapPin, Briefcase, GraduationCap }}
                        noInline={true}
                      >
                        <TailwindLivePreview />
                      </LiveProvider>
                    ) : previewSource === 'three-fiber-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[Three Fiber Canvas/WebGL Preview Coming Soon]</div>
                    ) : previewSource === 'sveltekit-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[SvelteKit + Tailwind + Motion One Preview Coming Soon]</div>
                    ) : previewSource === 'react-gpt-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[React + Tailwind + Monaco + GPT Preview Coming Soon]</div>
                    ) : previewSource === 'react-pdf-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[React + Tailwind + html2pdf/Puppeteer/PDFKit Preview Coming Soon]</div>
                    ) : previewSource === 'sveltekit2-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[SvelteKit + Tailwind + Motion One (2) Preview Coming Soon]</div>
                    ) : previewSource === 'nextjs-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[Next.js + Tailwind + Framer Motion Preview Coming Soon]</div>
                    ) : previewSource === 'remix-editor' ? (
                      <div className="h-full flex items-center justify-center text-gray-500">[Remix + Tailwind + Framer Motion Preview Coming Soon]</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default TemplateBuilder;