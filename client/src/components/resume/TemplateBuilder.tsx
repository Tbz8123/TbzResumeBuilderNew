import React, { useState, useEffect, useCallback } from 'react';
import { ResumeTemplate } from '@shared/schema';
import MonacoEditor from '@monaco-editor/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Palette, Code, Image, Save, Eye, RefreshCw, Download, RotateCw, PlusCircle, MinusCircle, Maximize2 } from 'lucide-react';
import { ResumeData, defaultResumeData } from './TemplateEngine';
import TemplateEngine from './TemplateEngine';

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
  createdAt: new Date(),
  updatedAt: new Date()
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
  
  // Template content states
  const [htmlContent, setHtmlContent] = useState<string>(template.htmlContent || '');
  const [cssContent, setCssContent] = useState<string>(template.cssContent || '');
  const [jsContent, setJsContent] = useState<string>(template.jsContent || '');
  const [svgContent, setSvgContent] = useState<string>(template.svgContent || '');
  const [displayScale, setDisplayScale] = useState<string>(template.displayScale || '0.22');
  
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
  
  // Reset state when template changes
  useEffect(() => {
    setHtmlContent(template.htmlContent || '');
    setCssContent(template.cssContent || '');
    setJsContent(template.jsContent || '');
    setSvgContent(template.svgContent || '');
    setDisplayScale(template.displayScale || '0.22');
  }, [template]);
  
  // Compiled template for preview
  const compiledTemplate = useCallback(() => {
    // Only include enabled code sections
    const compiledHtmlContent = htmlEnabled ? htmlContent : '';
    const compiledCssContent = cssEnabled ? cssContent : '';
    const compiledJsContent = jsEnabled ? jsContent : '';
    
    return {
      ...template,
      htmlContent: compiledHtmlContent,
      cssContent: compiledCssContent,
      jsContent: compiledJsContent,
      svgContent,
      displayScale
    };
  }, [template, htmlContent, cssContent, jsContent, svgContent, displayScale, 
      htmlEnabled, cssEnabled, jsEnabled]);
  
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
    }
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
  
  // Save template changes
  const handleSave = async () => {
    try {
      setSaving(true);
      
      const updatedTemplate: Partial<ResumeTemplate> = {
        htmlContent,
        cssContent,
        jsContent,
        svgContent,
        displayScale
      };
      
      await onSave(updatedTemplate);
      
      toast({
        title: isNew ? 'Template created' : 'Template saved',
        description: `Template "${template.name}" has been ${isNew ? 'created' : 'updated'} successfully.`,
      });
    } catch (error) {
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
              <TabsList className="mx-4 mt-2">
                {editorTabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center">
                    {tab.icon}
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {editorTabs.map((tab) => (
                <TabsContent 
                  key={tab.id} 
                  value={tab.id}
                  className="flex-1 overflow-hidden px-4 pb-4 h-[calc(100%-48px)]"
                >
                  <Card className="h-full">
                    <CardContent className="p-0 h-full">
                      <MonacoEditor
                        height="100%"
                        language={tab.language}
                        value={
                          tab.id === 'html-editor' ? htmlContent :
                          tab.id === 'css-editor' ? cssContent :
                          tab.id === 'js-editor' ? jsContent :
                          tab.id === 'svg-editor' ? svgContent :
                          ''
                        }
                        onChange={(value) => handleEditorChange(value, tab.id)}
                        options={{
                          minimap: { enabled: false },
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          wordWrap: 'on'
                        }}
                      />
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
                
                <div className="flex items-center space-x-2 ml-auto">
                  <label htmlFor="display-scale" className="text-sm font-medium">
                    Display Scale:
                  </label>
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
                    className="w-32"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-4 bg-gray-50">
              <Card className="h-full">
                <CardContent className="p-2 h-full relative">
                  <div className="w-full h-full overflow-hidden bg-white admin-preview">
                    <TemplateEngine
                      key={previewKey}
                      template={compiledTemplate()}
                      data={defaultResumeData}
                      previewMode={previewMode}
                      scale={previewScale}
                      className="h-full"
                    />
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