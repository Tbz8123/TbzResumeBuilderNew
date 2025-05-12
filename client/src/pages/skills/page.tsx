import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { 
  ArrowLeft, 
  HelpCircle, 
  ChevronRight, 
  Plus, 
  Search, 
  Star, 
  X, 
  RefreshCw,
  ArrowDownUp,
  ArrowRight,
  RotateCw,
  Undo2,
  Loader,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
// Define API job title interface specifically for this component
interface ApiJobTitle {
  id: number;
  title: string;
  category: string;
}
import { useQuery } from '@tanstack/react-query';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Sample skill categories
const SKILL_CATEGORIES = [
  {
    id: 'technical',
    title: 'Technical',
    skills: ['JavaScript', 'React', 'TypeScript', 'Python', 'SQL']
  },
  {
    id: 'soft',
    title: 'Soft Skills',
    skills: ['Communication', 'Leadership', 'Teamwork', 'Problem Solving']
  },
  {
    id: 'management',
    title: 'Management',
    skills: ['Project Management', 'Team Leadership', 'Strategic Planning']
  },
  {
    id: 'tools',
    title: 'Tools',
    skills: ['Microsoft Office', 'Adobe Creative Suite', 'Figma', 'Git']
  }
];

// Get related skill categories
const getRelatedSkillCategories = (currentSkill: string | null): string[] => {
  if (!currentSkill) {
    return ['Programming', 'Leadership', 'Communication', 'Teamwork'];
  }
  
  // Map of related skills
  const relatedSkillsMap: Record<string, string[]> = {
    'programming': ['javascript', 'react', 'python', 'web development'],
    'leadership': ['team management', 'strategic planning', 'mentoring', 'decision making'],
    'communication': ['presentation', 'writing', 'negotiation', 'customer service'],
    'design': ['ui design', 'graphic design', 'figma', 'adobe creative suite'],
  };
  
  // Try to match the current skill to a category
  const lowerCaseSkill = currentSkill.toLowerCase();
  let category = 'programming'; // Default
  
  for (const [key, _] of Object.entries(relatedSkillsMap)) {
    if (lowerCaseSkill.includes(key)) {
      category = key;
      break;
    }
  }
  
  // Return the related skills
  return relatedSkillsMap[category] || relatedSkillsMap['programming'];
};

// Interface for our API response
interface ApiSkill {
  id: number;
  name: string;
  categoryId: number;
  description: string | null;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

// Fallback skills to show if API fails
const fallbackSkills = [
  'Team Leadership',
  'Strategic Planning',
  'Project Management',
  'Communication',
  'Problem Solving',
  'JavaScript',
  'React',
  'TypeScript',
  'Python',
  'SQL',
  'Data Analysis',
  'UI/UX Design',
  'Git',
  'Microsoft Office',
  'Presentation Skills'
];

// Constant for Manager job title ID (fallback)
const MANAGER_ID = 28;

const SkillsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resumeData.skills || []);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('text-editor');
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  const [skillText, setSkillText] = useState('');
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState<string[]>([]);
  const [jobTitleId, setJobTitleId] = useState<number | null>(null);
  const [apiSkills, setApiSkills] = useState<ApiSkill[]>([]);
  const [jobTitleOpen, setJobTitleOpen] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState<ApiJobTitle | null>(null);
  const [jobTitleSearchResults, setJobTitleSearchResults] = useState<ApiJobTitle[]>([]);
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
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
  
  // Fetch job titles for the dropdown
  const { 
    data: jobTitlesData = { data: [] }, 
    isLoading: isLoadingJobTitles 
  } = useQuery({
    queryKey: ['/api/skills/job-titles'],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('limit', '50'); // Load more job titles for a better selection
      
      const response = await fetch(`/api/skills/job-titles?${params.toString()}`);
      if (!response.ok) {
        // If no skill job titles exist yet, fall back to regular job titles
        console.log("Couldn't fetch skill job titles, trying regular job titles");
        // If we can't fetch skill job titles, check regular job titles as a fallback
        console.log('Falling back to regular job titles API for skill job titles');
        const fallbackResponse = await fetch(`/api/jobs/titles?${params.toString()}`);
        if (!fallbackResponse.ok) {
          throw new Error('Failed to fetch job titles');
        }
        return await fallbackResponse.json();
      }
      return await response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds to catch backend updates
  });

  // Function to fetch skills based on job title
  const fetchSkillsForJobTitle = async (jobTitleId: number | null) => {
    setIsLoadingSkills(true);
    try {
      let endpoint = `/api/skills`;
      let skillData: ApiSkill[] = [];
      let recommendedSkills: ApiSkill[] = [];
      let standardSkills: ApiSkill[] = [];
      
      // If we have a job title ID, use the dedicated endpoint to get associated skills
      if (jobTitleId) {
        console.log(`Fetching skills for job title ID: ${jobTitleId}`);
        const response = await fetch(`/api/skills/by-skill-job-title/${jobTitleId}`);
        
        if (response.ok) {
          skillData = await response.json();
          console.log("Skills data received:", skillData);
          
          // Separate skills into recommended and standard
          recommendedSkills = skillData.filter(skill => skill.isRecommended === true);
          standardSkills = skillData.filter(skill => skill.isRecommended !== true);
          
          console.log(`Found ${recommendedSkills.length} recommended and ${standardSkills.length} standard skills`);
        }
      }
      
      // If no job title-specific skills were found or no job title selected,
      // fall back to general skills query
      if (skillData.length === 0) {
        console.log("No job title-specific skills found, fetching general skills");
        const params = new URLSearchParams();
        if (jobTitleId) {
          params.append('jobTitleId', jobTitleId.toString());
        }
        
        const response = await fetch(`${endpoint}?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch skills');
        }
        
        skillData = await response.json();
        
        // For general skills, mark the first 5 as recommended for better UX
        recommendedSkills = skillData.slice(0, 5);
        standardSkills = skillData.slice(5);
      }
      
      // Update state with the skills data
      setApiSkills(skillData);
      
      // Extract skill names, prioritizing recommended skills first
      const skillNames = [
        ...recommendedSkills.map(skill => skill.name),
        ...standardSkills.map(skill => skill.name)
      ];
      
      setSkillSuggestions(skillNames);
      
      console.log(`Loaded ${skillNames.length} skills for job title ID: ${jobTitleId || 'general'}`);
      
      // Only use fallback skills if absolutely necessary
      if (skillNames.length === 0) {
        console.log("No skills found at all, using minimal fallback skills");
        setSkillSuggestions(fallbackSkills.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching skills:", error);
      // Use minimal fallback skills on error
      setSkillSuggestions(fallbackSkills.slice(0, 5));
    } finally {
      setIsLoadingSkills(false);
    }
  };
  
  // Function to find the job title ID from the resume work experience
  const findJobTitleIdFromWorkExperience = async () => {
    if (!resumeData.workExperience || resumeData.workExperience.length === 0) {
      console.log("No work experience found, using default Manager ID");
      return null;
    }
    
    // Get the first work experience job title
    const firstJob = resumeData.workExperience[0];
    if (!firstJob.jobTitle) {
      console.log("No job title found in work experience, using default Manager ID");
      return null;
    }
    
    // Search for this job title
    try {
      console.log("Searching for job title:", firstJob.jobTitle);
      // Try looking in skill job titles first
      const response = await apiRequest('GET', `/api/skills/job-titles?search=${encodeURIComponent(firstJob.jobTitle)}`);
      
      // Type check the response structure
      if (response && 
          typeof response === 'object' && 
          'data' in response && 
          Array.isArray(response.data) && 
          response.data.length > 0) {
        
        // Try to find an exact match
        const exactMatch = response.data.find((job: ApiJobTitle) => 
          job.title.toLowerCase() === firstJob.jobTitle?.toLowerCase()
        );
        
        if (exactMatch) {
          console.log(`Found exact matching job title ID: ${exactMatch.id}`);
          return exactMatch.id;
        } else {
          // Use the first result if no exact match
          console.log(`No exact match found, using first result with ID: ${response.data[0].id}`);
          return response.data[0].id;
        }
      }
    } catch (error) {
      console.error("Error searching for job title:", error);
    }
    
    // Return null if job title search fails
    return null;
  };
  
  // Initial fetch of skills based on job title
  useEffect(() => {
    const initializeSkills = async () => {
      const titleId = await findJobTitleIdFromWorkExperience();
      setJobTitleId(titleId);
      
      // Also set the selected job title for the dropdown if we have job titles loaded
      if (jobTitlesData?.data && jobTitlesData.data.length > 0 && titleId) {
        const foundJobTitle = jobTitlesData.data.find((jt: ApiJobTitle) => jt.id === titleId);
        if (foundJobTitle) {
          setSelectedJobTitle(foundJobTitle);
        }
      }
      
      fetchSkillsForJobTitle(titleId);
    };
    
    initializeSkills();
  }, [resumeData.workExperience, jobTitlesData?.data]);
  
  // Effect specifically to handle selectedJobTitle changes
  useEffect(() => {
    if (selectedJobTitle?.id) {
      console.log(`Selected job title changed to: ${selectedJobTitle.title} (ID: ${selectedJobTitle.id})`);
      fetchSkillsForJobTitle(selectedJobTitle.id);
    }
  }, [selectedJobTitle]);

  // Set up a polling interval to refresh skills 
  useEffect(() => {
    // Set up polling for skill updates (every 20 seconds)
    const intervalId = setInterval(() => {
      if (selectedJobTitle?.id) {
        console.log("Refreshing skills for selected job title ID:", selectedJobTitle.id);
        fetchSkillsForJobTitle(selectedJobTitle.id);
      } else if (jobTitleId) {
        console.log("Refreshing skills for job title ID:", jobTitleId);
        fetchSkillsForJobTitle(jobTitleId);
      }
    }, 20000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [jobTitleId, selectedJobTitle?.id]);
  
  // Filter skills based on search term
  const filteredSkills = searchTerm.trim() !== ''
    ? skillSuggestions.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : skillSuggestions.slice(0, 15);
  
  const relatedSkills = getRelatedSkillCategories(searchTerm);
  
  // Navigation handlers
  const handleBack = () => {
    saveSkills();
    setLocation('/education-summary');
  };
  
  const handleNext = () => {
    saveSkills();
    setLocation('/skills-summary');
  };
  
  const handlePreview = () => {
    saveSkills();
    setLocation('/preview');
  };
  
  // Handle search input changes
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.trim()) {
      // Always show suggestions when there's a search term
      setShowSkillSuggestions(true);
      
      // If search term is longer than 1 character, fetch job titles that match
      if (value.length > 1) {
        try {
          // First check if we need to search for job titles
          const response = await fetch(`/api/skills/job-titles?search=${encodeURIComponent(value)}&limit=5`);
          if (response.ok) {
            const data = await response.json();
            
            // Update jobTitleSearchResults with the search results
            if (data && data.data) {
              console.log(`Found ${data.data.length} skill job titles matching "${value}"`);
              
              // Log each result for debugging
              if (data.data.length > 0) {
                data.data.forEach((jt: ApiJobTitle, i: number) => {
                  console.log(`  ${i+1}. "${jt.title}" (ID: ${jt.id})`);
                });
              }
              
              // Use our dedicated state for search results
              setJobTitleSearchResults(data.data);
            } else {
              console.log(`No skill job titles found for "${value}"`);
            }
          }
        } catch (error) {
          console.error("Error searching for job titles:", error);
          // Clear search results on error
          setJobTitleSearchResults([]);
        }
      }
    } else {
      setShowSkillSuggestions(false);
      // Clear search results when search is empty
      setJobTitleSearchResults([]);
    }
  };
  
  // Handle skill selection
  const handleSkillClick = (skillName: string) => {
    // Add to textarea
    if (skillText) {
      setSkillText((prev) => prev + '\n• ' + skillName);
    } else {
      setSkillText('• ' + skillName);
    }
    
    // Check if already in selected skills
    const existingSkill = selectedSkills.find(s => s.name === skillName);
    if (!existingSkill) {
      const newSkill: Skill = {
        id: uuidv4(),
        name: skillName,
        level: 3 // Default rating
      };
      setSelectedSkills([...selectedSkills, newSkill]);
      setCurrentSkill(newSkill);
    }
  };
  
  // Set skill rating
  const handleSkillRating = (skill: Skill, rating: number) => {
    const updatedSkills = selectedSkills.map(s => 
      s.id === skill.id ? { ...s, level: rating } : s
    );
    setSelectedSkills(updatedSkills);
  };
  
  // Save skills to resume context
  const saveSkills = () => {
    // Extract skills from text if needed
    if (skillText && selectedSkills.length === 0) {
      const lines = skillText.split('\n');
      const extractedSkills = lines.map(line => {
        const skillName = line.replace(/^[•\-*]\s*/, '').trim();
        return {
          id: uuidv4(),
          name: skillName,
          level: 3 // Default rating
        };
      }).filter(s => s.name);
      
      if (extractedSkills.length > 0) {
        updateResumeData({ skills: extractedSkills });
      }
    } else {
      updateResumeData({ skills: selectedSkills });
    }
  };
  
  // Handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSkillSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Save on unmount
  useEffect(() => {
    return () => {
      saveSkills();
    };
  }, [selectedSkills]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
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
              <span>Back to Education</span>
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
                What skills would you like to highlight?
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-purple-600 hover:text-purple-700 bg-purple-50 p-2 rounded-full">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4">
                    <p className="font-medium mb-2">Tips</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Include skills relevant to the job you're applying for</li>
                      <li>Rate your skills honestly</li>
                      <li>Balance technical skills with soft skills</li>
                      <li>Prioritize skills mentioned in the job description</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600 mb-8">
              To get started, you can choose from our expert recommended skills below.
            </p>
            
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Examples */}
              <div>
                {/* Search by skill or job title */}
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs uppercase font-bold text-gray-600">
                    SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES
                  </h2>
                  {isLoadingSkills && (
                    <div className="flex items-center gap-1 text-xs text-purple-500">
                      <Loader className="h-3 w-3 animate-spin" />
                      <span>Loading skills...</span>
                    </div>
                  )}
                </div>
                
                {/* Search input */}
                <div className="relative group mb-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-50 group-hover:opacity-70 blur group-hover:blur-md transition duration-300"></div>
                  <div className="relative bg-white rounded-lg">
                    <Input 
                      type="text"
                      ref={searchInputRef}
                      placeholder="Search by job title or skill..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="rounded-lg border-gray-300 pr-10 py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
                      onFocus={() => {
                        if (filteredSkills.length > 0) {
                          setShowSkillSuggestions(true);
                        }
                      }}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                      <Search className="h-5 w-5 text-purple-400" />
                    </div>
                    
                    {/* Search suggestions dropdown */}
                    {showSkillSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-xl max-h-60 overflow-auto"
                        style={{ top: '100%', left: 0 }}
                      >
                        {isLoadingSkills ? (
                          <div className="py-6 flex justify-center items-center">
                            <div className="flex flex-col items-center">
                              <Loader className="h-6 w-6 animate-spin text-purple-600" />
                              <p className="mt-2 text-sm text-gray-500">Loading skills...</p>
                            </div>
                          </div>
                        ) : (
                          <div className="py-1">
                            {/* Job titles section */}
                            {jobTitleSearchResults.length > 0 ? (
                              <>
                                <div className="px-4 py-2 text-xs font-semibold text-purple-600 bg-purple-50">
                                  Job Titles
                                </div>
                                
                                {jobTitleSearchResults.map((jobTitle: ApiJobTitle) => (
                                  <div
                                    key={`job-${jobTitle.id}`}
                                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100"
                                    onClick={() => {
                                      setSearchTerm(jobTitle.title);
                                      setSelectedJobTitle(jobTitle);
                                      setJobTitleId(jobTitle.id);
                                      fetchSkillsForJobTitle(jobTitle.id);
                                      setShowSkillSuggestions(false);
                                    }}
                                  >
                                    <div className="font-medium text-gray-900 flex items-center">
                                      <span className="mr-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                        Job Title
                                      </span>
                                      {jobTitle.title}
                                    </div>
                                  </div>
                                ))}
                              </>
                            ) : (
                              searchTerm.trim().length > 1 && (
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500">
                                  Type more to search for job titles
                                </div>
                              )
                            )}
                            
                            {/* Skills section, show if we have skills or no skills but with a message */}
                            {skillSuggestions.length > 0 ? (
                              <>
                                <div className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50">
                                  Skills {selectedJobTitle && `for ${selectedJobTitle.title}`}
                                </div>
                                
                                {/* Debug Info - Can be removed in production */}
                                <div className="px-4 py-2 text-xs border-b border-gray-100">
                                  <div className="text-gray-500">Job Title ID: {selectedJobTitle?.id || jobTitleId || 'None'}</div>
                                  <div className="text-gray-500">API Skills: {apiSkills.length}</div>
                                  <div className="text-gray-500">Skill Suggestions: {skillSuggestions.length}</div>
                                </div>
                                
                                {/* Recommended Skills First */}
                                {apiSkills
                                  .filter(skill => skill.isRecommended === true && (
                                    !searchTerm.trim() || 
                                    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                                  ))
                                  .slice(0, 5)
                                  .map((skill, index) => (
                                    <div
                                      key={`recommended-skill-${index}`}
                                      className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors border-l-2 border-green-500"
                                      onClick={() => {
                                        setSearchTerm(skill.name);
                                        handleSkillClick(skill.name);
                                        setShowSkillSuggestions(false);
                                      }}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="font-medium text-gray-900">{skill.name}</div>
                                        <div className="text-xs text-green-600 font-semibold flex items-center">
                                          <Star className="h-3 w-3 mr-1 fill-green-500" />
                                          Recommended
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                
                                {/* Standard Skills Next */}
                                {apiSkills
                                  .filter(skill => skill.isRecommended !== true && (
                                    !searchTerm.trim() || 
                                    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                                  ))
                                  .slice(0, 10)
                                  .map((skill, index) => (
                                    <div
                                      key={`standard-skill-${index}`}
                                      className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                                      onClick={() => {
                                        setSearchTerm(skill.name);
                                        handleSkillClick(skill.name);
                                        setShowSkillSuggestions(false);
                                      }}
                                    >
                                      <div className="font-medium text-gray-900">{skill.name}</div>
                                    </div>
                                  ))}
                                  
                                {/* If no skills from API are rendered, then show filtered skills from suggestions */}
                                {apiSkills.length === 0 && 
                                  skillSuggestions.slice(0, 5).map((skill, index) => (
                                    <div
                                      key={`fallback-skill-${index}`}
                                      className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                                      onClick={() => {
                                        setSearchTerm(skill);
                                        handleSkillClick(skill);
                                        setShowSkillSuggestions(false);
                                      }}
                                    >
                                      <div className="font-medium text-gray-900">{skill}</div>
                                    </div>
                                  ))}
                              </>
                            ) : (
                              searchTerm.trim().length > 0 && (
                                <div className="px-4 py-3 text-center text-gray-500">
                                  No matching skills found. Try a different search or select a job title above.
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Related Skill Categories */}
                <motion.div 
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mb-6"
                >
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold text-gray-800">Related Skill Categories</h2>
                    <button className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors duration-300 flex items-center gap-1 group">
                      More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {relatedSkills.map((skill, index) => (
                      <motion.button
                        key={`${skill}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + (index * 0.1) }}
                        className="flex items-center border border-gray-200 rounded-full px-3 py-2 text-sm bg-gray-50 hover:bg-purple-50 hover:border-purple-200 transition-all duration-300"
                        onClick={() => {
                          setSearchTerm(skill);
                          handleSkillClick(skill);
                        }}
                      >
                        {skill}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
                
                {/* Results */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{filteredSkills.length} results</h2>
                      {isLoadingSkills && (
                        <Loader className="h-4 w-4 animate-spin text-purple-500" />
                      )}
                      {jobTitleId && (
                        <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                          Job-specific skills
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSearchTerm('')}
                        className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                        title="Clear search"
                        disabled={isLoadingSkills}
                      >
                        <Undo2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Re-fetch skills for the current job title
                          fetchSkillsForJobTitle(jobTitleId);
                        }}
                        className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                        title="Refresh results"
                        disabled={isLoadingSkills}
                      >
                        <RotateCw className={`h-4 w-4 ${isLoadingSkills ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  
                  {isLoadingSkills ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader className="h-8 w-8 animate-spin text-purple-500 mb-4" />
                      <p className="text-gray-500">Loading skills for your job title...</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 py-2 bg-transparent">
                      <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="space-y-3"
                      >
                        {filteredSkills.length > 0 ? (
                          filteredSkills.map((skill, index) => (
                            <motion.div
                              key={`${skill}-card-${index}`}
                              variants={itemVariants}
                              className={`p-3 border border-gray-200 ${
                                apiSkills.find(s => s.name === skill && s.isRecommended) 
                                  ? 'bg-purple-50 border-purple-200' 
                                  : index < 3 ? 'bg-purple-50' : 'bg-gray-50'
                              } rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                              onClick={() => handleSkillClick(skill)}
                            >
                              {index < 3 && (
                                <div className="text-xs text-purple-700 font-medium mb-1">
                                  Expert Recommended
                                </div>
                              )}
                              <p className="text-gray-800 text-sm">
                                {skill}
                              </p>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No skills found matching your search.</p>
                            <button 
                              onClick={() => setSearchTerm('')}
                              className="mt-2 text-purple-600 hover:text-purple-800 font-medium"
                            >
                              Clear search
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </div>
              
              {/* Right Column - Editor/Rating */}
              <div>
                {/* Tabs */}
                <div className="flex justify-end mb-4">
                  <div className="inline-flex rounded-full bg-gray-100 p-1">
                    <button
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                        activeTab === "text-editor"
                          ? "bg-white shadow-sm text-purple-600"
                          : "text-gray-600 hover:text-purple-600"
                      )}
                      onClick={() => setActiveTab("text-editor")}
                    >
                      Text Editor
                    </button>
                    <button
                      className={cn(
                        "px-4 py-1.5 text-sm font-medium rounded-full transition-colors",
                        activeTab === "skills-rating"
                          ? "bg-white shadow-sm text-purple-600"
                          : "text-gray-600 hover:text-purple-600"
                      )}
                      onClick={() => setActiveTab("skills-rating")}
                    >
                      Skills Rating
                    </button>
                  </div>
                </div>
                
                {/* Content area based on active tab */}
                {activeTab === "text-editor" ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">
                      Your Professional Skills
                    </h2>
                    <p className="text-sm text-gray-600 mb-3">List your key skills below:</p>
                    
                    {/* Text editor with purple glow effect */}
                    <div className="relative mb-4">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg opacity-30 blur"></div>
                      <div className="relative">
                        <textarea
                          className="w-full h-[300px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                          placeholder="Click on any skill from the left to add it to your skills list, or write your own."
                          value={skillText}
                          onChange={(e) => setSkillText(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    {/* Character count and tips */}
                    <div className="flex justify-between items-center mt-3 text-sm">
                      <span className="text-gray-500">
                        Use a bullet (•) before each skill
                      </span>
                      <span className="text-purple-600">
                        Be specific and relevant
                      </span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {selectedSkills.length > 0 ? (
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">
                          Rate your skills
                        </h2>
                        <div className="space-y-6">
                          {currentSkill ? (
                            <div className="mb-6">
                              <h3 className="font-medium text-lg mb-4">
                                Rate your proficiency: <span className="text-purple-600">{currentSkill.name}</span>
                              </h3>
                              
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs text-gray-500">Beginner</span>
                                <span className="text-xs text-gray-500">Expert</span>
                              </div>
                              
                              <div className="flex justify-between items-center mb-4">
                                {[1, 2, 3, 4, 5].map((level) => (
                                  <button
                                    type="button"
                                    key={level}
                                    onClick={() => {
                                      // Update in state
                                      handleSkillRating(currentSkill, level);
                                      // Force rerender by creating a new object
                                      setCurrentSkill({...currentSkill, level});
                                    }}
                                    className={`flex flex-col items-center cursor-pointer ${
                                      level <= (currentSkill.level || 0) ? "text-yellow-500" : "text-gray-300"
                                    }`}
                                  >
                                    <Star
                                      className={`h-10 w-10 ${
                                        level <= (currentSkill.level || 0) ? "fill-yellow-500 text-yellow-500" : ""
                                      }`}
                                    />
                                    <span className="text-xs mt-1">{level}</span>
                                  </button>
                                ))}
                              </div>
                              
                              <div className="flex justify-between mt-4">
                                <span className="text-sm font-medium">
                                  {currentSkill.level === 1 && "Basic knowledge"}
                                  {currentSkill.level === 2 && "Beginner"}
                                  {currentSkill.level === 3 && "Intermediate"}
                                  {currentSkill.level === 4 && "Advanced"}
                                  {currentSkill.level === 5 && "Expert"}
                                </span>
                                <span className="text-sm text-purple-600">{currentSkill.level}/5</span>
                              </div>
                            </div>
                          ) : null}
                          
                          <div>
                            <h3 className="font-medium mb-3">Select a skill to rate:</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedSkills.map((skill) => (
                                <button
                                  key={skill.id}
                                  onClick={() => setCurrentSkill(skill)}
                                  className={`px-3 py-1.5 rounded-full text-sm ${
                                    currentSkill?.id === skill.id
                                      ? "bg-purple-100 text-purple-700 border border-purple-300"
                                      : "bg-gray-50 text-gray-700 border border-gray-200 hover:border-purple-300"
                                  }`}
                                >
                                  {skill.name}
                                  {skill.level ? (
                                    <span className="ml-1 inline-flex">
                                      {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`h-3 w-3 ${i < skill.level ? "fill-yellow-500 text-yellow-500" : "text-gray-300"}`} 
                                        />
                                      ))}
                                    </span>
                                  ) : null}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                          <Plus className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="text-xl font-medium mb-2">No skills added yet</h3>
                        <p className="text-gray-600 mb-6 max-w-md mx-auto">
                          Add skills from the suggestions on the left, then switch to this tab to rate your proficiency level for each skill.
                        </p>
                        <button
                          onClick={() => setActiveTab("text-editor")}
                          className="px-6 py-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
                        >
                          Add Skills Now
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    className="border-purple-500 text-purple-500 hover:bg-purple-50 hover:text-purple-700 rounded-full px-8"
                    onClick={handlePreview}
                  >
                    Preview
                  </Button>
                  <Button 
                    className="bg-amber-500 hover:bg-amber-600 text-black rounded-full px-8"
                    onClick={handleNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SkillsPage;