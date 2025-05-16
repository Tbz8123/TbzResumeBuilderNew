import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import HybridResumePreview from './HybridResumePreview';
import { Button } from '@/components/ui/button';
import { ResumeData, ResumeTemplate } from '@/types/resume';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

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
  hideSkills = false,
  onNextStep
}) => {
  const [templateSelection, setTemplateSelection] = useState<'classic' | 'overlay'>('classic');
  const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);

  // Filter to only show templates that have template HTML available
  const availableTemplates = templates.filter(t => t.html);

  // Function to strip identifying data for preview
  const deduplicateResumeData = (data: ResumeData): ResumeData => {
    // Create a deep copy to avoid mutating the original
    const copy = JSON.parse(JSON.stringify(data));

    // Ensure work experience entries are properly deduplicated
    if (copy.workExperience && Array.isArray(copy.workExperience)) {
      // Filter out any temporary entries and ensure unique values
      const seenKeys = new Set();
      copy.workExperience = copy.workExperience
        .filter(exp => !(typeof exp.id === 'string' && exp.id === 'temp-entry'))
        .filter(exp => {
          // Create a unique key based on job title, company and date
          const key = `${exp.jobTitle || ''}|${exp.employer || ''}|${exp.startYear || ''}`;
          if (!seenKeys.has(key)) {
            seenKeys.add(key);
            return true;
          }
          return false;
        });
    }

    return copy;
  };

  const deduplicatedResumeData = deduplicateResumeData(resumeData);

  // Update the active template index when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const index = availableTemplates.findIndex(t => t.id === selectedTemplateId);
      if (index !== -1) {
        setActiveTemplateIndex(index);
      }
    }
  }, [selectedTemplateId, availableTemplates]);

  // Select the next available template
  const selectNextTemplate = () => {
    const nextIndex = (activeTemplateIndex + 1) % availableTemplates.length;
    setSelectedTemplateId(availableTemplates[nextIndex].id);
  };

  // Select the previous available template
  const selectPrevTemplate = () => {
    const prevIndex = (activeTemplateIndex - 1 + availableTemplates.length) % availableTemplates.length;
    setSelectedTemplateId(availableTemplates[prevIndex].id);
  };

  // Component for classic preview with HybridResumePreview
  const ClassicPreview = () => {
    // Ensure template consistency for SAHIB KHAN template
    const fixedTemplateId = selectedTemplateId === 16 ? 16 : selectedTemplateId;
    
    return (
      <div className="flex justify-center overflow-auto" style={{ maxHeight: 'calc(90vh)', padding: '20px 0' }}>
        <div className="template-wrapper">
          <style dangerouslySetInnerHTML={{ __html: `
            /* Template container styles */
            .template-wrapper {
              width: 210mm;
              min-height: 297mm;
              transform: scale(0.85);
              transform-origin: top center;
              box-shadow: 0 0 12px rgba(0,0,0,0.1);
              background: white;
              margin: 0 auto;
              padding: 0;
              overflow: hidden;
            }
            
            /* For SAHIB KHAN template (Template 16) */
            .resume-page {
              display: flex;
              flex-direction: row;
              width: 210mm;
              min-height: 297mm;
              background: #fff;
              box-shadow: 0 0 5px rgba(0,0,0,0.1);
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            
            .left {
              width: 35%;
              background: #407187;
              color: #fff;
              padding: 20px 15px;
            }
            
            .right {
              width: 65%;
              padding: 20px;
            }
            
            /* Section styling */
            .section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .section h2 {
              font-size: 0.875rem;
              background: #f0f0f0;
              color: #000;
              padding: 5px;
              margin-bottom: 5px;
            }
            
            /* Add proper scrolling */
            .resume-container {
              overflow-y: visible !important;
              min-height: fit-content !important;
            }
            
            /* Ensure content expands properly */
            body .resume-container,
            body .resume-container * {
              height: auto !important;
              min-height: min-content !important;
              max-height: none !important;
            }
            
            /* Text styles */
            .job-title {
              font-weight: bold;
            }
            
            .company {
              font-style: italic;
            }
            
            /* Lists */
            .skills li,
            .languages li,
            .hobbies li {
              margin-bottom: 4px;
            }
          `}} />

          {/* Hybrid resume preview */}
          <HybridResumePreview
            width={595}
            height="auto"
            className="border shadow-lg"
            scaleContent={false}
            resumeData={deduplicatedResumeData}
            selectedTemplateId={fixedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
            templates={templates}
            isModal={true}
            hideSkills={hideSkills}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm"
              className={cn(
                "text-xs",
                templateSelection === 'classic' && "bg-gray-100"
              )}
              onClick={() => setTemplateSelection('classic')}
            >
              Classic View
            </Button>
            {onNextStep && (
              <Button 
                size="sm" 
                onClick={() => {
                  onOpenChange(false);
                  onNextStep();
                }}
              >
                Continue
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Template navigation controls */}
        <div className="flex justify-between items-center p-4 border-b">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectPrevTemplate}
            disabled={availableTemplates.length <= 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous Template
          </Button>
          <span className="text-sm font-medium">
            {selectedTemplateId && availableTemplates.find(t => t.id === selectedTemplateId)?.name}
          </span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={selectNextTemplate}
            disabled={availableTemplates.length <= 1}
          >
            Next Template
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
        
        {/* Preview content */}
        <div className="h-full max-h-[80vh] overflow-auto bg-gray-50">
          <ClassicPreview />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;