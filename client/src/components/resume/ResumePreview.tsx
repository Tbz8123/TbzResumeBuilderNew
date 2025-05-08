import React, { useEffect, useState, useRef } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { useTemplates } from '@/hooks/use-templates';

interface ResumePreviewProps {
  width?: number;
  height?: number;
  className?: string;
  scaleContent?: boolean;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  width = 280, 
  height = 365,
  className = '',
  scaleContent = true
}) => {
  const { resumeData, selectedTemplateId, setSelectedTemplateId } = useResume();
  const { data: templates } = useTemplates();
  const [templateStyles, setTemplateStyles] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  // Get template ID from localStorage if needed
  useEffect(() => {
    // Check if the context's selectedTemplateId doesn't match localStorage
    const storedTemplateId = localStorage.getItem('selectedTemplateId');
    
    if (storedTemplateId && (!selectedTemplateId || selectedTemplateId.toString() !== storedTemplateId)) {
      console.log("ResumePreview: Using template ID from localStorage:", storedTemplateId);
      setSelectedTemplateId(parseInt(storedTemplateId, 10));
    }
  }, [selectedTemplateId, setSelectedTemplateId]);
  
  // Find the selected template
  const selectedTemplate = Array.isArray(templates) && templates.length > 0 
    ? templates.find((t: any) => t.id === selectedTemplateId)
    : undefined;
    
  // For debugging
  useEffect(() => {
    console.log("ResumePreview - Selected Template ID:", selectedTemplateId);
    console.log("ResumePreview - Local Storage ID:", localStorage.getItem('selectedTemplateId'));
    console.log("ResumePreview - Found Template:", selectedTemplate?.name);
  }, [selectedTemplateId, selectedTemplate]);
  
  // Extract styles from template HTML - only depends on selectedTemplate
  useEffect(() => {
    if (selectedTemplate?.htmlContent) {
      // Extract <style> content
      const styleRegex = /<style>([\s\S]*?)<\/style>/;
      const styleMatch = selectedTemplate.htmlContent.match(styleRegex);
      
      if (styleMatch && styleMatch[1]) {
        let styles = styleMatch[1];
        
        // Add responsive styles to ensure proper display in preview
        styles += `
          @media print, screen {
            body {
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: transparent !important;
            }
            .resume {
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            .page {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
            }
            .sidebar {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            .contact-item, .sidebar-section {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            img.profile-image {
              object-fit: cover;
            }
          }
        `;
        
        // Update styles
        setTemplateStyles(styles);
      }
    }
  }, [selectedTemplate]);

  // Direct DOM manipulation to update content in iframe
  useEffect(() => {
    if (!selectedTemplate?.htmlContent || !iframeRef.current) return;
    
    try {
      const iframe = iframeRef.current;
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      
      if (!iframeDocument) return;
      
      // Insert basic document structure if it doesn't exist
      if (!iframeDocument.body) {
        iframeDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                ${templateStyles}
                body, html {
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                  height: 100%;
                }
              </style>
            </head>
            <body></body>
          </html>
        `);
        iframeDocument.close();
      }
      
      // Get just the HTML content without style tags
      let htmlContent = selectedTemplate.htmlContent;
      htmlContent = htmlContent.replace(/<style>[\s\S]*?<\/style>/g, '');
      
      // Set the content
      iframeDocument.body.innerHTML = htmlContent;
      
      // Insert or update style tag
      let styleTag = iframeDocument.querySelector('style');
      if (!styleTag) {
        styleTag = iframeDocument.createElement('style');
        iframeDocument.head.appendChild(styleTag);
      }
      styleTag.textContent = templateStyles;
      
      // Update all placeholders in the iframe DOM directly
      const updateTextContent = (selector, value) => {
        const elements = iframeDocument.querySelectorAll(selector);
        elements.forEach(el => {
          el.textContent = value;
        });
      };
      
      // Replace placeholders with direct DOM manipulation
      updateTextContent('[data-placeholder="firstName"]', resumeData.firstName || '');
      updateTextContent('[data-placeholder="lastName"]', resumeData.surname || '');
      updateTextContent('[data-placeholder="fullName"]', `${resumeData.firstName || ''} ${resumeData.surname || ''}`);
      updateTextContent('[data-placeholder="name"]', `${resumeData.firstName || ''} ${resumeData.surname || ''}`);
      updateTextContent('[data-placeholder="profession"]', resumeData.profession || '');
      updateTextContent('[data-placeholder="email"]', resumeData.email || '');
      updateTextContent('[data-placeholder="phone"]', resumeData.phone || '');
      updateTextContent('[data-placeholder="city"]', resumeData.city || '');
      updateTextContent('[data-placeholder="country"]', resumeData.country || '');
      
      // Also do text replacements for older template format
      const replaceInnerHTML = (element) => {
        if (element.innerHTML) {
          element.innerHTML = element.innerHTML
            .replace(/{{firstName}}/g, resumeData.firstName || '')
            .replace(/{{lastName}}/g, resumeData.surname || '')
            .replace(/{{fullName}}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`)
            .replace(/{{name}}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`)
            .replace(/{{profession}}/g, resumeData.profession || '')
            .replace(/{{email}}/g, resumeData.email || '')
            .replace(/{{phone}}/g, resumeData.phone || '')
            .replace(/{{city}}/g, resumeData.city || '')
            .replace(/{{country}}/g, resumeData.country || '')
            .replace(/{{address}}/g, [resumeData.city, resumeData.country].filter(Boolean).join(', '))
            .replace(/{{summary}}/g, resumeData.summary || '')
            .replace(/{{profile}}/g, resumeData.summary || '')
            .replace(/{{aboutMe}}/g, resumeData.summary || '')
            .replace(/{{bio}}/g, resumeData.summary || '')
            .replace(/{{description}}/g, resumeData.summary || '');
        }
      };
      
      // Apply to all elements
      const allElements = iframeDocument.querySelectorAll('*');
      allElements.forEach(replaceInnerHTML);
      
      // Update the head title for completeness
      const title = iframeDocument.querySelector('title');
      if (title) {
        title.textContent = `Resume - ${resumeData.firstName || ''} ${resumeData.surname || ''}`;
      }
      
      console.log("Direct DOM update completed for resume data", {
        firstName: resumeData.firstName,
        lastName: resumeData.surname,
        profession: resumeData.profession,
        summary: resumeData.summary,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error updating iframe content:', error);
    }
  }, [selectedTemplate, resumeData, templateStyles]);
  
  // Fallback modern template if no selected template is available
  const renderModernTemplate = () => (
    <div className="flex flex-col h-full">
      {/* Header with Photo and Name */}
      <div className="bg-amber-500 p-3 text-gray-900">
        <div className="flex items-start gap-3">
          {resumeData.photo && (
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
              <img 
                src={resumeData.photo} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <h1 className="font-bold text-lg leading-tight">
              {resumeData.firstName || 'First'} {resumeData.surname || 'Last'}
            </h1>
            <p className="text-sm font-medium">
              {resumeData.profession || 'Profession'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="grid grid-cols-3 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="bg-gray-900 text-white p-3">
          <div className="space-y-4">
            {/* Contact Section */}
            <section>
              <h2 className="text-amber-500 text-sm font-bold mb-2 uppercase">
                Contact Me
              </h2>
              <div className="text-xs space-y-2">
                {resumeData.phone && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span className="truncate">{resumeData.phone}</span>
                  </div>
                )}
                
                {resumeData.email && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="truncate break-all overflow-ellipsis">{resumeData.email}</span>
                  </div>
                )}
                
                {(resumeData.city || resumeData.country) && (
                  <div className="flex items-center gap-1 overflow-hidden">
                    <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{[resumeData.city, resumeData.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
                
                {/* Additional Info */}
                {Object.entries(resumeData.additionalInfo).map(([key, value]) => (
                  value && (
                    <div key={key} className="flex items-center gap-1 overflow-hidden">
                      <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate">{value}</span>
                    </div>
                  )
                ))}
              </div>
            </section>
            
            {/* Skills Section */}
            <section>
              <h2 className="text-amber-500 text-sm font-bold mb-2 uppercase">
                Skills
              </h2>
              <div className="text-xs space-y-1">
                <div>• Adobe Photoshop</div>
                <div>• HTML/CSS</div>
                <div>• Microsoft Word</div>
              </div>
            </section>
            
            {/* Education Section */}
            <section>
              <h2 className="text-amber-500 text-sm font-bold mb-2 uppercase">
                Education
              </h2>
              <div className="text-xs space-y-2">
                <div>
                  <p className="font-medium">University Degree</p>
                  <p className="text-gray-300 text-[10px]">2015 – 2019</p>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="col-span-2 p-3">
          <div className="space-y-4">
            {/* About Section */}
            <section>
              <h2 className="text-amber-500 text-sm font-bold mb-2 border-b border-amber-500 pb-1 uppercase">
                About Me
              </h2>
              <p className="text-xs text-gray-700">
                {resumeData.summary || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempor, libero a tincidunt elementum, felis urna luctus leo, non efficitur nisl justo nec augue.'}
              </p>
            </section>
            
            {/* Experience Section */}
            <section>
              <h2 className="text-amber-500 text-sm font-bold mb-2 border-b border-amber-500 pb-1 uppercase">
                Job Experience
              </h2>
              <div className="text-xs space-y-3">
                <div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Senior Web Designer</p>
                    <p className="text-gray-500">2020 – Present</p>
                  </div>
                  <p className="italic text-gray-600">Creative Agency / Chicago</p>
                  <p className="mt-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
                <div>
                  <div className="flex justify-between">
                    <p className="font-semibold">Graphic Designer</p>
                    <p className="text-gray-500">2015 – 2020</p>
                  </div>
                  <p className="italic text-gray-600">Creative Market / Chicago</p>
                  <p className="mt-1">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
                </div>
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
      {selectedTemplate ? (
        <div className="absolute inset-0 flex items-start justify-start overflow-hidden">
          {/* Use iframe with ref for direct DOM manipulation */}
          <iframe
            ref={iframeRef}
            style={{ 
              border: 'none',
              width: '794px', // A4 width
              height: '1123px', // A4 height
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'top left',
            }}
            title="Resume Preview"
            className="resume-iframe"
          />
        </div>
      ) : (
        <div className="h-full w-full">
          {renderModernTemplate()}
        </div>
      )}
    </div>
  );
};

export default ResumePreview;