import React, { useState, useEffect } from 'react';
import { ResumeTemplate } from '@shared/schema';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EyeIcon, Code, FileText, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface ResumeData {
  personalInfo: {
    name: string;
    title: string;
    email: string;
    phone: string;
    address?: string;
    website?: string;
    linkedin?: string;
    summary?: string;
  };
  workExperience: {
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    achievements?: string[];
  }[];
  education: {
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    gpa?: string;
    achievements?: string[];
  }[];
  skills: {
    name: string;
    level?: number; // 0-100
  }[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
  }[];
  languages?: {
    language: string;
    proficiency: string;
  }[];
  projects?: {
    name: string;
    description: string;
    technologies: string[];
    link?: string;
  }[];
}

// Default resume data for previews or new resumes
export const defaultResumeData: ResumeData = {
  personalInfo: {
    name: "Jane Smith",
    title: "Senior Frontend Developer",
    email: "jane.smith@example.com",
    phone: "(555) 123-4567",
    address: "San Francisco, CA",
    website: "janesmith.dev",
    linkedin: "linkedin.com/in/janesmith",
    summary: "Experienced frontend developer with 5+ years specializing in React and modern JavaScript frameworks. Passionate about creating intuitive user interfaces and optimizing web performance."
  },
  workExperience: [
    {
      company: "Tech Innovations Inc.",
      position: "Senior Frontend Developer",
      startDate: "2020-03",
      endDate: "Present",
      description: "Lead developer for the company's flagship SaaS product",
      achievements: [
        "Redesigned the UI/UX increasing user engagement by 40%",
        "Implemented performance optimizations resulting in 30% faster load times",
        "Mentored junior developers and conducted code reviews"
      ]
    },
    {
      company: "Digital Solutions LLC",
      position: "Frontend Developer",
      startDate: "2018-01",
      endDate: "2020-02",
      description: "Developed responsive web applications for enterprise clients",
      achievements: [
        "Built 15+ responsive web applications using React",
        "Collaborated with designers to implement pixel-perfect interfaces",
        "Received an award for engineering excellence"
      ]
    }
  ],
  education: [
    {
      institution: "University of California, Berkeley",
      degree: "Master's",
      field: "Computer Science",
      startDate: "2016",
      endDate: "2018",
      gpa: "3.8",
      achievements: [
        "Graduated with honors",
        "Published research on web accessibility"
      ]
    },
    {
      institution: "Stanford University",
      degree: "Bachelor's",
      field: "Web Development",
      startDate: "2012",
      endDate: "2016",
      gpa: "3.7",
      achievements: [
        "Dean's List 2012-2016",
        "Web Development Club President"
      ]
    }
  ],
  skills: [
    { name: "React", level: 95 },
    { name: "JavaScript", level: 90 },
    { name: "TypeScript", level: 85 },
    { name: "HTML/CSS", level: 95 },
    { name: "Node.js", level: 80 },
    { name: "GraphQL", level: 75 },
    { name: "Redux", level: 85 },
    { name: "Webpack", level: 70 }
  ],
  certifications: [
    {
      name: "AWS Certified Developer",
      issuer: "Amazon Web Services",
      date: "2021"
    },
    {
      name: "Google Professional Web Developer",
      issuer: "Google",
      date: "2020"
    }
  ],
  languages: [
    {
      language: "English",
      proficiency: "Native"
    },
    {
      language: "Spanish",
      proficiency: "Fluent"
    },
    {
      language: "French",
      proficiency: "Intermediate"
    }
  ],
  projects: [
    {
      name: "E-commerce Platform",
      description: "Developed a full-stack e-commerce platform with React and Node.js",
      technologies: ["React", "Node.js", "Express", "MongoDB"],
      link: "github.com/janesmith/ecommerce"
    },
    {
      name: "Task Management App",
      description: "Built a task management application with drag-and-drop functionality",
      technologies: ["React", "Redux", "Material-UI", "Firebase"],
      link: "github.com/janesmith/taskmanager"
    }
  ]
};

interface TemplateEngineProps {
  template: ResumeTemplate;
  data?: ResumeData;
  scale?: number;
  editable?: boolean;
  onDataChange?: (data: ResumeData) => void;
  previewMode?: 'html' | 'svg' | 'pdf';
  className?: string;
}

