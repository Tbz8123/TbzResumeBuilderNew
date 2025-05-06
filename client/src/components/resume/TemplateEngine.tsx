import React, { useState, useEffect, useCallback } from 'react';
import { ResumeTemplate } from '@shared/schema';

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

// Sample data for templates
export const defaultResumeData: ResumeData = {
  personalInfo: {
    name: 'John Doe',
    title: 'Senior Software Engineer',
    email: 'john.doe@example.com',
    phone: '(555) 123-4567',
    address: 'San Francisco, CA',
    website: 'johndoe.com',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Experienced software engineer with a passion for building innovative solutions. Over 8 years of experience in full-stack development with a focus on scalable architecture and clean code.',
  },
  workExperience: [
    {
      company: 'Tech Innovations Inc.',
      position: 'Senior Software Engineer',
      startDate: '2020-01',
      endDate: 'Present',
      description: 'Lead developer for the company\'s flagship product, overseeing architecture decisions and mentoring junior developers.',
      achievements: [
        'Reduced API response time by 40% through query optimization',
        'Implemented CI/CD pipeline reducing deployment time from hours to minutes',
        'Led migration from monolith to microservices architecture',
        'Awarded Employee of the Year 2022 for technical excellence',
      ],
    },
    {
      company: 'Digital Solutions LLC',
      position: 'Software Developer',
      startDate: '2017-03',
      endDate: '2019-12',
      description: 'Full-stack developer working on client projects in various industries from finance to healthcare.',
      achievements: [
        'Developed custom CRM solutions for 3 enterprise clients',
        'Created responsive design system used across 15+ projects',
        'Optimized database performance, reducing query time by 35%',
      ],
    },
  ],
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'Master of Science',
      field: 'Computer Science',
      startDate: '2015-08',
      endDate: '2017-05',
      gpa: '3.92',
      achievements: [
        'Thesis: "Optimizing Neural Networks for Edge Computing"',
        'Graduate Research Assistant in the AI Lab',
        'Recipient of the Outstanding Graduate Student Award',
      ],
    },
    {
      institution: 'Stanford University',
      degree: 'Bachelor of Science',
      field: 'Computer Engineering',
      startDate: '2011-09',
      endDate: '2015-06',
      gpa: '3.85',
      achievements: [
        'Cum Laude graduate',
        'President of the Robotics Club',
        'Participated in ACM Programming Competition',
      ],
    },
  ],
  skills: [
    { name: 'JavaScript', level: 95 },
    { name: 'TypeScript', level: 90 },
    { name: 'React', level: 92 },
    { name: 'Node.js', level: 88 },
    { name: 'Python', level: 85 },
    { name: 'SQL', level: 90 },
    { name: 'GraphQL', level: 82 },
    { name: 'AWS', level: 78 },
    { name: 'Docker', level: 80 },
    { name: 'Kubernetes', level: 75 },
  ],
  certifications: [
    {
      name: 'AWS Certified Solutions Architect',
      issuer: 'Amazon Web Services',
      date: '2021-05',
    },
    {
      name: 'Google Cloud Professional Developer',
      issuer: 'Google',
      date: '2020-11',
    },
    {
      name: 'Certified Kubernetes Administrator',
      issuer: 'Cloud Native Computing Foundation',
      date: '2019-08',
    },
  ],
  languages: [
    {
      language: 'English',
      proficiency: 'Native',
    },
    {
      language: 'Spanish',
      proficiency: 'Professional',
    },
    {
      language: 'French',
      proficiency: 'Intermediate',
    },
  ],
  projects: [
    {
      name: 'AI-Powered Task Manager',
      description: 'Developed a productivity app that uses ML to prioritize and suggest tasks based on user behavior patterns and deadlines.',
      technologies: ['React Native', 'TensorFlow.js', 'Node.js', 'MongoDB'],
      link: 'github.com/johndoe/task-manager',
    },
    {
      name: 'Blockchain Voting System',
      description: 'Created a secure, transparent voting system using blockchain technology for organizational elections.',
      technologies: ['Solidity', 'Ethereum', 'Web3.js', 'React'],
      link: 'github.com/johndoe/blockchain-voting',
    },
  ],
};

interface TemplateEngineProps {
  template: ResumeTemplate;
  data?: ResumeData;
  scale?: number;
  editable?: boolean;
  onDataChange?: (data: ResumeData) => void;
  previewMode?: 'html' | 'svg' | 'pdf';
  className?: string;
  showDimensionControls?: boolean;
  onDimensionsChange?: (width: number, height: number) => void;
}

