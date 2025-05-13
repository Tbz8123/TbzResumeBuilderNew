import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useResume } from '@/contexts/ResumeContext';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import Logo from '@/components/Logo';
import TemplateSelectionModal from '@/components/resume/TemplateSelectionModal';
import { motion } from 'framer-motion';

// Animation variants
const pageTransition = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

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

const AddSectionPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData, selectedTemplateId } = useResume();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  
  // State for selected optional sections
  const [selectedSections, setSelectedSections] = useState({
    personalDetails: false,
    websitesPortfolios: false,
    certifications: false,
    languages: false,
    software: false,
    accomplishments: false,
    additionalInfo: false,
    affiliations: false,
    interests: false
  });
  
  // State for custom section
  const [customSection, setCustomSection] = useState('');
  
  const handleBack = () => {
    setLocation('/professional-summary');
  };
  
  const handleNext = () => {
    // Save selected sections to resume data context if needed
    // Here you could add additional logic to store the selected sections
    setLocation('/preview'); // Navigate to preview or whatever the next page should be
  };
  
  const handlePreview = () => {
    console.log('Preview resume');
  };
  
  const handleSectionChange = (sectionName: keyof typeof selectedSections, checked: boolean) => {
    setSelectedSections(prev => ({
      ...prev,
      [sectionName]: checked
    }));
  };
  
  const handleCustomSectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSection(e.target.value);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
          <Logo size="medium" />
        </div>
      </header>
      
      {/* Main content */}
      <motion.main 
        className="flex-1 bg-white"
        initial="hidden"
        animate="visible"
        variants={pageTransition}
      >
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8">
          {/* Back button */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-transparent px-0 py-0 text-xs"
            >
              <ArrowLeft size={12} />
              <span>Go Back</span>
            </button>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:gap-12">
            {/* Left column - Optional Sections */}
            <motion.div 
              className="lg:w-1/2 mb-8 lg:mb-0"
              variants={containerVariants}
            >
              <motion.div 
                className="mb-8"
                variants={itemVariants}
              >
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Do you have anything else to add?
                </h1>
                <p className="text-gray-600">
                  These sections are optional.
                </p>
              </motion.div>
              
              {/* Standard optional sections */}
              <motion.div 
                className="space-y-4 mb-8"
                variants={containerVariants}
              >
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="personalDetails" 
                    checked={selectedSections.personalDetails}
                    onCheckedChange={(checked) => handleSectionChange('personalDetails', checked === true)}
                  />
                  <label
                    htmlFor="personalDetails"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Personal Details
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="websitesPortfolios" 
                    checked={selectedSections.websitesPortfolios}
                    onCheckedChange={(checked) => handleSectionChange('websitesPortfolios', checked === true)}
                  />
                  <label
                    htmlFor="websitesPortfolios"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Websites, Portfolios, Profiles
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="certifications" 
                    checked={selectedSections.certifications}
                    onCheckedChange={(checked) => handleSectionChange('certifications', checked === true)}
                  />
                  <label
                    htmlFor="certifications"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Certifications
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="languages" 
                    checked={selectedSections.languages}
                    onCheckedChange={(checked) => handleSectionChange('languages', checked === true)}
                  />
                  <label
                    htmlFor="languages"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Languages
                  </label>
                  <span className="bg-yellow-300 text-yellow-800 text-xs px-2 py-0.5 rounded-full">New!</span>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="software" 
                    checked={selectedSections.software}
                    onCheckedChange={(checked) => handleSectionChange('software', checked === true)}
                  />
                  <label
                    htmlFor="software"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Software
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="accomplishments" 
                    checked={selectedSections.accomplishments}
                    onCheckedChange={(checked) => handleSectionChange('accomplishments', checked === true)}
                  />
                  <label
                    htmlFor="accomplishments"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Accomplishments
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="additionalInfo" 
                    checked={selectedSections.additionalInfo}
                    onCheckedChange={(checked) => handleSectionChange('additionalInfo', checked === true)}
                  />
                  <label
                    htmlFor="additionalInfo"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Additional Information
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="affiliations" 
                    checked={selectedSections.affiliations}
                    onCheckedChange={(checked) => handleSectionChange('affiliations', checked === true)}
                  />
                  <label
                    htmlFor="affiliations"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Affiliations
                  </label>
                </motion.div>
                
                <motion.div 
                  className="flex items-center space-x-2"
                  variants={itemVariants}
                >
                  <Checkbox 
                    id="interests" 
                    checked={selectedSections.interests}
                    onCheckedChange={(checked) => handleSectionChange('interests', checked === true)}
                  />
                  <label
                    htmlFor="interests"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Interests
                  </label>
                </motion.div>
              </motion.div>
              
              {/* Custom section input */}
              <motion.div 
                className="mb-8"
                variants={itemVariants}
              >
                <h2 className="text-lg font-medium text-gray-900 mb-4">ADD YOUR OWN</h2>
                <div className="flex items-center space-x-2">
                  <Checkbox id="customSection" />
                  <Input 
                    value={customSection}
                    onChange={handleCustomSectionChange}
                    placeholder="Hobbies"
                    className="max-w-sm border-gray-300"
                  />
                </div>
              </motion.div>
            </motion.div>
            
            {/* Right column - Resume Preview */}
            <motion.div 
              className="lg:w-1/2 flex justify-center"
              variants={itemVariants}
            >
              <div className="flex flex-col items-center justify-center">
                <HybridResumePreview width={225} height={320} />
                <button
                  onClick={() => setTemplateModalOpen(true)}
                  className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Change template
                </button>
              </div>
            </motion.div>
          </div>
          
          {/* Footer buttons */}
          <motion.div 
            className="flex justify-between mt-12 mb-8"
            variants={itemVariants}
          >
            <Button
              variant="outline"
              onClick={handlePreview}
              className="px-6 py-2 rounded-full"
            >
              Preview
            </Button>
            <Button
              variant="default"
              onClick={handleNext}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-10 py-2 rounded-full"
            >
              Next
            </Button>
          </motion.div>
        </div>
      </motion.main>
      
      {/* Template Selection Modal */}
      <TemplateSelectionModal 
        open={templateModalOpen} 
        onOpenChange={setTemplateModalOpen} 
      />
    </div>
  );
};

export default AddSectionPage;