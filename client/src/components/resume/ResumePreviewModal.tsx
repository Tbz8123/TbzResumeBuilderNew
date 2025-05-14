import React from 'react';
import { X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  setSelectedTemplateId: (id: number | null) => void;
  templates: ResumeTemplate[];
  hideSkills?: boolean;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  setSelectedTemplateId,
  templates,
  hideSkills = true
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[calc(100vh-150px)] p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <DialogTitle className="text-xl font-semibold text-gray-800">Resume Preview</DialogTitle>
          <DialogClose asChild>
            <button className="h-6 w-6 p-0 rounded-full inline-flex items-center justify-center text-gray-500 hover:text-gray-700">
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
        </div>
        <div className="p-6 overflow-auto h-[calc(100%-60px)]">
          <div className="bg-white">
            <HybridResumePreview 
              resumeData={resumeData}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              templates={templates}
              isModal={true}
              hideSkills={hideSkills}
              showTemplateControls={true}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;