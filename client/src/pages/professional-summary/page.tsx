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
        className="flex flex-col min-h-screen bg-white"
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
          <div className="container mx-auto px-4">
            {/* Back Button */}
            <motion.div 
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <button 
                onClick={handleBack}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-all hover:-translate-x-1 duration-300 text-sm font-medium"
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
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-1">
                    Briefly tell us about your background
                  </h1>
                  <p className="text-sm text-gray-600">
                    Choose from our pre-written examples below or write your own.
                  </p>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-blue-500 hover:text-blue-600 transition-colors">
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
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <h2 className="text-sm font-semibold text-gray-700 mb-3">
                      SEARCH BY JOB TITLE FOR PRE-WRITTEN EXAMPLES
                    </h2>
                    
                    <div className="relative mb-3">
                      <Input 
                        type="text" 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        ref={searchInputRef}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <button className="text-purple-600 hover:text-purple-800">
                          <Search className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {showJobTitleSuggestions && (
                        <div 
                          ref={suggestionsRef}
                          className="absolute z-20 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-200 py-1"
                        >
                          {jobTitleSuggestions.map((title) => (
                            <button
                              key={title.id}
                              className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
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
                    </div>
                  </div>
                  
                  {/* Related Job Titles */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-sm font-medium text-gray-700">Related Job Titles</h3>
                      <Button variant="link" size="sm" className="h-auto p-0 text-purple-600">
                        <span className="text-sm">More</span> <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md transition-colors">
                        <Search className="h-3 w-3 mr-1 text-gray-500" /> General Warehouse Worker
                      </button>
                      <button className="inline-flex items-center text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1 rounded-md transition-colors">
                        <Search className="h-3 w-3 mr-1 text-gray-500" /> Warehouse Production Worker
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
                            <span className="font-medium ml-1">
                              {searchTerm || currentJobTitle}
                            </span>
                          </span>
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
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
                            className="relative border rounded-lg p-3 cursor-pointer transition-all hover:border-purple-300 hover:shadow-sm group bg-white"
                            onClick={() => handleSummaryClick(item.content)}
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3">
                              <button 
                                className="flex items-center justify-center w-6 h-6 bg-purple-600 rounded-full text-white shadow-sm hover:bg-purple-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSummaryClick(item.content);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="pl-2">
                              {item.isRecommended && (
                                <div className="flex items-center mb-1">
                                  <span className="text-xs font-semibold text-purple-600 px-2 py-0.5 rounded border border-purple-200 bg-purple-50">
                                    Expert Recommended
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-gray-700">{item.content}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : !isLoadingSummaries ? (
                        // Create example placeholder data that mirrors the screenshot
                        [1, 2, 3].map((id) => (
                          <motion.div 
                            key={id}
                            variants={itemVariants}
                            className="relative border rounded-lg p-3 cursor-pointer transition-all hover:border-purple-300 hover:shadow-sm group bg-white"
                            onClick={() => handleSummaryClick(id === 1 ? 
                              "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                              id === 2 ? 
                              "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                              "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                            )}
                          >
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-3">
                              <button 
                                className="flex items-center justify-center w-6 h-6 bg-purple-600 rounded-full text-white shadow-sm hover:bg-purple-700 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSummaryClick(id === 1 ? 
                                    "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                                    id === 2 ? 
                                    "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                                    "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                                  );
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="pl-2">
                              {id <= 2 && (
                                <div className="flex items-center mb-1">
                                  <span className="text-xs font-semibold text-purple-600 px-2 py-0.5 rounded border border-purple-200 bg-purple-50">
                                    Expert Recommended
                                  </span>
                                </div>
                              )}
                              <p className="text-sm text-gray-700">
                                {id === 1 ? 
                                  "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                                  id === 2 ? 
                                  "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                                  "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                                }
                              </p>
                            </div>
                          </motion.div>
                        ))
                      ) : null}
                    </motion.div>
                  </div>
                </div>
                
                {/* Right Column - Text Editor */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <textarea 
                    className="w-full min-h-[300px] p-3 text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none mb-4"
                    placeholder="Write your summary here."
                    value={professionalSummary}
                    onChange={(e) => setProfessionalSummary(e.target.value)}
                  ></textarea>
                  
                  <div className="flex items-center mb-4">
                    <div className="flex space-x-2 border-r border-gray-300 pr-4 mr-4">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <span className="font-bold">B</span>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <span className="italic">I</span>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <span className="underline">U</span>
                      </button>
                    </div>
                    <div className="flex space-x-2 border-r border-gray-300 pr-4 mr-4">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <span className="flex items-center">•</span>
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <span className="flex items-center">1.</span>
                      </button>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button className="p-2 hover:bg-gray-100 rounded">
                        <Redo className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                      onClick={handlePreview}
                    >
                      Preview
                    </Button>
                    
                    <Button
                      className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white"
                      onClick={handleNext}
                    >
                      Next: Extra sections
                    </Button>
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