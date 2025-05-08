import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const WhyNeedResumePage = () => {
  const [, setLocation] = useLocation();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  
  const handleBack = () => {
    setLocation('/personal-information');
  };
  
  const handleSkip = () => {
    setLocation('/education'); // Navigate to next step in the resume builder
  };
  
  const handleNext = () => {
    if (selectedReason) {
      // Store the selected reason if needed
      setLocation('/education'); // Navigate to next step
    }
  };
  
  const reasons = [
    { id: 'job-seeking', label: 'Job Seeking' },
    { id: 'different-reason', label: 'A Different Reason' }
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow flex flex-col items-center py-10">
        <div className="w-full max-w-2xl mx-auto px-4">
          {/* Back Button */}
          <div className="mb-8">
            <button 
              onClick={handleBack}
              className="flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
          
          {/* Main Content */}
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold mb-2">Why do you need a resume?</h1>
            <p className="text-gray-600">We'll show you a personalized experience based on your response.</p>
          </div>
          
          {/* Option Buttons */}
          <div className="flex justify-center gap-4 mb-10">
            {reasons.map(reason => (
              <button
                key={reason.id}
                className={`border rounded-lg py-3 px-8 transition-all ${
                  selectedReason === reason.id 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-200 hover:border-gray-400'
                }`}
                onClick={() => setSelectedReason(reason.id)}
              >
                {reason.label}
              </button>
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-end items-center gap-4">
            <Button 
              variant="link" 
              onClick={handleSkip}
              className="text-primary hover:text-primary/80"
            >
              Skip for now
            </Button>
            <Button 
              onClick={handleNext}
              className="bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-full px-8"
            >
              Next
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhyNeedResumePage;