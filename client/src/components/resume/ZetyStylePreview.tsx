import React, { useState, useEffect, useRef } from 'react';
import { X, Download } from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';

interface ZetyStylePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
  onNextStep?: () => void;
}

const ZetyStylePreview: React.FC<ZetyStylePreviewProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  templates,
  onNextStep
}) => {
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Find the selected template from the templates array
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId) || null;
  
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
          <title>Resume</title>
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
              onClick={handleDownload}
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
              minHeight: '297mm' 
            }}
          >
            {/* Resume content */}
            <div 
              dangerouslySetInnerHTML={{ __html: templateHtml }}
              className="resume-content"
            />
          </div>
        </div>
        
        {onNextStep && (
          <div className="p-4 bg-white border-t flex justify-end">
            <Button onClick={onNextStep}>
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ZetyStylePreview;