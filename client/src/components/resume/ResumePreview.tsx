import React from 'react';
import { useResume } from '@/contexts/ResumeContext';
import { useTemplates } from '@/hooks/use-templates';

interface ResumePreviewProps {
  width?: number;
  height?: number;
}

const ResumePreview: React.FC<ResumePreviewProps> = ({ 
  width = 234, 
  height = 305 
}) => {
  const { resumeData, selectedTemplateId } = useResume();
  const { data: templates, isLoading } = useTemplates();
  
  // Find the selected template
  const selectedTemplate = templates?.find(t => t.id === selectedTemplateId);
  
  // For now, we'll render a simple preview
  return (
    <div 
      className="border border-gray-200 bg-white rounded-md overflow-hidden shadow-sm mx-auto"
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        maxWidth: '100%' 
      }}
    >
      <div className="h-full flex flex-col">
        {/* Header section */}
        <div className="bg-blue-600 p-3 text-white">
          <div className="flex items-start gap-3">
            {resumeData.photo && (
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white flex-shrink-0">
                <img 
                  src={resumeData.photo} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 overflow-hidden">
              <h1 className="font-bold text-sm truncate">
                {resumeData.firstName || 'First'} {resumeData.surname || 'Last'}
              </h1>
              <p className="text-xs text-blue-100 truncate">
                {resumeData.profession || 'Profession'}
              </p>
            </div>
          </div>
        </div>
        
        {/* Content section */}
        <div className="p-3 text-xs flex-1 overflow-hidden flex flex-col">
          {/* Contact Information */}
          <div className="mb-2">
            <div className="grid grid-cols-1 gap-0.5">
              {resumeData.email && (
                <div className="truncate">
                  <span className="font-medium">Email:</span> {resumeData.email}
                </div>
              )}
              
              {resumeData.phone && (
                <div className="truncate">
                  <span className="font-medium">Phone:</span> {resumeData.phone}
                </div>
              )}
              
              {(resumeData.city || resumeData.country) && (
                <div className="truncate">
                  <span className="font-medium">Location:</span>{' '}
                  {[resumeData.city, resumeData.country].filter(Boolean).join(', ')}
                </div>
              )}
              
              {/* Additional info */}
              {Object.entries(resumeData.additionalInfo).map(([key, value]) => (
                value && (
                  <div key={key} className="truncate">
                    <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {value}
                  </div>
                )
              ))}
            </div>
          </div>
          
          {/* Example sections */}
          <div className="space-y-2 flex-1">
            <section className="mb-1.5">
              <h2 className="text-xs font-bold border-b border-gray-200 pb-0.5 mb-1">
                EXPERIENCE
              </h2>
              <div className="text-[10px] leading-tight">
                <p className="font-medium">Position • Company</p>
                <p className="text-gray-500">Date – Date</p>
                <p className="mt-0.5">Brief description of responsibilities and achievements.</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-xs font-bold border-b border-gray-200 pb-0.5 mb-1">
                EDUCATION
              </h2>
              <div className="text-[10px] leading-tight">
                <p className="font-medium">Degree • Institution</p>
                <p className="text-gray-500">Date – Date</p>
              </div>
            </section>
            
            <section>
              <h2 className="text-xs font-bold border-b border-gray-200 pb-0.5 mb-1">
                SKILLS
              </h2>
              <div className="text-[10px] flex flex-wrap gap-1">
                <span className="bg-gray-100 px-1 rounded">Skill 1</span>
                <span className="bg-gray-100 px-1 rounded">Skill 2</span>
                <span className="bg-gray-100 px-1 rounded">Skill 3</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePreview;