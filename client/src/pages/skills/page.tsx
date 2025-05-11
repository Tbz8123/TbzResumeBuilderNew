import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, ChevronDown, Plus, Search, Star, X, Minus, ArrowRight, RotateCw, Undo2, Bold, Italic, Underline, List, TerminalSquare } from 'lucide-react';
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
import { cn } from '@/lib/utils';


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
  const [activeTab, setActiveTab] = useState('text-editor');
  
  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  
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
    setActiveTab('skills-rating');
  };
  
  // Add one more skill (used in rating view)
  const addOneMore = () => {
    setActiveTab('text-editor');
    setShowRatingUI(false);
    setCurrentSkill(null);
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
        <div className="w-full max-w-6xl mx-auto px-4 md:px-6">
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
                <h2 className="text-xs uppercase font-bold text-purple-800 mb-2">SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES</h2>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-500 rounded-lg opacity-60 group-hover:opacity-100 blur-md group-hover:blur-lg transition duration-300"></div>
                  <div className="relative bg-white rounded-lg shadow-lg">
                    <Input 
                      type="text"
                      ref={searchInputRef}
                      placeholder="Search skills (e.g. JavaScript, Leadership)"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="rounded-lg border-purple-200 pr-10 py-7 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 bg-white shadow-inner text-lg"
                      onFocus={() => {
                        if (filteredSkills.length > 0) {
                          setShowSkillSuggestions(true);
                        }
                      }}
                    />
                    {searchTerm ? (
                      <button 
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-500 hover:text-purple-700 transition-colors duration-300"
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
                className="mb-6 relative rounded-xl shadow-lg"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-lg opacity-20 blur-md"></div>
                <div className="relative bg-white p-5 rounded-xl border border-purple-100">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-600 mr-2"></span>
                      Related Job Titles
                    </h2>
                    <button 
                      className="bg-purple-100 text-purple-600 text-sm font-medium hover:bg-purple-200 transition-colors duration-300 flex items-center gap-1 group px-2 py-1 rounded-md"
                      onClick={() => setActiveCategory(null)}
                    >
                      More <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {relatedCategories.map((category, index) => (
                      <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          duration: 0.3, 
                          delay: index * 0.08,
                          ease: [0.43, 0.13, 0.23, 0.96]
                        }}
                      >
                        <motion.button
                          onClick={() => setActiveCategory(category.id)}
                          className={`w-full px-3 py-2 rounded-lg text-left text-sm ${
                            activeCategory === category.id 
                              ? 'bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 border-purple-200' 
                              : 'bg-white text-gray-700 hover:bg-purple-50 border-gray-200'
                          } transition-all duration-200 border shadow-sm hover:shadow-md`}
                          whileHover={{ 
                            scale: 1.03, 
                            y: -2, 
                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)" 
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {category.name}
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Skill Suggestions List */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="relative rounded-xl shadow-lg"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 to-fuchsia-500 rounded-lg opacity-30 blur-md"></div>
                <div className="relative bg-white rounded-xl p-5 border border-purple-100">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-600 mr-2"></span>
                      <span>{showingResults} results for </span>
                      <span className="text-purple-600 ml-1">
                        {activeCategory 
                          ? SKILL_CATEGORIES.find(cat => cat.id === activeCategory)?.name 
                          : searchTerm || "All Skills"}
                      </span>
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
                          whileHover={{ 
                            scale: 1.02, 
                            boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
                            borderColor: "#a78bfa",
                            y: -2
                          }}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { 
                              duration: 0.4, 
                              delay: index * 0.05, 
                              ease: [0.43, 0.13, 0.23, 0.96] 
                            }
                          }}
                          className={`p-3 border ${
                            selectedSkills.some(s => s.name === skill.name)
                              ? 'border-purple-200 bg-gradient-to-r from-purple-50 to-fuchsia-50' 
                              : 'border-gray-200 bg-white'
                          } rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-md relative`}
                          onClick={() => handleSkillClick(skill.name)}
                        >
                          {selectedSkills.some(s => s.name === skill.name) && (
                            <motion.div 
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="absolute -top-1 -right-1 h-5 w-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs shadow-md"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </motion.div>
                          )}
                          <div className="flex justify-between items-center">
                            <p className="text-gray-800 font-medium">
                              {skill.name}
                            </p>
                            <div className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-600 font-medium">
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
                </div>
              </motion.div>
            </div>
            
            {/* Right column - Tabbed interface for Text Editor and Skills Rating */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b">
                <div 
                  onClick={() => setActiveTab("text-editor")}
                  className={cn(
                    "flex-1 px-6 py-3 text-center font-medium transition-colors cursor-pointer",
                    activeTab === "text-editor" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-600 hover:text-indigo-500"
                  )}
                >
                  Text Editor
                </div>
                <div
                  onClick={() => setActiveTab("skills-rating")}
                  className={cn(
                    "flex-1 px-6 py-3 text-center font-medium transition-colors cursor-pointer",
                    activeTab === "skills-rating" 
                      ? "text-indigo-600 border-b-2 border-indigo-600" 
                      : "text-gray-600 hover:text-indigo-500"
                  )}
                >
                  Skills Rating
                </div>
              </div>
              
              {/* Tab Content */}
              {activeTab === "text-editor" ? (
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-600 mr-2"></span>
                      List Your Professional Skills:
                    </h3>
                    <div className="relative">
                      <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-fuchsia-600 rounded-lg opacity-30 blur-md"></div>
                      <div className="relative">
                        <div
                          ref={editorRef}
                          contentEditable
                          className="min-h-[300px] focus:outline-none border border-purple-200 rounded-md p-4 bg-white empty:before:content-['Add_your_skills_here...'] empty:before:text-gray-400 empty:before:italic shadow-inner"
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <Bold className="h-4 w-4 text-purple-600" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <Italic className="h-4 w-4 text-purple-600" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <Underline className="h-4 w-4 text-purple-600" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <List className="h-4 w-4 text-purple-600" />
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded bg-purple-50 text-purple-600"
                      >
                        <span className="font-bold text-xs">AB</span>
                      </motion.button>
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <svg className="h-4 w-4 rotate-180 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M5 12L11 6M5 12L11 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.button>
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 border border-purple-200 rounded hover:bg-purple-50 transition-colors"
                      >
                        <svg className="h-4 w-4 text-purple-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.button>
                    </div>
                  </div>

                  <div className="flex flex-col mt-5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-700 font-medium">Skills: {selectedSkills.length}</span>
                      </div>
                      <motion.button
                        onClick={() => {
                          addCustomSkill();
                        }}
                        whileHover={{ scale: 1.03, y: -2, boxShadow: "0 4px 12px rgba(124, 58, 237, 0.25)" }}
                        whileTap={{ scale: 0.97 }}
                        className="bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white px-4 py-2 rounded-md transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-1">
                          <span>Enhance with AI</span>
                        </div>
                      </motion.button>
                    </div>
                    
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, selectedSkills.length * 10)}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="bg-gradient-to-r from-purple-500 to-fuchsia-600 h-2.5 rounded-full"
                      ></motion.div>
                    </div>
                    
                    <div className="flex justify-end mt-1">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="flex items-center text-purple-600 text-sm"
                      >
                        <span className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-800 mr-1">?</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  {/* Skills Rating View */}
                  {showRatingUI && currentSkill ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-start mb-8">
                        <div className="p-1 rounded-full bg-purple-600 text-white cursor-pointer hover:bg-purple-700 transition-colors"
                          onClick={() => {
                            if (currentSkill.level > 1) {
                              setSkillRating(currentSkill, currentSkill.level - 1);
                            }
                          }}
                        >
                          <Minus className="h-4 w-4" />
                        </div>
                        <div className="flex ml-3">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <motion.div
                              key={rating}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Star
                                onClick={() => setSkillRating(currentSkill, rating)}
                                className={`h-8 w-8 ${
                                  rating <= currentSkill.level
                                    ? 'text-purple-600 fill-current'
                                    : 'text-gray-300'
                                } cursor-pointer`}
                              />
                            </motion.div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg opacity-30 blur-sm"></div>
                        <div className="relative border border-purple-200 rounded-md p-4 mb-4 bg-white">
                          <div className="font-medium text-xl">{currentSkill.name}</div>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-8">
                        <motion.button
                          onClick={() => {
                            setActiveTab('text-editor');
                            setShowRatingUI(false);
                            setCurrentSkill(null);
                            setSkillDescription('');
                          }}
                          whileHover={{ scale: 1.03, y: -2 }}
                          whileTap={{ scale: 0.97 }}
                          className="flex items-center gap-2 px-4 py-2 border border-purple-600 text-purple-600 rounded-md hover:bg-purple-50 transition-colors"
                        >
                          <Plus className="h-4 w-4" /> Add one more
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="text-center py-10 text-gray-500 flex flex-col items-center">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="mb-4 text-purple-400"
                      >
                        <Star className="h-16 w-16 opacity-30" />
                      </motion.div>
                      <p>Select a skill to rate or add a new skill from the left panel.</p>
                    </div>
                  )}
                  
                  {/* Skills Progress Bar */}
                  <div className="flex flex-col mt-16">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-700 font-medium">Skills: {selectedSkills.length}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, selectedSkills.length * 10)}%` }}></div>
                    </div>
                    
                    <div className="flex justify-end mt-1">
                      <button className="flex items-center text-indigo-600 text-sm">
                        <span className="h-5 w-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 mr-1">?</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
            
            {/* Selected Skills Display (Below Tabs) */}
            {selectedSkills.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-6"
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">
                    Your Selected Skills
                  </h2>
                  <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                    {selectedSkills.length} skills
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <Badge 
                      key={skill.id} 
                      className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-1.5 flex items-center gap-1"
                      onClick={() => editSkill(skill)}
                    >
                      {skill.name} ({skill.level}/5)
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          removeSkill(skill.id);
                        }}
                        className="ml-1 text-purple-600 hover:text-purple-800 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </div>
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
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