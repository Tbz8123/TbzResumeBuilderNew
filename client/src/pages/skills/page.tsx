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
  ArrowDownUp 
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

// Sample skills by category
const SKILL_CATEGORIES = [
  {
    id: 'management',
    name: 'Management Skills',
    skills: 15,
    skillsList: [
      'Team Leadership', 'Strategic Planning', 'Project Management', 'Budget Management',
      'Performance Review', 'Hiring', 'Conflict Resolution', 'Decision Making',
      'Delegation', 'Mentoring', 'Change Management', 'Resource Allocation',
      'Business Development', 'Risk Management', 'Process Improvement'
    ]
  },
  {
    id: 'tools',
    name: 'Tools & Software',
    skills: 21,
    skillsList: [
      'Microsoft Office', 'Adobe Creative Suite', 'Figma', 'Jira', 'Slack',
      'Asana', 'Trello', 'Salesforce', 'HubSpot', 'Google Analytics',
      'Tableau', 'Power BI', 'SAP', 'QuickBooks', 'Zoom', 'Microsoft Teams',
      'WordPress', 'Shopify', 'AutoCAD', 'Sketch', 'Adobe XD'
    ]
  },
  {
    id: 'technical',
    name: 'Technical Skills',
    skills: 33,
    skillsList: [
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
    skills: 20,
    skillsList: [
      'Communication', 'Teamwork', 'Problem Solving', 'Leadership', 'Time Management',
      'Critical Thinking', 'Adaptability', 'Creativity', 'Conflict Resolution',
      'Project Management', 'Negotiation', 'Presentation Skills', 'Customer Service',
      'Interpersonal Skills', 'Detail-Oriented', 'Analytical Thinking', 'Decision Making',
      'Emotional Intelligence', 'Strategic Planning', 'Mentoring'
    ]
  }
];

const SkillsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>(resumeData.skills || []);
  const [activeSkillResults, setActiveSkillResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('text-editor');
  const [isFocused, setIsFocused] = useState(false);
  const [currentCharCount, setCurrentCharCount] = useState(0);
  const [currentSkill, setCurrentSkill] = useState<Skill | null>(null);
  
  // Refs
  const textareaRef = useRef<HTMLDivElement>(null);

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

  // Function to handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Search results logic for skills
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setActiveSkillResults([
        'Team Leadership',
        'Strategic Planning',
        'Project Management',
        'Budget Management',
        'Performance Review'
      ]);
    } else {
      const allSkills = SKILL_CATEGORIES.flatMap(cat => cat.skillsList);
      const filtered = allSkills.filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, 15);
      setActiveSkillResults(filtered);
    }
  }, [searchTerm]);

  // Update character count
  useEffect(() => {
    if (textareaRef.current) {
      const text = textareaRef.current.innerText || '';
      setCurrentCharCount(text.length);
    }
  }, [textareaRef.current?.innerText]);

  // Handle clicks on skill suggestions
  const handleSkillClick = (skillName: string) => {
    // Add the skill to textarea
    if (textareaRef.current) {
      let currentText = textareaRef.current.innerHTML || '';
      if (currentText.trim() === '') {
        textareaRef.current.innerHTML = `• ${skillName}`;
      } else {
        textareaRef.current.innerHTML = `${currentText}\n• ${skillName}`;
      }
      setCurrentCharCount(textareaRef.current.innerText.length);
    }
    
    // Add to skills list
    const skillExists = selectedSkills.find(s => s.name === skillName);
    if (!skillExists) {
      const newSkill: Skill = {
        id: uuidv4(),
        name: skillName,
        level: 3 // default level
      };
      setSelectedSkills([...selectedSkills, newSkill]);
      setCurrentSkill(newSkill);
    }
  };

  // Function to rate a skill
  const rateSkill = (skillId: string, level: number) => {
    const updatedSkills = selectedSkills.map(skill => 
      skill.id === skillId ? { ...skill, level } : skill
    );
    setSelectedSkills(updatedSkills);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white shadow-sm sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>

      <main className="pb-16 pt-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          {/* Back button */}
          <button 
            onClick={handleBack} 
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Education</span>
          </button>

          {/* Page title */}
          <div className="flex justify-between items-start mb-6">
            <h1 className="text-3xl font-bold text-purple-600">
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

          {/* Two column layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left column - Search and list */}
            <div>
              {/* Search by skill */}
              <h2 className="text-xs uppercase font-bold text-gray-500 mb-3">
                SEARCH BY SKILL FOR PRE-WRITTEN EXAMPLES
              </h2>

              {/* Search input */}
              <div className="relative rounded-lg shadow-sm mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-200 to-purple-200 rounded-lg opacity-30 -m-0.5 blur-sm"></div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search skills (e.g. JavaScript, Leadership)"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-4 pr-10 py-6 border-purple-200 rounded-lg"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Search className="h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Related Skill Categories */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-purple-600 mr-2"></div>
                    <h2 className="text-sm font-medium">Related Skill Categories</h2>
                  </div>
                  <button className="text-purple-600 text-sm flex items-center hover:underline">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {SKILL_CATEGORIES.map((category) => (
                    <div 
                      key={category.id}
                      className="p-3 rounded-md border border-gray-200 hover:border-purple-300 transition-colors"
                    >
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-xs text-gray-500">{category.skills} skills</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Results */}
              <div className="rounded-md mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm font-medium">{activeSkillResults.length} results</div>
                  <div className="flex space-x-2">
                    <button className="text-gray-500 hover:text-purple-600">
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button className="text-gray-500 hover:text-purple-600">
                      <ArrowDownUp className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                  {activeSkillResults.map((skill, index) => (
                    <div
                      key={`${skill}-${index}`}
                      className="p-3 border border-gray-200 rounded-md hover:border-purple-300 cursor-pointer transition-colors"
                      onClick={() => handleSkillClick(skill)}
                    >
                      <p className="text-sm text-gray-800">{skill}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right column - Text editor / Skill rating */}
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

              {/* Editor Title */}
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                Your Professional Skills
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                List your key skills below:
              </p>

              {/* Main content area based on active tab */}
              {activeTab === "text-editor" ? (
                <>
                  {/* Text editor */}
                  <div className="mb-4 relative">
                    <div
                      ref={textareaRef}
                      contentEditable
                      className="min-h-[250px] w-full p-4 bg-purple-50 bg-opacity-30 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-300 transition-all empty:before:content-['Add_your_skills_here...'] empty:before:text-gray-400 empty:before:italic"
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                    />
                  </div>

                  {/* Character count and tips */}
                  <div className="flex justify-between items-center text-sm">
                    <div className="text-gray-500">
                      Use a bullet (•) before each skill
                    </div>
                    <div className="text-purple-600">
                      Be specific and relevant
                    </div>
                  </div>
                </>
              ) : (
                /* Skills Rating UI */
                <div className="bg-white p-6 rounded-lg border border-gray-200">
                  {currentSkill ? (
                    <div>
                      <h3 className="text-lg font-medium mb-4">
                        Rate your proficiency in {currentSkill.name}
                      </h3>
                      <div className="grid grid-cols-5 gap-3 mb-4">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <button
                            key={level}
                            onClick={() => rateSkill(currentSkill.id, level)}
                            className={`flex flex-col items-center ${
                              level <= (currentSkill.level || 0)
                                ? "text-yellow-500"
                                : "text-gray-300"
                            }`}
                          >
                            <Star
                              className={`h-8 w-8 ${
                                level <= (currentSkill.level || 0)
                                  ? "fill-yellow-500"
                                  : ""
                              }`}
                            />
                            <span className="text-xs mt-1">{level}</span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-600 mb-2">Select another skill to rate:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedSkills.map((skill) => (
                            <button
                              key={skill.id}
                              onClick={() => setCurrentSkill(skill)}
                              className={`px-3 py-1.5 rounded-full text-sm border ${
                                skill.id === currentSkill.id
                                  ? "border-purple-400 bg-purple-50 text-purple-700"
                                  : "border-gray-200 text-gray-700 hover:border-purple-200"
                              }`}
                            >
                              {skill.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="mx-auto w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                        <Plus className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">Rate Your Skills</h3>
                      <p className="text-gray-600 mb-4">
                        Add skills from the left panel, then rate your proficiency level for each skill.
                      </p>
                    </div>
                  )}
                </div>
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
        </div>
      </main>
    </div>
  );
};

export default SkillsPage;