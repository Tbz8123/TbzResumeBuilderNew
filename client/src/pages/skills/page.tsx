import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
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
  Undo2
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

// Interface for API skill data
interface APISkill {
  id: number;
  name: string;
  description: string | null;
  isRecommended: boolean | null;
  categoryId: number;
  categoryName?: string;
  relevanceToJob?: 'high' | 'medium' | 'low';
}

// Extract job titles from work experience
const extractJobTitles = (workExperience: any[]): string[] => {
  if (!workExperience || workExperience.length === 0) {
    return [];
  }
  
  return workExperience.map(job => job.jobTitle).filter(Boolean);
};

// Default skills to show (fallback)
const defaultSkills = [
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

const SkillsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resumeData.skills || []);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [activeTab, setActiveTab] = useState('text-editor');
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  const [skillText, setSkillText] = useState('');
  
  // Extract the main job title from resume data
  const jobTitles = extractJobTitles(resumeData.workExperience || []);
  const primaryJobTitle = jobTitles[0] || '';
  
  // Since we're having database schema issues, we'll use static mock data for this demonstration
  // This would normally come from the API endpoint
  const mockJobTitleSkills = React.useMemo(() => {
    if (!primaryJobTitle) return [];
    
    // In a real implementation, this would be fetched from the API
    // Create some mock API skills based on the primary job title
    const jobSpecificSkills: APISkill[] = [
      {
        id: 1,
        name: `${primaryJobTitle} Leadership`,
        description: `Essential leadership skills for ${primaryJobTitle} roles`,
        isRecommended: true,
        categoryId: 1,
        categoryName: 'Leadership',
        relevanceToJob: 'high'
      },
      {
        id: 2,
        name: `${primaryJobTitle} Strategy`,
        description: 'Strategic planning and execution',
        isRecommended: true,
        categoryId: 1,
        categoryName: 'Management',
        relevanceToJob: 'high'
      },
      {
        id: 3,
        name: 'Team Management',
        description: 'People management skills',
        isRecommended: true,
        categoryId: 1,
        categoryName: 'Leadership',
        relevanceToJob: 'high'
      },
      {
        id: 4,
        name: 'Problem Solving',
        description: 'Analytical thinking and problem resolution',
        isRecommended: true,
        categoryId: 2,
        categoryName: 'Personal Skills',
        relevanceToJob: 'high'
      },
      {
        id: 5,
        name: 'Communication',
        description: 'Verbal and written communication',
        isRecommended: true,
        categoryId: 2,
        categoryName: 'Personal Skills',
        relevanceToJob: 'high'
      }
    ];
    
    // Add some domain-specific skills based on the job title
    const techSkills: APISkill[] = defaultSkills.slice(5, 15).map((skill, index) => ({
      id: 100 + index,
      name: skill,
      description: `${skill} for ${primaryJobTitle} projects`,
      isRecommended: index < 3,
      categoryId: 3,
      categoryName: 'Technical Skills',
      relevanceToJob: index < 2 ? 'high' : 'medium'
    }));
    
    return [...jobSpecificSkills, ...techSkills];
  }, [primaryJobTitle]);
  
  // In a production environment, we would use this API endpoint
  // This is commented out due to database schema issues
  /*
  const { data: apiSkills, isLoading, error } = useQuery<APISkill[]>({
    queryKey: ['/api/skills/by-job-title-name', primaryJobTitle],
    queryFn: async () => {
      if (!primaryJobTitle) {
        return [];
      }
      const response = await fetch(`/api/skills/by-job-title-name/${encodeURIComponent(primaryJobTitle)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch skills');
      }
      return response.json();
    },
    enabled: !!primaryJobTitle, // Only run the query if we have a job title
  });
  */
  
  // Use mock data for now until database schema is updated
  const apiSkills = mockJobTitleSkills;
  const isLoading = false; 
  const error = null;
  
  // Fallback to default skills when no API data is available
  const availableSkills = apiSkills?.map(skill => skill.name) || defaultSkills;
  
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
  
  // Filter skills based on search term
  const filteredSkills = searchTerm.trim() !== ''
    ? availableSkills.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : availableSkills.slice(0, 15);
  
  // Get skill categories from API data
  const skillCategories = React.useMemo(() => {
    if (!apiSkills) return [];
    
    const categories: Record<string, string[]> = {};
    apiSkills.forEach(skill => {
      const categoryName = skill.categoryName || 'Uncategorized';
      if (!categories[categoryName]) {
        categories[categoryName] = [];
      }
      categories[categoryName].push(skill.name);
    });
    
    return Object.entries(categories).map(([name, skills]) => ({
      id: name.toLowerCase().replace(/\s/g, '-'),
      title: name,
      skills: skills.slice(0, 5) // limit to 5 skills per category
    }));
  }, [apiSkills]);
  
  // Related skills based on categories or relevance
  const relatedSkills = React.useMemo(() => {
    if (apiSkills && apiSkills.length > 0) {
      // Get skills with high relevance to job
      const highRelevanceSkills = apiSkills
        .filter(skill => skill.relevanceToJob === 'high')
        .map(skill => skill.name)
        .slice(0, 5);
      
      if (highRelevanceSkills.length >= 4) {
        return highRelevanceSkills;
      }
      
      // If not enough high relevance skills, add some from popular categories
      const categoryNames = apiSkills
        .map(s => s.categoryName)
        .filter(Boolean) as string[];
        
      const popularCategoriesSet = new Set(categoryNames);
      const popularCategories = Array.from(popularCategoriesSet).slice(0, 2);
      
      const additionalSkills = apiSkills
        .filter(s => s.categoryName && popularCategories.includes(s.categoryName))
        .map(s => s.name)
        .slice(0, 5 - highRelevanceSkills.length);
      
      return [...highRelevanceSkills, ...additionalSkills];
    }
    
    // Fallback if no API data
    return ['Programming', 'Leadership', 'Communication', 'Teamwork', 'Problem Solving'];
  }, [apiSkills, searchTerm]);
  
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
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setShowSkillSuggestions(true);
    } else {
      setShowSkillSuggestions(false);
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
                {/* Search by skill */}
                <h2 className="text-xs uppercase font-bold text-gray-600 mb-2">
                  SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES
                </h2>
                
                {/* Search input */}
                <div className="relative group mb-6">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-50 group-hover:opacity-70 blur group-hover:blur-md transition duration-300"></div>
                  <div className="relative bg-white rounded-lg">
                    <Input 
                      type="text"
                      ref={searchInputRef}
                      placeholder="Search by skill"
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
                        <div className="py-1">
                          {filteredSkills.slice(0, 5).map((skill, index) => (
                            <div
                              key={`${skill}-${index}`}
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
                        </div>
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
                    <h2 className="text-base font-semibold text-gray-800">
                      {primaryJobTitle 
                        ? `Skills Related to ${primaryJobTitle}` 
                        : "Related Skill Categories"}
                    </h2>
                    {isLoading && (
                      <div className="text-sm text-purple-600 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Loading skills...
                      </div>
                    )}
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
                
                {/* Skill Categories from API */}
                {skillCategories.length > 0 && (
                  <motion.div 
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="mb-6"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="text-base font-semibold text-gray-800">Skill Categories</h2>
                      <button className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors duration-300 flex items-center gap-1 group">
                        More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {skillCategories.slice(0, 3).map((category) => (
                        <div key={category.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <h3 className="text-sm font-medium text-gray-700 mb-2">{category.title}</h3>
                          <div className="flex flex-wrap gap-2">
                            {category.skills.map((skill) => (
                              <button
                                key={`${category.id}-${skill}`}
                                className="text-xs bg-gray-50 hover:bg-purple-50 px-2 py-1 rounded border border-gray-200 hover:border-purple-200 transition-colors"
                                onClick={() => handleSkillClick(skill)}
                              >
                                {skill}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
                
                {/* Results */}
                <motion.div
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="mb-6"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-semibold">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Loading skills...
                        </span>
                      ) : (
                        `${filteredSkills.length} ${primaryJobTitle ? `skills for ${primaryJobTitle}` : 'results'}`
                      )}
                    </h2>
                    
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
                          queryClient.invalidateQueries({ queryKey: ['/api/skills/by-job-title-name', primaryJobTitle] });
                        }}
                        className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                        title="Refresh results"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {error ? (
                    <div className="p-4 border border-red-100 bg-red-50 rounded-lg text-red-600 mb-3">
                      <p className="font-medium">Failed to load skills</p>
                      <p className="text-sm text-red-500 mt-1">Using default skill suggestions instead</p>
                    </div>
                  ) : null}
                  
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 py-2 bg-transparent">
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {isLoading ? (
                        // Loading skeleton
                        Array(5).fill(0).map((_, i) => (
                          <div 
                            key={`skeleton-${i}`} 
                            className="p-3 border border-gray-200 bg-white rounded-lg"
                          >
                            <div className="h-3 bg-gray-200 rounded w-24 mb-2 animate-pulse"></div>
                            <div className="h-5 bg-gray-200 rounded w-40 animate-pulse"></div>
                          </div>
                        ))
                      ) : filteredSkills.map((skill, index) => {
                        // Find the skill object in the API data
                        const skillData = apiSkills?.find(s => s.name === skill);
                        const isHighRelevance = skillData?.relevanceToJob === 'high';
                        const isRecommended = skillData?.isRecommended || index < 3;
                        
                        return (
                          <motion.div
                            key={`${skill}-card-${index}`}
                            variants={itemVariants}
                            className={`p-3 border border-gray-200 ${isRecommended ? 'bg-purple-50' : 'bg-gray-50'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm ${isHighRelevance ? 'border-l-4 border-l-purple-500' : ''}`}
                            onClick={() => handleSkillClick(skill)}
                          >
                            {isRecommended && (
                              <div className="text-xs text-purple-700 font-medium mb-1">
                                {isHighRelevance ? 'Top Skill for ' + primaryJobTitle : 'Expert Recommended'}
                              </div>
                            )}
                            <div className="flex justify-between items-center">
                              <p className="text-gray-800 text-sm">
                                {skill}
                              </p>
                              {skillData?.categoryName && (
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {skillData.categoryName}
                                </span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </div>
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