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
import { JobTitle, getJobTitleSuggestions } from '@/utils/jobTitlesData';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchProfessionalSummaryDescriptions } from './fix-descriptions';

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
      duration: 0.3
    }
  }
};

export default function ProfessionalSummaryPage() {
  const [, navigate] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [suggestions, setSuggestions] = useState<JobTitle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // State for tracking the currently selected job title
  const [currentJobTitle, setCurrentJobTitle] = useState<JobTitle | null>(null);

  // Initialize job title from resumeData if available
  useEffect(() => {
    if (resumeData.workExperience && 
        resumeData.workExperience[0] && 
        resumeData.workExperience[0].jobTitle && 
        !currentJobTitle) {
      const initialJobTitle = {
        id: 0,
        title: resumeData.workExperience[0].jobTitle || 'Professional',
        category: 'General'
      };
      setCurrentJobTitle(initialJobTitle as JobTitle);
    }
  }, [resumeData, currentJobTitle]);
  
  // Initialize professional summary from resumeData if available
  const [professionalSummary, setProfessionalSummary] = useState(resumeData.professionalSummary || '');
  
  // State for summary descriptions
  const [summaryDescriptions, setSummaryDescriptions] = useState<any[]>([]);
  const [isLoadingSummaries, setIsLoadingSummaries] = useState(false);
  const [showingResults, setShowingResults] = useState<string>('');
  
  // Debug logging
  useEffect(() => {
    console.log("Current job title changed:", currentJobTitle);
  }, [currentJobTitle]);
  
  useEffect(() => {
    console.log("Summary descriptions updated:", summaryDescriptions.length, summaryDescriptions);
  }, [summaryDescriptions]);
  
  // Fetch professional summaries when current job title changes
  useEffect(() => {
    const loadProfessionalSummaries = async () => {
      if (!currentJobTitle) {
        console.log("No job title selected, skipping professional summary fetch");
        return;
      }
      
      setIsLoadingSummaries(true);
      
      try {
        console.log("Fetching professional summaries for job title:", currentJobTitle.title);
        
        // Get job title ID (could be number or string)
        const jobTitleId = currentJobTitle.id;
        
        // Use our helper function to fetch descriptions
        const descriptions = await fetchProfessionalSummaryDescriptions(jobTitleId);
        
        if (descriptions && descriptions.length > 0) {
          console.log(`Setting ${descriptions.length} professional summary descriptions`);
          setSummaryDescriptions(descriptions);
          setShowingResults(String(descriptions.length));
        } else {
          console.log("No professional summary descriptions found");
          setSummaryDescriptions([]);
          setShowingResults('0');
        }
      } catch (error) {
        console.error("Error loading professional summaries:", error);
        setSummaryDescriptions([]);
        setShowingResults('0');
      } finally {
        setIsLoadingSummaries(false);
      }
    };
    
    loadProfessionalSummaries();
  }, [currentJobTitle]);

  // Handle clicks outside the suggestions dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input changes for job title search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsTyping(true);
    setShowSuggestions(true);
    
    // Get job title suggestions
    const fetchSuggestions = async () => {
      try {
        const fetchedSuggestions = await getJobTitleSuggestions(value);
        setSuggestions(fetchedSuggestions);
        console.log("Filtered suggestions:", fetchedSuggestions);
      } catch (error) {
        console.error("Error fetching job title suggestions:", error);
      } finally {
        setIsTyping(false);
      }
    };
    
    fetchSuggestions();
  };

  // Handle job title selection
  const handleSelectJobTitle = (jobTitle: JobTitle) => {
    setCurrentJobTitle(jobTitle);
    setSearchTerm(jobTitle.title);
    setShowSuggestions(false);
    
    // Store the selected job title ID for persistence
    updateResumeData({
      professionalSummaryTitleId: jobTitle.id
    });
  };

  // Handle adding summary content
  const handleSummaryClick = (content: string) => {
    // Add this summary to the existing one with bullet point
    const newSummary = professionalSummary 
      ? `${professionalSummary}\n• ${content}` 
      : `• ${content}`;
    
    setProfessionalSummary(newSummary);
    
    // Store in resume data
    updateResumeData({ professionalSummary: newSummary });
  };

  // Handle text area changes
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setProfessionalSummary(value);
    updateResumeData({ professionalSummary: value });
  };

  // Handle clear button
  const handleClear = () => {
    setProfessionalSummary('');
    updateResumeData({ professionalSummary: '' });
  };

  // Handle undo/redo functionality
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (professionalSummary !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(professionalSummary);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
  }, [professionalSummary]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const previousSummary = history[historyIndex - 1];
      setProfessionalSummary(previousSummary);
      updateResumeData({ professionalSummary: previousSummary });
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextSummary = history[historyIndex + 1];
      setProfessionalSummary(nextSummary);
      updateResumeData({ professionalSummary: nextSummary });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="py-4 border-b bg-white flex justify-center">
        <div className="container max-w-screen-xl px-4 flex justify-between items-center">
          <Logo />
          <div className="flex gap-4">
            <Button variant="outline" size="sm" className="gap-1">
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 py-8 flex justify-center">
        <div className="container max-w-screen-xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1"
                onClick={() => navigate('/skills-summary')}
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-gray-800">Professional Summary</h1>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <div className="text-gray-500 flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    <span className="text-sm">How it works</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">
                    Search for your job title to see professional summary examples. 
                    Click on an example to add it to your summary. 
                    You can also edit your summary directly.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Side: Job Search, Examples, and Editor */}
            <div>
              {/* Job Title Search */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-800 mb-2">Enter Job Title</h2>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={searchInputRef}
                      value={searchTerm}
                      onChange={handleInputChange}
                      placeholder="Search job titles..."
                      className="pl-10 pr-10 py-6 border-gray-300 focus:border-purple-300 focus:ring focus:ring-purple-200 focus:ring-opacity-50"
                      onFocus={() => setShowSuggestions(true)}
                    />
                    {searchTerm && (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2"
                        onClick={() => {
                          setSearchTerm('');
                          setShowSuggestions(false);
                        }}
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                  
                  {/* Suggestions Dropdown */}
                  {showSuggestions && (
                    <div 
                      ref={suggestionsRef}
                      className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto"
                    >
                      {isTyping ? (
                        <div className="p-3 text-center text-gray-500">
                          <RotateCw className="h-4 w-4 animate-spin mx-auto mb-1" />
                          Searching...
                        </div>
                      ) : suggestions.length > 0 ? (
                        suggestions.map((suggestion) => (
                          <div
                            key={`${suggestion.id}-${suggestion.title}`}
                            className="px-3 py-2 hover:bg-purple-50 cursor-pointer transition-colors duration-150"
                            onClick={() => handleSelectJobTitle(suggestion)}
                          >
                            <div className="font-medium text-gray-800">{suggestion.title}</div>
                            <div className="text-xs text-gray-500">{suggestion.category}</div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-gray-500">
                          No matching job titles found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Examples Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-800">
                    Pre-Written Examples
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      Click to insert into your summary
                    </span>
                  </h2>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-md p-4">
                  {/* Examples Header */}
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
                            {currentJobTitle?.title || "Professional"}
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
                    {!isLoadingSummaries && summaryDescriptions.length > 0 ? (
                      // Show actual professional summary descriptions from API
                      summaryDescriptions.map((item) => (
                        <motion.div 
                          key={item.id}
                          variants={itemVariants}
                          className={`p-3 border ${item.isRecommended ? 'border-purple-200 bg-purple-50' : 'border-gray-200 bg-white'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
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
                      // If no descriptions are available, show generic examples
                      Array.from({length: 3}).map((_, index) => (
                        <motion.div 
                          key={index}
                          variants={itemVariants}
                          className={`p-3 ${index < 2 ? 'bg-purple-50 border border-purple-200' : 'bg-white border border-gray-200'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                        >
                          <div className="flex mb-1">
                            {index < 2 && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full mr-1">
                                Expert Recommended
                              </span>
                            )}
                          </div>
                          <p className="text-gray-800 text-sm">
                            {currentJobTitle 
                              ? `Professional with experience in ${currentJobTitle.title}. Click to select a job title and see real examples.` 
                              : "Select a job title above to see professional summary examples."}
                          </p>
                        </motion.div>
                      ))
                    ) : null}
                  </motion.div>
                </div>
              </div>
              
              {/* Professional Summary Editor */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-gray-800">
                    Your Professional Summary
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 gap-1"
                      onClick={handleUndo}
                      disabled={historyIndex <= 0}
                    >
                      <Undo2 className="h-3 w-3" />
                      Undo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 gap-1"
                      onClick={handleRedo}
                      disabled={historyIndex >= history.length - 1}
                    >
                      <Redo className="h-3 w-3" />
                      Redo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 gap-1"
                      onClick={handleClear}
                    >
                      <X className="h-3 w-3" />
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="rounded-md overflow-hidden bg-gradient-to-r from-purple-50 to-white p-0.5">
                  <textarea
                    className="w-full min-h-[300px] p-4 border border-gray-200 rounded focus:ring-purple-300 focus:border-purple-300 text-gray-800"
                    placeholder="Start writing your professional summary here..."
                    value={professionalSummary}
                    onChange={handleTextAreaChange}
                  ></textarea>
                </div>
              </div>
            </div>
            
            {/* Right Side: Resume Preview */}
            <div className="bg-white border border-gray-200 rounded-md p-6 sticky top-4 self-start">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-800">Resume Preview</h2>
                <Button variant="outline" size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Change Template
                </Button>
              </div>
              
              <div className="aspect-[1/1.414] bg-gray-100 rounded-md flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="mb-2">Professional Summary Preview</p>
                  <p className="text-sm">
                    {professionalSummary || "Your professional summary will appear here..."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <div className="mt-10 flex justify-end">
            <div className="flex gap-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/skills-summary')}
              >
                Back
              </Button>
              <Button 
                className="px-8 bg-gradient-to-r from-purple-500 to-purple-700 text-white hover:from-purple-600 hover:to-purple-800"
                onClick={() => navigate('/contacts')}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}