import React from 'react';
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

  // Function to safely prepare and render the template HTML content
  const renderTemplateContent = () => {
    if (!selectedTemplate || !selectedTemplate.htmlContent) {
      return (
        <div className="p-6 text-center">
          <p>Unable to load template content. Please try another template.</p>
        </div>
      );
    }

    // Process the HTML content to insert user data
    try {
      // Get the HTML content from the template
      let htmlContent = selectedTemplate.htmlContent;
      
      // Replace template variables with actual data
      htmlContent = htmlContent
        .replace(/{{ name }}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`)
        .replace(/{{ profession }}/g, resumeData.profession || '')
        .replace(/{{ email }}/g, resumeData.email || '')
        .replace(/{{ phone }}/g, resumeData.phone || '')
        .replace(/{{ city }}/g, resumeData.city || '')
        .replace(/{{ country }}/g, resumeData.country || '')
        .replace(/{{ postalCode }}/g, resumeData.postalCode || '')
        .replace(/{{ summary }}/g, resumeData.summary || '');
      
      // Work experience
      if (resumeData.workExperience && resumeData.workExperience.length > 0) {
        let workExperienceHtml = '';
        
        resumeData.workExperience.forEach(exp => {
          workExperienceHtml += `
            <div class="work-item">
              <h3>${exp.jobTitle || ''}</h3>
              <p>${exp.employer || ''}, ${exp.location || ''}</p>
              <p>${exp.startMonth || ''} ${exp.startYear || ''} - ${exp.isCurrentJob ? 'Present' : `${exp.endMonth || ''} ${exp.endYear || ''}`}</p>
              <div>${exp.responsibilities || ''}</div>
            </div>
          `;
        });
        
        htmlContent = htmlContent.replace(/{{ work_experience }}/g, workExperienceHtml);
      } else {
        htmlContent = htmlContent.replace(/{{ work_experience }}/g, '');
      }
      
      // Education
      if (resumeData.education && resumeData.education.length > 0) {
        let educationHtml = '';
        
        resumeData.education.forEach(edu => {
          educationHtml += `
            <div class="education-item">
              <h3>${edu.degree || ''}</h3>
              <p>${edu.schoolName || ''} - ${edu.schoolLocation || ''}</p>
              <div>${edu.description || ''}</div>
            </div>
          `;
        });
        
        htmlContent = htmlContent.replace(/{{ education }}/g, educationHtml);
      } else {
        htmlContent = htmlContent.replace(/{{ education }}/g, '');
      }
      
      // Skills
      if (resumeData.skills && resumeData.skills.length > 0) {
        let skillsHtml = '<ul>';
        
        resumeData.skills.forEach(skill => {
          skillsHtml += `<li>${typeof skill === 'string' ? skill : skill.name || ''}</li>`;
        });
        
        skillsHtml += '</ul>';
        htmlContent = htmlContent.replace(/{{ skills }}/g, skillsHtml);
      } else {
        htmlContent = htmlContent.replace(/{{ skills }}/g, '');
      }
      
      // Additional placeholders that might be in templates
      htmlContent = htmlContent.replace(/{{ additional_info }}/g, '');
      htmlContent = htmlContent.replace(/{{ website }}/g, '');
      htmlContent = htmlContent.replace(/{{ linkedin }}/g, '');
      
      return (
        <div 
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
          className="template-content"
          style={{ 
            width: '100%',
            height: 'auto',
            maxWidth: '800px',
            margin: '0 auto' 
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
            {renderTemplateContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;