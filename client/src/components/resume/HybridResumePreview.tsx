import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { useTemplates } from '@/hooks/use-templates';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';

interface HybridResumePreviewProps {
  width?: number;
  height?: number;
  className?: string;
  scaleContent?: boolean;
  resumeData?: any; // Allow passing resumeData directly
  selectedTemplateId?: number | null; // Allow passing selectedTemplateId directly
  setSelectedTemplateId?: (id: number | null) => void; // Allow passing setSelectedTemplateId function
  templates?: any[]; // Allow passing templates directly
  isModal?: boolean; // Indicates if preview is in a modal
  hideSkills?: boolean; // Option to hide skills section
  showTemplateControls?: boolean; // Option to show template selection controls
}

const HybridResumePreview: React.FC<HybridResumePreviewProps> = ({ 
  width = 280, 
  height = 365,
  className = '',
  scaleContent = true,
  resumeData: propResumeData,
  selectedTemplateId: propSelectedTemplateId,
  setSelectedTemplateId: propSetSelectedTemplateId,
  templates: propTemplates,
  isModal = false,
  hideSkills = false,
  showTemplateControls = false
}) => {
  // Use props if provided, otherwise fall back to context
  const resumeContext = useResume();
  const templatesContext = useTemplates();
  
  // Determine the actual data to use (props take precedence over context)
  const resumeData = propResumeData || resumeContext.resumeData;
  const selectedTemplateId = propSelectedTemplateId !== undefined ? propSelectedTemplateId : resumeContext.selectedTemplateId;
  const setSelectedTemplateId = propSetSelectedTemplateId || resumeContext.setSelectedTemplateId;
  const templates = propTemplates || templatesContext.data;
  const [showDirectPreview, setShowDirectPreview] = useState(false);
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateKey, setTemplateKey] = useState<number>(0); // Force re-renders with a key
  const templateHtmlRef = useRef<string>('');
  const renderedSectionsRef = useRef<{[key: string]: boolean}>({}); // Track which sections have been rendered
  
  // Special debug function to check additionalFields
  const hasAdditionalInfo = (key: string): boolean => {
    const field = resumeData.additionalFields?.[key];
    const hasInfo = Boolean(field?.value);
    const isVisible = Boolean(field?.visible);
    
    console.log(`[PREVIEW] hasAdditionalInfo('${key}'):`, {
      hasInfo,
      isVisible,
      field
    });
    
    return hasInfo && isVisible;
  };
  
  // Debug logging for rendering
  console.log("[PREVIEW] RENDER DEBUG - additionalFields:", resumeData.additionalFields);
  
  // Get template ID from localStorage if needed
  useEffect(() => {
    const storedTemplateId = localStorage.getItem('selectedTemplateId');
    if (storedTemplateId && (!selectedTemplateId || selectedTemplateId.toString() !== storedTemplateId)) {
      console.log("Using template ID from localStorage:", storedTemplateId);
      setSelectedTemplateId(parseInt(storedTemplateId, 10));
    }
  }, [selectedTemplateId, setSelectedTemplateId]);
  
  // Find the selected template
  const selectedTemplate = Array.isArray(templates) && templates.length > 0 
    ? templates.find((t: any) => t.id === selectedTemplateId)
    : undefined;
    
  // For debugging
  useEffect(() => {
    console.log("HybridResumePreview - Selected Template ID:", selectedTemplateId);
    console.log("HybridResumePreview - Found Template:", selectedTemplate?.name);
  }, [selectedTemplateId, selectedTemplate]);
  
  // Extract styles and HTML from template
  useEffect(() => {
    if (selectedTemplate?.htmlContent) {
      // Extract and enhance styles
      const enhancedStyles = extractAndEnhanceStyles(selectedTemplate.htmlContent);
      if (enhancedStyles) {
        setTemplateStyles(enhancedStyles);
      }
      
      // Get HTML without style tags
      let html = selectedTemplate.htmlContent;
      html = html.replace(/<style>[\s\S]*?<\/style>/g, '');
      templateHtmlRef.current = html;
      
      // Process HTML with placeholders
      processHtmlWithData();
    }
  }, [selectedTemplate]);
  
  // Process HTML whenever resume data changes with improved reactivity and logging
  const processHtmlWithData = useCallback(() => {
    // Reset rendered sections tracking on each template processing
    // This ensures we clean the state whenever we need to regenerate HTML
    renderedSectionsRef.current = {};
    
    console.log("[RESUME] processHtmlWithData() called - ensure we're not duplicating content");
    
    if (!templateHtmlRef.current) {
      console.log("No template HTML available to process");
      return;
    }
    
    // Cast resumeData to any to access legacy fields
    const data = resumeData as any;
    
    // DIRECT PRE-PROCESSING: Handle the optional-info div before any other processing
    let htmlToProcess = templateHtmlRef.current;
    
    // Check for the specific optional-info div in the template
    const optionalInfoRegex = /<div\s+class=["']optional-info["'][^>]*>([\s\S]*?)<\/div>/i;
    const optionalInfoMatch = htmlToProcess.match(optionalInfoRegex);
    
    console.log("LinkedIn available?", Boolean(data.additionalFields?.linkedin?.value));
    console.log("Website available?", Boolean(data.additionalFields?.website?.value));
    console.log("Driving License available?", Boolean(data.additionalFields?.drivingLicense?.value));
    
    if (optionalInfoMatch) {
      // Extract the optional info content to manipulate
      const optionalInfoContent = optionalInfoMatch[0];
      console.log("Found optional-info div:", optionalInfoContent);
      
      // Create a modified version based on what fields are actually present
      let modifiedOptionalInfo = '';
      
      // Check each field and only include if it exists
      if (data.additionalFields?.linkedin?.value) {
        modifiedOptionalInfo += `🔗 LinkedIn: ${data.additionalFields.linkedin.value}<br>`;
      }
      
      if (data.additionalFields?.website?.value) {
        modifiedOptionalInfo += `🌐 Website: ${data.additionalFields.website.value}<br>`;
      }
      
      if (data.additionalFields?.drivingLicense?.value) {
        modifiedOptionalInfo += `🚘 Driving License: ${data.additionalFields.drivingLicense.value}<br>`;
      }
      
      // If we have any fields, wrap them in the div
      if (modifiedOptionalInfo) {
        modifiedOptionalInfo = `<div class="optional-info">${modifiedOptionalInfo}</div>`;
        console.log("Created modified optional info:", modifiedOptionalInfo);
      }
      
      // Replace the original optional-info div with our modified version (or empty if no fields)
      htmlToProcess = htmlToProcess.replace(optionalInfoMatch[0], modifiedOptionalInfo);
      console.log("Replaced optional-info div in template");
    }
    
    console.log("Processing HTML with data", {
      firstName: resumeData.firstName,
      surname: resumeData.surname,
      profession: resumeData.profession,
      email: resumeData.email,
      phone: resumeData.phone,
      city: resumeData.city,
      country: resumeData.country,
      postalcode: resumeData.postalCode,
      dataUpdateTimestamp: new Date().toISOString() // For tracking update timing
    });
    
    // Now use the enhanced template processor on our pre-processed HTML
    const processedHtml = processTemplateHtml(htmlToProcess, resumeData);
    
    console.log("HTML processed with data", processedHtml.substring(0, 200) + "...");
    
    // Check for duplicated content by looking for repeated section markers
    const workExpMarkersCount = (processedHtml.match(/WORK EXPERIENCE CONTENT/g) || []).length;
    if (workExpMarkersCount > 1) {
      console.warn(`[PREVIEW] Detected ${workExpMarkersCount} work experience markers - possible duplication issue`);
    }
    
    // Update the templateKey to force a complete re-render of the component
    // This is critical for preventing duplication by ensuring fresh DOM content
    setTemplateKey(prev => prev + 1);
    
    // Update the HTML state
    setTemplateHtml(processedHtml);
  }, [resumeData]); // Include resumeData in dependencies
  
  // Watch for resume data changes with detailed logging and significantly improved reactivity
  useEffect(() => {
    console.log("HybridResumePreview - Resume data changed:", {
      firstName: resumeData.firstName,
      surname: resumeData.surname,
      profession: resumeData.profession,
      email: resumeData.email,
      phone: resumeData.phone,
      city: resumeData.city,
      country: resumeData.country,
      postalCode: resumeData.postalCode,
      summaryLength: resumeData.summary?.length || 0,
      additionalFields: resumeData.additionalFields, // Log the full additionalFields object
      updateTimestamp: new Date().toISOString() // Track when updates happen
    });
    
    // Reset tracking flags to ensure clean rendering
    renderedSectionsRef.current = {};
    console.log("[PREVIEW] Reset rendered sections tracking");
    
    // Process the HTML with the updated data immediately for each change
    // This ensures real-time updates in the preview
    processHtmlWithData();
    
    // Additional safety: Force a template key update
    // This guarantees re-rendering even if React misses some changes
    setTemplateKey(prevKey => prevKey + 1);
    
  }, [
    // Watch individual fields to ensure faster, more granular updates
    resumeData.firstName,
    resumeData.surname,
    resumeData.profession,
    resumeData.email,
    resumeData.phone,
    resumeData.city,
    resumeData.country,
    resumeData.postalCode,
    resumeData.summary,
    resumeData.photo,
    
    // Include fields from additionalFields
    resumeData.additionalFields?.linkedin?.value,
    resumeData.additionalFields?.linkedin?.visible,
    resumeData.additionalFields?.website?.value,
    resumeData.additionalFields?.website?.visible,
    resumeData.additionalFields?.drivingLicense?.value,
    resumeData.additionalFields?.drivingLicense?.visible,
    
    // Include the memoized callback
    processHtmlWithData
  ]);
  
  // Fallback direct template if template processing fails
  const renderDirectTemplate = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header with Name and Profession */}
      <div className="bg-blue-600 p-4 text-white">
        <h1 className="text-xl font-bold">
          {resumeData.firstName || '[First Name]'} {resumeData.surname || '[Last Name]'}
        </h1>
        <p className="text-sm text-blue-100">
          {resumeData.profession || '[Profession]'}
        </p>
      </div>
      
      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar with contact info */}
        <div className="w-1/3 bg-gray-100 p-4">
          <div className="space-y-4">
            <section>
              <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1 mb-2">
                CONTACT
              </h2>
              <div className="text-xs space-y-1 text-gray-600">
                {resumeData.email && (
                  <div>
                    <span className="font-medium">Email: </span>
                    {resumeData.email}
                  </div>
                )}
                {resumeData.phone && (
                  <div>
                    <span className="font-medium">Phone: </span>
                    {resumeData.phone}
                  </div>
                )}
                {(resumeData.city || resumeData.country) && (
                  <div>
                    <span className="font-medium">Location: </span>
                    {[resumeData.city, resumeData.country].filter(Boolean).join(', ')}
                  </div>
                )}
                
                {/* Cast resumeData to any to work with both old and new structures */}
                {/* Render LinkedIn if it exists in either structure */}
                {(() => {
                  const data = resumeData as any;
                  return (data.additionalInfo?.linkedin || data.additionalFields?.linkedin) && (
                    <div>
                      <span className="font-medium">LinkedIn: </span>
                      {data.additionalFields?.linkedin?.value || 
                       data.additionalInfo?.linkedin || 
                       '(No value provided)'}
                    </div>
                  );
                })()}
                
                {/* Render Website if it exists in either structure */}
                {(() => {
                  const data = resumeData as any;
                  return (data.additionalInfo?.website || data.additionalFields?.website) && (
                    <div>
                      <span className="font-medium">Website: </span>
                      {data.additionalFields?.website?.value || 
                       data.additionalInfo?.website || 
                       '(No value provided)'}
                    </div>
                  );
                })()}
                
                {/* Render Driving License if it exists in either structure */}
                {(() => {
                  const data = resumeData as any;
                  return (data.additionalInfo?.drivingLicense || data.additionalFields?.drivingLicense) && (
                    <div>
                      <span className="font-medium">License: </span>
                      {data.additionalFields?.drivingLicense?.value || 
                       data.additionalInfo?.drivingLicense || 
                       '(No value provided)'}
                    </div>
                  );
                })()}
              </div>
              </section>
          
            
            <section>
              <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1 mb-2">
                SKILLS
              </h2>
              <div className="text-xs space-y-1 text-gray-600">
                <div>• Communication</div>
                <div>• Problem Solving</div>
                <div>• Teamwork</div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Main content */}
        <div className="w-2/3 p-4">
          <div className="space-y-4">
            <section>
              <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1 mb-2">
                PROFILE
              </h2>
              <p className="text-xs text-gray-600">
                {resumeData.professionalSummary || resumeData.summary || 'This section will display your professional summary.'}
              </p>
            </section>
            
            <section>
              <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1 mb-2">
                WORK EXPERIENCE
              </h2>
              <div className="text-xs space-y-3 text-gray-600">
                {resumeData.workExperience && resumeData.workExperience.length > 0 ? (
                  resumeData.workExperience.map((exp: any, index: number) => (
                    <div key={exp.id || index}>
                      <div className="flex justify-between">
                        <p className="font-medium">{exp.jobTitle}</p>
                        <p>
                          {exp.startMonth && exp.startYear ? `${exp.startMonth} ${exp.startYear}` : ''} – {' '}
                          {exp.isCurrentJob ? 'Present' : (exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '')}
                        </p>
                      </div>
                      <p className="italic">{exp.employer}{exp.location ? `, ${exp.location}` : ''}{exp.isRemote ? ' (Remote)' : ''}</p>
                      <p className="mt-1">{exp.responsibilities}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <div className="flex justify-between">
                      <p className="font-medium">Job Title</p>
                      <p>Start Date – End Date</p>
                    </div>
                    <p className="italic">Company Name, Location</p>
                    <p className="mt-1">Description of responsibilities and achievements.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Reference to the resume container for auto-scaling
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  
  // Calculate scale factor based on container dimensions and A4 paper ratio
  const calculateScale = () => {
    if (!scaleContent) return 1;

    const resumeWidth = 794;
    const resumeHeight = 1123;

    const containerWidth = width || 280;
    const containerHeight = height || containerWidth * 1.414;

    const scaleX = containerWidth / resumeWidth;
    const scaleY = containerHeight / resumeHeight;

    return Math.min(scaleX, scaleY);
  };
  
  // Function to auto-scale content to fit one page (Zety-style)
  const autoScaleContent = useCallback(() => {
    const container = resumeContainerRef.current;
    if (!container) {
      console.log('[RESUME] Container reference not available');
      return;
    }
    
    // Get A4 size in pixels
    const maxHeight = 1123; // A4 height at 96 DPI
    
    // Skip auto-scaling for very small changes
    // This prevents constant re-processing which might cause layout issues
    const contentHeight = container.scrollHeight;
    console.log(`[RESUME] Content height: ${contentHeight}px, Max height: ${maxHeight}px`);
    
    // Only apply scaling if content significantly exceeds the page
    // For small overflows, leave as is to avoid layout disruption
    if (contentHeight > maxHeight * 1.05) {
      console.log(`[RESUME] Content overflow detected (${((contentHeight/maxHeight - 1) * 100).toFixed(1)}% overflow)`);
      
      // Modify container to fit content
      if (contentHeight <= maxHeight * 1.15) {
        // For small overflow (5-15%), apply gentle CSS adjustments
        container.classList.add('content-exceeds');
        container.classList.remove('content-exceeds-large');
        console.log('[RESUME] Applied gentle content compression');
      } else {
        // For larger overflow (>15%), apply stronger CSS adjustments
        container.classList.add('content-exceeds-large');
        console.log('[RESUME] Applied stronger content compression');
      }
      
      // Return without transform scaling to preserve layout structure
      return;
    } else {
      // Remove any compression classes if content fits
      container.classList.remove('content-exceeds', 'content-exceeds-large');
      console.log(`[RESUME] Content fits within page (or only small overflow). No scaling needed.`);
      return;
    }
  }, []);
  
  // Apply auto-scaling after template updates and check for duplications
  useEffect(() => {
    if (templateHtml) {
      // Use setTimeout to ensure content is fully rendered first
      setTimeout(() => {
        // First check for duplicate work experience entries
        const container = resumeContainerRef.current;
        if (container) {
          // Check for duplicate work experience entries by looking for repeated section markers
          const workExpMarkersCount = (templateHtml.match(/WORK EXPERIENCE CONTENT/g) || []).length;
          
          // Count actual work entries in the DOM
          const workExpContainers = container.querySelectorAll('.work-experience-item, .workexp-container');
          const realExperienceCount = resumeData.workExperience?.filter((exp: any) => 
            !(typeof exp.id === 'string' && exp.id === 'temp-entry')).length || 0;
          
          console.log(`[DUPLICATION CHECK] Found ${workExpContainers.length} work exp containers in DOM for ${realExperienceCount} actual entries`);
          
          // If we detect more containers than actual entries, we might have a duplication issue
          if (workExpContainers.length > realExperienceCount * 1.5 && realExperienceCount > 0) {
            console.warn('[DUPLICATION CHECK] Possible work experience duplication detected, forcing re-render');
            // Force a complete re-render with a new key
            setTemplateKey(prev => prev + 100);
            
            // Clear the inner HTML completely
            container.innerHTML = '';
            
            // Re-render after clearing
            setTimeout(() => {
              setTemplateHtml(processTemplateHtml(templateHtmlRef.current || '', resumeData));
            }, 50);
            
            return; // Skip auto-scaling until next render
          }
        }
        
        // Proceed with auto-scaling if no duplication detected
        autoScaleContent();
      }, 150); // Increased timeout for more reliable DOM checking
    }
  }, [
    templateHtml, 
    autoScaleContent, 
    resumeData.workExperience,
    processHtmlWithData, // Include the data processing function
    templateHtmlRef     // Include the HTML reference
  ]);
  
  // Initial scaling based on container size
  const scaleFactor = calculateScale();
  
  return (
    <div 
      className={`preview-container ${className}`}
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : '100%',
        maxWidth: '100%',
        position: 'relative',
        backgroundColor: 'white',
        overflow: 'hidden',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Toggle button for direct preview (for debugging) */}
      <button 
        onClick={() => setShowDirectPreview(!showDirectPreview)}
        className="absolute top-0 right-0 z-10 bg-gray-800 text-white text-xs px-2 py-1 opacity-30 hover:opacity-100"
        style={{ fontSize: '8px' }}
      >
        {showDirectPreview ? 'Show Template' : 'Direct View'}
      </button>
      
      {showDirectPreview ? (
        // Direct React-based preview (guaranteed to update)
        <div className="h-full w-full bg-white">
          {renderDirectTemplate()}
        </div>
      ) : (
        // Template-based preview
        templateHtml ? (
          <div className="absolute inset-0 flex items-start justify-start overflow-hidden">
            {/* Resume content with proper scaling */}
            <div className="relative">
              <style dangerouslySetInnerHTML={{ __html: `
                /* Base styles for the resume page */
                .resume-page {
                  position: relative;
                  box-sizing: border-box;
                  background-color: white;
                  font-family: Arial, sans-serif;
                }

                /* Zety-style auto-scaling CSS adjustments */
                @media print, screen {
                  .resume-page {
                    width: 210mm;
                    min-height: 297mm;
                  }
                  
                  /* When content exceeds container, tighten spacing */
                  .resume-page.content-exceeds {
                    --scale-factor: 0.95;
                    font-size: calc(1em * var(--scale-factor));
                    line-height: calc(1.4 * var(--scale-factor));
                  }
                  
                  /* Even tighter spacing for very long content */
                  .resume-page.content-exceeds-large {
                    --scale-factor: 0.9;
                    font-size: calc(1em * var(--scale-factor));
                    line-height: calc(1.3 * var(--scale-factor));
                  }
                }
                
                ${templateStyles}
              ` }} />
              {/* Simplified approach that doesn't try to handle template 16 specially */}
              <div key={`template-wrapper-${new Date().getTime()}`} className="template-container">
                <div 
                  key={`template-${templateKey}-${new Date().getTime()}`}
                  ref={resumeContainerRef}
                  dangerouslySetInnerHTML={{ __html: templateHtml }} 
                  data-work-entries={resumeData.workExperience?.length || 0}
                  data-render-id={`render-${new Date().getTime()}`}
                  data-template-id={selectedTemplateId || 'none'}
                  style={{ 
                    transform: `scale(${scaleFactor})`,
                    transformOrigin: 'top center',
                    width: '794px', // A4 width
                    height: '1123px', // A4 height
                    maxHeight: 'none', // Allow content to expand for measuring
                    overflow: 'visible', // Important for measuring true content height
                    padding: '0',
                    margin: '0 auto', // Center the content horizontally
                  }}
                  className="resume-page"
                />
              </div>
            </div>
          </div>
        ) : (
          // Fallback if no template is available
          <div className="h-full w-full">
            {renderDirectTemplate()}
          </div>
        )
      )}
    </div>
  );
};

export default HybridResumePreview;