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
  
  // Component to render the professional preview that mimics Zety's design
  const ProfessionalPreview = () => (
    <div className="professional-preview" style={{ 
      width: '100%', 
      maxWidth: '700px',
      margin: '0 auto',
      backgroundColor: 'white',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
      borderRadius: '6px'
    }}>
      <div 
        ref={contentRef}
        className="resume-document bg-white"
        style={{ 
          width: '100%',
          height: 'auto',
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '6px'
        }}
      >
        {/* Zety-like styling for preview */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Zety-style web preview */
          .resume-content {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            line-height: 1.5;
            color: #333;
            max-width: 100%;
          }
          
          /* Enhance typography */
          .resume-content h1 {
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 4px;
            color: #25335c;
          }
          
          .resume-content h2, .resume-content h3 {
            font-weight: 600;
            color: #25335c;
            margin-top: 18px;
            margin-bottom: 12px;
          }
          
          /* Contact details styling */
          .contact-details, .personal-details {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            margin-bottom: 18px;
            font-size: 14px;
          }
          
          .contact-details > div, .personal-details > div {
            display: flex;
            align-items: center;
            gap: 6px;
          }
          
          /* Section styling */
          .resume-section {
            margin-bottom: 20px;
            width: 100%;
          }
          
          /* Print-specific styles for PDF output - hidden in web preview */
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            .resume-document {
              width: 210mm;
              min-height: 297mm;
              box-sizing: border-box;
            }
            
            .resume-page, .page {
              page-break-after: always;
            }
          }
        `}} />
        
        {/* Resume content */}
        <div 
          dangerouslySetInnerHTML={{ __html: templateHtml }}
          className="resume-content"
        />
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
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white">
        <div className="flex justify-between items-center p-3 pl-5">
          <DialogTitle className="text-base font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              className="bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-1 rounded-md"
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
        
        <div className="flex justify-center" style={{ 
          maxHeight: 'calc(90vh - 60px)', 
          overflowY: 'auto',
          padding: '0.5rem 0',
          backgroundColor: '#fff'
        }}>
          <ProfessionalPreview />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZetyStylePreview;