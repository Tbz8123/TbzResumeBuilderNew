import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { FullWidthSection } from "@/components/ui/AppleStyles";
import { AnimatedSection } from "@/components/AnimationComponents";
import Logo from "@/components/Logo";

type ExperienceOption = {
  id: string;
  label: string;
  value: string;
};

type EducationOption = {
  id: string;
  label: string;
  value: string;
};

const ExperienceLevelPage = () => {
  const [_, setLocation] = useLocation();
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState<boolean | null>(null);
  
  const experienceOptions: ExperienceOption[] = [
    { id: "no-experience", label: "No Experience", value: "no_experience" },
    { id: "less-than-3", label: "Less Than 3 Years", value: "less_than_3" },
    { id: "3-5-years", label: "3-5 Years", value: "3_5_years" },
    { id: "5-10-years", label: "5-10 Years", value: "5_10_years" },
    { id: "10-plus", label: "10+ Years", value: "10_plus_years" },
  ];

  const educationOptions: EducationOption[] = [
    { id: "secondary", label: "Secondary School", value: "secondary_school" },
    { id: "vocational", label: "Vocational Certificate or Diploma", value: "vocational" },
    { id: "apprenticeship", label: "Apprenticeship or Internship Training", value: "apprenticeship" },
    { id: "associates", label: "Associates", value: "associates" },
    { id: "bachelors", label: "Bachelors", value: "bachelors" },
    { id: "masters", label: "Masters", value: "masters" },
    { id: "doctorate", label: "Doctorate or Ph.D.", value: "doctorate" },
  ];

  const handleExperienceSelect = (experienceOption: ExperienceOption) => {
    setSelectedExperience(experienceOption.value);
    
    // If the user has no experience, show the student question
    if (experienceOption.value === "no_experience") {
      // Don't navigate yet - need to ask if they're a student
    } else {
      // For users with experience, proceed directly to templates
      console.log(`Selected experience level: ${experienceOption.value}`);
      setLocation(`/templates?experience=${experienceOption.value}`);
    }
  };

  const handleStudentSelect = (isStudent: boolean) => {
    setIsStudent(isStudent);
    
    if (!isStudent) {
      // If not a student, proceed to templates
      console.log(`Not a student, experience: ${selectedExperience}`);
      setLocation(`/templates?experience=${selectedExperience}`);
    }
    // If they are a student, show the education options (handled by render condition)
  };

  const handleEducationSelect = (educationOption: EducationOption) => {
    console.log(`Selected education: ${educationOption.value}, experience: ${selectedExperience}`);
    setLocation(`/templates?experience=${selectedExperience}&education=${educationOption.value}`);
  };

  const skipEducation = () => {
    console.log(`Skipping education question, experience: ${selectedExperience}`);
    setLocation(`/templates?experience=${selectedExperience}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with only logo */}
      <header className="py-6 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <Logo size="large" />
        </div>
      </header>

      {/* Main content */}
      <FullWidthSection className="flex-grow flex items-center justify-center py-12">
        <div className="max-w-3xl w-full mx-auto px-4">
          <AnimatedSection animation="fadeIn">
            <div className="text-center mb-12">
              <motion.div 
                className="inline-flex items-center mb-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center mr-2">
                  1
                </div>
                <span className="text-sm text-gray-500">Step 1 of 3</span>
              </motion.div>
              
              <motion.h1 
                className="text-3xl md:text-4xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                How long have you been working?
              </motion.h1>
              
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                We'll find the best templates for your experience level.
              </motion.p>
            </div>
          </AnimatedSection>

          {/* Experience Options */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-4xl mx-auto mb-12">
            {experienceOptions.map((option, index) => (
              <AnimatedSection 
                key={option.id} 
                animation="fadeInUp"
                delay={0.5 + index * 0.1}
              >
                <motion.button
                  className={`w-full border rounded-lg py-4 px-4 text-center transition-all
                    ${selectedExperience === option.value
                      ? 'bg-primary text-white border-primary shadow-md'
                      : 'border-gray-300 text-gray-800 hover:border-primary hover:shadow-md'
                    }`}
                  whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExperienceSelect(option)}
                >
                  <span className="block font-medium">{option.label}</span>
                </motion.button>
              </AnimatedSection>
            ))}
          </div>

          {/* Student Question - Only shown if No Experience is selected */}
          <AnimatePresence>
            {selectedExperience === "no_experience" && isStudent === null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-8"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Are you a student?</h2>
                </div>
                
                <div className="flex justify-center gap-4 max-w-xs mx-auto">
                  <motion.button
                    className="flex-1 border border-gray-300 rounded-lg py-4 px-8 text-center hover:border-primary hover:shadow-md transition-all"
                    whileHover={{ y: -5, borderColor: "#5E17EB", boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStudentSelect(true)}
                  >
                    <span className="block text-gray-800 font-medium">Yes</span>
                  </motion.button>
                  
                  <motion.button
                    className="flex-1 border border-gray-300 rounded-lg py-4 px-8 text-center hover:border-primary hover:shadow-md transition-all"
                    whileHover={{ y: -5, borderColor: "#5E17EB", boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleStudentSelect(false)}
                  >
                    <span className="block text-gray-800 font-medium">No</span>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Education Options - Only shown if student = true */}
          <AnimatePresence>
            {selectedExperience === "no_experience" && isStudent === true && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mt-12"
              >
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">Select the option that best describes your education level.</h2>
                  <p className="text-gray-600">Your education background can help us guide you through relevant sections for your resume.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                  {educationOptions.slice(0, 6).map((option, index) => (
                    <AnimatedSection 
                      key={option.id} 
                      animation="fadeInUp"
                      delay={0.2 + index * 0.1}
                    >
                      <motion.button
                        className="w-full border border-gray-300 rounded-lg py-4 px-4 text-center hover:border-primary hover:shadow-md transition-all"
                        whileHover={{ y: -5, borderColor: "#5E17EB", boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleEducationSelect(option)}
                      >
                        <span className="block text-gray-800 font-medium">{option.label}</span>
                      </motion.button>
                    </AnimatedSection>
                  ))}
                </div>
                
                {/* Doctorate is centered on its own row */}
                <div className="max-w-xs mx-auto mt-4">
                  <AnimatedSection 
                    animation="fadeInUp"
                    delay={0.8}
                  >
                    <motion.button
                      className="w-full border border-gray-300 rounded-lg py-4 px-4 text-center hover:border-primary hover:shadow-md transition-all"
                      whileHover={{ y: -5, borderColor: "#5E17EB", boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleEducationSelect(educationOptions[6])}
                    >
                      <span className="block text-gray-800 font-medium">{educationOptions[6].label}</span>
                    </motion.button>
                  </AnimatedSection>
                </div>
                
                <div className="text-center mt-6">
                  <button
                    className="text-primary text-sm hover:underline"
                    onClick={skipEducation}
                  >
                    Prefer not to answer
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </FullWidthSection>

      {/* Footer */}
      <footer className="py-4 border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
            <a href="#" className="hover:text-primary">TERMS AND CONDITIONS</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">PRIVACY POLICY</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">ACCESSIBILITY</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">CONTACT US</a>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExperienceLevelPage;