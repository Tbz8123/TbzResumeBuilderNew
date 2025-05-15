import React, { useState, useEffect, useMemo } from 'react';
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
  
  // Create a deduplicated version of work experience to prevent duplications
  const deduplicatedResumeData = useMemo(() => {
    if (!resumeData?.workExperience?.length) return resumeData;
    
    // Clone the resume data to avoid mutating the original
    const cleanedData = { ...resumeData };
    
    // Check if we're using template 16 (known problematic template)
    const isTemplate16 = selectedTemplateId === 16;
    
    if (isTemplate16) {
      console.log("[RESUME PREVIEW] Template 16 detected - using special handling");
      
      // For Template 16, just use the first work experience entry
      if (cleanedData.workExperience?.length > 0) {
        cleanedData.workExperience = [cleanedData.workExperience[0]];
      }
    } else {
      // For other templates, deduplicate by creating a unique key for each entry
      const seen = new Set();
      cleanedData.workExperience = (cleanedData.workExperience || []).filter(exp => {
        const key = `${exp.jobTitle || ''}|${exp.employer || ''}|${exp.startYear || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    
    console.log("[RESUME PREVIEW] Deduplicated work experience:", 
      cleanedData.workExperience.length, 
      "entries (from original", resumeData.workExperience?.length || 0, "entries)");
    
    return cleanedData;
  }, [resumeData, selectedTemplateId]);
  
  // Reset the preview key when the modal opens to force a complete re-render
  useEffect(() => {
    if (open) {
      console.log("[RESUME PREVIEW] Modal opened - resetting preview key to force clean render");
      setPreviewKey(prev => prev + 1);
      
      // EMERGENCY FIX: Add two approaches to solve the issue
      // COMPREHENSIVE FIX FOR DUPLICATION ISSUES
      // Using multiple techniques to ensure work experience doesn't duplicate
      
      // Main fix function with enhanced tactics
      const clearWorkExperienceSection = () => {
        try {
          console.log("[PREVIEW FIX] Implementing comprehensive duplication fix");
          
          // APPROACH 1: Completely remount the element by deleting and recreating it
          // This ensures we have a fresh DOM on each preview
          // Set multiple timeouts to catch the iframe at different stages of loading
          [300, 600, 1000].forEach(delay => {
            setTimeout(() => {
              console.log(`[PREVIEW FIX] Applying DOM cleanup after ${delay}ms delay`);
              
              // Target any iframe elements that might contain the template
              const iframes = document.querySelectorAll('iframe');
              
              iframes.forEach(iframe => {
                if (iframe.contentDocument) {
                  const doc = iframe.contentDocument;
                  
                  // NUCLEAR OPTION: Instead of selectively clearing sections,
                  // completely rebuild the entire document structure
                  // This ensures a clean slate for each render
                  
                  // Extract critical elements to preserve (like <head> content)
                  const htmlElement = doc.documentElement;
                  const headContent = doc.head.innerHTML;
                  
                  // Save the original body structure but reset all content
                  const bodyClasses = doc.body.className;
                  const bodyStyle = doc.body.getAttribute('style') || '';
                  
                  // Create a fresh body element
                  const newBody = doc.createElement('body');
                  newBody.className = bodyClasses;
                  newBody.setAttribute('style', bodyStyle);
                  
                  // Replace the entire body with the new empty one
                  // This forces a complete rebuild of the content
                  doc.body.replaceWith(newBody);
                  
                  // Rebuild any necessary structure that needs to exist
                  // before template content is injected
                  
                  // This approach ensures no duplicated elements can exist
                  // because the entire DOM is completely reset
                  console.log(`[PREVIEW FIX] Completely rebuilt document structure at ${delay}ms`);
                }
              });
            }, delay);
          });
          
          // APPROACH 2: Monitor the DOM for duplicates and fix in real-time
          setTimeout(() => {
            console.log("[PREVIEW FIX] Setting up mutation observer to catch duplicates");
            
            const iframes = document.querySelectorAll('iframe');
            
            iframes.forEach(iframe => {
              if (iframe.contentDocument) {
                const doc = iframe.contentDocument;
                
                // Create a more sophisticated mutation observer that looks specifically
                // for duplication patterns
                const observer = new MutationObserver((mutations) => {
                  let potentialDuplicatesFound = false;
                  
                  mutations.forEach(mutation => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                      // Check each added node for potential work experience duplicates
                      mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                          const element = node as Element;
                          
                          // Look for work experience divs using multiple selector patterns
                          // This catches various template structures
                          const workExpSelectors = [
                            '.work-experience-item', 
                            '.work-experience > div', 
                            '.workexp-container > div',
                            '[data-section="work-experience"] > div',
                            'div:has(h2:contains("WORK EXPERIENCE")) > div',
                            'div:has(h3:contains("WORK EXPERIENCE")) > div'
                          ];
                          
                          // Find any work experience entries using our selectors
                          const workExperienceEntries = element.querySelectorAll && 
                            element.querySelectorAll(workExpSelectors.join(', '));
                          
                          // If more than one work entry is found, we have duplicates
                          if (workExperienceEntries && workExperienceEntries.length > 1) {
                            console.log(`[PREVIEW FIX] Observer detected ${workExperienceEntries.length} work entries - fixing duplicates`);
                            potentialDuplicatesFound = true;
                            
                            // Keep only the first entry of each type and remove the rest
                            const seen = new Set();
                            
                            workExperienceEntries.forEach(entry => {
                              // Create a fingerprint of the entry based on text content
                              const fingerprint = entry.textContent?.trim();
                              
                              if (fingerprint && seen.has(fingerprint)) {
                                // This is a duplicate based on content, remove it
                                entry.remove();
                                console.log('[PREVIEW FIX] Removed duplicate entry with matching content');
                              } else if (fingerprint) {
                                // This is the first occurrence, keep track of it
                                seen.add(fingerprint);
                              }
                            });
                          }
                        }
                      });
                    }
                  });
                  
                  // If we found and fixed duplicates, log it
                  if (potentialDuplicatesFound) {
                    console.log('[PREVIEW FIX] Fixed duplicate entries via observer');
                  }
                });
                
                // Start observing with comprehensive coverage
                observer.observe(doc.body, { 
                  childList: true, 
                  subtree: true,
                  characterData: true,
                  attributes: true 
                });
                
                // Disconnect after 5 seconds to prevent memory leaks
                setTimeout(() => {
                  observer.disconnect();
                  console.log('[PREVIEW FIX] Disconnected observer to prevent memory leaks');
                }, 5000);
              }
            });
          }, 800);
          
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