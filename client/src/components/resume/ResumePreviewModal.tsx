import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeTemplate } from '@shared/schema';
import { ResumeData } from '@/types/resume';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  templates
}) => {
  // Create local state that immediately syncs with incoming resumeData
  const [previewData, setPreviewData] = useState(resumeData);
  const [renderId, setRenderId] = useState(Date.now());
  
  // Update local state whenever resumeData changes
  useEffect(() => {
    setPreviewData({...resumeData});
    setRenderId(Date.now()); // Force re-render
  }, [resumeData]);
  
  // Find the selected template
  const selectedTemplate = templates?.find(template => template.id === selectedTemplateId);
  
  if (!selectedTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg p-6 bg-white shadow-xl">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">Resume Preview</DialogTitle>
            <DialogClose className="w-6 h-6 text-gray-500 hover:text-gray-800">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>No template selected. Please select a template first.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
  // Process the template HTML with actual resume data
  const processTemplate = (htmlContent: string, data: ResumeData) => {
    let processedHtml = htmlContent;
    
    // Basic information
    processedHtml = processedHtml
      .replace(/{{ name }}/g, `${data.firstName || ''} ${data.surname || ''}`)
      .replace(/{{ profession }}/g, data.profession || '')
      .replace(/{{ email }}/g, data.email || '')
      .replace(/{{ phone }}/g, data.phone || '')
      .replace(/{{ city }}/g, data.city || '')
      .replace(/{{ country }}/g, data.country || '')
      .replace(/{{ postalCode }}/g, data.postalCode || '')
      .replace(/{{ summary }}/g, data.summary || '');
    
    // Work experience
    if (data.workExperience && data.workExperience.length > 0) {
      let workExperienceHtml = '';
      
      data.workExperience.forEach(exp => {
        workExperienceHtml += `
          <div class="work-item">
            <h3>${exp.jobTitle || ''}</h3>
            <p>${exp.employer || ''}, ${exp.location || ''}</p>
            <p>${exp.startMonth || ''} ${exp.startYear || ''} - ${exp.isCurrentJob ? 'Present' : `${exp.endMonth || ''} ${exp.endYear || ''}`}</p>
            <div>${exp.responsibilities || ''}</div>
          </div>
        `;
      });
      
      processedHtml = processedHtml.replace(/{{ work_experience }}/g, workExperienceHtml);
    } else {
      processedHtml = processedHtml.replace(/{{ work_experience }}/g, '');
    }
    
    // Education
    if (data.education && data.education.length > 0) {
      let educationHtml = '';
      
      data.education.forEach(edu => {
        educationHtml += `
          <div class="education-item">
            <h3>${edu.degree || ''}</h3>
            <p>${edu.schoolName || ''} - ${edu.schoolLocation || ''}</p>
            <div>${edu.description || ''}</div>
          </div>
        `;
      });
      
      processedHtml = processedHtml.replace(/{{ education }}/g, educationHtml);
    } else {
      processedHtml = processedHtml.replace(/{{ education }}/g, '');
    }
    
    // Skills
    if (data.skills && data.skills.length > 0) {
      let skillsHtml = '<ul>';
      
      data.skills.forEach(skill => {
        skillsHtml += `<li>${typeof skill === 'string' ? skill : skill.name || ''}</li>`;
      });
      
      skillsHtml += '</ul>';
      processedHtml = processedHtml.replace(/{{ skills }}/g, skillsHtml);
    } else {
      processedHtml = processedHtml.replace(/{{ skills }}/g, '');
    }
    
    // Additional placeholders
    processedHtml = processedHtml.replace(/{{ additional_info }}/g, '');
    processedHtml = processedHtml.replace(/{{ website }}/g, '');
    processedHtml = processedHtml.replace(/{{ linkedin }}/g, '');
    
    return processedHtml;
  };
  
  // Real-time template rendering
  const renderResumeContent = () => {
    try {
      // Get and process the HTML content
      const processedHtml = processTemplate(selectedTemplate.htmlContent, previewData);
      
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: processedHtml }} 
          className="template-content"
          style={{ 
            width: '100%',
            height: 'auto',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0'
          }}
        />
      );
    } catch (error) {
      console.error("Error rendering template:", error);
      return (
        <div className="p-6 text-center">
          <p>An error occurred while rendering the template. Please try again.</p>
        </div>
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg p-0 bg-white shadow-xl">
        <DialogHeader className="sticky top-0 z-10 bg-white p-4 flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-4">
            <span className="text-blue-600 text-sm">
              {selectedTemplate ? selectedTemplate.name : 'Template'}
            </span>
            <DialogClose className="w-6 h-6 text-gray-500 hover:text-gray-800">
              <X size={18} />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="resume-container p-6">
          <div className="resume-preview shadow-lg mx-auto bg-white rounded-sm overflow-hidden" style={{maxWidth: '100%'}}>
            {/* Use a key to force re-render when data changes */}
            <div key={`preview-${renderId}`}>
              {renderResumeContent()}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;