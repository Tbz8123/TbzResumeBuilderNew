import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume, Education } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

// Define achievement interface
interface EducationAchievement {
  id?: string;
  type: 'achievement' | 'prize' | 'coursework' | 'activity' | 'study_abroad' | 'apprenticeship' | 'project';
  title: string;
  description?: string;
}

// List of degrees
const degreeOptions = [
  'Bachelor of Arts (BA)',
  'Bachelor of Science (BS)',
  'Bachelor of Fine Arts (BFA)',
  'Bachelor of Business Administration (BBA)',
  'Master of Arts (MA)',
  'Master of Science (MS)',
  'Master of Business Administration (MBA)',
  'Master of Fine Arts (MFA)',
  'Doctor of Philosophy (PhD)',
  'Doctor of Medicine (MD)',
  'Juris Doctor (JD)',
  'Associate Degree',
  'High School Diploma',
  'GED',
  'Certificate',
  'Diploma',
  'Other'
];

// Months for graduation date
const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Type definitions for education categories and examples from the API
interface EducationExample {
  id: number;
  categoryId: number;
  content: string;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

interface EducationCategory {
  id: number;
  name: string;
  description: string;
  type: string;
  createdAt: string;
  updatedAt: string;
  examples: EducationExample[];
}

const EducationPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [educationCategories, setEducationCategories] = useState<EducationCategory[]>([]);
  
  // Get current education or initialize if none exists
  const defaultEducation: Education = {
    institution: '',
    location: '',
    degree: '',
    startDate: '',
    endDate: '',
    description: ''
  };
  
  // For tracking achievements separately (not in the original Education interface)
  const [achievements, setAchievements] = useState<EducationAchievement[]>([]);
  
  // Get the education index from URL if present
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const urlIndex = searchParams.get('index');
  
  // Current education data - Use the specified index or default to the last entry if adding new
  const [editIndex, setEditIndex] = useState(() => {
    if (urlIndex) {
      const index = parseInt(urlIndex);
      return isNaN(index) ? 0 : index;
    }
    return resumeData.education.length > 0 ? resumeData.education.length - 1 : 0;
  });
  
  // Initialize education state from resumeData at the specified index or with a default
  const [currentEducation, setCurrentEducation] = useState<Education>(() => {
    if (resumeData.education && resumeData.education.length > 0) {
      if (urlIndex) {
        const index = parseInt(urlIndex);
        if (!isNaN(index) && index >= 0 && index < resumeData.education.length) {
          return resumeData.education[index];
        }
      }
      return resumeData.education[resumeData.education.length - 1]; // Default to most recent entry
    }
    return defaultEducation;
  });
  
  // State for expanded sections
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  // State for showing additional coursework section
  const [showAdditionalCoursework, setShowAdditionalCoursework] = useState(false);

  // Fetch education categories and examples from the API
  useEffect(() => {
    const fetchEducationCategories = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/education/categories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch education categories');
        }
        
        const data = await response.json();
        setEducationCategories(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching education categories:', err);
        setError('Failed to load education options. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEducationCategories();
  }, []);
  
  // Handle education form changes
  const handleEducationChange = (field: keyof Education, value: string) => {
    setCurrentEducation(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };
  
  // Add achievement to education
  const addAchievement = (type: string, title: string) => {
    const newAchievement: EducationAchievement = {
      id: uuidv4(),
      type: type as any,
      title
    };
    
    setAchievements(prev => [...prev, newAchievement]);
  };
  
  // Generate years for graduation date dropdown (recent 20 years)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear + 5; i >= currentYear - 20; i--) {
      years.push(i.toString());
    }
    return years;
  };
  
  const years = generateYears();
  
  // Navigation handlers
  const handleBack = () => {
    saveEducation();
    setLocation('/work-history-summary');
  };
  
  const handleNext = () => {
    saveEducation();
    setLocation('/education-summary');
  };
  
  const handlePreview = () => {
    saveEducation();
    setLocation('/preview');
  };
  
  // Save education data to resume context
  const saveEducation = () => {
    if (currentEducation.institution.trim()) {
      const updatedEducation = [...(resumeData.education || [])];
      
      // Combine achievements with education description
      const achievementsText = achievements.map(a => `• ${a.title}`).join('\n');
      const fullDescription = currentEducation.description 
        ? (achievementsText ? `${currentEducation.description}\n\n${achievementsText}` : currentEducation.description)
        : achievementsText;
        
      const updatedEntry = {
        ...currentEducation,
        description: fullDescription
      };
      
      // Check if we're editing an existing education or adding a new one
      if (editIndex >= 0 && editIndex < updatedEducation.length) {
        // Update existing education entry at the specified index
        updatedEducation[editIndex] = updatedEntry;
      } else {
        // Add new education
        updatedEducation.push(updatedEntry);
        // Update edit index to point to the newly added education
        setEditIndex(updatedEducation.length - 1);
      }
      
      updateResumeData({ education: updatedEducation });
    }
  };
  
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
  
  // Save on unmount with updated education data
  useEffect(() => {
    // Define the cleanup function inside to capture the latest state
    const saveOnUnmount = () => {
      if (currentEducation.institution.trim()) {
        const updatedEducation = [...(resumeData.education || [])];
        
        // Combine achievements with education description
        const achievementsText = achievements.map(a => `• ${a.title}`).join('\n');
        const fullDescription = currentEducation.description 
          ? (achievementsText ? `${currentEducation.description}\n\n${achievementsText}` : currentEducation.description)
          : achievementsText;
          
        const updatedEntry = {
          ...currentEducation,
          description: fullDescription
        };
        
        // Update or add the education entry based on editIndex
        if (editIndex >= 0 && editIndex < updatedEducation.length) {
          updatedEducation[editIndex] = updatedEntry;
        } else {
          updatedEducation.push(updatedEntry);
        }
        
        updateResumeData({ education: updatedEducation });
      }
    };
    
    return saveOnUnmount;
  }, [currentEducation, achievements, editIndex, resumeData.education, updateResumeData]);
  
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
                Tell us about your education
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
                    <p className="font-medium text-gray-900 mb-2">💡 Education Tips:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Include your highest level of education first</li>
                      <li>You can list honors, achievements, and relevant coursework</li>
                      <li>If you're currently studying, mention your expected graduation date</li>
                      <li>For recent graduates, include your GPA if it's impressive</li>
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600 text-lg mb-6">
              Enter your education experience so far, even if you are a current student or did not graduate.
            </p>
            
            <div className="text-sm text-gray-500 mb-6">
              <span className="text-red-500">*</span> indicates a required field
            </div>
            
