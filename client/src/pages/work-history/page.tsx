import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
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
      setLocation('/work-experience-details'); // Navigate to work experience details page
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
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
          
          {/* Main Content */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold mb-3">Why do you need a resume?</h1>
            <p className="text-gray-600 text-lg">We'll show you a personalized experience based on your response.</p>
          </div>
          
          {/* Option Buttons */}
          <div className="flex justify-center gap-6 mb-16">
            {reasons.map(reason => (
              <button
                key={reason.id}
                className={`border rounded-lg py-4 px-10 transition-all text-base ${
                  selectedReason === reason.id 
                    ? 'border-purple-500 bg-purple-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => setSelectedReason(reason.id)}
              >
                {reason.label}
              </button>
            ))}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex justify-end items-center gap-6">
            <button 
              onClick={handleSkip}
              className="text-purple-600 hover:text-purple-800 text-base font-medium"
            >
              Skip for now
            </button>
            <button 
              onClick={handleNext}
              className="bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-full px-10 py-3 text-base"
            >
              Next
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WhyNeedResumePage;