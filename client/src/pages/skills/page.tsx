import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Plus, Search, Star, X, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import { Badge } from '@/components/ui/badge';

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

const SkillsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resumeData.skills || []);
  const [activeTab, setActiveTab] = useState('text-editor');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [skillsByJob, setSkillsByJob] = useState<string[]>([]);
  
  // State for displaying rating UI
  const [currentSkillForRating, setCurrentSkillForRating] = useState<Skill | null>(null);
  const [showRatingUI, setShowRatingUI] = useState(false);
  
  // Ref for the text editor content
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Handle searching for skills
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Clear search term
  const clearSearch = () => {
    setSearchTerm('');
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
  const toggleSkill = (skillName: string) => {
    const skillExists = selectedSkills.find(s => s.name === skillName);
    
    if (skillExists) {
      setSelectedSkills(selectedSkills.filter(s => s.name !== skillName));
    } else {
      const newSkill: Skill = {
        name: skillName,
        level: 3, // Default to medium skill level
        id: uuidv4()
      };
      setSelectedSkills([...selectedSkills, newSkill]);
      showRatingFor(newSkill);
    }
  };
  
  // Show rating UI for a skill
  const showRatingFor = (skill: Skill) => {
    setCurrentSkillForRating(skill);
    setShowRatingUI(true);
    setActiveTab('skills-rating');
  };
  
  // Set rating for a skill
  const setSkillRating = (skill: Skill, level: number) => {
    const updatedSkills = selectedSkills.map(s => 
      s.id === skill.id ? { ...s, level } : s
    );
    setSelectedSkills(updatedSkills);
  };
  
  // Add a custom skill from the text editor
  const addCustomSkill = () => {
    if (editorRef.current && editorRef.current.textContent?.trim()) {
      const skillName = editorRef.current.textContent.trim();
      if (!selectedSkills.find(s => s.name === skillName)) {
        const newSkill: Skill = {
          name: skillName,
          level: 3,
          id: uuidv4()
        };
        setSelectedSkills([...selectedSkills, newSkill]);
        showRatingFor(newSkill);
        
        // Clear the editor
        if (editorRef.current) {
          editorRef.current.textContent = '';
        }
      }
    }
  };

  // Add one more skill
  const addOneMore = () => {
    setActiveTab('text-editor');
    setShowRatingUI(false);
    setCurrentSkillForRating(null);
  };
  
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
  
  // Animation variants
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
  
  // Prepare skill categories for display
  const uniqueCategories = Array.from(new Set(
    SKILL_CATEGORIES.map(category => category.id)
  ));
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow py-6 md:py-10 overflow-x-hidden">
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6">
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
                What skills would you like to highlight?
              </h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="flex items-center gap-1 text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 p-2 rounded-full transition-all duration-300">
                      <HelpCircle className="h-5 w-5" />
                      <span className="hidden sm:inline font-medium">Tips</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4 bg-white border border-purple-100 shadow-lg text-gray-700">
                    <p className="font-medium text-gray-900 mb-2">💡 Skills Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Include skills that are relevant to the job you're applying for</li>
                      <li>Rate your skills honestly - overstating can backfire in interviews</li>
                      <li>Balance technical skills with soft skills</li>
                      <li>Customize your skill set for each application</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600 text-lg mb-6">
              Choose from our pre-written examples below or write your own.
            </p>
            
            {/* Main Skills Interface */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column - Skill Selection */}
              <div className="md:col-span-5">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h2 className="font-medium text-gray-900 mb-4 uppercase text-xs tracking-wider">
                    SEARCH BY JOB TITLE FOR PRE-WRITTEN EXAMPLES
                  </h2>
                  
                  {/* Search Box */}
                  <div className="relative mb-4">
                    <Input
                      type="text"
                      placeholder="Search skills..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="pl-10 pr-10 py-2 w-full"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    {searchTerm && (
                      <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 flex items-center pr-3"
                      >
                        <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                  
                  {/* Related Job Titles */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-sm text-gray-700">Related Skill Categories</h3>
                      <button 
                        className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
                        onClick={() => setActiveCategory(null)}
                      >
                        More <ChevronDown className="h-3 w-3" />
                      </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {SKILL_CATEGORIES.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setActiveCategory(category.id)}
                          className={`inline-flex items-center text-sm px-3 py-1 rounded-full ${
                            activeCategory === category.id
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-white text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Results Stats and Filters */}
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-sm text-gray-500">
                      {searchTerm.trim() !== '' && (
                        <span>Showing results for "{searchTerm}"</span>
                      )}
                      {activeCategory && searchTerm.trim() === '' && (
                        <span>Showing results for "{SKILL_CATEGORIES.find(c => c.id === activeCategory)?.name}"</span>
                      )}
                    </div>
                    <button className="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1">
                      Filter by Keyword <span className="text-gray-400">|</span> <ChevronDown className="h-3 w-3" />
                    </button>
                  </div>
                  
                  {/* Skills List */}
                  <div className="space-y-1 max-h-[500px] overflow-y-auto">
                    <AnimatePresence>
                      {filteredSkills.map((skill, index) => (
                        <motion.div
                          key={`${skill.name}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`relative border rounded-md p-3 ${
                            selectedSkills.some(s => s.name === skill.name)
                              ? 'bg-purple-50 border-purple-200'
                              : 'bg-white border-gray-200 hover:border-purple-200'
                          }`}
                        >
                          <div className="flex items-start">
                            <button
                              onClick={() => toggleSkill(skill.name)}
                              className="absolute inset-0 w-full h-full cursor-pointer"
                              aria-label={`Select ${skill.name}`}
                            ></button>
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedSkills.some(s => s.name === skill.name)
                                ? 'bg-purple-600 text-white'
                                : 'bg-slate-100 text-gray-400'
                            }`}>
                              {selectedSkills.some(s => s.name === skill.name) ? (
                                <span className="text-xs font-bold">✓</span>
                              ) : (
                                <Plus className="h-3 w-3" />
                              )}
                            </div>
                            <div className="ml-3 flex-1">
                              <p className="font-medium text-gray-800">{skill.name}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              
              {/* Right Column - Editor and Rating */}
              <div className="md:col-span-7">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text-editor">Text Editor</TabsTrigger>
                    <TabsTrigger value="skills-rating">Skills Rating</TabsTrigger>
                  </TabsList>
                  
                  {/* Text Editor Tab */}
                  <TabsContent value="text-editor" className="mt-4">
                    <div className="rounded-md border border-gray-200 p-4 mt-2">
                      <h3 className="font-medium text-gray-700 mb-2">Skills:</h3>
                      <div
                        ref={editorRef}
                        contentEditable
                        className="min-h-[150px] focus:outline-none border border-gray-200 rounded-md p-4 mb-4"
                        placeholder="Add your skills here."
                      ></div>
                      
                      <div className="flex justify-end">
                        <Button 
                          onClick={addCustomSkill}
                          variant="outline" 
                          className="text-purple-600 border-purple-200 hover:bg-purple-50"
                        >
                          Add Skill
                        </Button>
                      </div>
                    </div>
                    
                    {/* Selected Skills Preview */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-700">Skills: {selectedSkills.length}</h3>
                        <button className="text-purple-600 hover:text-purple-800 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600">?</span> Help
                          </div>
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 min-h-[50px]">
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <Badge 
                              key={skill.id} 
                              className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-1 flex items-center gap-1"
                            >
                              {skill.name}
                              <button 
                                onClick={() => setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id))}
                                className="ml-1 text-purple-600 hover:text-purple-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Skills Rating Tab */}
                  <TabsContent value="skills-rating" className="mt-4">
                    {showRatingUI && currentSkillForRating && (
                      <div className="rounded-md border border-gray-200 p-6 mt-2">
                        <div className="flex flex-col items-center mb-4">
                          <h3 className="font-medium text-gray-800 text-lg mb-2">Rate your proficiency</h3>
                          <div className="text-center mb-6">
                            <div className="font-medium text-lg mb-2">{currentSkillForRating.name}</div>
                            <p className="text-gray-500 text-sm">How would you rate your skill level?</p>
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <Minus className="h-4 w-4 text-gray-400" />
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                  key={rating}
                                  onClick={() => setSkillRating(currentSkillForRating, rating)}
                                  className={`h-8 w-8 ${
                                    rating <= (selectedSkills.find(s => s.id === currentSkillForRating.id)?.level || 0)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  <Star className="h-full w-full fill-current" />
                                </button>
                              ))}
                            </div>
                            <Plus className="h-4 w-4 text-gray-400" />
                          </div>
                          
                          <div className="grid grid-cols-5 w-full text-xs text-gray-500 px-6">
                            <div className="text-center">Beginner</div>
                            <div className="text-center">Basic</div>
                            <div className="text-center">Intermediate</div>
                            <div className="text-center">Advanced</div>
                            <div className="text-center">Expert</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-end mt-6">
                          <Button 
                            onClick={addOneMore}
                            variant="outline" 
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Add one more
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Skills Preview */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-3">
                        <h3 className="font-medium text-gray-700">Skills: {selectedSkills.length}</h3>
                        <button className="text-purple-600 hover:text-purple-800 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-blue-600">?</span> Help
                          </div>
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-md p-3 min-h-[50px]">
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <Badge 
                              key={skill.id} 
                              className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-3 py-1 flex items-center gap-1"
                              onClick={() => showRatingFor(skill)}
                            >
                              {skill.name} ({skill.level}/5)
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedSkills(selectedSkills.filter(s => s.id !== skill.id));
                                }}
                                className="ml-1 text-purple-600 hover:text-purple-800"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Navigation Buttons */}
            <div className="mt-10 flex justify-between items-center">
              <Button 
                variant="outline" 
                onClick={handlePreview}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                Preview
              </Button>
              
              <Button 
                onClick={handleNext}
                className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600"
              >
                Next: Summary
              </Button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SkillsPage;