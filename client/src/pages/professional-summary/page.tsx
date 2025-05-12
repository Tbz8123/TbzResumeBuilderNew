import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Search, Plus, ArrowRight, RotateCw, Undo2, X, Filter, Redo } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { JobTitle, getJobTitleSuggestions, findJobTitleById } from '@/utils/jobTitlesData';
import { apiRequest } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';

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

const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const ProfessionalSummaryPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<JobTitle[]>([]);
  const [showJobTitleSuggestions, setShowJobTitleSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Get the current job title from resume data
  const currentJobTitle = resumeData.workExperience && resumeData.workExperience.length > 0 
    ? resumeData.workExperience[0].jobTitle 
    : 'Professional';
  
  // Initialize professional summary from resumeData if available
  const [professionalSummary, setProfessionalSummary] = useState(resumeData.professionalSummary || '');
  
  // State for summary descriptions
  const [summaryDescriptions, setSummaryDescriptions] = useState<any[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [showingResults, setShowingResults] = useState<string>('');
  
  // Fetch professional summaries from API
  useEffect(() => {
    const fetchProfessionalSummaries = async () => {
      setIsLoadingSummaries(true);
      try {
        console.log("Searching for professional summaries for:", currentJobTitle);
        
        if (!currentJobTitle) {
          console.log("No job title found, using default: Professional");
        }
        
        // Default Professional title ID fallback
        const DEFAULT_TITLE_ID = 1;
        
        // Step 1: Find the professional summary title in the database first
        const searchQuery = currentJobTitle || "Professional";
        const titlesResponse = await fetch(`/api/professional-summary/titles?search=${encodeURIComponent(searchQuery)}`, {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const titlesData = await titlesResponse.json();
        
        console.log("Professional summary titles search results:", titlesData);
        
        // Step 2: Determine the title ID to use
        let titleIdToUse = DEFAULT_TITLE_ID; // Start with default ID as fallback
        
        // First check if we have stored ID
        if (resumeData.professionalSummaryTitleId) {
          const storedId = typeof resumeData.professionalSummaryTitleId === 'string' 
            ? parseInt(resumeData.professionalSummaryTitleId) 
            : resumeData.professionalSummaryTitleId;
            
          if (!isNaN(storedId) && storedId > 0) {
            titleIdToUse = storedId;
            console.log(`Using stored professional summary title ID: ${titleIdToUse}`);
          }
        } 
        // Then try to find from search results
        else if (titlesData.data && titlesData.data.length > 0) {
          // Try to find an exact match first
          const exactMatch = titlesData.data.find((item: any) => 
            item.title.toLowerCase() === searchQuery.toLowerCase()
          );
          
          if (exactMatch) {
            titleIdToUse = exactMatch.id;
            console.log(`Found exact matching professional summary title ID: ${titleIdToUse}`);
            
            // Store this ID for future use
            updateResumeData({ professionalSummaryTitleId: titleIdToUse });
          } else {
            // Otherwise use the first result
            titleIdToUse = titlesData.data[0].id;
            console.log(`Using closest matching professional summary title ID: ${titleIdToUse}`);
          }
        }
        
        // Step 3: Fetch descriptions using the determined title ID
        console.log(`Fetching descriptions for professional summary title ID: ${titleIdToUse}`);
        
        // Use fetch with cache control headers
        const descResponse = await fetch(`/api/professional-summary/descriptions/by-title/${titleIdToUse}`, {
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
          console.log(`Successfully parsed ${descriptionsData.length} professional summary descriptions`);
        } catch (parseError) {
          console.error("Error parsing JSON:", parseError);
          descriptionsData = [];
        }
        
        // Apply search term filtering
        if (searchTerm && descriptionsData.length > 0) {
          const filteredData = descriptionsData.filter((desc: any) => 
            desc.content.toLowerCase().includes(searchTerm.toLowerCase())
          );
          console.log(`Filtered professional summaries by "${searchTerm}": ${filteredData.length} results`);
          
          // Only use filtered results if we found something
          if (filteredData.length > 0) {
            descriptionsData = filteredData;
          }
        }
        
        // If we still have no descriptions, try the default fallback
        if (!Array.isArray(descriptionsData) || descriptionsData.length === 0) {
          console.log("No descriptions found, trying default ID as fallback");
          
          const fallbackResponse = await fetch(`/api/professional-summary/descriptions/by-title/${DEFAULT_TITLE_ID}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          try {
            const fallbackText = await fallbackResponse.text();
            descriptionsData = JSON.parse(fallbackText);
            console.log(`Retrieved ${descriptionsData.length} fallback professional summary descriptions`);
          } catch (fallbackError) {
            console.error("Error with fallback descriptions:", fallbackError);
            descriptionsData = [];
          }
        }
        
        // Only update state if we have valid data
        if (Array.isArray(descriptionsData)) {
          // Force array to simple objects to avoid reference issues
          const cleanData = descriptionsData.map(desc => ({
            id: desc.id,
            professionalSummaryTitleId: desc.professionalSummaryTitleId,
            content: desc.content,
            isRecommended: desc.isRecommended === true
          }));
          
          console.log("Setting professional summary descriptions state with:", cleanData.length, "items");
          setSummaryDescriptions(cleanData);
          setShowingResults(`${cleanData.length}`);
        } else {
          console.error("Invalid professional summary descriptions data format:", descriptionsData);
          setSummaryDescriptions([]);
          setShowingResults("0");
        }
      } catch (error) {
        console.error('Error fetching professional summary descriptions:', error);
        setSummaryDescriptions([]);
        setShowingResults("0");
      } finally {
        setIsLoadingSummaries(false);
      }
    };
    
    fetchProfessionalSummaries();
  }, [currentJobTitle, resumeData.professionalSummaryTitleId, searchTerm]);
  
  // Effect to update job title suggestions when search term changes
  useEffect(() => {
    const fetchJobTitleSuggestions = async () => {
      if (searchTerm.trim()) {
        try {
          // First try to get suggestions from the API
          const apiResponse = await apiRequest('GET', `/api/professional-summary/titles?search=${encodeURIComponent(searchTerm)}`);
          const apiData = await apiResponse.json();
          
          console.log("Professional summary title suggestions from API:", apiData);
          
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
          console.error("Error fetching professional summary title suggestions:", error);
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
    setLocation('/skills-summary');
  };

  const handlePreview = () => {
    // Save before previewing
    saveProfessionalSummary();
    setLocation('/preview');
  };

  const handleNext = () => {
    // Save and navigate to the next page (summary page)
    saveProfessionalSummary();
    setLocation('/summary');
  };

  const saveProfessionalSummary = () => {
    if (professionalSummary.trim()) {
      updateResumeData({ professionalSummary: professionalSummary.trim() });
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Only show suggestions if there's input text
    if (value.trim()) {
      setShowJobTitleSuggestions(true);
    } else {
      setShowJobTitleSuggestions(false);
    }
  };

  const handleSummaryClick = (content: string) => {
    // Set the selected summary as the professional summary
    setProfessionalSummary(content);
  };

  // Set initial value for showing results text
  useEffect(() => {
    if (!showingResults) {
      setShowingResults(searchTerm ? 'Filtered' : 'Showing');
    }
  }, [searchTerm, showingResults]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50"
        variants={pageTransition}
        initial="hidden"
        animate="visible"
        exit="exit"
        key="professional-summary-page"
      >
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
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-purple-600 mb-2">
                    Briefly tell us about your background
                  </h1>
                  <p className="text-sm text-gray-600">
                    Choose from our pre-written examples below or write your own.
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-purple-500 hover:text-purple-600 transition-colors bg-purple-50 p-2 rounded-full">
                        <HelpCircle className="h-5 w-5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Tips</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Search and Examples */}
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
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500">
                            <Search className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  
                    {showJobTitleSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-20 mt-1 w-[calc(100%-1px)] bg-white shadow-lg rounded-md border border-gray-200 py-1 max-h-60 overflow-y-auto left-0"
                        style={{ width: searchInputRef.current ? searchInputRef.current.offsetWidth : 'auto' }}
                      >
                        {jobTitleSuggestions.map((title) => (
                          <button
                            key={title.id}
                            className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm"
                            onClick={() => {
                              setSearchTerm(title.title);
                              setShowJobTitleSuggestions(false);
                            }}
                          >
                            {title.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                  
                  {/* Related Job Titles */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-sm font-medium text-gray-700">Related Job Titles</h3>
                      <button className="text-purple-600 text-sm font-medium flex items-center hover:text-purple-800 transition-colors">
                        More <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="text-sm bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-full hover:shadow-sm transition-all">
                        Assistant Manager
                      </button>
                      <button className="text-sm bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-full hover:shadow-sm transition-all">
                        Project Manager
                      </button>
                      <button className="text-sm bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-full hover:shadow-sm transition-all">
                        Operations Manager
                      </button>
                      <button className="text-sm bg-white border border-gray-200 text-gray-800 px-4 py-2 rounded-full hover:shadow-sm transition-all">
                        General Manager
                      </button>
                    </div>
                  </div>
                  
                  {/* Examples */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center">
                        {isLoadingSummaries ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <RotateCw className="h-3 w-3 animate-spin" />
                            <span>Loading examples...</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">
                            Showing results for
                            <span className="font-medium ml-1 text-purple-600">
                              {searchTerm || "Warehouse Worker"}
                            </span>
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs border-purple-200 text-purple-600 hover:bg-purple-50">
                        <Filter className="h-3 w-3" />
                        Filter by Keyword
                      </Button>
                    </div>
                    
                    {/* List of examples */}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {summaryDescriptions.length > 0 ? (
                        summaryDescriptions.map((item) => (
                          <motion.div 
                            key={item.id}
                            variants={itemVariants}
                            className={`p-3 ${item.isRecommended ? 'bg-pink-50' : 'bg-white'} rounded-lg cursor-pointer transition-all duration-300 hover:shadow-sm`}
                            onClick={() => handleSummaryClick(item.content)}
                          >
                            <div className="flex mb-1">
                              {item.isRecommended && (
                                <span className="text-xs text-purple-600 font-medium px-2 py-0.5 mr-1">
                                  Expert Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-gray-800 text-sm">
                              {item.content}
                            </p>
                          </motion.div>
                        ))
                      ) : !isLoadingSummaries ? (
                        // Create example placeholder data that mirrors the screenshot
                        [1, 2, 3].map((id) => (
                          <motion.div 
                            key={id}
                            variants={itemVariants}
                            className={`p-3 ${id <= 2 ? 'bg-pink-50' : 'bg-white'} rounded-lg cursor-pointer transition-all duration-300 hover:shadow-sm`}
                            onClick={() => handleSummaryClick(id === 1 ? 
                              "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                              id === 2 ? 
                              "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                              "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                            )}
                          >
                            <div className="flex mb-1">
                              {id <= 2 && (
                                <span className="text-xs text-purple-600 font-medium px-2 py-0.5 mr-1">
                                  Expert Recommended
                                </span>
                              )}
                            </div>
                            <p className="text-gray-800 text-sm">
                              {id === 1 ? 
                                "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                                id === 2 ? 
                                "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                                "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                              }
                            </p>
                          </motion.div>
                        ))
                      ) : null}
                    </motion.div>
                  </div>
                </div>
                
                {/* Right Column - Text Editor */}
                <div>
                  <h3 className="text-gray-700 mb-2">Professional summary:</h3>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-400 rounded-lg opacity-70 group-hover:opacity-90 blur-md group-hover:blur-lg transition duration-300"></div>
                    <div className="relative bg-white rounded-lg">
                      <textarea 
                        className="w-full min-h-[300px] p-4 text-gray-800 border-0 rounded-lg shadow-inner focus:outline-none resize-none"
                        placeholder="Click on any example from the left to add it to your professional summary, or write your own."
                        value={professionalSummary}
                        onChange={(e) => setProfessionalSummary(e.target.value)}
                      ></textarea>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 mb-4">
                    <div className="text-sm text-gray-500">
                      {professionalSummary.length} characters
                    </div>
                    <div className="text-sm text-purple-600">
                      Use • to create bullet points
                    </div>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      className="h-10 px-8 rounded-full border border-purple-500 bg-white text-purple-500 font-medium hover:bg-purple-50 focus:outline-none transition-colors"
                      onClick={handlePreview}
                    >
                      Preview
                    </button>
                    
                    <button
                      className="h-10 px-8 rounded-full border-0 bg-yellow-500 hover:bg-yellow-600 text-white font-medium focus:outline-none transition-colors"
                      onClick={handleNext}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </main>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProfessionalSummaryPage;