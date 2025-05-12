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
import { apiRequest } from '@/lib/queryClient';
import { motion } from 'framer-motion';

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
    // Save and navigate to the next page (could be a new page after this one)
    saveProfessionalSummary();
    // For now, navigate to preview as the final step
    setLocation('/preview');
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
                How would you describe yourself as a {currentJobTitle}?
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-gray-400 hover:text-purple-600 transition-colors">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Your professional summary is a short statement that appears at the top of your resume, highlighting your career focus, skills and achievements.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Text Area */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative">
                <textarea 
                  className="w-full min-h-[300px] p-3 text-gray-800 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none"
                  placeholder="Enter your professional summary here, or select from the examples on the right..."
                  value={professionalSummary}
                  onChange={(e) => setProfessionalSummary(e.target.value)}
                ></textarea>
                
                <div className="flex justify-between mt-4">
                  <button 
                    onClick={() => setProfessionalSummary('')}
                    className="text-sm text-gray-500 flex items-center gap-1 hover:text-red-500 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    <span>Clear</span>
                  </button>
                  
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setProfessionalSummary(professionalSummary => professionalSummary.slice(0, professionalSummary.lastIndexOf('\n')))}
                      className="text-sm bg-gray-100 px-3 py-1.5 rounded-md text-gray-600 flex items-center gap-1 hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!professionalSummary.includes('\n')}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                      <span>Undo</span>
                    </button>
                    
                    <button 
                      onClick={handlePreview}
                      className="text-sm bg-blue-50 px-3 py-1.5 rounded-md text-blue-700 flex items-center gap-1 hover:bg-blue-100 transition-colors"
                    >
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Summary Examples */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col h-full">
                  <div className="mb-4">
                    <h2 className="font-semibold text-gray-800 mb-1">
                      SEARCH FOR PRE-WRITTEN EXAMPLES
                    </h2>
                    
                    <div className="relative">
                      <Input 
                        type="text" 
                        placeholder="Search by skills, qualities or experience..." 
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-9"
                        ref={searchInputRef}
                      />
                      <Search className="h-4 w-4 absolute top-3 left-3 text-gray-400" />
                      
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
                  
                  <div className="flex-grow overflow-y-auto">
                    <motion.div
                      className="mb-2 text-sm font-medium text-gray-500"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {isLoadingSummaries ? (
                        <div className="flex items-center gap-2">
                          <RotateCw className="h-3 w-3 animate-spin" />
                          <span>Loading examples...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span>Showing {summaryDescriptions.length} examples</span>
                          {searchTerm && <span>for "{searchTerm}"</span>}
                        </div>
                      )}
                    </motion.div>
                    
                    {/* List of examples */}
                    <motion.div
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {summaryDescriptions.map((item) => (
                        <motion.div 
                          key={item.id}
                          variants={itemVariants}
                          className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-purple-300 hover:shadow-sm group ${
                            item.isRecommended ? 'border-purple-200 bg-purple-50' : 'border-gray-200'
                          }`}
                          onClick={() => handleSummaryClick(item.content)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            {item.isRecommended && (
                              <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-0.5 rounded">
                                Recommended
                              </span>
                            )}
                            <button 
                              className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSummaryClick(item.content);
                              }}
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-700">{item.content}</p>
                        </motion.div>
                      ))}
                      
                      {summaryDescriptions.length === 0 && !isLoadingSummaries && (
                        <div className="text-center py-8 text-gray-500">
                          <p>No examples found. Try a different search term.</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Navigation Buttons */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex justify-between"
          >
            <button
              onClick={handleBack}
              className="px-6 py-2.5 border border-gray-300 rounded-full text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            
            <button
              onClick={handleNext}
              className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 rounded-full text-white font-medium shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default ProfessionalSummaryPage;