const TemplateEngine: React.FC<TemplateEngineProps> = ({
  template,
  data = defaultResumeData,
  scale = 1,
  editable = false,
  onDataChange,
  previewMode = 'html',
  className = '',
  showDimensionControls = false,
  onDimensionsChange,
}) => {
  const [processedContent, setProcessedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(template.width || 794); // Default A4 width
  const [previewHeight, setPreviewHeight] = useState<number>(template.height || 1123); // Default A4 height
  
  // Update local state when template dimensions change
  useEffect(() => {
    setPreviewWidth(template.width || 794);
    setPreviewHeight(template.height || 1123);
  }, [template.width, template.height]);

  const injectDataIntoTemplate = useCallback((html: string, data: ResumeData): string => {
    let processedHtml = html;

    // Replace simple placeholders with data
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    processedHtml = processedHtml.replace(placeholderRegex, (match, path) => {
      const keys = path.trim().split('.');
      let value: any = data;

      // Navigate through the object path
      for (const key of keys) {
        if (value && typeof value === 'object' && key in value) {
          value = value[key];
        } else {
          return ''; // Return empty string if path doesn't exist
        }
      }

      return String(value);
    });

    return processedHtml;
  }, []);

  // Process the template content based on the preview mode
  useEffect(() => {
    try {
      setError(null);
      let content = '';

      switch (previewMode) {
        case 'html':
          if (!template.htmlContent) {
            setError('No HTML content available for this template.');
            return;
          }
          // Inject data into HTML template
          content = injectDataIntoTemplate(template.htmlContent, data);
          
          // Inject CSS into HTML
          if (template.cssContent) {
            content = content.replace('</head>', `<style>${template.cssContent}</style></head>`);
          }
          
          // Inject JavaScript into HTML
          if (template.jsContent) {
            content = content.replace('</body>', `<script>${template.jsContent}</script></body>`);
          }
          break;

        case 'svg':
          if (!template.svgContent) {
            setError('No SVG content available for this template.');
            return;
          }
          content = injectDataIntoTemplate(template.svgContent, data);
          break;

        case 'pdf':
          if (!template.pdfContent) {
            setError('No PDF content available for this template.');
            return;
          }
          content = template.pdfContent;
          break;

        default:
          content = 'Unsupported preview mode';
      }

      setProcessedContent(content);
    } catch (err) {
      setError(`Error processing template: ${(err as Error).message}`);
    }
  }, [template, data, previewMode, injectDataIntoTemplate]);

  // Handle rendering based on preview mode
  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="bg-red-50 text-red-800 p-4 rounded">
            <h3 className="text-lg font-medium">Error</h3>
            <p>{error}</p>
          </div>
        </div>
      );
    }

    // Use local dimensions if available, otherwise fallback to template dimensions or A4 size
    const resumeWidth = previewWidth || template.width || 794;   // Use width or A4 width in pixels at 96 DPI
    const resumeHeight = previewHeight || template.height || 1123; // Use height or A4 height in pixels at 96 DPI
    const defaultScale = 0.35; // Default scale if dynamic calculation fails
    
    // First try to use the template's displayScale if available
    // Otherwise use passed scale or default
    const templateScale = template.displayScale ? parseFloat(template.displayScale) : null;
    const finalScale = scale || templateScale || defaultScale;

    switch (previewMode) {
      case 'html':
        return (
          <div 
            className="resume-content" 
            style={{
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center',
              width: `${resumeWidth}px`, 
              height: `${resumeHeight}px`,
              pointerEvents: 'none',
              position: 'absolute'
            }}
          >
            <iframe
              srcDoc={processedContent}
              title="Resume Preview"
              style={{ 
                width: '100%',
                height: '100%',
                border: 'none',
              }}
            />
          </div>
        );

      case 'svg':
        return (
          <div 
            className="resume-content"
            style={{
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center',
              width: `${resumeWidth}px`, 
              height: `${resumeHeight}px`,
              pointerEvents: 'none',
              position: 'absolute'
            }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );

      case 'pdf':
        return (
          <div 
            className="resume-content"
            style={{
              transform: `scale(${finalScale})`,
              transformOrigin: 'center center',
              width: `${resumeWidth}px`, 
              height: `${resumeHeight}px`,
              pointerEvents: 'none',
              position: 'absolute'
            }}
          >
            <object
              data={`data:application/pdf;base64,${processedContent}`}
              type="application/pdf"
              style={{ width: '100%', height: '100%' }}
            >
              <p>PDF cannot be displayed in your browser.</p>
            </object>
          </div>
        );

      default:
        return <div>Unsupported preview mode</div>;
    }
  };

  // Handle dimension changes
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = Number(e.target.value);
    setPreviewWidth(newWidth);
    
    // Notify parent component if callback is provided
    if (onDimensionsChange) {
      onDimensionsChange(newWidth, previewHeight);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = Number(e.target.value);
    setPreviewHeight(newHeight);
    
    // Notify parent component if callback is provided
    if (onDimensionsChange) {
      onDimensionsChange(previewWidth, newHeight);
    }
  };
  
  // Create A4 dimensions preset
  const setToA4 = () => {
    const a4Width = 794;
    const a4Height = 1123;
    setPreviewWidth(a4Width);
    setPreviewHeight(a4Height);
    
    if (onDimensionsChange) {
      onDimensionsChange(a4Width, a4Height);
    }
  };
  
  return (
    <div className={`template-engine preview-wrapper relative ${className}`} style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      overflow: 'hidden',
      height: '100%',
      width: '100%',
      position: 'relative'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        overflow: 'hidden',
        flex: 1,
        width: '100%',
        position: 'relative'
      }}>
        {renderPreview()}
      </div>
      
      {/* Dimension Controls */}
      {showDimensionControls && (
        <div className="dimension-controls mt-4 p-4 bg-gray-50 rounded-md border shadow-sm w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Width (px)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="500"
                  max="1200"
                  step="1"
                  value={previewWidth}
                  onChange={handleWidthChange}
                  className="w-32"
                />
                <input
                  type="number"
                  min="500"
                  max="1200"
                  value={previewWidth}
                  onChange={handleWidthChange}
                  className="w-16 text-sm p-1 border rounded"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Height (px)</span>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="700"
                  max="1800"
                  step="1"
                  value={previewHeight}
                  onChange={handleHeightChange}
                  className="w-32"
                />
                <input
                  type="number"
                  min="700"
                  max="1800"
                  value={previewHeight}
                  onChange={handleHeightChange}
                  className="w-16 text-sm p-1 border rounded"
                />
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">
                Current: {previewWidth} × {previewHeight} px
              </span>
              <button
                type="button"
                onClick={setToA4}
                className="text-xs bg-primary text-white py-1 px-2 rounded hover:bg-primary/90 transition-colors"
              >
                Reset to A4
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateEngine;