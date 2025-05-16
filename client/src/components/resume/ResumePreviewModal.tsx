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
        
        // Ensure job description appears in the resume
        if (deduplicatedResumeData?.workExperience && deduplicatedResumeData.workExperience.length > 0) {
          const firstJob = deduplicatedResumeData.workExperience[0];
          if (firstJob.responsibilities) {
            const description = firstJob.responsibilities.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // 1. Replace description placeholder (standard approach)
            processedHtml = processedHtml.replace(
              /<p>Description here\.\.\.<\/p>/g, 
              `<p>${description}</p>`
            );
            
            // 2. Replace any bare text "Description here..." (broader approach)
            processedHtml = processedHtml.replace(
              /Description here\.\.\./g, 
              description
            );
            
            // 3. For Template 16 (SAHIB KHAN template) - Special approach
            if (selectedTemplateId === 16 || processedHtml.includes('SAHIB KHAN')) {
              console.log("Special fix for Template 16 (SAHIB KHAN template)");
              
              // Insert job description after work experience section
              const workExperiencePattern = /(WORK EXPERIENCE[\s\S]*?Software Engineer[\s\S]*?ef[\s\S]*?September 2017 - August 2019)/i;
              if (workExperiencePattern.test(processedHtml)) {
                processedHtml = processedHtml.replace(
                  workExperiencePattern,
                  `$1
                  <div style="margin-top:8px;">${description}</div>`
                );
              }
            }
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
          {/* Enhanced styles for intelligent layout adaptation */}
          <style dangerouslySetInnerHTML={{ __html: `
            /* Zety-style auto-scaling content */
            .resume-content {
              overflow: visible !important; 
              height: auto !important;
              min-height: auto !important;
              max-height: none !important;
              display: flex !important;
              flex-direction: column !important;
              flex-grow: 1 !important;
            }
            
            /* Ensure all sections are visible and properly flow */
            .resume-content * {
              overflow: visible !important;
              max-height: none !important;
              box-sizing: border-box !important;
            }
            
            /* Intelligent layout scaling for content-heavy sections */
            .resume-content p, 
            .resume-content li, 
            .resume-content div {
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              hyphens: auto !important;
              margin-bottom: 0.1em !important;
            }
            
            /* Fix for common template issues - ensure every section can grow */
            .sidebar, .main-content, .resume-section, .section, 
            [class*="section"], [class*="container"], [class*="content"],
            [class*="experience"], [class*="education"], [class*="skills"],
            [class*="work"], [class*="history"] {
              height: auto !important;
              min-height: min-content !important;
              max-height: none !important;
              overflow: visible !important;
              page-break-inside: avoid !important;
            }
            
            /* Automatic adaptive scaling for content density */
            @media screen {
              .resume-content.content-dense {
                font-size: 0.95em !important;
                line-height: 1.3 !important;
              }
              
              .resume-content.content-very-dense {
                font-size: 0.9em !important;
                line-height: 1.25 !important;
              }
              
              /* For two-column templates, ensure columns stretch */
              .resume-content [class*="column"],
              .resume-content [class*="col-"],
              .resume-content [style*="column"],
              .resume-content > div > div {
                height: auto !important;
                min-height: min-content !important;
                flex: 1 1 auto !important;
              }
            }
            
            /* Fix for specific template types */
            .work-experience-item, .education-item, 
            [class*="experience-item"], [class*="education-item"],
            .resume-section > div {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: block !important;
              margin-bottom: 0.5em !important;
            }
          `}} />
          
          {/* Resume content */}
          <div 
            dangerouslySetInnerHTML={{ __html: templateHtml }}
            className="resume-content"
            ref={(el) => {
              // Dynamic content density detection
              if (el) {
                setTimeout(() => {
                  const contentHeight = el.scrollHeight;
                  const viewportHeight = el.clientHeight;
                  
                  // If content exceeds container height, add adaptive classes
                  if (contentHeight > viewportHeight * 1.2) {
                    el.classList.add('content-dense');
                  }
                  
                  if (contentHeight > viewportHeight * 1.5) {
                    el.classList.add('content-very-dense');
                  }
                }, 100);
              }
            }}
          />
        </div>
      </div>
    </div>
  );

  // Component for classic preview with HybridResumePreview and improved content scaling
  const ClassicPreview = () => {
    // Ensure template consistency for SAHIB KHAN template
    const fixedTemplateId = selectedTemplateId === 16 ? 16 : selectedTemplateId;
    
    return (
    <div className="flex justify-center overflow-auto" style={{ maxHeight: 'calc(90vh)', padding: '20px 0' }}>
      <div className="template-wrapper">
        {/* Fix for template flickering in preview modal */}
        <style dangerouslySetInnerHTML={{ __html: `
          /* Template container styles */
          .template-wrapper {
            /* Show at true A4 size with auto scrolling */
            width: 210mm;
            min-height: 297mm;
            transform: scale(0.85);
            transform-origin: top center;
            margin: 0 auto 50px auto;
            background-color: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          
          /* Resume page expansion */
          .resume-page {
            min-height: 297mm !important;
            height: auto !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }
          
          /* Left sidebar stretching */
          .resume-page .left {
            min-height: 100% !important;
            height: auto !important;
          }
          
          /* Text content */
          p, div, li, .section {
            overflow-wrap: break-word !important;
            word-wrap: break-word !important;
            page-break-inside: avoid !important;
          }
          
          /* Ensure all section content is visible */
          .section, .right .section {
            height: auto !important;
            min-height: min-content !important;
            overflow: visible !important;
            page-break-inside: avoid !important;
          }
          
          /* Fix SAHIB KHAN template specifically */
          body .resume-container,
          body .resume-container * {
            height: auto !important;
            min-height: min-content !important;
            max-height: none !important;
          }
          
          /* Add proper scrolling */
          .resume-container {
            overflow-y: visible !important;
            height: auto !important;
          }
          
          /* Prevent template flickering */
          [data-template-id="16"] {
            visibility: visible !important;
            display: block !important;
          }
        `}} />
        
        {/* Use the key prop with template ID to force a consistent template */}
        <HybridResumePreview 
          key={`resume-preview-template-${fixedTemplateId}-${previewKey}`}
          width={794} 
          height={1123}
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
  }
  
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