const TemplateEngine: React.FC<TemplateEngineProps> = ({
  template,
  data = defaultResumeData,
  scale = 1,
  editable = false,
  onDataChange,
  previewMode = 'html',
  className = '',
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'preview' | 'code'>(previewMode === 'svg' ? 'code' : 'preview');
  
  // For SVG preview
  const [svgContent, setSvgContent] = useState<string>('');
  
  // For HTML preview with compiled HTML/CSS/JS
  const [compiledHtml, setCompiledHtml] = useState<string>('');
  
  // For PDF preview (using iframe or object tag)
  const [pdfUrl, setPdfUrl] = useState<string>('');
  
  useEffect(() => {
    // Initialize based on preview mode
    setLoading(true);
    setError(null);
    
    const initializeTemplate = async () => {
      try {
        if (previewMode === 'svg') {
          // For SVG preview, we can use the template's SVG content directly
          setSvgContent(template.svgContent || '');
          setActiveView('code');
        } 
        else if (previewMode === 'html') {
          // For HTML preview, we need to compile HTML, CSS, and JS
          if (template.htmlContent) {
            // Combine HTML, CSS, and JS
            let html = template.htmlContent || '';
            const css = template.cssContent || '';
            const js = template.jsContent || '';
            
            // Process html to include CSS and JS
            if (css) {
              html = html.replace('</head>', `<style>${css}</style></head>`);
            }
            
            if (js) {
              html = html.replace('</body>', `<script>${js}</script></body>`);
            }
            
            // Replace placeholders with actual data
            // This is a simplistic approach, you might want to use a templating engine
            // to properly inject the data
            html = injectDataIntoTemplate(html, data);
            
            setCompiledHtml(html);
          } else {
            setError('No HTML content available for this template');
          }
        } 
        else if (previewMode === 'pdf') {
          // For PDF preview
          if (template.pdfContent) {
            // Convert base64 to Blob and create URL
            const byteCharacters = atob(template.pdfContent);
            const byteNumbers = new Array(byteCharacters.length);
            
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            
            setPdfUrl(url);
          } else {
            // If no PDF content, fallback to API endpoint
            setPdfUrl(`/api/export/templates/${template.id}/export/pdf`);
          }
        }
      } catch (err) {
        console.error('Error initializing template:', err);
        setError(`Failed to load template: ${(err as Error).message}`);
      } finally {
        setLoading(false);
      }
    };
    
    initializeTemplate();
    
    // Cleanup function for PDF URL
    return () => {
      if (pdfUrl && pdfUrl.startsWith('blob:')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [template, data, previewMode]);
  
  // Function to inject resume data into template
  const injectDataIntoTemplate = (html: string, data: ResumeData): string => {
    // Basic template variable replacement
    // This is a simple example; in a real app, you might use a more robust templating solution
    
    let processedHtml = html;
    
    // Replace personal info
    processedHtml = processedHtml.replace(/{{personalInfo\.name}}/g, data.personalInfo.name);
    processedHtml = processedHtml.replace(/{{personalInfo\.title}}/g, data.personalInfo.title);
    processedHtml = processedHtml.replace(/{{personalInfo\.email}}/g, data.personalInfo.email);
    processedHtml = processedHtml.replace(/{{personalInfo\.phone}}/g, data.personalInfo.phone);
    processedHtml = processedHtml.replace(/{{personalInfo\.address}}/g, data.personalInfo.address || '');
    processedHtml = processedHtml.replace(/{{personalInfo\.website}}/g, data.personalInfo.website || '');
    processedHtml = processedHtml.replace(/{{personalInfo\.linkedin}}/g, data.personalInfo.linkedin || '');
    processedHtml = processedHtml.replace(/{{personalInfo\.summary}}/g, data.personalInfo.summary || '');
    
    // For arrays like workExperience, education, etc., you'd need to loop through and create HTML
    // This would be better handled by a proper templating engine
    
    return processedHtml;
  };
  
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-full w-full ${className}`}>
        <div className="flex flex-col items-center space-y-4">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`flex items-center justify-center h-full w-full ${className}`}>
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-600 font-medium">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  // Render based on preview mode
  return (
    <div className={`template-engine ${className}`} style={{ height: '100%', width: '100%' }}>
      {previewMode === 'svg' && (
        <div className="flex flex-col h-full">
          <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'preview' | 'code')} className="w-full">
            <div className="flex justify-between items-center mb-4">
              <TabsList>
                <TabsTrigger value="preview">
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview
                </TabsTrigger>
                <TabsTrigger value="code">
                  <Code className="h-4 w-4 mr-2" />
                  SVG Code
                </TabsTrigger>
              </TabsList>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml' });
                  const url = URL.createObjectURL(svgBlob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `template-${template.id}.svg`;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download SVG
              </Button>
            </div>
            
            <TabsContent value="preview" className="flex-grow overflow-auto">
              <div 
                className="flex items-center justify-center bg-gray-50 rounded-lg h-full"
                style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
              >
                <div 
                  dangerouslySetInnerHTML={{ __html: svgContent }} 
                  className="overflow-hidden h-fit"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="code" className="flex-grow overflow-auto">
              <Card>
                <CardContent className="p-4">
                  <pre className="text-xs bg-gray-50 p-4 rounded-md overflow-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                    {svgContent}
                  </pre>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {previewMode === 'html' && (
        <div 
          className="flex items-center justify-center bg-gray-50 rounded-lg h-full overflow-hidden"
          style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}
        >
          <iframe
            srcDoc={compiledHtml}
            title="Template Preview"
            className="border-0 w-full h-full bg-white"
            sandbox="allow-scripts"
          />
        </div>
      )}
      
      {previewMode === 'pdf' && (
        <div className="h-full w-full flex items-center justify-center">
          <object
            data={pdfUrl}
            type="application/pdf"
            className="w-full h-full"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-gray-500 mb-4">PDF preview not available in your browser</p>
              <Button 
                variant="outline"
                onClick={() => window.open(pdfUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </object>
        </div>
      )}
    </div>
  );
};

export default TemplateEngine;