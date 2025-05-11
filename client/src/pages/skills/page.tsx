import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, ChevronDown, Plus, Search, Star, X, Minus, ArrowRight, RotateCw, Undo2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

// Sample skills by category
const SKILL_CATEGORIES = [
  {
    id: 'technical',
    name: 'Technical Skills',
    skills: [
      'JavaScript', 'React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'GraphQL',
      'Docker', 'AWS', 'Git', 'HTML/CSS', 'React Native', 'Redux', 'Vue.js', 'Angular',
      'Java', 'PHP', 'Laravel', 'Spring Boot', 'MongoDB', 'PostgreSQL', 'MySQL',
      'CI/CD', 'DevOps', 'Machine Learning', 'Data Analysis', 'Kotlin', 'Swift',
      'C#', '.NET', 'REST APIs', 'Microservices', 'Cloud Architecture'
    ]
  },
  {
    id: 'soft',
    name: 'Soft Skills',
    skills: [
      'Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Time Management',
      'Critical Thinking', 'Adaptability', 'Creativity', 'Conflict Resolution',
      'Project Management', 'Negotiation', 'Presentation Skills', 'Customer Service',
      'Interpersonal Skills', 'Detail-Oriented', 'Analytical Thinking', 'Decision Making',
      'Emotional Intelligence', 'Strategic Planning', 'Mentoring'
    ]
  },
  {
    id: 'management',
    name: 'Management Skills',
    skills: [
      'Team Leadership', 'Strategic Planning', 'Project Management', 'Budget Management',
      'Performance Review', 'Hiring', 'Conflict Resolution', 'Decision Making',
      'Delegation', 'Mentoring', 'Change Management', 'Resource Allocation',
      'Business Development', 'Risk Management', 'Process Improvement'
    ]
  },
  {
    id: 'tools',
    name: 'Tools & Software',
    skills: [
      'Microsoft Office', 'Adobe Creative Suite', 'Figma', 'Jira', 'Slack',
      'Asana', 'Trello', 'Salesforce', 'HubSpot', 'Google Analytics',
      'Tableau', 'Power BI', 'SAP', 'QuickBooks', 'Zoom', 'Microsoft Teams',
      'WordPress', 'Shopify', 'AutoCAD', 'Sketch', 'Adobe XD'
    ]
  }
];

// Get related skill categories
const getRelatedCategories = (currentCategory: string | null) => {
  if (!currentCategory) return SKILL_CATEGORIES.slice(0, 4);
  
  // Keep the current category and add 3 more different ones
  const otherCategories = SKILL_CATEGORIES.filter(cat => cat.id !== currentCategory);
  const shuffled = [...otherCategories].sort(() => 0.5 - Math.random());
  const selectedCategory = SKILL_CATEGORIES.find(cat => cat.id === currentCategory);
  
  return selectedCategory ? [selectedCategory, ...shuffled.slice(0, 3)] : shuffled.slice(0, 4);
};

const SkillsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resumeData.skills || []);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [showRatingUI, setShowRatingUI] = useState(false);
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  const [skillDescription, setSkillDescription] = useState('');
  const [showingResults, setShowingResults] = useState('0');
  
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
  
  // Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (e.target.value.trim()) {
      setShowSkillSuggestions(true);
    } else {
      setShowSkillSuggestions(false);
    }
  };
  
  // Filter skills based on search term
  const filteredSkills = searchTerm.trim() !== ''
    ? SKILL_CATEGORIES.flatMap(category => 
        category.skills.filter(skill => 
          skill.toLowerCase().includes(searchTerm.toLowerCase())
        ).map(skill => ({ name: skill, category: category.id }))
      )
    : activeCategory
      ? SKILL_CATEGORIES.find(cat => cat.id === activeCategory)?.skills.map(skill => ({ name: skill, category: activeCategory })) || []
      : SKILL_CATEGORIES.flatMap(category => 
          category.skills.slice(0, 5).map(skill => ({ name: skill, category: category.id }))
        );
  
  // Toggle skill selection
  const addSkill = (skillName: string) => {
    const skillExists = selectedSkills.find(s => s.name === skillName);
    
    if (!skillExists) {
      const newSkill: Skill = {
        name: skillName,
        level: 3, // Default to medium skill level
        id: uuidv4()
      };
      setSelectedSkills([...selectedSkills, newSkill]);
      setCurrentSkill(newSkill);
      setShowRatingUI(true);
      setShowSkillSuggestions(false);
    }
  };
  
  // Set rating for a skill
  const setSkillRating = (skill: Skill, level: number) => {
    const updatedSkills = selectedSkills.map(s => 
      s.id === skill.id ? { ...s, level } : s
    );
    setSelectedSkills(updatedSkills);
  };
  
  // Handle skill click
  const handleSkillClick = (skillName: string) => {
    addSkill(skillName);
  };
  
  // Effect to handle clicks outside the suggestions dropdown
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
  
  // Update showing results count
  useEffect(() => {
    setShowingResults(filteredSkills.length.toString());
  }, [filteredSkills]);
  
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
  
  // Add custom skill from text input
  const addCustomSkill = () => {
    if (skillDescription.trim()) {
      const newSkill: Skill = {
        name: skillDescription.trim(),
        level: 3,
        id: uuidv4()
      };
      setSelectedSkills([...selectedSkills, newSkill]);
      setCurrentSkill(newSkill);
      setShowRatingUI(true);
      setSkillDescription('');
    }
  };
  
  // Remove a skill
  const removeSkill = (skillId: string) => {
    setSelectedSkills(selectedSkills.filter(skill => skill.id !== skillId));
    if (currentSkill?.id === skillId) {
      setCurrentSkill(null);
      setShowRatingUI(false);
    }
  };
  
  // Edit/rate an existing skill
  const editSkill = (skill: Skill) => {
    setCurrentSkill(skill);
    setShowRatingUI(true);
  };
  
  // Save skills to resume context
  const saveSkills = () => {
    updateResumeData({ skills: selectedSkills });
  };
  
  // Save on unmount
  useEffect(() => {
    return () => {
      saveSkills();
    };
  }, [selectedSkills]);
  
  // Related skill categories
  const relatedCategories = getRelatedCategories(activeCategory);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <motion.main 
        className="flex-grow py-6 md:py-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back Button */}
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-purple-600 hover:text-purple-800 transition-colors duration-300"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Education</span>
            </button>
          </motion.div>
          
          {/* Page Title */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
                What skills would you like to highlight?
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <button className="text-purple-600 hover:text-purple-700 bg-purple-50 p-2 rounded-full">
                      <HelpCircle className="h-5 w-5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4">
                    <p className="font-medium mb-2">💡 Skills Tips:</p>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Include skills that are relevant to the job you're applying for</li>
                      <li>Rate your skills honestly - overstating can backfire in interviews</li>
                      <li>Balance technical skills with soft skills</li>
                      <li>Add 5-10 skills that best represent your expertise</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600 text-lg">To get started, you can choose from our expert recommended skills below.</p>
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
                <h2 className="text-xs uppercase font-bold text-gray-600 mb-2">SEARCH FOR SKILLS</h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-50 group-hover:opacity-70 blur group-hover:blur-md transition duration-300"></div>
                  <div className="relative bg-white rounded-lg">
                    <Input 
                      type="text"
                      ref={searchInputRef}
                      placeholder="Search skills (e.g. JavaScript, Leadership)"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="rounded-lg border-gray-300 pr-10 py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white"
                      onFocus={() => {
                        if (filteredSkills.length > 0) {
                          setShowSkillSuggestions(true);
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

                    {/* Skill suggestions dropdown */}
                    {showSkillSuggestions && (
                      <div 
                        ref={suggestionsRef}
                        className="absolute z-50 mt-1 w-full"
                        style={{ top: '100%', left: 0 }}
                      >
                        <div className="bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto backdrop-blur-sm bg-white/80">
                          <div className="py-1">
                            {filteredSkills.length > 0 ? (
                              filteredSkills.map((skill, index) => (
                                <motion.div
                                  key={`${skill.name}-${index}`}
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="px-4 py-3 hover:bg-purple-50 cursor-pointer transition-colors duration-200 border-b border-gray-100 last:border-b-0"
                                  onClick={() => {
                                    setSearchTerm(skill.name);
                                    handleSkillClick(skill.name);
                                  }}
                                >
                                  <div className="font-medium text-gray-900">{skill.name}</div>
                                  <div className="text-xs text-gray-500">
                                    {SKILL_CATEGORIES.find(cat => cat.id === skill.category)?.name}
                                  </div>
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
              
              {/* Related Skill Categories */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="mb-6 bg-white p-5 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-base font-semibold text-gray-800">Skill Categories</h2>
                  <button 
                    className="text-purple-600 text-sm font-medium hover:text-purple-800 transition-colors duration-300 flex items-center gap-1 group"
                    onClick={() => setActiveCategory(null)}
                  >
                    More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {relatedCategories.map((category, index) => (
                    <motion.button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-3 py-2 rounded-lg text-left text-sm ${
                        activeCategory === category.id 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      } transition-colors duration-200`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {category.name}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
              
              {/* Skill Suggestions List */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">{showingResults} results for <span className="text-purple-600">
                    {activeCategory 
                      ? SKILL_CATEGORIES.find(cat => cat.id === activeCategory)?.name 
                      : searchTerm || "All Skills"}
                  </span></h2>
                  
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
                        // Refresh by forcing a re-render
                        setSearchTerm(searchTerm);
                      }}
                      className="text-gray-500 hover:text-purple-600 p-1 rounded-full hover:bg-purple-50 transition-colors"
                      title="Refresh results"
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 py-2">
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {filteredSkills.map((skill, index) => (
                      <motion.div
                        key={`${skill.name}-${index}`}
                        variants={itemVariants}
                        className={`p-3 border ${
                          selectedSkills.some(s => s.name === skill.name)
                            ? 'border-purple-200 bg-purple-50' 
                            : 'border-gray-200 bg-gray-50'
                        } rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                        onClick={() => handleSkillClick(skill.name)}
                      >
                        <div className="flex justify-between items-center">
                          <p className="text-gray-800 font-medium">
                            {skill.name}
                          </p>
                          <div className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                            {SKILL_CATEGORIES.find(cat => cat.id === skill.category)?.name}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
                
                {filteredSkills.length === 0 && (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">No skills found. Try a different search term.</p>
                  </div>
                )}
              </motion.div>
            </div>
            
            {/* Right column - Skill Rating and Custom Addition */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              {/* Custom Skill Input */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Add Custom Skill
                </h2>
                
                <div className="relative mb-4">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg opacity-30 blur"></div>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Enter a custom skill (e.g. Public Speaking)"
                      value={skillDescription}
                      onChange={(e) => setSkillDescription(e.target.value)}
                      className="border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent py-6 bg-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button
                    onClick={addCustomSkill}
                    disabled={!skillDescription.trim()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add Skill
                  </Button>
                </div>
              </div>
              
              {/* Skill Rating UI */}
              {showRatingUI && currentSkill && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
                >
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">
                    Rate Your Proficiency
                  </h2>
                  
                  <div className="text-center mb-6">
                    <div className="font-medium text-xl mb-2">{currentSkill.name}</div>
                    <p className="text-gray-500">How would you rate your skill level?</p>
                  </div>
                  
                  <div className="flex justify-center items-center space-x-2 mb-6">
                    <Minus className="h-4 w-4 text-gray-400" />
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          onClick={() => setSkillRating(currentSkill, rating)}
                          className={`h-10 w-10 ${
                            rating <= currentSkill.level
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          } transition-colors duration-200`}
                        >
                          <Star className="h-full w-full fill-current" />
                        </button>
                      ))}
                    </div>
                    <Plus className="h-4 w-4 text-gray-400" />
                  </div>
                  
                  <div className="grid grid-cols-5 w-full text-xs text-gray-500 px-4 mb-6">
                    <div className="text-center">Beginner</div>
                    <div className="text-center">Basic</div>
                    <div className="text-center">Intermediate</div>
                    <div className="text-center">Advanced</div>
                    <div className="text-center">Expert</div>
                  </div>
                </motion.div>
              )}
              
              {/* Selected Skills Display */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Your Selected Skills
                  </h2>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {selectedSkills.length} skills
                  </Badge>
                </div>
                
                {selectedSkills.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                    {selectedSkills.map((skill) => (
                      <motion.div
                        key={skill.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex justify-between items-center p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                      >
                        <div className="flex items-center">
                          <div className="font-medium">{skill.name}</div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${
                                  star <= skill.level 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              onClick={() => editSkill(skill)}
                              className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50"
                            >
                              <Star className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => removeSkill(skill.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No skills added yet. Search or type a custom skill to add it to your resume.
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
          
          {/* Navigation Buttons */}
          <motion.div 
            className="flex justify-end space-x-4 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handlePreview}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50 px-6 py-2 rounded-md font-medium"
              >
                Preview
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black px-6 py-2 rounded-md shadow-md flex items-center font-medium"
              >
                Next: Skills Summary
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default SkillsPage;