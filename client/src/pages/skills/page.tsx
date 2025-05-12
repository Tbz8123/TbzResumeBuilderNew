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
        
        // First try the skill-specific endpoint that matches with the admin panel
        const response = await fetch(`/api/skills/by-skill-job-title/${jobTitleId}`);
        
        if (response.ok) {
          skillData = await response.json();
          
          if (skillData && Array.isArray(skillData)) {
            console.log(`Fetched ${skillData.length} skills for skill job title ID: ${jobTitleId}`);
            
            // Log all skill names for debugging
            if (skillData.length > 0) {
              console.log("Skills data:", skillData);
            }
            
            // Separate skills into recommended and standard
            recommendedSkills = skillData.filter(skill => skill.isRecommended === true);
            standardSkills = skillData.filter(skill => skill.isRecommended !== true);
            
            console.log(`Found ${recommendedSkills.length} recommended and ${standardSkills.length} standard skills`);
          } else {
            console.error("Unexpected response format:", skillData);
            skillData = []; // Reset if format is unexpected
          }
        } else {
          console.log(`Error fetching skills: ${response.status} ${response.statusText}`);
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
        if (response.ok) {
          skillData = await response.json();
          console.log(`Fallback returned ${skillData.length} general skills`);
          
          // For general skills, mark the first 5 as recommended for better UX
          recommendedSkills = skillData.slice(0, 5);
          standardSkills = skillData.slice(5);
        } else {
          console.error(`Failed to fetch general skills: ${response.status} ${response.statusText}`);
        }
      }
      
      // Update state with the skills data
      setApiSkills(skillData);
      
      // Extract skill names, prioritizing recommended skills first
      const skillNames = [
        ...recommendedSkills.map(skill => skill.name),
        ...standardSkills.map(skill => skill.name)
      ];
      
      if (skillNames.length > 0) {
        console.log(`Setting ${skillNames.length} skill suggestions`);
        console.log("First 5 skills:", skillNames.slice(0, 5).join(', '));
        setSkillSuggestions(skillNames);
      } else {
        console.warn("No skill names were extracted from the data");
        // Use fallback skills if needed
        console.log("No skills found at all, using minimal fallback skills");
        setSkillSuggestions(fallbackSkills.slice(0, 5));
      }
      
      console.log(`Loaded ${skillNames.length} skills for job title ID: ${jobTitleId || 'general'}`);
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
  
  // Filter skills based on search term, but only if we're not just showing job title results
  const isSearchingForJobTitle = selectedJobTitle && searchTerm === selectedJobTitle.title;
  
  // If we have a selected job title and the search term is that job title, 
  // show all skills without filtering by searchTerm
  const filteredSkills = (searchTerm.trim() !== '' && !isSearchingForJobTitle)
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
      // Reset the search results when search term is empty
      setJobTitleSearchResults([]);
      // Hide suggestions if search is empty
      setShowSkillSuggestions(false);
    }
  };
  
  // Handle clicking outside the suggestions box
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
  
  // Handle skill click from suggestions
  const handleSkillClick = (skillName: string) => {
    // Create a new skill object
    const newSkill: Skill = {
      id: uuidv4(),
      name: skillName,
      proficiency: 3, // Default to middle rating
    };
    
    // Check if this skill is already in the selected skills
    const existingSkill = selectedSkills.find(s => s.name.toLowerCase() === skillName.toLowerCase());
    
    if (!existingSkill) {
      // Add the new skill to selected skills
      const updatedSkills = [...selectedSkills, newSkill];
      setSelectedSkills(updatedSkills);
      
      // Set it as the current skill
      setCurrentSkill(newSkill);
      
      // Clear search term
      setSearchTerm('');
      setShowSkillSuggestions(false);
    } else {
      // If already exists, just focus on it
      setCurrentSkill(existingSkill);
      setSearchTerm('');
      setShowSkillSuggestions(false);
    }
  };
  
  // Remove a skill from selected skills
  const handleRemoveSkill = (skillToRemove: Skill) => {
    const updatedSkills = selectedSkills.filter(skill => skill.id !== skillToRemove.id);
    setSelectedSkills(updatedSkills);
    
    if (currentSkill && currentSkill.id === skillToRemove.id) {
      setCurrentSkill(null);
    }
  };
  
  // Update a skill's proficiency rating
  const handleSkillRating = (skill: Skill, rating: number) => {
    const updatedSkills = selectedSkills.map(s => {
      if (s.id === skill.id) {
        return { ...s, proficiency: rating };
      }
      return s;
    });
    setSelectedSkills(updatedSkills);
    
    // Also update current skill if it's the one being rated
    if (currentSkill && currentSkill.id === skill.id) {
      setCurrentSkill({ ...currentSkill, proficiency: rating });
    }
  };
  
  // Save skills to resume context
  const saveSkills = () => {
    if (selectedSkills.length > 0 || resumeData.skills?.length > 0) {
      updateResumeData({ ...resumeData, skills: selectedSkills });
    }
  };
  
  useEffect(() => {
    // Auto-save skills when they change
    saveSkills();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSkills]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Debug panel - always visible for now during development */}
      {true && (
        <div className="bg-black text-white p-4 text-xs" style={{ opacity: 0.9 }}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold">Debug Panel (Admin Only)</h3>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-6 text-xs bg-transparent text-white border-white hover:bg-gray-800"
              onClick={() => fetchSkillsForJobTitle(selectedJobTitle?.id || jobTitleId)}
            >
              <RefreshCw className="h-3 w-3 mr-1" /> Refresh Skills
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="mb-1">Job Title Info:</div>
              <div>Selected ID: {selectedJobTitle?.id || jobTitleId || 'None'}</div>
              <div>Title: {selectedJobTitle?.title || 'None'}</div>
              <div>Search Term: {searchTerm || 'Empty'}</div>
              <div>API Skills: {apiSkills.length}</div>
              <div>Filtered Skills: {filteredSkills.length}</div>
            </div>
            <div>
              <div className="mb-1">Skills Data State:</div>
              <div>Selected Skills: {selectedSkills.length}</div>
              <div>Current Skill: {currentSkill?.name || 'None'}</div>
              <div>Suggestions Visible: {showSkillSuggestions ? 'Yes' : 'No'}</div>
              <div>Is Loading: {isLoadingSkills ? 'Yes' : 'No'}</div>
            </div>
          </div>
          <div className="mt-2">
            <div className="mb-1">API Skills (first 3):</div>
            <div className="grid grid-cols-3 gap-1">
              {apiSkills.slice(0, 3).map((skill, idx) => (
                <div key={`debug-skill-${idx}`} className="bg-gray-800 p-1 rounded text-xs">
                  {skill.name} {skill.isRecommended ? '⭐' : ''}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Logo />
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleNext}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
        
        {/* Main content */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Left column - Skills Input */}
          <motion.div variants={itemVariants} className="flex flex-col">
            <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Add Your Skills
            </h1>
            <p className="text-gray-600 mb-6">
              Add skills that are relevant to your experience and the job you want.
            </p>

            {/* Search field */}
            <div className="relative mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input 
                  type="text"
                  placeholder="SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES"
                  className="pl-10 pr-10 py-6 rounded-full border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onFocus={() => setShowSkillSuggestions(true)}
                  ref={searchInputRef}
                />
                {searchTerm && (
                  <X 
                    className="absolute right-3 top-3 h-4 w-4 text-gray-400 cursor-pointer" 
                    onClick={() => {
                      setSearchTerm('');
                      setJobTitleSearchResults([]);
                      setShowSkillSuggestions(false);
                    }}
                  />
                )}
              </div>
              
              {/* Suggestions dropdown */}
              {showSkillSuggestions && (
                <div 
                  className="absolute z-30 mt-1 w-full bg-white rounded-md shadow-lg overflow-hidden"
                  ref={suggestionsRef}
                >
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
                              // Log the selection for debugging
                              console.log(`Selected job title: "${jobTitle.title}" (ID: ${jobTitle.id})`);
                              
                              // Update state
                              setSearchTerm(jobTitle.title);
                              setSelectedJobTitle(jobTitle);
                              setJobTitleId(jobTitle.id);
                              
                              // First check if there's a matching skill job title in jobTitlesData
                              const matchingSkillJobTitle = jobTitlesData?.data?.find(
                                (jt: ApiJobTitle) => jt.title === jobTitle.title
                              );
                              
                              if (matchingSkillJobTitle) {
                                console.log(`Found matching skill job title with ID: ${matchingSkillJobTitle.id}`);
                                fetchSkillsForJobTitle(matchingSkillJobTitle.id);
                              } else {
                                console.log(`No matching skill job title, using selected job title ID: ${jobTitle.id}`);
                                fetchSkillsForJobTitle(jobTitle.id);
                              }
                              
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
                    
                    {/* Skills section */}
                    {apiSkills.length > 0 || filteredSkills.length > 0 ? (
                      <>
                        <div className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50">
                          Skills {selectedJobTitle && `for ${selectedJobTitle.title}`}
                        </div>
                        
                        {/* Debug info for visibility */}
                        <div className="px-4 py-1 text-xs text-gray-500 bg-gray-50">
                          <span>API Skills: {apiSkills.length}</span>
                          <span className="ml-3">Filtered Skills: {filteredSkills.length}</span>
                        </div>
                        
                        {/* Display skills based on context */}
                        {selectedJobTitle && apiSkills.length > 0 ? (
                          // Display API skills when a job title is selected
                          apiSkills.map((skill, index) => (
                            <div
                              key={`skill-api-${skill.id}`}
                              className={`px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors ${
                                skill.isRecommended ? 'border-l-2 border-green-500' : ''
                              }`}
                              onClick={() => {
                                setSearchTerm(skill.name);
                                handleSkillClick(skill.name);
                                setShowSkillSuggestions(false);
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="font-medium text-gray-900">{skill.name}</div>
                                {skill.isRecommended && (
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                                    Recommended
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fall back to filtered skills when no job title selected
                          filteredSkills.map((skill, index) => (
                            <div
                              key={`skill-filtered-${index}`}
                              className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors"
                              onClick={() => {
                                setSearchTerm(skill);
                                handleSkillClick(skill);
                                setShowSkillSuggestions(false);
                              }}
                            >
                              <div className="font-medium text-gray-900">{skill}</div>
                            </div>
                          ))
                        )}
                      </>
                    ) : (
                      searchTerm.trim().length > 0 && (
                        <div className="px-4 py-3 text-center text-gray-500">
                          No matching skills found. Try a different search term.
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Related skill categories */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                Related Skill Categories
                <span className="text-blue-600 ml-auto hover:underline cursor-pointer">
                  More <ArrowRight className="h-3 w-3 inline ml-1" />
                </span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {relatedSkills.map((skill, index) => (
                  <div
                    key={`related-${index}`}
                    className="bg-white border border-gray-200 rounded-full px-4 py-1 text-sm cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setSearchTerm(skill);
                      setShowSkillSuggestions(true);
                    }}
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Selected skills list */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <h3 className="text-md font-semibold mb-4">Your Selected Skills</h3>
              
              {selectedSkills.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>Search for skills above and select them to add to your resume</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedSkills.map((skill) => (
                    <div 
                      key={skill.id}
                      className={cn(
                        "bg-gray-50 rounded-lg p-3 transition-all duration-200",
                        currentSkill?.id === skill.id ? "border-2 border-blue-500" : "border border-gray-200"
                      )}
                      onClick={() => setCurrentSkill(skill)}
                    >
                      <div className="flex justify-between mb-1">
                        <div className="font-medium">{skill.name}</div>
                        <X
                          className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveSkill(skill);
                          }}
                        />
                      </div>
                      
                      {/* Skill rating */}
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Star
                            key={`star-${skill.id}-${rating}`}
                            className={cn(
                              "h-5 w-5 cursor-pointer transition-colors",
                              rating <= skill.proficiency 
                                ? "text-yellow-400 fill-yellow-400" 
                                : "text-gray-300"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSkillRating(skill, rating);
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Skill details */}
            {currentSkill && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="text-md font-semibold mb-3">Skill Details</h3>
                <p className="text-gray-500 text-sm mb-3">
                  Provide some details about your proficiency with this skill.
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium mb-2">{currentSkill.name}</div>
                  <div className="flex gap-1 mb-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <Star
                        key={`detail-star-${rating}`}
                        className={cn(
                          "h-5 w-5 cursor-pointer transition-colors",
                          rating <= (currentSkill?.proficiency || 0) 
                            ? "text-yellow-400 fill-yellow-400" 
                            : "text-gray-300"
                        )}
                        onClick={() => {
                          if (currentSkill) {
                            handleSkillRating(currentSkill, rating);
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
          
          {/* Right column - Tab Content */}
          <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
            <div className="flex border-b">
              <button
                className={cn(
                  "flex-1 py-4 text-center transition-colors",
                  activeTab === 'text-editor'
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setActiveTab('text-editor')}
              >
                Text Editor
              </button>
              <button
                className={cn(
                  "flex-1 py-4 text-center transition-colors",
                  activeTab === 'job-specific'
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                )}
                onClick={() => setActiveTab('job-specific')}
              >
                Job-specific skills
              </button>
            </div>
            
            <div className="p-4 h-[500px] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
              {activeTab === 'text-editor' ? (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Create Your Professional Skills Section</h2>
                  <p>
                    Search for skills above that are relevant to your target job. Add them to your resume 
                    and rate your proficiency level from 1 to 5 stars.
                  </p>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="text-blue-800 font-semibold mb-2">Tips for selecting skills:</h3>
                    <ul className="list-disc pl-5 space-y-1 text-blue-700">
                      <li>Include a mix of technical and soft skills</li>
                      <li>Prioritize skills mentioned in the job description</li>
                      <li>Only include skills you're comfortable discussing in an interview</li>
                      <li>Be honest with your proficiency ratings</li>
                    </ul>
                  </div>
                  
                  <p>
                    When you search for a specific job title, we'll suggest skills that are commonly 
                    requested for that role, with recommended skills highlighted.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold">Job-Specific Skills</h2>
                  
                  {selectedJobTitle ? (
                    <>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h3 className="text-purple-800 font-semibold mb-2">
                          Skills for {selectedJobTitle.title}
                        </h3>
                        <p className="text-purple-700 mb-3">
                          These skills are frequently requested in job descriptions for 
                          {' '}{selectedJobTitle.title} roles.
                        </p>
                        
                        <div className="bg-white p-3 rounded border border-purple-100">
                          {isLoadingSkills ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader className="h-5 w-5 text-purple-600 animate-spin mr-2" />
                              <span>Loading skills...</span>
                            </div>
                          ) : apiSkills.length > 0 ? (
                            <div className="space-y-2">
                              {apiSkills
                                .filter(skill => skill.isRecommended)
                                .map((skill, index) => (
                                  <div key={`rec-${skill.id}`} className="flex items-center">
                                    <Check className="h-4 w-4 text-green-500 mr-2" />
                                    <span>{skill.name}</span>
                                    <button 
                                      className="ml-auto text-xs text-blue-600 hover:underline"
                                      onClick={() => handleSkillClick(skill.name)}
                                    >
                                      Add
                                    </button>
                                  </div>
                                ))}
                              
                              {apiSkills
                                .filter(skill => !skill.isRecommended)
                                .slice(0, 5)
                                .map((skill, index) => (
                                  <div key={`std-${skill.id}`} className="flex items-center">
                                    <span>{skill.name}</span>
                                    <button 
                                      className="ml-auto text-xs text-blue-600 hover:underline"
                                      onClick={() => handleSkillClick(skill.name)}
                                    >
                                      Add
                                    </button>
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 py-2 text-center">
                              No specific skills found for this job title.
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p>
                        Click "Add" next to any skill to add it to your selected skills list.
                        You can then rate your proficiency with each skill.
                      </p>
                    </>
                  ) : (
                    <div className="bg-gray-100 p-6 rounded-lg text-center">
                      <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="mb-4">
                        Search for a job title above to see skills specific to that role.
                      </p>
                      <Button 
                        size="sm"
                        onClick={() => {
                          searchInputRef.current?.focus();
                          setShowSkillSuggestions(true);
                        }}
                      >
                        Search Job Titles
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default SkillsPage;