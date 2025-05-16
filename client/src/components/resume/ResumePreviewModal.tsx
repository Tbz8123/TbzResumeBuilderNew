import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { ResumeTemplate } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';
import { WorkExperience } from '@/types/resume';

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
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Always deduplicate work experience entries for all templates
  const deduplicatedResumeData = useMemo(() => {
    // If no work experience or no resumeData, just return original data
    if (!resumeData || !resumeData.workExperience?.length) return resumeData;
    
    // Create a deep clone to avoid mutating the original data
    const cleanedData = JSON.parse(JSON.stringify(resumeData));
    
    // Special handling for template 16
    const isTemplate16 = selectedTemplateId === 16;
    
    // For template 16, completely replace the array with first entry only
    if (isTemplate16 && cleanedData.workExperience?.length > 0) {
      console.log("[RESUME PREVIEW] Template 16 detected - using ONLY the first work experience entry");
      
      // Create a fresh array with just the first entry
      cleanedData.workExperience = [cleanedData.workExperience[0]];
    } else {
      // For other templates, perform aggressive deduplication using Set
      console.log("[RESUME PREVIEW] Standard template detected - performing work experience deduplication");
      
      // Create a Set of unique entries based on composite key
      const seen = new Set();
      
      // Filter the array to only keep unique entries
      cleanedData.workExperience = cleanedData.workExperience.filter((exp: WorkExperience) => {
        // Skip null/undefined entries
        if (!exp) return false;
        
        // Create a composite key from multiple fields for more precise deduplication
        const key = `${exp.jobTitle || ''}|${exp.employer || ''}|${exp.startYear || ''}|${exp.startMonth || ''}`;
        
        // If this key has been seen before, filter it out
        if (seen.has(key)) {
          console.log("[RESUME PREVIEW] Removing duplicate:", exp.jobTitle, "at", exp.employer);
          return false;
        }
        
        // Otherwise, add to seen set and keep this entry
        seen.add(key);
        return true;
      });
    }
    
    return cleanedData;
  }, [resumeData, selectedTemplateId]);

  // Find the selected template from the templates array
  const selectedTemplate = templates && Array.isArray(templates) ? templates.find(t => t.id === selectedTemplateId) || null : null;
  
  // Process the template HTML and styles
  useEffect(() => {
    if (open && selectedTemplate) {
      try {
        // Reset the preview key to force a clean render
        setPreviewKey(prev => prev + 1);
        
        // Extract CSS styles from the template
        const enhancedStyles = extractAndEnhanceStyles(selectedTemplate.htmlContent || '');
        if (enhancedStyles) {
          setTemplateStyles(enhancedStyles);
        }
        
        // Process the template HTML with resume data
        let processedHtml = processTemplateHtml(selectedTemplate.htmlContent || '', deduplicatedResumeData);
        
        // Check for "Description here..." placeholder and replace it with actual job description
        if (deduplicatedResumeData?.workExperience && deduplicatedResumeData.workExperience.length > 0) {
          const firstJob = deduplicatedResumeData.workExperience[0];
          if (firstJob.responsibilities) {
            processedHtml = processedHtml.replace(
              /<p>Description here\.\.\.<\/p>/g, 
              `<p>${firstJob.responsibilities.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
            );
          }
        }
        
        // Set the processed HTML
        setTemplateHtml(processedHtml);
        
      } catch (error) {
        console.error('Error processing template:', error);
      }
    }
  }, [open, selectedTemplate, deduplicatedResumeData]);
  
  // Handle PDF download
  const handleDownload = () => {
    if (!contentRef.current) return;
    
    // Create a printable version in a new window
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download as PDF');
      return;
    }
    
    // Setup the print document with proper CSS for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${resumeData.firstName || ''} ${resumeData.surname || ''} - Resume</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
            .resume-document {
              width: 210mm;
              min-height: 297mm;
              padding: 0;
              margin: 0;
              box-sizing: border-box;
            }
            .section, .job-entry, .education-entry {
              page-break-inside: avoid;
            }
            ${templateStyles}
          </style>
        </head>
        <body>
          <div class="resume-document">
            ${templateHtml}
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
    `);
    
    printWindow.document.close();
  };

  // Component to render the professional preview (like in the first screenshot)
  const ProfessionalPreview = () => (
    <div className="professional-preview bg-white shadow-lg mx-auto rounded overflow-hidden" style={{ maxWidth: '720px' }}>
      <div className="preview-content">
        {/* Template Display */}
        <div 
          ref={contentRef}
          className="resume-document bg-white mx-auto overflow-hidden" 
          style={{ 
            width: '100%', 
            height: 'auto',
            minHeight: 'min-content',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}
        >
          {/* Inject styles to allow content to expand vertically */}
          <style dangerouslySetInnerHTML={{ __html: `
            .resume-content {
              overflow: visible !important; 
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
            }
            
            /* Ensure all sections are visible */
            .resume-content * {
              overflow: visible !important;
              max-height: none !important;
            }
            
            /* Fix for common template issues */
            .sidebar, .main-content, .resume-section, .section {
              height: auto !important;
              min-height: min-content !important;
              max-height: none !important;
            }
          `}} />
          
          {/* Resume content */}
          <div 
            dangerouslySetInnerHTML={{ __html: templateHtml }}
            className="resume-content"
          />
        </div>
      </div>
    </div>
  );

  // Component for classic preview with HybridResumePreview
  const ClassicPreview = () => (
    <div className="flex justify-center overflow-auto" style={{ maxHeight: 'calc(80vh)' }}>
      <div style={{ transform: 'scale(0.7)', transformOrigin: 'top center' }}>
        {/* Use the key prop to force a complete remount when the modal opens */}
        <HybridResumePreview 
          key={`resume-preview-${previewKey}-${Date.now()}`}
          width={794} 
          height={1123}
          className="border shadow-lg"
          scaleContent={false}
          resumeData={deduplicatedResumeData}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          templates={templates}
          isModal={true}
          hideSkills={hideSkills}
        />
      </div>
    </div>
  );
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              className="flex items-center gap-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <DialogClose className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>
        
        <Tabs defaultValue="professional" className="w-full">
          <div className="border-b px-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="professional">
                <FileText className="h-4 w-4 mr-2" />
                Professional View
              </TabsTrigger>
              <TabsTrigger value="classic">
                <FileText className="h-4 w-4 mr-2" />
                Classic View
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="p-6 bg-gray-50" style={{ maxHeight: 'calc(80vh)', overflow: 'auto' }}>
            <TabsContent value="professional" className="mt-0">
              <ProfessionalPreview />
            </TabsContent>
            
            <TabsContent value="classic" className="mt-0">
              <ClassicPreview />
            </TabsContent>
          </div>
        </Tabs>
        
        {onNextStep && (
          <DialogFooter className="p-4 border-t">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="default" onClick={onNextStep}>Continue to Next Step</Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;