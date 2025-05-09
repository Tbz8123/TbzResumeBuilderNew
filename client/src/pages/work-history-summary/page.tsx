import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Edit, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WorkExperience } from '@/types/resume';

const WorkHistorySummaryPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  
  // Format dates for display
  const formatDate = (month: string, year: string) => {
    return `${month} ${year}`;
  };
  
  const handleBack = () => {
    setLocation('/job-description');
  };
  
  const handleNext = () => {
    setLocation('/education');
  };
  
  const handlePreview = () => {
    setLocation('/preview');
  };
  
  const handleEditDescription = (id: string | undefined) => {
    if (id) {
      // Find the index of the job in work experience
      const jobIndex = resumeData.workExperience.findIndex(job => job.id === id);
      if (jobIndex !== -1) {
        // Navigate to job description page with this job selected
        setLocation('/job-description');
      }
    }
  };
  
  const handleDeleteJob = (id: string | undefined) => {
    if (id) {
      // Filter out the job with the given id
      const updatedWorkExperience = resumeData.workExperience.filter(job => job.id !== id);
      updateResumeData({ workExperience: updatedWorkExperience });
    }
  };
  
  const handleAddNewPosition = () => {
    setLocation('/work-experience-details');
  };
  
  const handleAiAssistance = () => {
    // This would connect to an AI assistance feature
    console.log('AI assistance requested');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-4">
            <button 
              onClick={handleBack}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
          
          {/* Page Title and Tips */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Work history summary</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="flex items-center text-blue-600 text-sm font-medium">
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Tips
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    List your most recent jobs first. Include key responsibilities that showcase your skills relevant to the job you're applying for.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          {/* AI Writing Assistant Banner */}
          <div className="bg-blue-100 rounded-md p-4 mb-8 flex items-center">
            <div className="flex-shrink-0 mr-4">
              <img 
                src="/assets/writing-assistance.svg" 
                alt="Writing assistance" 
                className="h-16 w-16"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>';
                }}
              />
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-800">Unsure what to write or how to phrase it?</h3>
              <p className="text-sm text-gray-600">Answer a few quick questions, and we'll help craft interview-landing content as you go.</p>
            </div>
            <button 
              onClick={handleAiAssistance}
              className="flex-shrink-0 bg-purple-700 hover:bg-purple-800 text-white font-medium rounded-full px-4 py-2 text-sm"
            >
              Let's go
            </button>
          </div>
          
          {/* Work Experience List */}
          <div className="space-y-4">
            {resumeData.workExperience && resumeData.workExperience.length > 0 ? (
              resumeData.workExperience.map((job, index) => (
                <div key={job.id || index} className="border border-gray-200 rounded-md p-6 relative">
                  <div className="absolute top-4 left-4 bg-blue-100 text-blue-800 h-8 w-8 flex items-center justify-center rounded-full font-medium">
                    {index + 1}
                  </div>
                  
                  <div className="ml-10">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-lg">{job.jobTitle}</h3>
                        <p className="text-gray-600">
                          {job.employer}{job.location ? `, ${job.location}` : ''} | {job.startMonth} {job.startYear} - {job.isCurrentJob ? 'Present' : `${job.endMonth} ${job.endYear}`}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleEditDescription(job.id)}
                          className="text-blue-600 hover:text-blue-800"
                          aria-label="Edit job description"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Delete job"
                        >
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    
                    <ul className="list-disc pl-5 mt-3 space-y-1">
                      {job.responsibilities.split('\n').map((item, i) => (
                        item.trim() && <li key={i} className="text-gray-700">{item.trim()}</li>
                      ))}
                    </ul>
                    
                    <button 
                      onClick={() => handleEditDescription(job.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-3 flex items-center"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit description
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">No work experience added yet. Add a position to get started.</p>
              </div>
            )}
            
            {/* Add New Position Button */}
            <div className="border border-dashed border-gray-300 rounded-md p-4 flex items-center justify-center">
              <button 
                onClick={handleAddNewPosition}
                className="text-purple-600 hover:text-purple-800 font-medium flex items-center"
              >
                <span className="text-xl mr-2">+</span>
                Add new position
              </button>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-end space-x-4 mt-8">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="border-purple-600 text-purple-600 hover:bg-purple-50"
            >
              Preview
            </Button>
            <Button
              onClick={handleNext}
              className="bg-amber-400 hover:bg-amber-500 text-black"
            >
              Next: Education
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkHistorySummaryPage;