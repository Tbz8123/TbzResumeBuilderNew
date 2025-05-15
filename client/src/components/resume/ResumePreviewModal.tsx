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
      
      // EMERGENCY FIX: Add two approaches to solve the issue
      // 1. Direct DOM manipulation right after render
      // 2. MutationObserver to watch for template changes and fix them in real-time
      
      // First attempt - immediate fix
      const clearWorkExperienceSection = () => {
        try {
          // Set multiple timeouts to catch the iframe at different stages of loading
          // Some browsers may take longer to fully render the iframe content
          [300, 600, 1000].forEach(delay => {
            setTimeout(() => {
              console.log(`[PREVIEW FIX] Applying fix after ${delay}ms delay`);
              
              // Target the iframes that contain the template content
              const iframes = document.querySelectorAll('iframe');
              
              iframes.forEach(iframe => {
                if (iframe.contentDocument) {
                  const doc = iframe.contentDocument;
                  
                  // First, try targeting specific elements by ID or class name
                  const workExpSection = doc.querySelector('.work-experience') || 
                                       doc.querySelector('#work-experience') || 
                                       doc.getElementById('workExperience');
                  
                  if (workExpSection) {
                    console.log('[PREVIEW FIX] Found work experience by ID/class');
                    
                    // Keep only the section header and clear everything else
                    const header = workExpSection.querySelector('h2');
                    
                    if (header) {
                      // Save the header
                      const headerClone = header.cloneNode(true);
                      
                      // Clear everything
                      workExpSection.innerHTML = '';
                      
                      // Put back just the header
                      workExpSection.appendChild(headerClone);
                      console.log('[PREVIEW FIX] Cleared work experience section');
                    }
                  } else {
                    // Fallback - find by heading text
                    const headers = doc.querySelectorAll('h2, h3, h4');
                    
                    // Find the work experience section
                    headers.forEach(header => {
                      if (header.textContent?.includes('WORK EXPERIENCE')) {
                        console.log('[PREVIEW FIX] Found Work Experience section by text content');
                        
                        // Find the container that holds work experience entries
                        // Get the parent container
                        const sectionContainer = header.closest('div');
                        
                        if (sectionContainer) {
                          // Keep the header but remove all subsequent elements 
                          const workEntryElements = Array.from(sectionContainer.children).filter(child => 
                            child !== header && !child.tagName.startsWith('H')
                          );
                          
                          console.log(`[PREVIEW FIX] Removing ${workEntryElements.length} existing work entries`);
                          
                          // Remove all existing content
                          workEntryElements.forEach(element => element.remove());
                        }
                      }
                    });
                  }
                }
              });
            }, delay);
          });
          
          // Second approach: Set up a MutationObserver to catch any changes to the DOM
          // This will handle cases where the template is updated after our initial fix
          setTimeout(() => {
            const iframes = document.querySelectorAll('iframe');
            
            iframes.forEach(iframe => {
              if (iframe.contentDocument) {
                const doc = iframe.contentDocument;
                
                // Create a mutation observer to watch for changes to the DOM
                const observer = new MutationObserver((mutations) => {
                  // Look for mutations that add nodes to the document
                  mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                      // Check if any of the added nodes contain work experience duplicates
                      mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node as Element;
                          
                          // Look for duplicate work experience entries
                          const workExperienceEntries = element.querySelectorAll && 
                            element.querySelectorAll('.work-experience-item, .work-experience > div, .workexp-container > div');
                          
                          if (workExperienceEntries && workExperienceEntries.length > 1) {
                            console.log(`[PREVIEW FIX] Observer detected ${workExperienceEntries.length} work entries - fixing duplicates`);
                            
                            // Keep only the first entry and remove the rest to prevent duplicates
                            for (let i = 1; i < workExperienceEntries.length; i++) {
                              workExperienceEntries[i].remove();
                            }
                          }
                        }
                      });
                    }
                  });
                });
                
                // Start observing the document with the configured parameters
                observer.observe(doc.body, { childList: true, subtree: true });
                
                // Disconnect after 5 seconds to prevent memory leaks
                setTimeout(() => observer.disconnect(), 5000);
              }
            });
          }, 1000);
          
        } catch (err) {
          console.error('[PREVIEW FIX] Error in emergency DOM fix:', err);
        }
      };
      
      // Apply the fix
      clearWorkExperienceSection();
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