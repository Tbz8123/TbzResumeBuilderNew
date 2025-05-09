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
  const [showingResults, setShowingResults] = useState<string>('');
  
  // Fetch job descriptions from API when job title changes or on search
  useEffect(() => {
    const fetchJobDescriptions = async () => {
      setIsLoadingDescriptions(true);
      try {
        console.log("Searching for job title:", currentJob.jobTitle);
        
        if (!currentJob.jobTitle) {
          console.log("No job title found, using default: Manager");
          // Instead of exiting early, continue with a default job title
        }
        
        // Hard-code a known working Manager ID for faster debugging/development
        const MANAGER_ID = 28;
        
        // Step 1: Try to find the job title in the database first
        const searchQuery = currentJob.jobTitle || "Manager";
        const titlesResponse = await fetch(`/api/jobs/titles?search=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const titlesData = await titlesResponse.json();
        
        console.log("Job titles search results:", titlesData);
        
        // Step 2: Determine the job title ID to use
        let jobTitleIdToUse = MANAGER_ID; // Start with default Manager ID as fallback
        
        // First check if we already have a stored ID
        if (currentJob.dbJobTitleId) {
          const storedId = typeof currentJob.dbJobTitleId === 'string' 
            ? parseInt(currentJob.dbJobTitleId) 
            : currentJob.dbJobTitleId;
            
          if (!isNaN(storedId) && storedId > 0) {
            jobTitleIdToUse = storedId;
            console.log(`Using stored job title ID: ${jobTitleIdToUse}`);
          }
        } 
        // Then try to find from search results
        else if (titlesData.data && titlesData.data.length > 0) {
          // Try to find an exact match first
          const exactMatch = titlesData.data.find((item: any) => 
            item.title.toLowerCase() === searchQuery.toLowerCase()
          );
          
          if (exactMatch) {
            jobTitleIdToUse = exactMatch.id;
            console.log(`Found exact matching job title ID: ${jobTitleIdToUse}`);
            
            // Store this ID for future use
            const updatedWorkExperience = [...(resumeData.workExperience || [])];
            if (updatedWorkExperience.length > 0) {
              updatedWorkExperience[0] = {
                ...updatedWorkExperience[0],
                dbJobTitleId: jobTitleIdToUse
              };
              updateResumeData({ workExperience: updatedWorkExperience });
            }
          } else {
            // Otherwise use the first result
            jobTitleIdToUse = titlesData.data[0].id;
            console.log(`Using closest matching job title ID: ${jobTitleIdToUse}`);
          }
        }
        
        // Step 3: Fetch descriptions using the determined job title ID
        console.log(`Fetching descriptions for job title ID: ${jobTitleIdToUse}`);
        
        // Use fetch directly with cache control headers
        const descResponse = await fetch(`/api/jobs/descriptions?jobTitleId=${jobTitleIdToUse}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        // Parse the response
        const descriptionText = await descResponse.text();
        console.log("Raw response text:", descriptionText);
        
        let descriptionsData = [];
        try {
          descriptionsData = JSON.parse(descriptionText);
          console.log(`Successfully parsed ${descriptionsData.length} descriptions`);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          descriptionsData = [];
        }
        
        // Apply search term filtering
        if (searchTerm && descriptionsData.length > 0) {
          const filteredData = descriptionsData.filter((desc: any) => 
            desc.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
          console.log(`Filtered descriptions by "${searchTerm}": ${filteredData.length} results`);
          
          // Only use filtered results if we found something
          if (filteredData.length > 0) {
            descriptionsData = filteredData;
          }
        }
        
        // If we still have no descriptions, try the Manager fallback
        if (!Array.isArray(descriptionsData) || descriptionsData.length === 0) {
          console.log("No descriptions found, trying Manager ID as fallback");
          
          const fallbackResponse = await fetch(`/api/jobs/descriptions?jobTitleId=${MANAGER_ID}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          try {
            const fallbackText = await fallbackResponse.text();
            descriptionsData = JSON.parse(fallbackText);
            console.log(`Retrieved ${descriptionsData.length} fallback descriptions`);
          } catch (fallbackError) {
            console.error("Error with fallback descriptions:", fallbackError);
            descriptionsData = [];
          }
        }
        
        // Only update state if we have valid data
        if (Array.isArray(descriptionsData)) {
          // Force array to simple objects to avoid any potential reference issues
          const cleanData = descriptionsData.map(desc => ({
            id: desc.id,
            jobTitleId: desc.jobTitleId,
            content: desc.content,
            isRecommended: desc.isRecommended === true
          }));
          
          console.log("Setting descriptions state with:", cleanData.length, "items");
          setDescriptions(cleanData);
          setShowingResults(`${cleanData.length}`);
        } else {
          console.error("Invalid descriptions data format:", descriptionsData);
          setDescriptions([]);
          setShowingResults("0");
        }
      } catch (error) {
        console.error('Error fetching job descriptions:', error);
        setDescriptions([]);
        setShowingResults("0");
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

  // Set initial value for showing results text
  useEffect(() => {
    if (!showingResults) {
      setShowingResults(searchTerm ? 'Filtered' : 'Showing');
    }
  }, [searchTerm, showingResults]);

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
                                      // Ensure ID is stored as a number for API consistency
                                      dbJobTitleId: typeof jobTitle.id === 'string' ? parseInt(jobTitle.id) : jobTitle.id
                                    };
                                    updateResumeData({ workExperience: updatedWorkExperience });
                                    console.log(`Updated current job title to: ${jobTitle.title} (DB ID: ${jobTitle.id})`);
                                    
                                    // Immediately fetch the job descriptions for this title ID
                                    setIsLoadingDescriptions(true);
                                    try {
                                      // Ensure consistent numeric ID type for API calls
                                      const jobTitleIdForApi = typeof jobTitle.id === 'string' ? parseInt(jobTitle.id) : jobTitle.id;
                                      const descriptionsUrl = `/api/jobs/descriptions?jobTitleId=${jobTitleIdForApi}`;
                                      console.log(`Directly fetching descriptions from: ${descriptionsUrl}`, "ID type:", typeof jobTitleIdForApi);
                                      
                                      const response = await apiRequest('GET', descriptionsUrl);
                                      const descriptionsData = await response.json();
                                      
                                      console.log(`Retrieved ${descriptionsData.length} descriptions directly for job title ID: ${jobTitle.id}`);
                                      
                                      if (descriptionsData.length > 0) {
                                        setDescriptions(descriptionsData);
                                      } else {
                                        // Fallback to general descriptions if none found
                                        // Pass the job title ID for prioritization, ensuring consistent numeric ID for API
                                        const allResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${jobTitleIdForApi}`);
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
                              // Ensure consistent numeric ID for API calls
                              const jobTitleIdForApi = typeof dbJobTitleId === 'string' ? parseInt(dbJobTitleId) : dbJobTitleId;
                              const descriptionsUrl = `/api/jobs/descriptions?jobTitleId=${jobTitleIdForApi}`;
                              console.log(`Directly fetching descriptions from: ${descriptionsUrl}`, "ID type:", typeof jobTitleIdForApi);
                              
                              const response = await apiRequest('GET', descriptionsUrl);
                              const descriptionsData = await response.json();
                              
                              console.log(`Retrieved ${descriptionsData.length} descriptions directly for job title ID: ${dbJobTitleId}`);
                              
                              if (descriptionsData.length > 0) {
                                setDescriptions(descriptionsData);
                              } else {
                                // Fallback to general descriptions, but still prioritize this job title's descriptions
                                // Continue to use the jobTitleIdForApi to ensure consistent numeric ID for API
                                const allResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${jobTitleIdForApi}`);
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
                ) : Array.isArray(descriptions) && descriptions.length > 0 ? (
                  descriptions.map((description: any) => {
                    console.log("Rendering description:", description);
                    
                    // Safety check to ensure we have valid description object
                    if (!description || typeof description !== 'object') {
                      console.error("Invalid description object:", description);
                      return null;
                    }
                    
                    // Get ID or use a fallback
                    const descId = description.id || Math.random().toString(36).substring(2, 9);
                    
                    // Ensure content is a string
                    const content = description.content && typeof description.content === 'string' 
                      ? description.content 
                      : "No description content available";
                    
                    // Use boolean for isRecommended
                    const isRecommended = Boolean(description.isRecommended);
                    
                    return (
                      <div key={descId} className="p-3 hover:bg-gray-50">
                        <button 
                          onClick={() => handleDescriptionClick(content)}
                          className="flex items-start w-full text-left group"
                        >
                          <div className="mt-1 mr-2">
                            <Plus className="h-4 w-4 text-purple-600 opacity-0 group-hover:opacity-100" />
                          </div>
                          <div>
                            {isRecommended && (
                              <div className="flex items-center text-xs text-purple-600 mb-1">
                                <span className="text-purple-600 mr-1">★</span>
                                Expert Recommended
                              </div>
                            )}
                            <p className="text-sm">{content}</p>
                          </div>
                        </button>
                      </div>
                    );
                  }).filter(Boolean) // Remove any null items from invalid descriptions
                ) : (
                  <div className="p-4 text-center">
                    <div className="mb-3">
                      <p className="text-gray-500 mb-2">No specific descriptions found for "{currentJob.jobTitle}"</p>
                      <p className="text-gray-500 text-sm">
                        This could be due to a connection issue or because this job title doesn't have descriptions yet.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button 
                        onClick={async () => {
                          setIsLoadingDescriptions(true);
                          try {
                            // First try to fetch with current job title ID again
                            if (currentJob.dbJobTitleId) {
                              const jobTitleIdForApi = typeof currentJob.dbJobTitleId === 'string' 
                                ? parseInt(currentJob.dbJobTitleId) 
                                : currentJob.dbJobTitleId;
                              
                              console.log(`Re-attempting to fetch descriptions for job title ID: ${jobTitleIdForApi}`);
                              const response = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${jobTitleIdForApi}`);
                              const data = await response.json();
                              
                              if (data && data.length > 0) {
                                console.log(`Successfully retrieved ${data.length} descriptions on retry`);
                                setDescriptions(data);
                                setIsLoadingDescriptions(false);
                                return;
                              }
                            }
                            
                            // If that fails or no ID, get general descriptions
                            console.log('Fetching generic job descriptions as fallback');
                            const allResponse = await apiRequest('GET', '/api/jobs/descriptions?limit=200');
                            const allDescriptionsData = await allResponse.json();
                            setDescriptions(allDescriptionsData);
                            setShowingResults(`${allDescriptionsData.length} generic`);
                          } catch (error) {
                            console.error('Error fetching fallback job descriptions:', error);
                          } finally {
                            setIsLoadingDescriptions(false);
                          }
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Get Generic Suggestions
                      </button>
                      
                      <button 
                        onClick={async () => {
                          setIsLoadingDescriptions(true);
                          try {
                            // Try to find a similar job title that might have descriptions
                            const response = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(currentJob.jobTitle.split(' ')[0])}&limit=5`);
                            const relatedTitles = await response.json();
                            
                            if (relatedTitles?.data?.length > 0) {
                              // Find the first related title that isn't exactly the same
                              const similarTitle = relatedTitles.data.find((t: any) => 
                                t.title.toLowerCase() !== currentJob.jobTitle.toLowerCase()
                              );
                              
                              if (similarTitle) {
                                console.log(`Trying similar job title: ${similarTitle.title} (ID: ${similarTitle.id})`);
                                const descResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${similarTitle.id}`);
                                const descData = await descResponse.json();
                                
                                if (descData && descData.length > 0) {
                                  setDescriptions(descData);
                                  setShowingResults(`${descData.length} from similar title "${similarTitle.title}"`);
                                } else {
                                  // If still no descriptions, fall back to generic ones
                                  const allResponse = await apiRequest('GET', '/api/jobs/descriptions?limit=100');
                                  const allData = await allResponse.json();
                                  setDescriptions(allData);
                                  setShowingResults(`${allData.length} generic`);
                                }
                              }
                            }
                          } catch (error) {
                            console.error('Error fetching similar job titles:', error);
                          } finally {
                            setIsLoadingDescriptions(false);
                          }
                        }}
                        className="px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                      >
                        Try Similar Jobs
                      </button>
                    </div>
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