import React, { useEffect, useState } from 'react';
import { useResume } from '@/contexts/ResumeContext';

interface DirectResumePreviewProps {
  width?: number;
  height?: number;
  className?: string;
}

const DirectResumePreview: React.FC<DirectResumePreviewProps> = ({ 
  width = 280, 
  height = 365,
  className = '',
}) => {
  const { resumeData } = useResume();
  
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
                  {resumeData.summary || 'This section will display your professional summary.'}
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
              
              <section>
                <h2 className="font-semibold text-gray-800 text-sm border-b border-gray-300 pb-1 mb-2">
                  EDUCATION
                </h2>
                <div className="text-xs space-y-2 text-gray-600">
                  {resumeData.education.length > 0 ? (
                    resumeData.education.map((edu, index) => (
                      <div key={index}>
                        <p className="font-medium">{edu.degree}</p>
                        <p className="text-gray-500">{edu.startDate} – {edu.endDate}</p>
                        <p className="italic">{edu.institution}, {edu.location}</p>
                      </div>
                    ))
                  ) : (
                    <div>
                      <p className="font-medium">Degree Name</p>
                      <p className="text-gray-500">Start Year – End Year</p>
                      <p className="italic">Institution Name, Location</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectResumePreview;