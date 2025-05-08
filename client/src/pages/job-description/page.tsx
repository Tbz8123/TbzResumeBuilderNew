import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Search, Plus, ArrowRight, RotateCw, Undo2, X } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { JobTitle, getJobTitleSuggestions, findJobTitleById } from '@/utils/jobTitlesData';
import { JobDescription } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { WorkExperience } from '@/types/resume';

// Related job titles
const getRelatedJobTitles = (jobTitle: string): JobTitle[] => {
  // Convert common job titles to their IDs
  const titleToId = (title: string): string => {
    return title.toLowerCase().replace(/\s+/g, '-');
  };

  // Predefined related job titles map
  const relatedTitlesMap: Record<string, string[]> = {
    'manager': ['assistant-manager', 'project-manager', 'operations-manager', 'general-manager'],
    'developer': ['software-engineer', 'web-developer', 'front-end-developer', 'back-end-developer'],
    'engineer': ['software-engineer', 'mechanical-engineer', 'electrical-engineer', 'civil-engineer'],
    'accountant': ['financial-analyst', 'bookkeeper', 'tax-accountant', 'controller'],
    'designer': ['graphic-designer', 'ui-designer', 'ux-designer', 'product-designer'],
  };
  
  // Default to manager if no match
  const baseTitle = titleToId(jobTitle) || 'manager';
  const relatedIds = relatedTitlesMap[baseTitle] || relatedTitlesMap['manager'];
  
  // Map IDs to job title objects
  return relatedIds.map(id => {
    const jobTitle = findJobTitleById(id);
    return jobTitle || { id, title: id.replace(/-/g, ' '), category: 'Default' };
  });
};

const JobDescriptionPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<JobTitle[]>([]);
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Get the current work experience (first one in the array)
  const defaultWorkExperience: WorkExperience = { 
    id: 'temp-default',
    jobTitle: 'Manager', 
    employer: 'Cocoblu', 
    location: '',
    isRemote: false,
    startMonth: 'January', 
    startYear: '2025', 
    endMonth: 'January', 
    endYear: '2026',
    isCurrentJob: false,
    responsibilities: ''
  };
  
  const currentJob = resumeData.workExperience && resumeData.workExperience.length > 0 
    ? resumeData.workExperience[0] 
    : defaultWorkExperience;
      
  // Initialize job responsibilities from currentJob if available
  const [jobResponsibilities, setJobResponsibilities] = useState(currentJob.responsibilities || '');
  
  // Get job title ID for looking up descriptions
  const jobTitleId = currentJob.jobTitle ? 
    currentJob.jobTitle.toLowerCase().replace(/\s+/g, '-') : 'manager';
  
  // Get related job titles
  const relatedJobTitles = getRelatedJobTitles(currentJob.jobTitle);
  
  // Get job descriptions based on job title
  const [descriptions, setDescriptions] = useState<JobDescription[]>([]);
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);
  
  // Fetch job descriptions from API when job title changes or on search
  useEffect(() => {
    const fetchJobDescriptions = async () => {
      setIsLoadingDescriptions(true);
      try {
        // First try to find the actual job title ID from the database based on the title
        const titlesResponse = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(currentJob.jobTitle)}`);
        const titlesData = await titlesResponse.json();
        
        let jobTitleIdFromDb = null;
        if (titlesData.data && titlesData.data.length > 0) {
          // Use the first matching job title's ID
          jobTitleIdFromDb = titlesData.data[0].id;
        }
        
        // Fetch descriptions based on the found job title ID, or all descriptions if none found
        let descriptionsUrl = '/api/jobs/descriptions';
        if (jobTitleIdFromDb) {
          descriptionsUrl += `?jobTitleId=${jobTitleIdFromDb}`;
        }
        
        // If search term is provided, we would normally add it to the query
        // But the backend doesn't currently support text search on descriptions
        // so we'll filter on the client side
        
        const response = await apiRequest('GET', descriptionsUrl);
        let descriptionsData = await response.json();
        
        // Client-side filtering if search term is provided
        if (searchTerm && descriptionsData.length > 0) {
          const searchTermLower = searchTerm.toLowerCase();
          descriptionsData = descriptionsData.filter((desc: JobDescription) => 
            desc.content.toLowerCase().includes(searchTermLower)
          );
        }
        
        setDescriptions(descriptionsData);
      } catch (error) {
        console.error('Error fetching job descriptions:', error);
        setDescriptions([]);
      } finally {
        setIsLoadingDescriptions(false);
      }
    };
    
    fetchJobDescriptions();
  }, [currentJob.jobTitle, searchTerm]);
  
  // Effect to update job title suggestions when search term changes
  useEffect(() => {
    if (searchTerm.trim()) {
      const suggestions = getJobTitleSuggestions(searchTerm, 5);
      setJobTitleSuggestions(suggestions);
      setShowJobTitleSuggestions(suggestions.length > 0);
    } else {
      setShowJobTitleSuggestions(false);
    }
  }, [searchTerm]);
  
  // Effect to handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowJobTitleSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    const value = e.target.value;
    setSearchTerm(value);
    
    // Only show suggestions if there's input text
    if (value.trim()) {
      // Get suggestions based on input
      const suggestions = getJobTitleSuggestions(value, 5);
      setJobTitleSuggestions(suggestions);
      setShowJobTitleSuggestions(suggestions.length > 0);
    } else {
      setShowJobTitleSuggestions(false);
    }
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
                <div className="relative" style={{ position: 'relative' }}>
                  <Input 
                    type="text"
                    ref={searchInputRef}
                    placeholder="Search by job title"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="rounded-sm border-gray-300 pr-10"
                    onFocus={() => {
                      if (jobTitleSuggestions.length > 0) {
                        setShowJobTitleSuggestions(true);
                      }
                    }}
                  />
                  {searchTerm ? (
                    <button 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setSearchTerm('')}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  ) : (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600">
                      <Search className="h-5 w-5" />
                    </div>
                  )}

                  {/* Job title suggestions dropdown positioned directly below search input */}
                  {showJobTitleSuggestions && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-50 mt-1 w-full"
                      style={{ top: '100%', left: 0 }}
                    >
                      <div className="bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                        <div className="py-1">
                          {jobTitleSuggestions.length > 0 ? (
                            jobTitleSuggestions.map((jobTitle: JobTitle) => (
                              <button
                                key={jobTitle.id}
                                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between items-center"
                                onClick={() => {
                                  setSearchTerm(jobTitle.title);
                                  setShowJobTitleSuggestions(false);
                                }}
                              >
                                <div>
                                  <span className="font-medium">{jobTitle.title}</span>
                                  <span className="text-xs text-gray-500 ml-2">({jobTitle.category})</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              No job titles found matching your search
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
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
                
                <div className="flex flex-wrap gap-2">
                  {relatedJobTitles.map((job: JobTitle) => (
                    <button
                      key={job.id}
                      className="flex items-center border border-gray-300 rounded-md px-2 py-1 text-sm"
                      onClick={() => setSearchTerm(job.title)}
                    >
                      <Search className="h-3 w-3 mr-1 text-purple-600" />
                      {job.title}
                    </button>
                  ))}
                </div>
              </div>
              

              
              {/* Results heading */}
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-500">
                  {showingResults} results for <span className="font-medium">{searchTerm || currentJob.jobTitle}</span>
                </p>
                <button className="text-purple-600 text-sm flex items-center">
                  Filter by Keyword <ArrowRight className="h-3 w-3 ml-1" />
                </button>
              </div>
              
              {/* Examples list */}
              <div className="border border-gray-200 rounded-sm divide-y divide-gray-200">
                {isLoadingDescriptions ? (
                  <div className="p-4 text-center text-gray-500">
                    <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading job descriptions...
                  </div>
                ) : descriptions.length > 0 ? (
                  descriptions.map((description: JobDescription) => (
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
                  ))
                ) : (
                  <div className="p-4 text-center">
                    <p className="text-gray-500">No descriptions found. Try another job title.</p>
                  </div>
                )}
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