import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Search, Plus, ArrowRight, RotateCw, Undo2 } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

// Pre-defined job descriptions for various job titles
const preWrittenExamples = [
  {
    id: 1,
    content: 'Managed and motivated employees to be productive and engaged in work.',
    isRecommended: true
  },
  {
    id: 2,
    content: 'Accomplished multiple tasks within established timeframes.',
    isRecommended: true
  },
  {
    id: 3,
    content: 'Maximized performance by monitoring daily activities and mentoring team members.',
    isRecommended: false
  },
  {
    id: 4,
    content: 'Enhanced customer satisfaction by resolving disputes promptly, maintaining open lines of communication, and ensuring high-quality service delivery.',
    isRecommended: false
  },
  {
    id: 5,
    content: 'Resolved staff member conflicts, actively listening to concerns and finding appropriate middle ground.',
    isRecommended: false
  },
  {
    id: 6,
    content: 'Controlled costs to keep business operating within budget and increase profits.',
    isRecommended: false
  },
  {
    id: 7,
    content: 'Improved marketing to attract new customers and promote business.',
    isRecommended: false
  },
  {
    id: 8,
    content: 'Cross-trained existing employees to maximize team agility and performance.',
    isRecommended: false
  }
];

// Related job titles for suggestions
const relatedJobTitles = [
  { id: 'assistant-manager', title: 'Assistant Manager' },
  { id: 'project-manager', title: 'Project Manager' },
];

const JobDescriptionPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [descriptions, setDescriptions] = useState(preWrittenExamples);
  const [jobResponsibilities, setJobResponsibilities] = useState('');
  
  // Get the current work experience (first one in the array)
  const currentJob = resumeData.workExperience && resumeData.workExperience.length > 0 
    ? resumeData.workExperience[0] 
    : { jobTitle: 'Manager', employer: 'Cocoblu', startMonth: 'January', startYear: '2025', endMonth: 'January', endYear: '2026' };

  const handleBack = () => {
    setLocation('/work-experience-details');
  };

  const handlePreview = () => {
    // Save before previewing
    saveJobDescription();
    setLocation('/preview');
  };

  const handleNext = () => {
    // Save and navigate to the next step
    saveJobDescription();
    setLocation('/education'); // Assuming education is the next step
  };

  const saveJobDescription = () => {
    if (jobResponsibilities.trim()) {
      const updatedWorkExperience = [...(resumeData.workExperience || [])];
      
      if (updatedWorkExperience.length > 0) {
        // Update the first work experience
        updatedWorkExperience[0] = {
          ...updatedWorkExperience[0],
          responsibilities: jobResponsibilities.trim()
        };
        
        updateResumeData({ workExperience: updatedWorkExperience });
      }
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleDescriptionClick = (description: string) => {
    // Add the selected description to the text area
    if (jobResponsibilities) {
      setJobResponsibilities(prev => prev + '\n• ' + description);
    } else {
      setJobResponsibilities('• ' + description);
    }
  };

  const showingResults = searchTerm ? 'Filtered' : 'Showing';

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow py-10">
        <div className="w-full max-w-5xl mx-auto px-6">
          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
          
          {/* Main Content */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold">What did you do as a {currentJob.jobTitle}?</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-purple-600">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 ml-1" />
                        Tips
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4">
                    <p>Be specific about your achievements. Use action verbs and quantify results when possible.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600">To get started, you can choose from our expert recommended examples below.</p>
          </div>
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Examples */}
            <div>
              <div className="mb-4">
                <h2 className="text-xs uppercase font-bold text-gray-600 mb-2">SEARCH BY JOB TITLE FOR PRE-WRITTEN EXAMPLES</h2>
                <div className="relative">
                  <Input 
                    type="text"
                    placeholder="Search by job title"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="rounded-sm border-gray-300 pr-10"
                  />
                  <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </div>
              
              {/* Related Job Titles */}
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-sm font-medium mb-2">Related Job Titles</h2>
                  <button className="text-purple-600 text-sm">
                    More <ArrowRight className="h-3 w-3 inline-block" />
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {relatedJobTitles.map(job => (
                    <button
                      key={job.id}
                      className="flex items-center border border-gray-300 rounded-md px-2 py-1 text-sm"
                    >
                      <Search className="h-3 w-3 mr-1 text-purple-600" />
                      {job.title}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Results heading */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">{showingResults} results for <span className="font-medium">Manager</span></p>
                <button className="text-purple-600 text-sm flex items-center">
                  Filter by Keyword <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              
              {/* Examples list */}
              <div className="border border-gray-200 rounded-sm divide-y divide-gray-200">
                {descriptions.map(description => (
                  <div key={description.id} className="p-3 hover:bg-gray-50">
                    <button 
                      onClick={() => handleDescriptionClick(description.content)}
                      className="flex items-start w-full text-left group"
                    >
                      <div className="mt-1 mr-2">
                        <Plus className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100" />
                      </div>
                      <div>
                        {description.isRecommended && (
                          <div className="flex items-center text-xs text-purple-600 mb-1">
                            <span className="text-purple-600 mr-1">★</span>
                            Expert Recommended
                          </div>
                        )}
                        <p className="text-sm">{description.content}</p>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Right Column - Job Description Editor */}
            <div>
              <div className="mb-2">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">{currentJob.jobTitle}</span> | {currentJob.employer}
                </div>
                <div className="text-xs text-gray-500">
                  {currentJob.startMonth} {currentJob.startYear} - {currentJob.endMonth} {currentJob.endYear}
                </div>
              </div>
              
              <div className="mb-2">
                <h2 className="text-sm font-medium">Job description:</h2>
              </div>
              
              {/* Text editor */}
              <div className="border border-gray-300 rounded-sm mb-3">
                <textarea
                  value={jobResponsibilities}
                  onChange={(e) => setJobResponsibilities(e.target.value)}
                  placeholder="Type your achievements and responsibilities here."
                  className="w-full h-52 p-3 text-sm resize-none focus:outline-none"
                />
                
                {/* Editor toolbar */}
                <div className="flex items-center border-t border-gray-300 p-2">
                  <button className="p-1 text-gray-500 hover:text-gray-800">
                    <Undo2 className="h-4 w-4" />
                  </button>
                  <button className="p-1 text-gray-500 hover:text-gray-800">
                    <RotateCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-center items-center gap-6 mt-10">
                <button 
                  onClick={handlePreview}
                  className="text-purple-600 hover:text-purple-800 border border-purple-600 hover:border-purple-800 font-medium rounded-full px-10 py-2.5 text-base w-28"
                >
                  Preview
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-full px-10 py-2.5 text-base w-28"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default JobDescriptionPage;