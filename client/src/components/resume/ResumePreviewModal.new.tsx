import React, { useState } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import { ResumeData } from '@/contexts/ResumeContext';
import { Button } from '@/components/ui/button';

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  setSelectedTemplateId: (id: number | null) => void;
  templates: any[];
  hideSkills?: boolean;
  onNextStep?: () => void;
}

/**
 * ResumePreviewModal - Displays a modal with two view options for resume preview
 * Uses the exact same configuration as the right sidebar for consistent template display
 */
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
  // Create a key to force remount when the modal opens
  const [previewKey, setPreviewKey] = useState(0);
  
  // Update the key when the modal opens to ensure fresh render
  React.useEffect(() => {
    if (open) {
      setPreviewKey(prev => prev + 1);
    }
  }, [open]);

  // Professional preview - displays the resume in a full A4 format without page breaks
  const ProfessionalPreview = () => (
    <div className="professional-preview bg-white shadow-lg mx-auto rounded overflow-auto" style={{ maxWidth: '720px' }}>
      <div className="p-0">
        <HybridResumePreview 
          width={700}
          height="auto"
          className="transition-all duration-300"
          resumeData={resumeData}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          templates={templates}
          isModal={true}
          hideSkills={hideSkills}
          scaleContent={false}
          expandContent={true}
        />
      </div>
    </div>
  );

  // Classic preview - using EXACTLY the same configuration as the right sidebar
  const ClassicPreview = () => (
    <div className="flex justify-center overflow-auto py-8">
      <div className="mx-auto" style={{ width: '400px' }}>
        {/* This matches exactly the sidebar implementation */}
        <div className="relative bg-white" style={{ height: '500px' }}>
          <HybridResumePreview 
            className="h-full w-full" 
            width={280} 
            height={410}
            resumeData={resumeData}
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            templates={templates}
            isModal={false}
            hideSkills={hideSkills}
            scaleContent={true}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      modal={true}
      key={`preview-modal-${previewKey}`}
    >
      <DialogContent className="max-w-5xl w-[95vw] h-[95vh] overflow-hidden flex flex-col p-4">
        <div className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold">Resume Preview</DialogTitle>
          
          <div className="flex items-center gap-2">
            <DialogClose asChild>
              <Button 
                variant="outline" 
                size="icon"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
            
            <Button
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="classic" className="mt-2 flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-auto mb-4">
            <TabsTrigger value="professional" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Professional View
            </TabsTrigger>
            <TabsTrigger value="classic" className="flex items-center gap-1">
              <FileText className="h-4 w-4" /> Classic View
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="professional" className="flex flex-col flex-1 overflow-auto">
            <div className="flex-1 overflow-auto">
              <ProfessionalPreview />
            </div>
          </TabsContent>
          
          <TabsContent value="classic" className="flex-1 overflow-auto">
            <ClassicPreview />
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-4 flex items-center justify-between">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          
          {onNextStep && (
            <Button onClick={onNextStep} variant="default">
              Continue to Next Step
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;