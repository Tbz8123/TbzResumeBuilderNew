import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';
import { Button } from '@/components/ui/button';

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  setSelectedTemplateId: (id: number | null) => void;
  templates: ResumeTemplate[];
  hideSkills?: boolean;
  onNextStep?: () => void;
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  setSelectedTemplateId,
  templates,
  hideSkills = true,
  onNextStep
}) => {
  // Create a unique key that changes whenever the modal is opened
  // This forces React to unmount and remount the component, resetting all internal state
  const [previewKey, setPreviewKey] = useState(0);
  
  // Reset the preview key when the modal opens to force a complete re-render
  useEffect(() => {
    if (open) {
      console.log("[RESUME PREVIEW] Modal opened - resetting preview key to force clean render");
      setPreviewKey(prev => prev + 1);
    }
  }, [open]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Resume Preview</h2>
          <DialogClose className="rounded-full w-6 h-6 flex items-center justify-center">
            <X className="h-4 w-4" />
          </DialogClose>
        </div>
        
        <div className="flex justify-center p-4 bg-gray-50 rounded-md overflow-hidden" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          <div style={{ transform: 'scale(0.55)', transformOrigin: 'top center', marginBottom: '-30%' }}>
            {/* Use the key prop to force a complete remount when the modal opens */}
            <HybridResumePreview 
              key={`resume-preview-${previewKey}`}
              width={794} 
              height={1123}
              className="border shadow-lg"
              scaleContent={false}
              resumeData={resumeData}
              selectedTemplateId={selectedTemplateId}
              setSelectedTemplateId={setSelectedTemplateId}
              templates={templates}
              isModal={true}
              hideSkills={hideSkills}
            />
          </div>
        </div>
        
        {onNextStep && (
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => onOpenChange(false)}>Close</Button>
            <Button variant="default" onClick={onNextStep}>Continue to Next Step</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;