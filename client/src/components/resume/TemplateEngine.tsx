import React, { useState, useEffect, useRef } from 'react';
import { ResumeTemplate } from '@shared/schema';

interface TemplateEngineProps {
  template: ResumeTemplate;
  data?: ResumeData;
  scale?: number;
  editable?: boolean;
  onDataChange?: (data: ResumeData) => void;
  previewMode?: 'html' | 'svg' | 'pdf';
  className?: string;
}

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

// Default resume data for previews
const defaultResumeData: ResumeData = {
  personalInfo: {
    name: 'John Doe',
    title: 'Software Engineer',
    email: 'john.doe@example.com',
    phone: '(123) 456-7890',
    address: 'New York, NY',
    linkedin: 'linkedin.com/in/johndoe',
    summary: 'Experienced software engineer with a passion for creating elegant solutions to complex problems. Proficient in multiple programming languages and frameworks.',
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
        'Mentored junior developers, improving team productivity by 30%',
        'Refactored legacy codebase, reducing technical debt by 40%'
      ]
    },
    {
      company: 'Digital Solutions LLC',
      position: 'Software Developer',
      startDate: '2017-06',
      endDate: '2019-12',
      description: 'Developed and maintained web applications for clients in various industries.',
      achievements: [
        'Created responsive web interfaces using modern frontend frameworks',
        'Optimized database queries, improving application performance by 60%'
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
    { name: 'HTML/CSS', level: 85 },
    { name: 'Python', level: 70 },
    { name: 'SQL', level: 75 }
  ]
};

const TemplateEngine: React.FC<TemplateEngineProps> = ({
  template,
  data = defaultResumeData,
  scale = 1,
  editable = false,
  onDataChange,
  previewMode = 'html',
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState(scale);
  const [resumeData, setResumeData] = useState<ResumeData>(data);

  // Handle data changes if the component is editable
  const handleDataChange = (newData: Partial<ResumeData>) => {
    const updatedData = { ...resumeData, ...newData };
    setResumeData(updatedData);
    if (onDataChange) {
      onDataChange(updatedData);
    }
  };

  // Replace placeholders in template with actual data
  const processTemplate = (templateContent: string): string => {
    if (!templateContent) return '';

    let processedContent = templateContent;

    // Process personal information
    processedContent = processedContent
      .replace(/{{name}}/g, resumeData.personalInfo.name)
      .replace(/{{title}}/g, resumeData.personalInfo.title)
      .replace(/{{email}}/g, resumeData.personalInfo.email)
      .replace(/{{phone}}/g, resumeData.personalInfo.phone)
      .replace(/{{address}}/g, resumeData.personalInfo.address || '')
      .replace(/{{website}}/g, resumeData.personalInfo.website || '')
      .replace(/{{linkedin}}/g, resumeData.personalInfo.linkedin || '')
      .replace(/{{summary}}/g, resumeData.personalInfo.summary || '');

    // More complex data like work experience, education, and skills
    // would need more sophisticated templating or be handled via JavaScript
    // in the rendered template

    return processedContent;
  };

  // Generate HTML content with inlined CSS and JS
  const generateHtmlContent = (): string => {
    if (!template) return '';

    let baseHtml = template.htmlContent || '';
    
    // If there's no HTML content but there is SVG content, we'll wrap the SVG
    if (!baseHtml && template.svgContent) {
      baseHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Resume Template</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            font-family: Arial, sans-serif;
          }
          .resume-container {
            width: 8.5in;
            height: 11in;
            position: relative;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="resume-container">
          ${template.svgContent}
        </div>
      </body>
      </html>
      `;
    }

    // Process content with actual data
    let processedHtml = processTemplate(baseHtml);
    
    // Inject CSS
    if (template.cssContent) {
      processedHtml = processedHtml.replace('</head>', `<style>${template.cssContent}</style></head>`);
    }
    
    // Inject JS
    if (template.jsContent) {
      processedHtml = processedHtml.replace('</body>', `<script>${template.jsContent}</script></body>`);
    }
    
    return processedHtml;
  };

  const renderPreview = () => {
    switch (previewMode) {
      case 'pdf':
        if (template.pdfContent) {
          return (
            <iframe
              src={`data:application/pdf;base64,${template.pdfContent}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center'
              }}
              title="PDF Resume Preview"
            />
          );
        } else {
          // Fallback to HTML if no PDF
          return renderHtmlPreview();
        }
      
      case 'svg':
        if (template.svgContent) {
          return (
            <div 
              className="svg-container"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                width: '100%',
                display: 'flex',
                justifyContent: 'center'
              }}
              dangerouslySetInnerHTML={{ __html: processTemplate(template.svgContent) }}
            />
          );
        } else {
          // Fallback to HTML if no SVG
          return renderHtmlPreview();
        }
      
      case 'html':
      default:
        return renderHtmlPreview();
    }
  };

  const renderHtmlPreview = () => {
    return (
      <iframe
        srcDoc={generateHtmlContent()}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'top center'
        }}
        title="HTML Resume Preview"
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`template-engine-container relative ${className}`}
      style={{ 
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        minHeight: '500px'
      }}
    >
      {renderPreview()}
      
      {/* Add edit overlay if editable */}
      {editable && (
        <div className="edit-overlay absolute inset-0 pointer-events-none">
          {/* Add overlay controls here if needed */}
        </div>
      )}
    </div>
  );
};

export default TemplateEngine;