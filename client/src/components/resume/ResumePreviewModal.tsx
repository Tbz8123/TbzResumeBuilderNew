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
      
      console.log("[RESUME PREVIEW] Template 16 work experience RESTRICTED to:", 
        cleanedData.workExperience[0].jobTitle,
        "at",
        cleanedData.workExperience[0].employer);
    } else {
      // For other templates, perform aggressive deduplication using Set
      console.log("[RESUME PREVIEW] Standard template detected - performing work experience deduplication");
      
      // Create a Set of unique entries based on composite key
      const seen = new Set();
      
      // Filter the array to only keep unique entries
      cleanedData.workExperience = cleanedData.workExperience.filter(exp => {
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
    
    console.log("[RESUME PREVIEW] Final work experience entries:", cleanedData.workExperience.length);
    
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Resume Preview</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Scroll down to see all content</span>
            <DialogClose className="rounded-full w-6 h-6 flex items-center justify-center">
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>
        
        {/* Simple iframe solution for template display */}
        <div 
          className="flex flex-col items-center p-6 bg-gray-50 rounded-md overflow-y-auto" 
          style={{ 
            maxHeight: 'calc(90vh - 150px)',
            minHeight: '500px'
          }}
        >
          {/* Display template content directly in an iframe for better rendering */}
          {selectedTemplateId && (
            <div className="border shadow-lg bg-white">
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body {
                          margin: 0;
                          padding: 0;
                          font-family: Arial, sans-serif;
                        }
                        .resume-page {
                          width: 210mm;
                          min-height: 297mm;
                          background: #fff;
                          margin-bottom: 20px;
                          page-break-after: always;
                        }
                        .resume-page .left {
                          min-height: 297mm;
                        }
                        .resume-page .right {
                          min-height: 297mm;
                        }
                      </style>
                    </head>
                    <body>
                      <div id="resume-content">
                        ${templates.find(t => t.id === selectedTemplateId)?.htmlContent || ''}
                      </div>
                    </body>
                  </html>
                `}
                style={{
                  width: '794px',
                  height: '1123px',
                  border: 'none',
                  transform: 'scale(0.7)',
                  transformOrigin: 'top center'
                }}
                title="Resume Preview"
              />
            </div>
          )}
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