import React from 'react';
import { useLocation, Link } from 'wouter';
import { AnimatedSection } from '@/components/AnimationComponents';
import { ArrowLeft, FileUp, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UploadOptionsPage = () => {
  const [, setLocation] = useLocation();
  const [selectedOption, setSelectedOption] = React.useState<'upload' | 'scratch' | null>(null);
  
  // Function to handle going back
  const handleBack = () => {
    setLocation('/templates');
  };
  
  // Function to handle next step
  const handleNext = () => {
    if (selectedOption === 'upload') {
      setLocation('/upload-resume');
    } else if (selectedOption === 'scratch') {
      setLocation('/builder');
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <AnimatedSection animation="fadeIn" className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Are you uploading an existing resume?
          </h1>
          <p className="text-gray-600">
            Just review, edit, and update it with new information
          </p>
        </AnimatedSection>
        
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          {/* Upload option */}
          <AnimatedSection 
            animation="fadeInUp" 
            className="relative"
            delay={0.1}
          >
            <div 
              className={`border rounded-lg p-8 h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-md
                ${selectedOption === 'upload' ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'}`}
              onClick={() => setSelectedOption('upload')}
            >
              {/* Recommended tag */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full font-medium">
                Recommended option to save you time
              </div>
              
              <div className="w-16 h-16 mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="w-12 h-14 border-2 border-primary rounded-md flex items-center justify-center">
                    <FileUp size={24} className="text-primary" />
                  </div>
                  <div className="absolute -right-2 -bottom-2 bg-primary text-white p-1 rounded-full">
                    <ArrowLeft size={12} className="transform rotate-180" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Yes, upload from my resume</h3>
              <p className="text-gray-600 text-center text-sm">
                We'll give you expert guidance to fill out your info and enhance your resume, from start to finish
              </p>
            </div>
          </AnimatedSection>
          
          {/* Start from scratch option */}
          <AnimatedSection 
            animation="fadeInUp" 
            className="relative"
            delay={0.2}
          >
            <div 
              className={`border rounded-lg p-8 h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-md
                ${selectedOption === 'scratch' ? 'border-primary border-2 bg-primary/5' : 'border-gray-200'}`}
              onClick={() => setSelectedOption('scratch')}
            >
              <div className="w-16 h-16 mb-6 flex items-center justify-center">
                <div className="relative">
                  <div className="w-12 h-14 border-2 border-primary rounded-md flex items-center justify-center">
                    <Pencil size={20} className="text-primary" />
                  </div>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No, start from scratch</h3>
              <p className="text-gray-600 text-center text-sm">
                We'll guide you through the whole process so your skills can shine
              </p>
            </div>
          </AnimatedSection>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-12">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          
          <Button 
            onClick={handleNext}
            disabled={!selectedOption}
            className={`px-6 ${!selectedOption ? 'bg-gray-300' : 'bg-primary hover:bg-primary-dark'} text-white`}
          >
            Next
          </Button>
        </div>
        
        {/* Terms text */}
        <div className="text-center text-xs text-gray-500 mt-6">
          By clicking Next, you agree to our <Link href="/terms" className="text-primary hover:underline">Terms of Use</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
            <Link href="/terms" className="hover:text-primary">TERMS AND CONDITIONS</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-primary">PRIVACY POLICY</Link>
            <span>|</span>
            <Link href="/accessibility" className="hover:text-primary">ACCESSIBILITY</Link>
            <span>|</span>
            <Link href="/contact" className="hover:text-primary">CONTACT US</Link>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UploadOptionsPage;