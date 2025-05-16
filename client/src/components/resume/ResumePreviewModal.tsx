import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResumeTemplate } from '@shared/schema';
import { ResumeData } from '@/types/resume';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from "@/components/ui/dialog";

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  templates: ResumeTemplate[];
}

const ResumePreviewModal: React.FC<ResumePreviewModalProps> = ({
  open,
  onOpenChange,
  resumeData,
  selectedTemplateId,
  templates
}) => {
  // Find the selected template
  const selectedTemplate = templates?.find(template => template.id === selectedTemplateId);
  
  if (!selectedTemplate) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg p-6 bg-white shadow-xl">
          <DialogHeader className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">Resume Preview</DialogTitle>
            <DialogClose className="w-6 h-6 text-gray-500 hover:text-gray-800">
              <X size={18} />
            </DialogClose>
          </DialogHeader>
          <div className="p-4 text-center">
            <p>No template selected. Please select a template first.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Create a styled resume preview based on the style in the screenshot
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[800px] max-w-[90vw] max-h-[90vh] overflow-auto rounded-lg p-0 bg-white shadow-xl">
        <DialogHeader className="sticky top-0 z-10 bg-white p-4 flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold">Resume Preview</DialogTitle>
          <div className="flex items-center gap-4">
            <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-blue-600 text-sm hover:underline">
              Change template
            </a>
            <DialogClose className="w-6 h-6 text-gray-500 hover:text-gray-800">
              <X size={18} />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <div className="resume-container p-6">
          <div className="resume-preview shadow-lg mx-auto bg-white rounded-sm overflow-hidden" style={{maxWidth: '100%'}}>
            {/* Modern Professional Template */}
            <div className="flex h-full">
              {/* Left sidebar */}
              <div className="bg-blue-900 text-white w-1/4 p-6 flex flex-col justify-between">
                <div>
                  {resumeData.workExperience && resumeData.workExperience.length > 0 && (
                    <div className="text-xs text-center mb-16">
                      <div className="text-white/70">{resumeData.workExperience[0].startYear}-{resumeData.workExperience[0].isCurrentJob ? 'Present' : resumeData.workExperience[0].endYear}</div>
                    </div>
                  )}
                </div>
                <div className="text-xs text-center">
                  <div className="text-white/70">Expected in 2025-01</div>
                </div>
              </div>
              
              {/* Main content */}
              <div className="w-3/4 p-6">
                {/* Header with name and photo */}
                <div className="flex items-center mb-4">
                  {resumeData.photo && (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mr-4">
                      <img src={resumeData.photo} alt="Profile" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {!resumeData.photo && (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mr-4">
                      <div className="w-full h-full flex items-center justify-center text-gray-400">Photo</div>
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-blue-900">{resumeData.firstName} {resumeData.surname}</h1>
                    <p className="text-gray-600">{resumeData.profession || 'Manager'}</p>
                  </div>
                </div>
                
                {/* Contact info section */}
                <div className="flex flex-wrap mb-6">
                  <div className="flex items-center mr-6 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm">{resumeData.city}, {resumeData.postalCode}</span>
                  </div>
                  <div className="flex items-center mr-6 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <span className="text-sm">{resumeData.phone || '123444'}</span>
                  </div>
                  <div className="flex items-center mr-6 mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="text-sm">{resumeData.email || 'mom@email.com'}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                      </svg>
                    </div>
                    <span className="text-sm">Bold Profile</span>
                  </div>
                </div>
                
                {/* Professional summary */}
                <div className="mb-6">
                  <p className="text-sm text-gray-700">
                    {resumeData.summary || resumeData.professionalSummary || 'Forward-thinking team leader skilled at operating departments efficiently to meet goals. Successful background matching employees with roles for maximum performance. Proactive and hardworking individual focused on continuous operational improvement.'}
                  </p>
                </div>
                
                {/* Websites section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <span className="font-semibold text-blue-900">Websites, Portfolios, Profiles</span>
                  </div>
                  <ul className="list-disc pl-8 text-sm">
                    <li>ewev</li>
                    <li>vewvew</li>
                    <li>vewvwe</li>
                  </ul>
                </div>
                
                {/* Skills section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-blue-900">Skills</span>
                  </div>
                  <ul className="list-disc pl-8 text-sm">
                    {resumeData.skills && resumeData.skills.length > 0 ? 
                      resumeData.skills.map((skill, index) => (
                        <li key={index}>{typeof skill === 'string' ? skill : skill.name}</li>
                      )) : 
                      <li>Data analysis</li>
                    }
                  </ul>
                </div>
                
                {/* Work History section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-blue-900">Work History</span>
                  </div>
                  
                  {resumeData.workExperience && resumeData.workExperience.length > 0 ? (
                    resumeData.workExperience.map((job, index) => (
                      <div key={index} className="mb-4">
                        <h3 className="font-semibold">{job.jobTitle || 'Manager of Operations'}</h3>
                        <p className="text-sm">{job.employer || 'Dell'}, {job.location || 'Bengaluru'}</p>
                        <ul className="list-disc pl-8 text-sm mt-1">
                          <li>{job.responsibilities || 'Established positive and effective communication among unit staff and organization leadership, reducing miscommunications, and missed deadlines.'}</li>
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="mb-4">
                      <h3 className="font-semibold">Manager of Operations</h3>
                      <p className="text-sm">Dell, Bengaluru</p>
                      <ul className="list-disc pl-8 text-sm mt-1">
                        <li>Established positive and effective communication among unit staff and organization leadership, reducing miscommunications, and missed deadlines.</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Education section */}
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M12 14l9-5-9-5-9 5 9 5z" />
                        <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                      </svg>
                    </div>
                    <span className="font-semibold text-blue-900">Education</span>
                  </div>
                  
                  {resumeData.education && resumeData.education.length > 0 ? (
                    resumeData.education.map((edu, index) => (
                      <div key={index} className="mb-4">
                        <h3 className="font-semibold">{edu.degree || 'Master of Arts: Computers'}</h3>
                        <p className="text-sm">{edu.schoolName || 'New Public'} - {edu.schoolLocation || 'Bangalore'}</p>
                        <ul className="list-disc pl-8 text-sm mt-1">
                          <li>Honours [Semester, Year]</li>
                        </ul>
                      </div>
                    ))
                  ) : (
                    <div className="mb-4">
                      <h3 className="font-semibold">Master of Arts: Computers</h3>
                      <p className="text-sm">New Public - Bangalore</p>
                      <ul className="list-disc pl-8 text-sm mt-1">
                        <li>Honours [Semester, Year]</li>
                      </ul>
                    </div>
                  )}
                </div>
                
                {/* Languages section */}
                <div>
                  <div className="flex items-center mb-2">
                    <div className="w-5 h-5 rounded-full bg-blue-900 flex items-center justify-center mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <span className="font-semibold text-blue-900">Languages</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-sm">Hindi</p>
                      <div className="flex mt-1">
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Advanced (C1)</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Arabic</p>
                      <div className="flex mt-1">
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Advanced (C1)</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Armenian</p>
                      <div className="flex mt-1">
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-blue-900 mr-1"></div>
                        <div className="w-4 h-4 rounded-full bg-gray-300"></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">Advanced (C1)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResumePreviewModal;