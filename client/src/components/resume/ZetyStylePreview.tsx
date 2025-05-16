import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';
import HybridResumePreview from './HybridResumePreview';

interface ZetyStylePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
  onNextStep?: () => void;
  setSelectedTemplateId?: (id: number | null) => void;
  hideSkills?: boolean;
}

const ZetyStylePreview: React.FC<ZetyStylePreviewProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  templates,
  onNextStep,
  setSelectedTemplateId,
  hideSkills = true
}) => {
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const [previewKey, setPreviewKey] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Find the selected template from the templates array
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
  
  // Reset the preview key when the modal opens to force a complete re-render
  useEffect(() => {
    if (open) {
      setPreviewKey(prev => prev + 1);
    }
  }, [open]);
  
  // Process the template HTML and styles
  useEffect(() => {
    if (open && selectedTemplate) {
      try {
        // Extract CSS styles from the template
        const enhancedStyles = extractAndEnhanceStyles(selectedTemplate.htmlContent || '');
        if (enhancedStyles) {
          setTemplateStyles(enhancedStyles);
        }
        
        // Process the template HTML with resume data
        const processedHtml = processTemplateHtml(selectedTemplate.htmlContent || '', resumeData);
        
        // Set the processed HTML
        setTemplateHtml(processedHtml);
      } catch (error) {
        console.error('Error processing template:', error);
      }
    }
  }, [open, selectedTemplate, resumeData]);
  
  // Handle download
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
  
  // Component to render the professional preview (similar to the reference screenshot)
  const ProfessionalPreview = () => (
    <div className="professional-preview bg-white shadow-lg mx-auto rounded" style={{ maxWidth: '720px' }}>
      <div className="preview-content">
        {/* Template Display */}
        <div 
          ref={contentRef}
          className="resume-document bg-white mx-auto" 
          style={{ 
            width: '100%', 
            height: 'auto',
            minHeight: 'min-content'
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
  
  // Component for classic preview
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
          resumeData={resumeData}
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
              className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1"
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
        
        <div className="p-6 bg-gray-50 flex justify-center" style={{ maxHeight: 'calc(80vh)', overflowY: 'auto' }}>
          <ProfessionalPreview />
        </div>
        
        {onNextStep && (
          <DialogFooter className="p-4 border-t">
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="default" onClick={onNextStep}>Continue</Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ZetyStylePreview;