import React, { useState, useEffect, useRef } from 'react';
import { X, Download, FileText } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';

interface ZetyPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
}

const ZetyPreview: React.FC<ZetyPreviewProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  templates
}) => {
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Find the selected template
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  // Process template on open
  useEffect(() => {
    if (open && selectedTemplate && selectedTemplate.htmlContent) {
      try {
        // Extract CSS styles
        const enhancedStyles = extractAndEnhanceStyles(selectedTemplate.htmlContent);
        setTemplateStyles(enhancedStyles || '');
        
        // Process HTML with resume data
        const processedHtml = processTemplateHtml(selectedTemplate.htmlContent, resumeData);
        setTemplateHtml(processedHtml);
      } catch (error) {
        console.error('Error processing template:', error);
        setTemplateHtml('<div class="error">Error processing template</div>');
      }
    }
  }, [open, selectedTemplate, resumeData]);
  
  // Handle print/download
  const handlePrint = () => {
    if (!contentRef.current) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to download the resume');
      return;
    }
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Resume - ${resumeData.firstName} ${resumeData.surname}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
            }
            .resume-content {
              width: 210mm;
              min-height: 297mm;
              padding: 0;
              margin: 0;
              box-sizing: border-box;
              page-break-after: always;
            }
            /* Prevent sections from breaking across pages */
            section, .section, .job-entry, .education-entry {
              page-break-inside: avoid;
            }
            /* Template-specific styles */
            ${templateStyles}
          </style>
        </head>
        <body>
          <div class="resume-content">
            ${templateHtml}
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 bg-gray-50">
        <div className="sticky top-0 z-10 flex justify-between items-center p-4 bg-white border-b">
          <h2 className="text-lg font-semibold">Resume Preview</h2>
          <div className="flex items-center gap-2">
            <Button 
              variant="default" 
              size="sm"
              className="flex items-center gap-1"
              onClick={handlePrint}
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            <DialogClose className="rounded-full w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-gray-200">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>
        
        <div className="resume-preview-container overflow-auto p-8" style={{ maxHeight: 'calc(90vh - 70px)' }}>
          <div 
            ref={contentRef}
            className="resume-document bg-white shadow-md mx-auto"
            style={{ 
              width: '210mm',
              height: 'auto',
              position: 'relative'
            }}
          >
            {/* Critical CSS to ensure template displays properly */}
            <style dangerouslySetInnerHTML={{ __html: `
              /* Force all elements to be visible and expandable */
              .resume-document * {
                overflow: visible !important;
                height: auto !important;
                min-height: min-content !important;
                max-height: none !important;
              }
              
              /* Fix for common template issues with fixed heights */
              .resume-section, .sidebar, .main-content, .section {
                height: auto !important;
                min-height: min-content !important;
                max-height: none !important;
              }
              
              /* Ensure content vertically expands within the document */
              .resume-content {
                display: block;
                height: auto !important;
                min-height: min-content !important;
              }
            `}} />
            
            {/* Resume content */}
            <div 
              dangerouslySetInnerHTML={{ __html: templateHtml }} 
              className="resume-content overflow-visible"
            />
            
            {/* Show empty state if no template or content */}
            {(!selectedTemplate || !templateHtml) && (
              <div className="flex flex-col items-center justify-center p-20 text-center text-gray-500">
                <FileText size={48} className="mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">No Template Selected</h3>
                <p className="max-w-sm text-sm">
                  Please select a resume template to preview your content.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ZetyPreview;