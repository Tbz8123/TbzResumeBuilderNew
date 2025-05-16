import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Search, Plus, ArrowRight, RotateCw, Undo2, X, Eye } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
// Resume preview functionality removed
import { useTemplates } from '@/hooks/use-templates';
import { Input } from '@/components/ui/input';
import { JobTitle, getJobTitleSuggestions, findJobTitleById } from '@/utils/jobTitlesData';
import { JobDescription } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { WorkExperience } from '@/types/resume';
import { motion } from 'framer-motion';

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
  
  // Get related job titles
  const relatedJobTitles = getRelatedJobTitles(currentJob.jobTitle);
  
  // Get job descriptions based on job title
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [isLoadingDescriptions, setIsLoadingDescriptions] = useState(false);
  const [showingResults, setShowingResults] = useState<string>('');
  // Preview functionality removed
  const { data: templates } = useTemplates();
  
  // Animation variants for framer-motion
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };
  
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
  }, [currentJob.jobTitle, currentJob.dbJobTitleId, searchTerm]);
  
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

  // Preview functionality removed

  const handleNext = () => {
    // Save and navigate to the work history summary page
    saveJobDescription();
    setLocation('/work-history-summary');
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
      setJobResponsibilities((prev: string) => prev + '\n• ' + description);
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow py-6 md:py-10 overflow-x-hidden">
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
          {/* Back Button */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-8"
          >
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-all hover:-translate-x-1 duration-300 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Go Back</span>
            </button>
          </motion.div>
          
          {/* Main Content */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                What did you do as a {currentJob.jobTitle}?
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-full transition-all duration-300">
                      <HelpCircle className="h-5 w-5" />
                      <span className="hidden sm:inline font-medium">Tips</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4 bg-white border border-purple-100 shadow-lg text-gray-700">
                    <p className="font-medium text-gray-900 mb-2">💡 Writing Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Be specific about your achievements</li>
                      <li>Use action verbs to start each bullet point</li>
                      <li>Quantify results when possible (e.g., "increased sales by 20%")</li>
                      <li>Highlight leadership and teamwork skills</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600 text-lg">To get started, you can choose from our expert recommended examples below.</p>
          </motion.div>
          
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column - Examples */}
            <div>
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-6 transform transition-all hover:scale-[1.01] duration-300"
              >
                <h2 className="text-xs uppercase font-bold text-gray-600 mb-2">SEARCH BY JOB TITLE FOR PRE-WRITTEN EXAMPLES</h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-50 group-hover:opacity-70 blur group-hover:blur-md transition duration-300"></div>
                  <div className="relative bg-white rounded-lg">
                    <Input 
                      type="text"
                      ref={searchInputRef}
                      placeholder="Search by job title"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="rounded-lg border-gray-300 pr-10 py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
                      onFocus={() => {
                        if (jobTitleSuggestions.length > 0) {
                          setShowJobTitleSuggestions(true);
                        }
                      }}
                    />
                    {searchTerm ? (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-300"
                        onClick={() => setSearchTerm('')}
                      >
                        <X className="h-5 w-5" />
                      </button>
                    ) : (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-600 animate-pulse">
                        <Search className="h-5 w-5" />
                      </div>
                    )}

                    {/* Job title suggestions dropdown */}
                    {showJobTitleSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-50 mt-1 w-full"
                        style={{ top: '100%', left: 0 }}
                      >
                        <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto backdrop-blur-sm bg-white/80">
                          <div className="py-1">
                            {jobTitleSuggestions.length > 0 ? (
                              jobTitleSuggestions.map((jobTitle: JobTitle, index) => (
                                <motion.div
                                  key={jobTitle.id}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setSearchTerm(jobTitle.title);
                                    setShowJobTitleSuggestions(false);
                                  }}
                                >
                                  <div className="font-medium text-gray-900">{jobTitle.title}</div>
                                  <div className="text-xs text-gray-500">{jobTitle.category}</div>
                                </motion.div>
                              ))
                            ) : (
                              <div className="px-4 py-3 text-sm text-gray-500">
                                No suggestions found
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
              
              {/* Related Job Titles */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-6"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-semibold text-gray-800">Related Job Titles</h2>
                  <button className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors duration-300 flex items-center gap-1 group">
                    More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {relatedJobTitles.map((job: JobTitle, index) => (
                    <motion.button
                      key={job.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                      className="flex items-center border border-gray-200 rounded-full px-3 py-2 text-sm bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-all duration-300"
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
                              ...(dbJobTitleId ? { dbJobTitleId } : {})
                            };
                            
                            updateResumeData({ workExperience: updatedWorkExperience });
                            
                          } catch (error) {
                            console.error("Error updating job title:", error);
                          } finally {
                            setIsLoadingDescriptions(false);
                          }
                        }
                      }}
                    >
                      <span>{job.title}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              
              {/* Job Descriptions List */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="mb-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">{showingResults} results for <span className="text-purple-600">{currentJob.jobTitle}</span></h2>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                      title="Clear search"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        // Refresh descriptions by forcing a fetch 
                        setSearchTerm(searchTerm);
                      }}
                      className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                      title="Refresh results"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {isLoadingDescriptions ? (
                  <div className="p-6 flex justify-center items-center">
                    <div className="relative w-12 h-12">
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-purple-200 rounded-full"></div>
                      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-purple-500 animate-spin rounded-full"></div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 py-2 bg-transparent">
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {descriptions.map((description: any, index) => (
                        <motion.div
                          key={description.id || index}
                          variants={itemVariants}
                          className={`p-3 border ${description.isRecommended ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                          onClick={() => handleDescriptionClick(description.content)}
                        >
                          <div className="flex mb-1">
                            {description.isRecommended && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mr-1">
                                Expert Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 text-sm">
                            {description.content}
                          </p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </div>
                )}
                
                {!isLoadingDescriptions && descriptions.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No descriptions found. Try a different search term.</p>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Right column - Job Description Textarea */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="p-6"
            >
              <div className="mb-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {currentJob.employer} | {currentJob.jobTitle}
                  </h2>
                </div>
                <p className="text-gray-500 text-sm">
                  {currentJob.startMonth} {currentJob.startYear} - {currentJob.isCurrentJob ? 'Present' : `${currentJob.endMonth} ${currentJob.endYear}`}
                </p>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">Job description:</p>
              
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg opacity-30 blur"></div>
                <div className="relative">
                  <textarea
                    className="w-full h-[300px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    placeholder="Click on any example from the left to add it to your job description, or write your own."
                    value={jobResponsibilities}
                    onChange={(e) => setJobResponsibilities(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Character count and tips */}
              <div className="flex justify-between items-center mt-3 text-sm">
                <span className="text-gray-500">
                  {jobResponsibilities.length} characters
                </span>
                <span className="text-purple-600">
                  Use • to create bullet points
                </span>
              </div>
              
              {/* Navigation buttons */}
              <div className="flex justify-end items-center mt-8">
                <button 
                  onClick={handleNext}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full px-10 py-2.5 text-base transition-colors duration-300 shadow-sm hover:shadow"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 TbzResumeBuilder. All rights reserved.
        </div>
      </footer>

      {/* Resume preview functionality has been removed */}
    </div>
  );
};

export default JobDescriptionPage;