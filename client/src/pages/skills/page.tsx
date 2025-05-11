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
      
      <main className="flex-grow py-6 md:py-10 overflow-x-hidden">
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
                  <TooltipTrigger asChild>
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
                <h2 className="text-xs uppercase font-bold text-gray-600 mb-2">SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES</h2>
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
                className="mb-6 relative rounded-xl shadow-lg"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg opacity-20 blur-md"></div>
                <div className="relative bg-white p-5 rounded-xl border border-purple-100">
                  <div className="flex justify-between items-center mb-3">
                    <h2 className="text-base font-semibold text-gray-800 flex items-center">
                      <span className="h-3 w-3 rounded-full bg-purple-600 mr-2"></span>
                      Related Skill Categories
                    </h2>
                    <button 
                      className="bg-purple-100 text-purple-600 text-sm font-medium hover:bg-purple-200 transition-colors duration-300 flex items-center gap-1 group px-2 py-1 rounded-md"
                      onClick={() => setActiveCategory(null)}
                    >
                      View All <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {relatedCategories.map((category, index) => (
                      <motion.button 
                        key={category.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (index * 0.1) }}
                        className={`flex flex-col items-start justify-between p-3 rounded-lg border transition-all duration-300 hover:shadow-md ${activeCategory === category.id ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-200'}`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <div className="font-medium text-left">{category.name}</div>
                        <div className="text-xs text-gray-500">{category.skills.length} skills</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
              
              {/* Popular Skills */}
              <motion.div 
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">{showingResults} results</h2>
                  
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
                
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 py-2">
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-3"
                  >
                    {filteredSkills.slice(0, 10).map((skill, index) => (
                      <motion.div
                        key={`${skill.name}-card-${index}`}
                        variants={itemVariants}
                        className={`p-3 border border-gray-200 bg-gray-50 rounded-lg cursor-pointer transition-all duration-300 hover:border-purple-300 hover:shadow-sm`}
                        onClick={() => handleSkillClick(skill.name)}
                      >
                        <p className="text-gray-800 text-sm">
                          {skill.name}
                        </p>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              </motion.div>
            </div>
            
            {/* Right column - Tabbed interface for Text Editor and Skills Rating */}
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              {/* Tabs */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <button 
                    onClick={() => setActiveTab("text-editor")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                      activeTab === "text-editor" 
                        ? "bg-purple-100 text-purple-700" 
                        : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                    )}
                  >
                    Text Editor
                  </button>
                  <button
                    onClick={() => setActiveTab("skills-rating")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-full transition-colors",
                      activeTab === "skills-rating" 
                        ? "bg-purple-100 text-purple-700" 
                        : "text-gray-600 hover:text-purple-700 hover:bg-purple-50"
                    )}
                  >
                    Skills Rating
                  </button>
                </div>
              </div>
              
              {/* Tab Content */}
              {activeTab === "text-editor" ? (
                <div>
                  <div className="mb-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-lg font-semibold text-gray-800">
                        Your Professional Skills
                      </h2>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">List your key skills below:</p>
                  
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg opacity-30 blur"></div>
                    <div className="relative">
                      <div
                        ref={editorRef}
                        contentEditable
                        className="w-full h-[300px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 empty:before:content-['Add_your_skills_here...'] empty:before:text-gray-400 empty:before:italic"
                      ></div>
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
                </div>
              ) : (
                <div>
                  {currentSkill ? (
                    <div>
                      <h3 className="text-lg font-medium text-gray-800 mb-4">Rate your proficiency in {currentSkill.name}</h3>
                      
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-gray-500">Beginner</span>
                          <span className="text-xs text-gray-500">Expert</span>
                        </div>
                        <div className="flex items-center justify-between">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <button 
                              key={level}
                              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${level <= currentSkill.level ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-purple-200'}`}
                              onClick={() => setSkillRating(currentSkill, level)}
                            >
                              <Star className={`h-5 w-5 ${level <= currentSkill.level ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs font-medium">
                            {currentSkill.level === 1 && 'Basic understanding'}
                            {currentSkill.level === 2 && 'Working knowledge'}
                            {currentSkill.level === 3 && 'Proficient'}
                            {currentSkill.level === 4 && 'Advanced'}
                            {currentSkill.level === 5 && 'Expert level'}
                          </span>
                          <span className="text-xs text-purple-600 font-medium">{currentSkill.level}/5</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end mt-8">
                        <motion.button
                          onClick={addOneMore}
                          whileHover={{ scale: 1.03, y: -2 }}
                          className="bg-purple-600 text-white font-medium rounded-full px-5 py-2 text-sm shadow-sm hover:bg-purple-700 transition-colors"
                        >
                          Add Another Skill
                        </motion.button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="text-gray-400 mb-3">
                        <Plus className="w-12 h-12" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-2">Add a Skill to Rate</h3>
                      <p className="text-gray-600 text-center mb-6 max-w-md">
                        Click on a skill from the list on the left, or add a custom one below.
                      </p>
                      
                      <div className="w-full max-w-sm">
                        <Input
                          placeholder="Enter custom skill name"
                          value={skillDescription}
                          onChange={(e) => setSkillDescription(e.target.value)}
                          className="mb-3"
                        />
                        <Button 
                          onClick={addCustomSkill}
                          disabled={!skillDescription.trim()}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Add Custom Skill
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Navigation buttons */}
              <div className="flex justify-between items-center mt-8">
                <button
                  onClick={handlePreview}
                  className="text-purple-600 hover:text-purple-800 border border-purple-600 hover:border-purple-800 font-medium rounded-full px-10 py-2.5 text-base transition-colors duration-300 hover:bg-purple-50"
                >
                  Preview
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full px-10 py-2.5 text-base transition-colors duration-300 shadow-sm hover:shadow"
                >
                  Next
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Selected Skills Display (Below Tabs) */}
          {selectedSkills.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-8 bg-white p-6 rounded-xl shadow-md border border-gray-100"
            >
              <h3 className="text-lg font-medium text-gray-800 mb-4">Your Selected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {selectedSkills.map((skill) => (
                  <Badge
                    key={skill.id}
                    variant="outline"
                    className="px-3 py-2 rounded-full text-sm font-medium bg-gray-50 border-gray-200 text-gray-700 flex items-center gap-1"
                  >
                    <div className="flex items-center">
                      {skill.name}
                      <span className="ml-2 flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${i < skill.level ? 'fill-purple-500 text-purple-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </span>
                    </div>
                    <div className="ml-1 flex space-x-1">
                      <button 
                        className="text-gray-400 hover:text-purple-600 p-0.5 rounded-full focus:outline-none"
                        onClick={() => editSkill(skill)}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                        </svg>
                      </button>
                      <button 
                        className="text-gray-400 hover:text-red-600 p-0.5 rounded-full focus:outline-none"
                        onClick={() => removeSkill(skill.id)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </Badge>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          © 2025 TbzResumeBuilder. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default SkillsPage;