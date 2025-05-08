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
  
  // Job title ID will be set in the fetchJobDescriptions function
  
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
        console.log("Searching for job title:", currentJob.jobTitle);
        
        // First check if we already have a job title ID stored in the work experience
        const dbJobTitleId = currentJob.dbJobTitleId;
        
        if (dbJobTitleId) {
          // If we already have the database ID, use it directly
          console.log(`Using stored job title ID (${dbJobTitleId}) for fetching descriptions`);
          
          const descriptionsUrl = `/api/jobs/descriptions?jobTitleId=${dbJobTitleId}`;
          const response = await apiRequest('GET', descriptionsUrl);
          let descriptionsData = await response.json();
          
          console.log(`Retrieved ${descriptionsData.length} descriptions directly for stored job title ID: ${dbJobTitleId}`);
          
          // Apply search term filtering
          if (searchTerm && descriptionsData.length > 0) {
            const searchTermLower = searchTerm.toLowerCase();
            descriptionsData = descriptionsData.filter((desc: JobDescription) => 
              desc.content.toLowerCase().includes(searchTermLower)
            );
            console.log("Filtered descriptions by search term:", searchTerm, "Results:", descriptionsData.length);
          }
          
          if (descriptionsData.length > 0) {
            setDescriptions(descriptionsData);
            setIsLoadingDescriptions(false);
            return; // Exit early since we found descriptions
          }
        }
        
        // If we don't have a stored ID or no descriptions found, try to find the job title in the database
        const searchQuery = currentJob.jobTitle || "Manager";
        const titlesResponse = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(searchQuery)}`);
        const titlesData = await titlesResponse.json();
        
        console.log("Job titles search results:", titlesData);
        
        let jobTitleIdFromDb = null;
        if (titlesData.data && titlesData.data.length > 0) {
          // Try to find an exact match first (case-insensitive)
          const exactMatch = titlesData.data.find((item: any) => 
            item.title.toLowerCase() === searchQuery.toLowerCase()
          );
          
          if (exactMatch) {
            jobTitleIdFromDb = exactMatch.id;
            console.log("Found exact matching job title ID:", jobTitleIdFromDb);
            
            // Update the work experience with this ID for future reference
            const updatedWorkExperience = [...(resumeData.workExperience || [])];
            if (updatedWorkExperience.length > 0 && !updatedWorkExperience[0].dbJobTitleId) {
              updatedWorkExperience[0] = {
                ...updatedWorkExperience[0],
                dbJobTitleId: jobTitleIdFromDb
              };
              updateResumeData({ workExperience: updatedWorkExperience });
            }
          } else {
            // If no exact match, use the first result
            jobTitleIdFromDb = titlesData.data[0].id;
            console.log("Using closest matching job title ID:", jobTitleIdFromDb);
          }
        } else {
          console.log("No matching job title found in database");
        }
        
        // Fetch descriptions based on the found job title ID, or all descriptions if none found
        let descriptionsUrl = '/api/jobs/descriptions';
        if (jobTitleIdFromDb) {
          descriptionsUrl += `?jobTitleId=${jobTitleIdFromDb}`;
        }
        
        console.log("Fetching descriptions from:", descriptionsUrl);
        
        const response = await apiRequest('GET', descriptionsUrl);
        let descriptionsData = await response.json();
        
        console.log("Raw descriptions data:", descriptionsData);
        
        // Client-side filtering if search term is provided
        if (searchTerm && descriptionsData.length > 0) {
          const searchTermLower = searchTerm.toLowerCase();
          descriptionsData = descriptionsData.filter((desc: JobDescription) => 
            desc.content.toLowerCase().includes(searchTermLower)
          );
          console.log("Filtered descriptions by search term:", searchTerm, "Results:", descriptionsData.length);
        }
        
        // As a fallback, if we still have no descriptions, fetch all descriptions
        // but pass the job title ID to prioritize this title's descriptions
        if (descriptionsData.length === 0) {
          console.log("No descriptions found, fetching all descriptions as fallback with prioritization");
          
          // Include the current job title ID even when fetching all descriptions
          // so the backend can prioritize this title's descriptions at the top
          const allResponse = await apiRequest('GET', `/api/jobs/descriptions${jobTitleIdFromDb ? `?jobTitleId=${jobTitleIdFromDb}` : ''}`);
          
          descriptionsData = await allResponse.json();
          console.log(`Fallback descriptions retrieved: ${descriptionsData.length}`);
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
  }, [currentJob.jobTitle, currentJob.dbJobTitleId, searchTerm, resumeData.workExperience]);
  
  // Effect to update job title suggestions when search term changes
  useEffect(() => {
    const fetchJobTitleSuggestions = async () => {
      if (searchTerm.trim()) {
        try {
          // First try to get suggestions from the API
          const apiResponse = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(searchTerm)}`);
          const apiData = await apiResponse.json();
          
          console.log("Job title suggestions from API:", apiData);
          
          if (apiData.data && apiData.data.length > 0) {
            // Convert database titles to JobTitle format
            const apiSuggestions = apiData.data.map((item: any) => ({
              id: item.id.toString(),
              title: item.title,
              category: item.category
            }));
            setJobTitleSuggestions(apiSuggestions);
            setShowJobTitleSuggestions(true);
          } else {
            // Fallback to static data if no API results
            const staticSuggestions = getJobTitleSuggestions(searchTerm, 5);
            setJobTitleSuggestions(staticSuggestions);
            setShowJobTitleSuggestions(staticSuggestions.length > 0);
          }
        } catch (error) {
          console.error("Error fetching job title suggestions:", error);
          // Fallback to static data if API fails
          const staticSuggestions = getJobTitleSuggestions(searchTerm, 5);
          setJobTitleSuggestions(staticSuggestions);
          setShowJobTitleSuggestions(staticSuggestions.length > 0);
        }
      } else {
        setShowJobTitleSuggestions(false);
      }
    };
    
    fetchJobTitleSuggestions();
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
                                onClick={async () => {
                                  setSearchTerm(jobTitle.title);
                                  setShowJobTitleSuggestions(false);
                                  
                                  // Update current job title in resume data
                                  const updatedWorkExperience = [...(resumeData.workExperience || [])];
                                  if (updatedWorkExperience.length > 0) {
                                    // Update job title
                                    updatedWorkExperience[0] = {
                                      ...updatedWorkExperience[0],
                                      jobTitle: jobTitle.title,
                                      // Store the database ID to use directly in the descriptions API
                                      dbJobTitleId: jobTitle.id
                                    };
                                    updateResumeData({ workExperience: updatedWorkExperience });
                                    console.log(`Updated current job title to: ${jobTitle.title} (DB ID: ${jobTitle.id})`);
                                    
                                    // Immediately fetch the job descriptions for this title ID
                                    setIsLoadingDescriptions(true);
                                    try {
                                      const descriptionsUrl = `/api/jobs/descriptions?jobTitleId=${jobTitle.id}`;
                                      console.log(`Directly fetching descriptions from: ${descriptionsUrl}`);
                                      
                                      const response = await apiRequest('GET', descriptionsUrl);
                                      const descriptionsData = await response.json();
                                      
                                      console.log(`Retrieved ${descriptionsData.length} descriptions directly for job title ID: ${jobTitle.id}`);
                                      
                                      if (descriptionsData.length > 0) {
                                        setDescriptions(descriptionsData);
                                      } else {
                                        // Fallback to general descriptions if none found
                                        // Pass the job title ID for prioritization
                                        const allResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${jobTitle.id}`);
                                        const allDescriptionsData = await allResponse.json();
                                        setDescriptions(allDescriptionsData);
                                      }
                                    } catch (error) {
                                      console.error('Error fetching job descriptions:', error);
                                    } finally {
                                      setIsLoadingDescriptions(false);
                                    }
                                  }
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
                      onClick={async () => {
                        setSearchTerm(job.title);
                        
                        // Update current job title in resume data
                        const updatedWorkExperience = [...(resumeData.workExperience || [])];
                        if (updatedWorkExperience.length > 0) {
                          // First try to find the exact job title ID from API
                          setIsLoadingDescriptions(true);
                          try {
                            // First check if this job title exists in the database
                            const titlesResponse = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(job.title)}`);
                            const titlesData = await titlesResponse.json();
                            
                            let dbJobTitleId = null;
                            if (titlesData.data && titlesData.data.length > 0) {
                              // Find exact match (case-insensitive)
                              const exactMatch = titlesData.data.find((item: any) => 
                                item.title.toLowerCase() === job.title.toLowerCase()
                              );
                              
                              if (exactMatch) {
                                dbJobTitleId = exactMatch.id;
                                console.log(`Found exact DB match for related job title: ${job.title} (ID: ${dbJobTitleId})`);
                              }
                            }
                            
                            // Update work experience with job title and ID if found
                            updatedWorkExperience[0] = {
                              ...updatedWorkExperience[0],
                              jobTitle: job.title,
                              // Store the database ID if found
                              ...(dbJobTitleId && { dbJobTitleId })
                            };
                            updateResumeData({ workExperience: updatedWorkExperience });
                            console.log(`Updated current job title to: ${job.title}`);
                            
                            // Fetch descriptions for this job title
                            if (dbJobTitleId) {
                              // If we have a database ID, use it directly
                              const descriptionsUrl = `/api/jobs/descriptions?jobTitleId=${dbJobTitleId}`;
                              console.log(`Directly fetching descriptions from: ${descriptionsUrl}`);
                              
                              const response = await apiRequest('GET', descriptionsUrl);
                              const descriptionsData = await response.json();
                              
                              console.log(`Retrieved ${descriptionsData.length} descriptions directly for job title ID: ${dbJobTitleId}`);
                              
                              if (descriptionsData.length > 0) {
                                setDescriptions(descriptionsData);
                              } else {
                                // Fallback to general descriptions, but still prioritize this job title's descriptions
                                const allResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${dbJobTitleId}`);
                                const allDescriptionsData = await allResponse.json();
                                setDescriptions(allDescriptionsData);
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching job title data:', error);
                          } finally {
                            setIsLoadingDescriptions(false);
                          }
                        }
                      }}
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