import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume, Skill } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, Edit2, Trash2, Plus, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SkillsSummaryPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const skills = resumeData.skills || [];
  
  // Handle navigation
  const handleBack = () => {
    setLocation('/skills');
  };
  
  const handleNext = () => {
    setLocation('/summary');
  };
  
  const handlePreview = () => {
    setLocation('/preview');
  };
  
  const handleAddSkill = () => {
    setLocation('/skills');
  };
  
  const handleEditSkill = (skillId: string) => {
    // Navigate to the skills page with the skill id as a parameter
    setLocation(`/skills?edit=${skillId}`);
  };
  
  const handleDeleteSkill = (skillId: string) => {
    // Remove the skill from the resume data
    const updatedSkills = skills.filter(skill => skill.id !== skillId);
    updateResumeData({ skills: updatedSkills });
  };
  
  // Render star rating component
  const renderStarRating = (level: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= level ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
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
                Skills Summary
              </h1>
            </div>
            <p className="text-gray-600 text-lg mb-6">
              Below is a summary of all the skills you've added. You can edit or delete each skill, or add more skills to your resume.
            </p>
            
            {/* Skills List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-8">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Skills</h2>
                
                {skills.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">You haven't added any skills yet.</p>
                    <Button 
                      onClick={handleAddSkill}
                      className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Skills
                    </Button>
                  </div>
                ) : (
                  <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {skills.map((skill) => (
                      <motion.div
                        key={skill.id}
                        variants={itemVariants}
                        className="flex justify-between items-center p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300"
                      >
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="font-medium text-gray-800">{skill.name}</h3>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSkill(skill.id)}
                                className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                              >
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteSkill(skill.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            <span className="text-gray-500 text-sm mr-2">Proficiency:</span>
                            {renderStarRating(skill.level)}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <motion.div
                      variants={itemVariants}
                      className="mt-6"
                    >
                      <Button 
                        onClick={handleAddSkill}
                        variant="outline"
                        className="w-full border-dashed border-2 border-purple-200 text-purple-600 hover:bg-purple-50 py-6"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Add Another Skill
                      </Button>
                    </motion.div>
                  </motion.div>
                )}
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

export default SkillsSummaryPage;