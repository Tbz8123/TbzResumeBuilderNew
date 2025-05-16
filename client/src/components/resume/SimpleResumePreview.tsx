import React from 'react';
import { X, Download } from 'lucide-react';
import { ResumeData } from '@/contexts/ResumeContext';

// Simplified props interface for the preview component
interface SimpleResumePreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  onNextStep?: () => void;
}

/**
 * Ultra-simplified resume preview component that matches the Zety-style layout
 * Focuses on clean interface with single scrollbar and no page breaks
 */
const SimpleResumePreview: React.FC<SimpleResumePreviewProps> = ({
  open,
  onOpenChange,
  resumeData,
  onNextStep
}) => {
  if (!open) return null;
  
  // Handle PDF download
  const handleDownload = () => {
    alert('PDF download coming soon!');
  };
  
  // Handle modal close
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto pt-10 pb-10">
      <div className="bg-white rounded-md shadow-xl w-full max-w-3xl flex flex-col mx-4">
        {/* Header */}
        <div className="flex justify-between items-center py-3 px-4 border-b">
          <h3 className="text-lg font-medium">Resume Preview</h3>
          <div className="flex items-center gap-2">
            <button 
              className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1.5 rounded flex items-center"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download PDF
            </button>
            <button 
              className="rounded-full w-8 h-8 flex items-center justify-center hover:bg-gray-100"
              onClick={handleClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Content - Resume Preview */}
        <div className="overflow-y-auto max-h-[70vh] p-8 bg-white">
          {/* Personal Info Section */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{resumeData.personalInfo?.fullName || 'Your Name'}</h1>
            <div className="flex justify-center gap-3 text-sm text-gray-600 mt-1">
              {resumeData.personalInfo?.email && (
                <span>{resumeData.personalInfo.email}</span>
              )}
              {resumeData.personalInfo?.phone && (
                <span>• {resumeData.personalInfo.phone}</span>
              )}
              {resumeData.personalInfo?.location && (
                <span>• {resumeData.personalInfo.location}</span>
              )}
            </div>
          </div>

          {/* Summary Section */}
          {resumeData.summary && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-2 text-gray-800 border-b pb-1">Professional Summary</h2>
              <p className="text-sm">{resumeData.summary}</p>
            </div>
          )}
          
          {/* Work Experience Section */}
          {resumeData.workExperience && resumeData.workExperience.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Work Experience</h2>
              {resumeData.workExperience.map((exp, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between text-sm">
                    <div className="font-bold">{exp.jobTitle || 'Job Title'}</div>
                    <div className="text-gray-600">
                      {exp.startMonth} {exp.startYear} - {exp.isCurrentJob ? 'Present' : `${exp.endMonth} ${exp.endYear}`}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{exp.employer || 'Employer'}{exp.location ? `, ${exp.location}` : ''}</div>
                  <p className="mt-2 text-sm text-gray-700 whitespace-pre-line">{exp.responsibilities || 'Job responsibilities'}</p>
                </div>
              ))}
            </div>
          )}
          
          {/* Education Section */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Education</h2>
              {resumeData.education.map((edu, index) => (
                <div key={index} className="mb-4">
                  <div className="flex justify-between text-sm">
                    <div className="font-bold">{edu.degree || 'Degree'}, {edu.fieldOfStudy || 'Field of Study'}</div>
                    <div className="text-gray-600">
                      {edu.startYear} - {edu.isCurrentlyStudying ? 'Present' : edu.endYear}
                    </div>
                  </div>
                  <div className="text-sm font-medium">{edu.institution || 'Institution'}</div>
                  {edu.description && (
                    <p className="mt-2 text-sm text-gray-700">{edu.description}</p>
                  )}
                </div>
              ))}
            </div>
          )}
          
          {/* Skills Section */}
          {resumeData.skills && resumeData.skills.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 text-gray-800 border-b pb-1">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.map((skill, index) => (
                  <span key={index} className="text-sm bg-gray-100 rounded-full px-3 py-1">{skill.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleResumePreview;