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
  const [processedContent, setProcessedContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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

    switch (previewMode) {
      case 'html':
        return (
          <iframe
            srcDoc={processedContent}
            className="w-full h-full border-0"
            title="Resume Preview"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
          />
        );

      case 'svg':
        return (
          <div
            className="flex items-center justify-center h-full"
            style={{ transform: `scale(${scale})`, transformOrigin: 'center top' }}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
        );

      case 'pdf':
        return (
          <div className="flex items-center justify-center h-full">
            <object
              data={`data:application/pdf;base64,${processedContent}`}
              type="application/pdf"
              className="w-full h-full"
            >
              <p>PDF cannot be displayed in your browser.</p>
            </object>
          </div>
        );

      default:
        return <div>Unsupported preview mode</div>;
    }
  };

  return (
    <div className={`template-engine relative ${className}`}>
      {renderPreview()}
    </div>
  );
};

export default TemplateEngine;