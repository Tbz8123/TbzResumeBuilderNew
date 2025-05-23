import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Edit, Trash, ArrowRight, CheckCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { WorkExperience } from '@/types/resume';
import { motion, AnimatePresence } from 'framer-motion';

const WorkHistorySummaryPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Show success notification when page loads with work experiences
  useEffect(() => {
    const validExperiences = resumeData.workExperience.filter(job => 
      job.jobTitle && 
      job.employer && 
      job.startMonth && 
      job.startYear && 
      (job.isCurrentJob || (job.endMonth && job.endYear)) &&
      job.responsibilities
    );
    
    if (validExperiences.length > 0) {
      setShowSuccessMessage(true);
      const timer = setTimeout(() => setShowSuccessMessage(false), 3000);
      return () => clearTimeout(timer);
    }
  }, []);
  
  // Format dates for display
  const formatDate = (month: string, year: string) => {
    return `${month} ${year}`;
  };
  
  const handleBack = () => {
    setLocation('/job-description');
  };
  
  const handleNext = () => {
    setLocation('/education');
  };
  
  const handlePreview = () => {
    setLocation('/preview');
  };
  
  const handleEditDescription = (id: string | undefined) => {
    if (id) {
      // Find the index of the job in work experience
      const jobIndex = resumeData.workExperience.findIndex(job => job.id === id);
      if (jobIndex !== -1) {
        // Navigate to job description page with this job selected
        setLocation(`/job-description?id=${id}`);
      }
    }
  };
  
  const handleDeleteJob = (id: string | undefined) => {
    if (id) {
      // Filter out the job with the given id
      const updatedWorkExperience = resumeData.workExperience.filter(job => job.id !== id);
      updateResumeData({ ...resumeData, workExperience: updatedWorkExperience });
    }
  };
  
  const handleAddNewPosition = () => {
    setLocation('/work-experience-details');
  };
  
  const handleAiAssistance = () => {
    // This would connect to an AI assistance feature
    console.log('AI assistance requested');
  };

  // Filter out incomplete job entries
  const validWorkExperiences = resumeData.workExperience.filter(job => 
    job.jobTitle && 
    job.employer && 
    job.startMonth && 
    job.startYear && 
    (job.isCurrentJob || (job.endMonth && job.endYear)) &&
    job.responsibilities
  );
  
  // Animation variants
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 70 } }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Success notification */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div 
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-5 py-3 rounded-lg shadow-lg flex items-center"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            <span>Your work experience is looking great!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with logo */}
      <motion.header 
        className="py-4 border-b border-gray-100 bg-white shadow-sm"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </motion.header>
      
      <motion.main 
        className="flex-grow py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.button 
              onClick={handleBack}
              className="flex items-center text-purple-600 hover:text-purple-800 hover:-translate-x-1 transition-all duration-300 text-sm font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </motion.button>
          </motion.div>
          
          {/* Page Title and Tips */}
          <motion.div 
            className="flex justify-between items-center mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-500">
              Work history summary
            </h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button 
                    className="flex items-center text-blue-600 text-sm font-medium bg-blue-50 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <HelpCircle className="h-4 w-4 mr-1" />
                    Tips
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-3 shadow-lg">
                  <p className="max-w-xs text-gray-800">
                    List your most recent jobs first. Include key responsibilities that showcase your skills relevant to the job you're applying for.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </motion.div>
          
          {/* AI Writing Assistant Banner */}
          <motion.div 
            className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 mb-8 flex items-center shadow-md border border-blue-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            <div className="flex-shrink-0 mr-5">
              <div className="bg-gradient-to-br from-purple-100 to-blue-100 h-16 w-16 rounded-full flex items-center justify-center shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#3B82F6" />
                    </linearGradient>
                  </defs>
                  <path d="M17 6.1H3" />
                  <path d="M21 12.1H3" />
                  <path d="M15.1 18H3" />
                </svg>
              </div>
            </div>
            <div className="flex-grow">
              <h3 className="font-medium text-gray-800 text-lg">Unsure what to write or how to phrase it?</h3>
              <p className="text-gray-600">Answer a few quick questions, and we'll help craft interview-landing content as you go.</p>
            </div>
            <motion.button 
              onClick={handleAiAssistance}
              className="flex-shrink-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-full px-5 py-2 hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.95 }}
            >
              Let's go
            </motion.button>
          </motion.div>
          
          {/* Work Experience List with animations */}
          <motion.div
            className="space-y-5"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {validWorkExperiences.length > 0 ? (
              validWorkExperiences.map((job, index) => (
                <motion.div 
                  key={job.id || index} 
                  className="border border-gray-200 bg-white rounded-xl p-6 relative shadow-sm hover:shadow-md transition-all duration-300"
                  variants={item}
                  whileHover={{ 
                    y: -5, 
                    boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.05)",
                    borderColor: "#8B5CF6",
                    borderLeftColor: "#8B5CF6",
                    borderLeftWidth: "4px"
                  }}
                >
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white h-8 w-8 flex items-center justify-center rounded-full font-medium shadow-md">
                    {index + 1}
                  </div>
                  
                  <div className="ml-12">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-xl text-gray-800">{job.jobTitle}</h3>
                        <p className="text-gray-600">
                          {job.employer}{job.location ? `, ${job.location}` : ''} | {job.startMonth} {job.startYear} - {job.isCurrentJob ? 'Present' : `${job.endMonth} ${job.endYear}`}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <motion.button 
                          onClick={() => handleEditDescription(job.id)}
                          className="text-blue-600 hover:text-blue-800 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors duration-200"
                          aria-label="Edit job description"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Edit className="h-4 w-4" />
                        </motion.button>
                        <motion.button 
                          onClick={() => handleDeleteJob(job.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 p-2 rounded-full hover:bg-red-100 transition-colors duration-200"
                          aria-label="Delete job"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <ul className="list-disc pl-5 mt-4 space-y-2">
                      {job.responsibilities.split('\n').map((item, i) => (
                        item.trim() && (
                          <motion.li 
                            key={i} 
                            className="text-gray-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.1 * i }}
                          >
                            {item.trim()}
                          </motion.li>
                        )
                      ))}
                    </ul>
                    
                    <motion.button 
                      onClick={() => handleEditDescription(job.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm mt-4 flex items-center hover:underline transition-all duration-200"
                      whileHover={{ x: 5 }}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit description
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100"
                variants={item}
              >
                <p className="text-gray-500">No work experience added yet. Add a position to get started.</p>
              </motion.div>
            )}
            
            {/* Add New Position Button with animation */}
            <motion.div 
              className="border-2 border-dashed border-indigo-200 rounded-xl p-6 flex items-center justify-center bg-white hover:bg-indigo-50 transition-colors duration-300"
              variants={item}
              whileHover={{ 
                scale: 1.02,
                borderColor: "#8B5CF6",
                backgroundColor: "rgba(139, 92, 246, 0.05)"
              }}
            >
              <motion.button 
                onClick={handleAddNewPosition}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add new position
              </motion.button>
            </motion.div>
          </motion.div>
          
          {/* Navigation Buttons with animations */}
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
                Next: Education
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.main>
    </div>
  );
};

export default WorkHistorySummaryPage;