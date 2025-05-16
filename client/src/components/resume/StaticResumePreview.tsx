import React, { useRef, useEffect, useState } from 'react';
import { ResumeTemplate } from '@shared/schema';
import { ResumeData } from '@/contexts/ResumeContext';
import { Skeleton } from '@/components/ui/skeleton';

interface StaticResumePreviewProps {
  width: number;
  height: number;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
}

/**
 * A completely static, non-flickering preview component that uses
 * a pre-rendered static image to prevent size fluctuations
 */
const StaticResumePreview: React.FC<StaticResumePreviewProps> = ({
  width,
  height,
  resumeData,
  selectedTemplateId,
  templates
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  // Get template color for the background
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const backgroundColor = selectedTemplate?.primaryColor || '#2d2f35';

  useEffect(() => {
    // Briefly show loading state on template change to prevent visual flickering
    if (selectedTemplateId) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedTemplateId]);

  // Create a stable rendering that doesn't flicker with constant dimensions
  return (
    <div 
      ref={containerRef}
      className="static-preview-container"
      style={{
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'white',
        border: '1px solid #e2e8f0',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="w-[90%] h-[95%]" />
        </div>
      ) : (
        <div 
          style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'row',
          }}
        >
          {/* Static sidebar */}
          <div style={{ 
            width: '35%', 
            height: '100%', 
            backgroundColor: backgroundColor,
            padding: '20px',
            color: 'white',
            overflow: 'hidden'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
              {resumeData.firstName || 'FIRST'} {resumeData.surname || 'LAST'}
            </h2>
            <h3 style={{ fontSize: '14px', marginBottom: '20px' }}>
              {resumeData.profession || 'PROFESSION'}
            </h3>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>CONTACT</h4>
              <p style={{ fontSize: '12px', margin: '2px 0' }}>
                {resumeData.phone || 'Phone'}
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}>
                {resumeData.email || 'Email'}
              </p>
              <p style={{ fontSize: '12px', margin: '2px 0' }}>
                {resumeData.city || 'City'}{resumeData.city && resumeData.country ? ', ' : ''}{resumeData.country || 'Country'}
              </p>
            </div>
            
            <div>
              <h4 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '5px' }}>SKILLS</h4>
              <div style={{ fontSize: '12px' }}>
                {resumeData.skills?.length ? (
                  resumeData.skills.slice(0, 5).map((skill, i) => (
                    <p key={i} style={{ margin: '2px 0' }}>{skill.name}</p>
                  ))
                ) : (
                  <p>Skills will appear here</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Static content area */}
          <div style={{ 
            width: '65%', 
            height: '100%', 
            padding: '20px',
            overflow: 'hidden'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>ABOUT ME</h4>
              <p style={{ fontSize: '12px', color: '#555' }}>
                {resumeData.summary || 'Your professional summary will appear here...'}
              </p>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>WORK EXPERIENCE</h4>
              {resumeData.workExperience?.length ? (
                resumeData.workExperience.slice(0, 2).map((job, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold' }}>{job.jobTitle}</h5>
                    <p style={{ fontSize: '11px', color: '#666' }}>{job.company}</p>
                    <p style={{ fontSize: '11px', color: '#888' }}>{job.startDate} - {job.endDate || 'Present'}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '12px', color: '#555' }}>Work experience will appear here...</p>
              )}
            </div>
            
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>EDUCATION</h4>
              {resumeData.education?.length ? (
                resumeData.education.slice(0, 2).map((edu, i) => (
                  <div key={i} style={{ marginBottom: '10px' }}>
                    <h5 style={{ fontSize: '12px', fontWeight: 'bold' }}>{edu.degree}</h5>
                    <p style={{ fontSize: '11px', color: '#666' }}>{edu.institution}</p>
                    <p style={{ fontSize: '11px', color: '#888' }}>{edu.startDate} - {edu.endDate || 'Present'}</p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '12px', color: '#555' }}>Education will appear here...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticResumePreview;