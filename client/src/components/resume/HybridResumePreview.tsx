import React, { useEffect, useState, useRef } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { useTemplates } from '@/hooks/use-templates';
import { processTemplateHtml, extractAndEnhanceStyles } from './templates-support';

interface HybridResumePreviewProps {
  width?: number;
  height?: number;
  className?: string;
  scaleContent?: boolean;
}

const HybridResumePreview: React.FC<HybridResumePreviewProps> = ({ 
  width = 280, 
  height = 365,
  className = '',
  scaleContent = true
}) => {
  const { resumeData, selectedTemplateId, setSelectedTemplateId } = useResume();
  const { data: templates } = useTemplates();
  const [showDirectPreview, setShowDirectPreview] = useState(false);
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const templateHtmlRef = useRef<string>('');
  
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
  
  // Process HTML whenever resume data changes
  const processHtmlWithData = () => {
    if (!templateHtmlRef.current) return;
    
    console.log("Processing HTML with data", {
      firstName: resumeData.firstName,
      surname: resumeData.surname,
      profession: resumeData.profession,
      email: resumeData.email,
      city: resumeData.city,
      country: resumeData.country
    });
    
    // Use the enhanced template processor with more robust placeholder handling
    const processedHtml = processTemplateHtml(templateHtmlRef.current, resumeData);
    
    console.log("HTML processed with data", processedHtml.substring(0, 200) + "...");
    
    // Update the state
    setTemplateHtml(processedHtml);
  };
  
  // Watch for resume data changes with detailed logging
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
      professionalSummaryLength: resumeData.professionalSummary?.length || 0,
      photoPresent: resumeData.photo ? 'yes' : 'no',
      additionalInfoKeys: Object.keys(resumeData.additionalInfo || {}),
      workExperienceCount: resumeData.workExperience?.length || 0,
      educationCount: resumeData.education?.length || 0,
      skillsCount: resumeData.skills?.length || 0
    });
    
    // Process the HTML with the updated data
    processHtmlWithData();
  }, [
    resumeData,  // Track the entire resumeData object for more reliable updates
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
                {resumeData.workExperience.length > 0 ? (
                  resumeData.workExperience.map((exp, index) => (
                    <div key={index}>
                      <div className="flex justify-between">
                        <p className="font-medium">{exp.jobTitle}</p>
                        <p>{exp.startDate} – {exp.isCurrentPosition ? 'Present' : exp.endDate}</p>
                      </div>
                      <p className="italic">{exp.employer}, {exp.location}</p>
                      <p className="mt-1">{exp.description}</p>
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
              <style dangerouslySetInnerHTML={{ __html: templateStyles }} />
              <div 
                dangerouslySetInnerHTML={{ __html: templateHtml }} 
                style={{ 
                  transform: `scale(${scaleFactor})`,
                  transformOrigin: 'top left',
                  width: '794px', // A4 width
                  height: '1123px', // A4 height
                }}
              />
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