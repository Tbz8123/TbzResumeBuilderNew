import React, { useEffect, useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { useTemplates } from '@/hooks/use-templates';

interface ResumePreviewProps {
  width?: number;
  height?: number;
  className?: string;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  width = 280, 
  height = 365,
  className = ''
}) => {
  const { resumeData, selectedTemplateId } = useResume();
  const { data: templates } = useTemplates();
  const [templateHtml, setTemplateHtml] = useState<string>('');
  
  // Find the selected template
  const selectedTemplate = Array.isArray(templates) && templates.length > 0 
    ? templates.find((t: any) => t.id === selectedTemplateId)
    : undefined;
  
  // Process template HTML when available
  useEffect(() => {
    if (selectedTemplate?.htmlContent) {
      let html = selectedTemplate.htmlContent;
      
      // Replace placeholders with actual data
      html = html.replace(/{{firstName}}/g, resumeData.firstName || '');
      html = html.replace(/{{lastName}}/g, resumeData.surname || '');
      html = html.replace(/{{fullName}}/g, `${resumeData.firstName || ''} ${resumeData.surname || ''}`);
      html = html.replace(/{{profession}}/g, resumeData.profession || '');
      html = html.replace(/{{email}}/g, resumeData.email || '');
      html = html.replace(/{{phone}}/g, resumeData.phone || '');
      html = html.replace(/{{city}}/g, resumeData.city || '');
      html = html.replace(/{{country}}/g, resumeData.country || '');
      html = html.replace(/{{address}}/g, [resumeData.city, resumeData.country].filter(Boolean).join(', '));
      
      // Update the state
      setTemplateHtml(html);
    }
  }, [selectedTemplate, resumeData]);
  
  // Fallback template if no selected template is available
  const renderFallbackTemplate = () => (
    <div className="flex flex-col h-full">
      {/* Header with Photo and Name */}
      <div className="bg-blue-600 p-2 text-white">
        <div className="flex items-start gap-2">
          {resumeData.photo && (
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
              <img 
                src={resumeData.photo} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="flex-1 overflow-hidden">
            <h1 className="font-bold text-xs truncate">
              {resumeData.firstName || 'First'} {resumeData.surname || 'Last'}
            </h1>
            <p className="text-[10px] text-blue-100 truncate">
              {resumeData.profession || 'Profession'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="grid grid-cols-4 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="col-span-1 bg-gray-100 p-2">
          <div className="space-y-2">
            {/* Contact Section */}
            <section>
              <h2 className="text-[8px] font-bold rounded-sm bg-blue-600 text-white px-1 py-0.5 mb-1">
                CONTACT
              </h2>
              <div className="text-[7px] space-y-1">
                {resumeData.email && (
                  <div className="truncate">
                    <div className="font-medium">Email</div>
                    <div>{resumeData.email}</div>
                  </div>
                )}
                
                {resumeData.phone && (
                  <div className="truncate">
                    <div className="font-medium">Phone</div>
                    <div>{resumeData.phone}</div>
                  </div>
                )}
                
                {(resumeData.city || resumeData.country) && (
                  <div className="truncate">
                    <div className="font-medium">Address</div>
                    <div>{[resumeData.city, resumeData.country].filter(Boolean).join(', ')}</div>
                  </div>
                )}
                
                {/* Additional Info */}
                {Object.entries(resumeData.additionalInfo).map(([key, value]) => (
                  value && (
                    <div key={key} className="truncate">
                      <div className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                      <div>{value}</div>
                    </div>
                  )
                ))}
              </div>
            </section>
            
            {/* Skills Section */}
            <section>
              <h2 className="text-[8px] font-bold rounded-sm bg-blue-600 text-white px-1 py-0.5 mb-1">
                SKILLS
              </h2>
              <div className="text-[7px] space-y-0.5">
                <div>• Skill 1</div>
                <div>• Skill 2</div>
                <div>• Skill 3</div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="col-span-3 p-2">
          <div className="space-y-2">
            {/* Experience Section */}
            <section>
              <h2 className="text-[8px] font-bold border-b border-blue-600 pb-0.5 mb-1 text-blue-600">
                WORK HISTORY
              </h2>
              <div className="text-[7px] space-y-1">
                <div>
                  <div className="flex justify-between">
                    <p className="font-medium">Position • Company</p>
                    <p className="text-gray-500">MM/YYYY – MM/YYYY</p>
                  </div>
                  <p>Brief description of responsibilities and achievements.</p>
                </div>
                <div>
                  <div className="flex justify-between">
                    <p className="font-medium">Position • Company</p>
                    <p className="text-gray-500">MM/YYYY – MM/YYYY</p>
                  </div>
                  <p>Brief description of responsibilities and achievements.</p>
                </div>
              </div>
            </section>
            
            {/* Education Section */}
            <section>
              <h2 className="text-[8px] font-bold border-b border-blue-600 pb-0.5 mb-1 text-blue-600">
                EDUCATION
              </h2>
              <div className="text-[7px] space-y-1">
                <div>
                  <div className="flex justify-between">
                    <p className="font-medium">Degree • Institution</p>
                    <p className="text-gray-500">MM/YYYY – MM/YYYY</p>
                  </div>
                  <p>Major, honors, or relevant achievements.</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div 
      className={`border border-gray-200 bg-white rounded-md overflow-hidden shadow-sm relative ${className}`}
      style={{ 
        width: width ? `${width}px` : '100%', 
        height: height ? `${height}px` : '100%',
        maxWidth: '100%',
      }}
    >
      <div className="h-full flex flex-col w-full">
        {/* Render selected template HTML content if available, otherwise fallback */}
        {templateHtml ? (
          <div 
            dangerouslySetInnerHTML={{ __html: templateHtml }} 
            className="w-full h-full scale-[0.85] origin-top transform"
          />
        ) : (
          renderFallbackTemplate()
        )}
      </div>
    </div>
  );
};

export default ResumePreview;