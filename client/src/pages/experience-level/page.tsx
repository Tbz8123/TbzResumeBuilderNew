import { useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { FullWidthSection } from "@/components/ui/AppleStyles";
import { AnimatedSection } from "@/components/AnimationComponents";
import Logo from "@/components/Logo";

type ExperienceOption = {
  id: string;
  label: string;
  value: string;
};

const ExperienceLevelPage = () => {
  const [_, setLocation] = useLocation();
  
  const experienceOptions: ExperienceOption[] = [
    { id: "no-experience", label: "No Experience", value: "no_experience" },
    { id: "less-than-3", label: "Less Than 3 Years", value: "less_than_3" },
    { id: "3-5-years", label: "3-5 Years", value: "3_5_years" },
    { id: "5-10-years", label: "5-10 Years", value: "5_10_years" },
    { id: "10-plus", label: "10+ Years", value: "10_plus_years" },
  ];

  const handleExperienceSelect = (experienceLevel: string) => {
    // For now, this would redirect to a template selection page with the chosen experience level
    console.log(`Selected experience level: ${experienceLevel}`);
    // Future implementation:
    // setLocation(`/templates?experience=${experienceLevel}`);
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {experienceOptions.map((option, index) => (
              <AnimatedSection 
                key={option.id} 
                animation="fadeInUp"
                delay={0.5 + index * 0.1}
              >
                <motion.button
                  className="w-full border border-gray-300 rounded-lg py-4 px-4 text-center hover:border-primary hover:shadow-md transition-all"
                  whileHover={{ y: -5, borderColor: "#5E17EB", boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleExperienceSelect(option.value)}
                >
                  <span className="block text-gray-800 font-medium">{option.label}</span>
                </motion.button>
              </AnimatedSection>
            ))}
          </div>
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
            © 2023, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ExperienceLevelPage;