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

// Default skills to show
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
    ? defaultSkills.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : defaultSkills.slice(0, 15);
  
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
                    <h2 className="font-semibold">{filteredSkills.length} results</h2>
                    
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
                          setSearchTerm(searchTerm); 
                        }}
                        className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                        title="Refresh results"
                      >
                        <RotateCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 py-2">
                    <motion.div 
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                      className="space-y-3"
                    >
                      {filteredSkills.map((skill, index) => (
                        <motion.div
                          key={`${skill}-card-${index}`}
                          variants={itemVariants}
                          className={`p-3 border border-gray-200 ${index < 3 ? 'bg-purple-50' : 'bg-gray-50'} rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
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
                      ))}
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
                            <div className="p-6 mb-6">
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