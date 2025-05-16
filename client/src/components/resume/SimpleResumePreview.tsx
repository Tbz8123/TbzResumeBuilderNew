import React, { useRef } from 'react';
import { X, Download } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResumeData } from '@/contexts/ResumeContext';

// Simplified props interface for the preview component
interface SimpleResumePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId?: number | null;
  templates?: any[];
  onNextStep?: () => void;
  hideSkills?: boolean;
  setSelectedTemplateId?: (id: number | null) => void;
}

/**
 * Professional resume preview component that matches the Zety style
 * Focuses on clean interface with single scrollbar and no page breaks
 */
const SimpleResumePreview: React.FC<SimpleResumePreviewProps> = ({
  open,
  onOpenChange,
  resumeData,
  onNextStep,
  hideSkills = false
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Handle PDF download
  const handleDownload = () => {
    if (!contentRef.current) return;
    
    // Create a printable version in a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download as PDF');
      return;
    }
    
    // Get personal name for the PDF title
    const name = `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim() || 'Resume';
    
    // Create PDF content with proper handling of the data structure
    const createPdfContent = () => {
      // Format work experience
      const workExperience = resumeData.workExperience && resumeData.workExperience.length > 0 
        ? `
          <div class="section section-break">
            <h2>Work Experience</h2>
            ${resumeData.workExperience.map(exp => `
              <div class="experience-item">
                <div class="experience-header">
                  <div>${exp.jobTitle || 'Job Title'}</div>
                  <div>${exp.startMonth} ${exp.startYear} - ${exp.isCurrentJob ? 'Present' : `${exp.endMonth} ${exp.endYear}`}</div>
                </div>
                <div class="company-location">${exp.employer || 'Employer'}${exp.location ? `, ${exp.location}` : ''}</div>
                <p>${exp.responsibilities || 'Job responsibilities'}</p>
              </div>
            `).join('')}
          </div>
        ` : '';
      
      // Format education 
      const education = resumeData.education && resumeData.education.length > 0 
        ? `
          <div class="section section-break">
            <h2>Education</h2>
            ${resumeData.education.map(edu => `
              <div class="education-item">
                <div class="education-header">
                  <div>${edu.degree || 'Degree'}, ${edu.fieldOfStudy || 'Field of Study'}</div>
                  <div>${edu.graduationMonth || ''} ${edu.graduationYear || ''}</div>
                </div>
                <div class="company-location">${edu.schoolName || 'Institution'}</div>
                ${edu.description ? `<p>${edu.description}</p>` : ''}
              </div>
            `).join('')}
          </div>
        ` : '';
      
      // Format skills - using any type to avoid TS errors with different skill structures
      const skills = !hideSkills && resumeData.skills && resumeData.skills.length > 0 
        ? `
          <div class="section section-break">
            <h2>Skills</h2>
            <div class="skills-container">
              ${Array.isArray(resumeData.skills) 
                ? (resumeData.skills as any[]).map(skill => {
                  // Convert any skill type to a string representation
                  const skillText = typeof skill === 'string' 
                    ? skill 
                    : (typeof skill === 'object' && skill && 'name' in skill 
                      ? skill.name 
                      : '');
                  return `<div class="skill-item">${skillText}</div>`;
                }).join('')
                : ''
              }
            </div>
          </div>
        ` : '';
    
      return `
        <!DOCTYPE html>
        <html>
          <head>
            <title>${name} - Resume</title>
            <style>
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
              }
              .resume-document {
                width: 210mm;
                min-height: 297mm;
                padding: 20mm;
                margin: 0;
                box-sizing: border-box;
              }
              h1 {
                font-size: 24px;
                margin-bottom: 5px;
                color: #333;
              }
              h2 {
                font-size: 18px;
                margin-top: 15px;
                margin-bottom: 10px;
                color: #333;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
              }
              .contact-info {
                display: flex;
                justify-content: center;
                gap: 15px;
                margin-bottom: 20px;
                font-size: 14px;
                color: #555;
              }
              .section {
                margin-bottom: 20px;
              }
              .experience-item, .education-item {
                margin-bottom: 15px;
              }
              .experience-header, .education-header {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
              }
              .company-location {
                font-style: italic;
                margin-bottom: 5px;
              }
              .skills-container {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
              }
              .skill-item {
                background-color: #f0f0f0;
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 13px;
              }
              .section-break {
                page-break-inside: avoid;
              }
            </style>
          </head>
          <body>
            <div class="resume-document">
              <!-- Content will be added here -->
              <h1 style="text-align: center;">${resumeData.firstName || ''} ${resumeData.surname || ''}</h1>
              <div class="contact-info">
                ${resumeData.email ? `<span>${resumeData.email}</span>` : ''}
                ${resumeData.phone ? `<span>• ${resumeData.phone}</span>` : ''}
                ${resumeData.city && resumeData.country ? `<span>• ${resumeData.city}, ${resumeData.country}</span>` : ''}
              </div>
              
              ${resumeData.summary ? `
              <div class="section section-break">
                <h2>Professional Summary</h2>
                <p>${resumeData.summary}</p>
              </div>
              ` : ''}
              
              ${workExperience}
              ${education}
              ${skills}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }, 200);
              };
            </script>
          </body>
        </html>
      `;
    };
    
    // Write the PDF content to the window
    printWindow.document.write(createPdfContent());
    
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex justify-between items-center p-3 pl-5">
          <DialogTitle className="text-base font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <DialogClose className="rounded-md w-7 h-7 flex items-center justify-center hover:bg-gray-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>
        
        <div 
          ref={contentRef}
          className="flex justify-center overflow-auto" 
          style={{ 
            maxHeight: 'calc(90vh - 60px)', 
            padding: '1rem 0',
            backgroundColor: '#fff'
          }}
        >
          <div className="w-full max-w-[700px] bg-white p-8">
            {/* Personal Info Section */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">{`${resumeData.firstName || ''} ${resumeData.surname || ''}`}</h1>
              <div className="flex justify-center gap-3 text-sm text-gray-600 mt-1">
                {resumeData.email && (
                  <span>{resumeData.email}</span>
                )}
                {resumeData.phone && (
                  <span>• {resumeData.phone}</span>
                )}
                {resumeData.city && resumeData.country && (
                  <span>• {resumeData.city}, {resumeData.country}</span>
                )}
              </div>
            </div>

            {/* Summary Section */}
            {resumeData.summary && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-2 text-gray-800 border-b pb-1">Professional Summary</h2>
                <p className="text-sm">{resumeData.summary}</p>
              </div>
            )}
            
            {/* Work Experience Section */}
            {resumeData.workExperience && resumeData.workExperience.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Work Experience</h2>
                {resumeData.workExperience.map((exp, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between text-sm">
                      <div className="font-bold">{exp.jobTitle || 'Job Title'}</div>
                      <div className="text-gray-600">
                        {exp.startMonth} {exp.startYear} - {exp.isCurrentJob ? 'Present' : `${exp.endMonth} ${exp.endYear}`}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{exp.employer || 'Employer'}{exp.location ? `, ${exp.location}` : ''}</div>
                    <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{exp.responsibilities || 'Job responsibilities'}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Education Section */}
            {resumeData.education && resumeData.education.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Education</h2>
                {resumeData.education.map((edu, index) => (
                  <div key={index} className="mb-4">
                    <div className="flex justify-between text-sm">
                      <div className="font-bold">{edu.degree || 'Degree'}, {edu.fieldOfStudy || 'Field of Study'}</div>
                      <div className="text-gray-600">
                        {edu.graduationMonth} {edu.graduationYear}
                      </div>
                    </div>
                    <div className="text-sm font-medium">{edu.schoolName || 'Institution'}</div>
                    {edu.description && (
                      <p className="mt-2 text-sm text-gray-700">{edu.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Skills Section */}
            {!hideSkills && resumeData.skills && resumeData.skills.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {/* Safely handle different possible types of skills data */}
                  {Array.isArray(resumeData.skills) && resumeData.skills.map((skill: any, index) => (
                    <span key={index} className="text-sm bg-gray-100 rounded-full px-3 py-1">
                      {typeof skill === 'string' ? skill : (skill && typeof skill === 'object' && 'name' in skill ? skill.name : '')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleResumePreview;