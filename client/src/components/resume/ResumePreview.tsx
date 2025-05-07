import React, { useEffect, useState } from 'react';
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
  const { resumeData, selectedTemplateId } = useResume();
  const { data: templates } = useTemplates();
  const [templateHtml, setTemplateHtml] = useState<string>('');
  const [templateStyles, setTemplateStyles] = useState<string>('');
  
  // Find the selected template
  const selectedTemplate = Array.isArray(templates) && templates.length > 0 
    ? templates.find((t: any) => t.id === selectedTemplateId)
    : undefined;
  
  // Process template HTML and CSS when available
  useEffect(() => {
    if (selectedTemplate?.htmlContent) {
      let html = selectedTemplate.htmlContent;
      
      // Extract <style> content
      const styleRegex = /<style>([\s\S]*?)<\/style>/;
      const styleMatch = html.match(styleRegex);
      
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
        
        // Remove original style tag as we'll inject it separately
        html = html.replace(styleRegex, '');
      }
      
      // Replace placeholders with actual resume data
      html = html.replace(/{{firstName}}/g, resumeData.firstName || '');
      html = html.replace(/{{lastName}}/g, resumeData.surname || '');
      html = html.replace(/{{fullName}}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`);
      html = html.replace(/{{name}}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`);
      html = html.replace(/{{profession}}/g, resumeData.profession || '');
      html = html.replace(/{{email}}/g, resumeData.email || '');
      html = html.replace(/{{phone}}/g, resumeData.phone || '');
      html = html.replace(/{{city}}/g, resumeData.city || '');
      html = html.replace(/{{country}}/g, resumeData.country || '');
      html = html.replace(/{{address}}/g, [resumeData.city, resumeData.country].filter(Boolean).join(', '));
      
      // Handle profile photo if present
      if (resumeData.photo) {
        html = html.replace(/<img[^>]*class="profile-image"[^>]*>/g, 
          `<img class="profile-image" src="${resumeData.photo}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`);
      }
      
      // Additional info replacements
      Object.entries(resumeData.additionalInfo).forEach(([key, value]) => {
        if (value) {
          const placeholder = new RegExp(`{{${key}}}`, 'g');
          html = html.replace(placeholder, value);
        }
      });
      
      // Update the state
      setTemplateHtml(html);
    }
  }, [selectedTemplate, resumeData]);
  
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
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce tempor, libero a tincidunt elementum, felis urna luctus leo, non efficitur nisl justo nec augue.
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
    
    // A4 paper dimensions
    const A4_WIDTH = 794; // px
    const A4_HEIGHT = 1123; // px
    
    // Container dimensions
    const containerWidth = width || 280;
    const containerHeight = height || 362;
    
    // Calculate scale factors for both dimensions
    const scaleX = containerWidth / A4_WIDTH;
    const scaleY = containerHeight / A4_HEIGHT;
    
    // Use the smaller scale factor to ensure the entire resume fits
    return Math.min(scaleX, scaleY) * 0.95; // 0.95 for a slight margin
  };
  
  const scaleFactor = calculateScale();
  
  return (
    <div 
      className={`preview-container ${className} ${scaleContent ? 'overflow-hidden' : 'rounded-md border border-gray-200 shadow-sm'}`}
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : '100%',
        maxWidth: '100%',
        position: 'relative',
        backgroundColor: 'white',
      }}
    >
      {templateHtml ? (
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {/* Inject styles separately */}
          <style dangerouslySetInnerHTML={{ __html: templateStyles }} />
          
          {/* Resume content with proper scaling */}
          <div 
            dangerouslySetInnerHTML={{ __html: templateHtml }} 
            className="resume-scaled"
            style={{ 
              transform: `scale(${scaleFactor})`,
              transformOrigin: 'center',
              width: '794px', // A4 width
              height: '1123px', // A4 height
              margin: '0 auto',
              // Debug border (comment out in production)
              // border: '1px solid red'
            }}
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