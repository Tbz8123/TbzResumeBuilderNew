import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeTemplate } from '@shared/schema';
import { ResumeData } from '@/types/resume';
import HybridResumePreview from './HybridResumePreview';
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
  const [previewData, setPreviewData] = React.useState(resumeData);
  
  // Update local state whenever resumeData changes
  React.useEffect(() => {
    setPreviewData({...resumeData, _previewTimestamp: Date.now()});
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

  // To enable real-time updates, re-render when resumeData changes
  React.useEffect(() => {
    console.log("ResumePreviewModal: ResumeData updated", resumeData);
  }, [resumeData]);

  // Use HybridResumePreview for consistent real-time updating 
  const renderTemplateContent = () => {
    if (!selectedTemplate || !selectedTemplate.htmlContent) {
      return (
        <div className="p-6 text-center">
          <p>Unable to load template content. Please try another template.</p>
        </div>
      );
    }

    // Use the HybridResumePreview component which already has real-time update capability
    return (
      <HybridResumePreview
        templateHtml={selectedTemplate.htmlContent}
        resumeData={previewData} // Use our local state that updates immediately
        width={800}
        height={1130}
        scaleContent={true}
        showPrintButton={true}
        fullPreviewMode={true}
        key={`preview-${Date.now()}`} // Force re-render on every update
      />
    );
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