            {/* Education Form */}
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-6"
            >
              {/* School Name */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="institution" className="block text-sm font-medium text-gray-700">
                  SCHOOL NAME <span className="text-red-500">*</span>
                </label>
                <Input
                  id="institution"
                  type="text"
                  placeholder="e.g. Delhi University"
                  value={currentEducation.institution}
                  onChange={(e) => handleEducationChange('institution', e.target.value)}
                  className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </motion.div>
              
              {/* School Location */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                  SCHOOL LOCATION
                </label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g. Delhi, India"
                  value={currentEducation.location}
                  onChange={(e) => handleEducationChange('location', e.target.value)}
                  className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </motion.div>
              
              {/* Degree */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="degree" className="block text-sm font-medium text-gray-700">
                  DEGREE
                </label>
                <Select
                  value={currentEducation.degree}
                  onValueChange={(value) => handleEducationChange('degree', value)}
                >
                  <SelectTrigger className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {degreeOptions.map((degree) => (
                        <SelectItem key={degree} value={degree}>
                          {degree}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </motion.div>
              
              {/* Field of Study - We'll add this to the description later */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-gray-700">
                  FIELD OF STUDY
                </label>
                <Input
                  id="fieldOfStudy"
                  type="text"
                  placeholder="e.g. Financial Accounting"
                  value={currentEducation.description || ''}
                  onChange={(e) => handleEducationChange('description', e.target.value)}
                  className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </motion.div>
              
              {/* Graduation Date */}
              <motion.div variants={itemVariants} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  GRADUATION DATE (OR EXPECTED GRADUATION DATE)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {/* For startDate we'll use it as month/year format */}
                  <Select
                    value={currentEducation.startDate || ''}
                    onValueChange={(value) => {
                      // Format the date as "Month Year"
                      const currentYear = new Date().getFullYear();
                      handleEducationChange('startDate', value);
                    }}
                  >
                    <SelectTrigger className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {months.map((month) => (
                          <SelectItem key={month} value={month}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={currentEducation.endDate || ''}
                    onValueChange={(value) => handleEducationChange('endDate', value)}
                  >
                    <SelectTrigger className="w-full py-6 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {years.map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
              
              {/* Additional Coursework Section */}
              <motion.div
                variants={itemVariants}
                className="mt-8 border border-gray-200 rounded-xl overflow-hidden bg-gray-50"
              >
                <button
                  onClick={() => setShowAdditionalCoursework(!showAdditionalCoursework)}
                  className="w-full flex items-center justify-between p-4 bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors duration-200"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      Add any additional coursework you're proud to showcase
                    </span>
                  </div>
                  {showAdditionalCoursework ? (
                    <ChevronUp className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showAdditionalCoursework && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-blue-50"
                    >
                      <div className="mb-4 flex justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-purple-600 text-white p-1 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polygon points="17 8 12 3 7 8"/>
                              <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                          </div>
                          <span className="text-sm font-medium">Pro Tip</span>
                        </div>
                        <a href="#" className="text-sm text-blue-600 hover:underline">
                          Look here for sample resume references
                        </a>
                      </div>
                      
                      <div className="text-gray-700 mb-4 text-sm">
                        We recommend including completed coursework, apprenticeship, internship experience or relevant educational achievements. Add them in chronological order, beginning with the most recent one.
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Achievement Types */}
                        <div className="space-y-4">
                          <h3 className="text-sm font-medium mb-2">Ready-to-use-examples</h3>
                          
                          {isLoading ? (
                            <div className="flex justify-center py-4">
                              <div className="animate-spin h-6 w-6 border-t-2 border-b-2 border-purple-500 rounded-full"></div>
                            </div>
                          ) : error ? (
                            <div className="text-red-500 p-4 text-center">
                              {error}
                            </div>
                          ) : (
                            educationCategories.map((category) => (
                              <div key={category.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                <button
                                  onClick={() => toggleSection(String(category.id))}
                                  className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
                                >
                                  <span className="font-medium">{category.name}</span>
                                  {expandedSection === String(category.id) ? (
                                    <ChevronUp className="h-5 w-5 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-600" />
                                  )}
                                </button>
                                
                                <AnimatePresence>
                                  {expandedSection === String(category.id) && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.3 }}
                                      className="px-4 pt-2 pb-4 bg-white"
                                    >
                                      <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                                      <div className="flex flex-wrap gap-2">
                                        {category.examples && category.examples.map(example => (
                                          <button
                                            key={example.id}
                                            className="flex items-center gap-1 border border-purple-200 rounded-full px-3 py-2 bg-white hover:bg-purple-50 transition-colors duration-200"
                                            onClick={() => {
                                              // Instead of adding as an achievement, directly insert into description field
                                              const currentText = currentEducation.description || '';
                                              const newText = currentText ? `${currentText}\n• ${example.content}` : `• ${example.content}`;
                                              handleEducationChange('description', newText);
                                              // Close the section after inserting
                                              setExpandedSection(null);
                                            }}
                                          >
                                            <Plus className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm">{example.content}</span>
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Right Column - Education Description */}
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium mb-2">EDUCATION DESCRIPTION</h3>
                          <textarea
                            className="w-full h-[300px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                            placeholder="Describe your education, notable achievements, relevant coursework, etc."
                            value={currentEducation.description}
                            onChange={(e) => handleEducationChange('description', e.target.value)}
                          />
                          <div className="flex justify-end space-x-2 py-2">
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 9h3.5a2 2 0 0 1 0 4H11v4.5"/>
                                <path d="M8 4h8"/>
                                <rect x="4" y="9" width="4" height="12" rx="1"/>
                              </svg>
                            </button>
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="m6 9 6 6 6-6"/>
                              </svg>
                            </button>
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="8" y1="6" x2="21" y2="6"/>
                                <line x1="8" y1="12" x2="21" y2="12"/>
                                <line x1="8" y1="18" x2="21" y2="18"/>
                                <line x1="3" y1="6" x2="3.01" y2="6"/>
                                <line x1="3" y1="12" x2="3.01" y2="12"/>
                                <line x1="3" y1="18" x2="3.01" y2="18"/>
                              </svg>
                            </button>
                            <button className="p-1 rounded hover:bg-gray-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M4 7V4h16v3"/>
                                <path d="M9 20h6"/>
                                <path d="M12 4v16"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
              
              {/* Selected Achievements Display */}
              {achievements && achievements.length > 0 && (
                <motion.div
                  variants={itemVariants}
                  className="mt-6 p-4 border border-gray-200 rounded-lg bg-white"
                >
                  <h3 className="font-medium mb-3">Selected Achievements</h3>
                  <div className="flex flex-wrap gap-2">
                    {achievements.map((achievement) => (
                      <div
                        key={achievement.id}
                        className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1 rounded-full"
                      >
                        <span>{achievement.title}</span>
                        <button
                          onClick={() => {
                            setAchievements(prev => 
                              prev.filter(a => a.id !== achievement.id)
                            );
                          }}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
              
              {/* Navigation buttons */}
              <motion.div variants={itemVariants} className="flex justify-end items-center mt-8 space-x-4">
                <button
                  onClick={handlePreview}
                  className="text-purple-600 hover:text-purple-800 border border-purple-600 hover:border-purple-800 font-medium rounded-full px-8 py-2.5 text-base transition-colors duration-300 hover:bg-purple-50"
                >
                  Preview
                </button>
                <button 
                  onClick={handleNext}
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-full px-10 py-2.5 text-base transition-colors duration-300 shadow-sm hover:shadow"
                >
                  Next: Skills
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
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

export default EducationPage;