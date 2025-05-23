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
  
  // State for managing the selected job title
  const [currentJobTitle, setCurrentJobTitle] = useState<JobTitle | null>(null);
  
  // Initialize job title from resume data if available
  useEffect(() => {
    // Only set initial job title if not already set
    if (!currentJobTitle && resumeData.workExperience && resumeData.workExperience.length > 0) {
      // Try to create a JobTitle object from the saved data
      const initialJobTitle = {
        id: 0, // We'll use a default ID
        title: resumeData.workExperience[0].jobTitle || 'Professional',
        category: 'General'
      };
      
      // Set the job title in state 
      setCurrentJobTitle(initialJobTitle as JobTitle);
      
      // Also update the search term state
      setSearchTerm(initialJobTitle.title);
      
      // Update the input field value directly (for uncontrolled input)
      if (searchInputRef.current) {
        searchInputRef.current.value = initialJobTitle.title;
        console.log("Set initial job title in input field:", initialJobTitle.title);
      }
    }
  }, [resumeData, currentJobTitle]);
  
  // Initialize professional summary from resumeData if available
  const [professionalSummary, setProfessionalSummary] = useState(resumeData.professionalSummary || '');
  
  // State for summary descriptions
  const [summaryDescriptions, setSummaryDescriptions] = useState<any[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [showingResults, setShowingResults] = useState<string>('');
  
  // For debugging
  useEffect(() => {
    console.log("Current job title changed:", currentJobTitle);
  }, [currentJobTitle]);
  
  useEffect(() => {
    console.log("Summary descriptions updated:", summaryDescriptions.length, summaryDescriptions);
  }, [summaryDescriptions]);
  
  // Fetch professional summaries from API when currentJobTitle changes
  useEffect(() => {
    const fetchProfessionalSummaries = async () => {
      setIsLoadingSummaries(true);
      try {
        console.log("Searching for professional summaries for:", currentJobTitle ? currentJobTitle.title : "none");
        
        if (!currentJobTitle) {
          console.log("No job title found, using default: Professional");
        }
        
        // Set the search term in the UI when job title changes
        if (currentJobTitle?.title && searchTerm !== currentJobTitle.title) {
          setSearchTerm(currentJobTitle.title);
        }
        
        // Default Professional title ID fallback
        const DEFAULT_TITLE_ID = 1;
        
        // Step 1: Find the professional summary title in the database first
        const searchQuery = currentJobTitle ? currentJobTitle.title : "Professional";
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
        
        // First check if we have a current job title directly selected by the user
        if (currentJobTitle && currentJobTitle.id) {
          titleIdToUse = currentJobTitle.id;
          console.log(`Using selected job title ID: ${titleIdToUse} (${currentJobTitle.title})`);
          
          // Store this ID for future use
          updateResumeData({ professionalSummaryTitleId: titleIdToUse });
        }
        // Then check if we have stored ID
        else if (resumeData.professionalSummaryTitleId) {
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
  
  // State for professional summary titles from database
  const [professionalSummaryTitles, setProfessionalSummaryTitles] = useState<Array<{id: number, title: string, category: string}>>([]);
  
  // Fetch professional summary titles from database
  useEffect(() => {
    const fetchProfessionalSummaryTitles = async () => {
      try {
        const response = await fetch('/api/professional-summary/titles?limit=100');
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // Transform to expected format (id, title, category)
          const titles = data.data.map((title: any) => ({
            id: title.id,
            title: title.title,
            category: title.category || 'Other'
          }));
          setProfessionalSummaryTitles(titles);
          console.log("Fetched professional summary titles:", titles);
        }
      } catch (error) {
        console.error("Error fetching professional summary titles:", error);
      }
    };
    
    fetchProfessionalSummaryTitles();
  }, []);
  
  // Hardcoded suggestions for backwards compatibility and to ensure we always have data
  const hardcodedSuggestions = [
    { id: 28, title: 'Manager', category: 'Management', createdAt: new Date(), updatedAt: new Date() },
    { id: 29, title: 'Marketing Manager', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
    { id: 30, title: 'Marketing Coordinator', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
    { id: 31, title: 'Marketing Specialist', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() },
    { id: 32, title: 'Machine Learning Engineer', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
    { id: 33, title: 'Software Engineer', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
    { id: 34, title: 'Product Manager', category: 'Product', createdAt: new Date(), updatedAt: new Date() },
    { id: 35, title: 'Data Scientist', category: 'Data', createdAt: new Date(), updatedAt: new Date() },
    { id: 36, title: 'UI/UX Designer', category: 'Design', createdAt: new Date(), updatedAt: new Date() },
    { id: 37, title: 'Project Manager', category: 'Management', createdAt: new Date(), updatedAt: new Date() },
    { id: 38, title: 'Business Analyst', category: 'Business', createdAt: new Date(), updatedAt: new Date() },
    { id: 39, title: 'DevOps Engineer', category: 'Technology', createdAt: new Date(), updatedAt: new Date() },
    { id: 40, title: 'Content Writer', category: 'Marketing', createdAt: new Date(), updatedAt: new Date() }
  ];

  // Combined suggestions from hardcoded and database
  const allSuggestions = [...professionalSummaryTitles, ...hardcodedSuggestions];
  
  // Log the combined suggestions to help with debugging
  useEffect(() => {
    console.log("All job title suggestions available:", allSuggestions.length);
    console.log("Sample of suggestions:", allSuggestions.slice(0, 3));
  }, [allSuggestions]);

  // Debug effect to monitor dropdown visibility state
  useEffect(() => {
    if (showJobTitleSuggestions) {
      console.log("DROPDOWN IS VISIBLE with", jobTitleSuggestions.length, "suggestions");
    } else {
      console.log("DROPDOWN IS HIDDEN");
    }
  }, [showJobTitleSuggestions, jobTitleSuggestions.length]);
  
  // No need for the complex job title suggestions effect anymore since we've reimplemented the complete input
  // The logic is now directly in the onChange, onClick and onFocus handlers
  
  // Effect to handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Simple check - if click is outside both the dropdown and input, close the dropdown
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        console.log("Outside click detected - closing dropdown");
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
    // Save and navigate to the next page (add-section page)
    saveProfessionalSummary();
    setLocation('/add-section');
  };

  const saveProfessionalSummary = () => {
    if (professionalSummary.trim()) {
      updateResumeData({ professionalSummary: professionalSummary.trim() });
    }
  };

  // Handle input changes for the search field
  const handleSearchChange = (newValue: string) => {
    console.log("Search term changed to:", newValue);
    setSearchTerm(newValue);
    
    // Clear the current job title if the search term is empty
    if (newValue === '') {
      setCurrentJobTitle(null);
      setSummaryDescriptions([]);
      setShowJobTitleSuggestions(false);
    } else {
      // Show/hide dropdown based on input
      const filtered = allSuggestions.filter(job => 
        job.title.toLowerCase().includes(newValue.toLowerCase())
      );
      
      if (filtered.length > 0) {
        console.log(`Found ${filtered.length} matching job title suggestions for "${newValue}"`);
        setJobTitleSuggestions(filtered);
        setShowJobTitleSuggestions(true);
      } else {
        setShowJobTitleSuggestions(false);
      }
    }
  };

  const handleSummaryClick = (content: string) => {
    // Add the selected summary to the text area (append with bullet points)
    if (professionalSummary) {
      setProfessionalSummary((prev: string) => prev + '\n• ' + content);
    } else {
      setProfessionalSummary('• ' + content);
    }
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
                    
                    {/* Completely redesigned search input and dropdown */}
                    <div className="search-component relative">
                      {/* Gradient border effect */}
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-50 group-hover:opacity-70 blur group-hover:blur-md transition duration-300"></div>
                      
                      {/* Input container */}
                      <div className="relative bg-white rounded-lg">
                        <input 
                          type="text"
                          ref={searchInputRef}
                          id="professional-summary-search"
                          placeholder="Search by job title for pre-written examples"
                          className="w-full rounded-lg border border-gray-300 px-3 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          // Switch to uncontrolled input to resolve backspace issues
                          defaultValue={searchTerm}
                          onInput={(e) => {
                            // Use the uncontrolled input's value directly
                            const target = e.target as HTMLInputElement;
                            const newValue = target.value;
                            console.log("Input event with value:", newValue);
                            
                            // Update state
                            setSearchTerm(newValue);
                            
                            // Show dropdown while typing
                            if (newValue === '') {
                              // Show default suggestions
                              setJobTitleSuggestions(allSuggestions.slice(0, 5));
                              setCurrentJobTitle(null);
                              setSummaryDescriptions([]);
                            } else {
                              // Filter suggestions
                              const filtered = allSuggestions.filter(job => 
                                job.title.toLowerCase().includes(newValue.toLowerCase())
                              );
                              setJobTitleSuggestions(filtered);
                            }
                            
                            // Always show dropdown while typing
                            setShowJobTitleSuggestions(true);
                          }}
                          onClick={() => {
                            // Show dropdown when input is clicked
                            const defaultSuggestions = allSuggestions.slice(0, 5);
                            setJobTitleSuggestions(defaultSuggestions);
                            setShowJobTitleSuggestions(true);
                          }}
                          onFocus={() => {
                            // Show dropdown on focus
                            const defaultSuggestions = allSuggestions.slice(0, 5);
                            setJobTitleSuggestions(defaultSuggestions);
                            setShowJobTitleSuggestions(true);
                          }}
                        />
                        
                        {/* Action buttons */}
                        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                          <button
                            type="button" 
                            className="p-1 text-xs bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-md mr-1"
                            onClick={() => {
                              // Force show dropdown
                              setJobTitleSuggestions(allSuggestions.slice(0, 5));
                              setShowJobTitleSuggestions(true);
                            }}
                          >
                            Show
                          </button>
                        
                          {searchTerm ? (
                            <button 
                              className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                              onClick={() => {
                                // Clear the search term state
                                setSearchTerm('');
                                
                                // Clear the input field value directly for uncontrolled input
                                if (searchInputRef.current) {
                                  searchInputRef.current.value = '';
                                }
                                
                                // Reset related states
                                setCurrentJobTitle(null);
                                setSummaryDescriptions([]);
                                setShowJobTitleSuggestions(false);
                                
                                // Focus back on the input
                                searchInputRef.current?.focus();
                              }}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : (
                            <Search className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {/* Dropdown */}
                      {showJobTitleSuggestions && (
                        <div 
                          ref={suggestionsRef}
                          className="dropdown-menu absolute left-0 right-0 top-[calc(100%+4px)] border border-gray-200 rounded-lg shadow-lg bg-white z-50 max-h-60 overflow-y-auto"
                        >
                          {jobTitleSuggestions.length > 0 ? (
                            jobTitleSuggestions.map((job, index) => (
                              <div
                                key={job.id}
                                className="px-4 py-2 cursor-pointer hover:bg-purple-50 border-b border-gray-100 last:border-0"
                                onClick={() => {
                                  console.log("Job title selected:", job.title);
                                  
                                  // Update the search term state
                                  setSearchTerm(job.title);
                                  
                                  // Also update the input field value directly for uncontrolled input
                                  if (searchInputRef.current) {
                                    searchInputRef.current.value = job.title;
                                  }
                                  
                                  // Update selected job title and hide dropdown
                                  setCurrentJobTitle(job);
                                  setShowJobTitleSuggestions(false);
                                }}
                              >
                                <div className="font-medium">{job.title}</div>
                                <div className="text-xs text-gray-500">{job.category}</div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-gray-500">
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                            className={`p-3 border ${item.isRecommended ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-gray-50'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                            onClick={() => handleSummaryClick(item.content)}
                          >
                            <div className="flex mb-1">
                              {item.isRecommended && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mr-1">
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
                            className={`p-3 ${id <= 2 ? 'bg-purple-50 border border-purple-200' : 'bg-white border border-gray-200'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                            onClick={() => handleSummaryClick(id === 1 ? 
                              "Motivated Warehouse Worker skilled at providing efficiency in shipping and receiving, inspection and storage operations. Handles diverse materials to achieve high-quality packaging standards and reduce risk. Brings related experience and dedication to meet production and quality goals." : 
                              id === 2 ? 
                              "Dedicated Warehouse team member skilled in operating equipment, prioritizing tasks, and carrying out fast-paced work to meet team goals. Strong understanding of OSHA standards and optimal safety guidelines. Hard worker consistently completes deadline-oriented tasks." :
                              "Team-oriented warehouse professional accustomed to streamlining shipping and receiving processes to increase overall efficiency. Industrious and dedicated with talents in team leadership and motivation. Energetic individual equipped to work hard in fast-paced, constantly changing environment."
                            )}
                          >
                            <div className="flex mb-1">
                              {id <= 2 && (
                                <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mr-1">
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
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg opacity-30 blur"></div>
                    <div className="relative">
                      <textarea 
                        className="w-full min-h-[300px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
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
                  
                  {/* Navigation buttons */}
                  <div className="flex justify-between items-center mt-8">
                    <button
                      onClick={handlePreview}
                      className="text-purple-600 hover:text-purple-800 border border-purple-600 hover:border-purple-800 font-medium rounded-full px-10 py-2.5 text-base transition-all duration-300 hover:bg-purple-50"
                    >
                      Preview
                    </button>
                    <button 
                      onClick={handleNext}
                      className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium rounded-full px-10 py-2.5 text-base transition-all duration-300 shadow-sm hover:shadow"
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