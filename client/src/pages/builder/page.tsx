import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AnimatedSection } from '@/components/AnimationComponents';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResume } from '@/contexts/ResumeContext';
import ResumePreview from '@/components/resume/ResumePreview';
import PhotoUploader from '@/components/resume/PhotoUploader';
import AdditionalInfoOptions from '@/components/resume/AdditionalInfoOptions';

const ResumeBuilderPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  const [step, setStep] = useState(1); // For multi-step form navigation
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      setLocation('/upload-options');
    }
  };
  
  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final step - this would be where you'd generate and save the resume
      console.log('Resume data:', resumeData);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateResumeData({ [name]: value } as any);
  };
  
  // Preview resume
  const handlePreview = () => {
    // This could be a modal or a new view that shows a larger preview
    console.log('Preview resume');
  };
  
  // Steps
  const stepTitles = [
    "What's the best way for employers to contact you?",
    "Tell us about your work experience",
    "Add your education details"
  ];
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 py-4">
        <div className="container mx-auto px-4 flex items-center">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          
          {/* Progress indicator could go here */}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left column - Resume Preview */}
          <div className="lg:w-1/3">
            <div className="sticky top-8">
              <AnimatedSection animation="fadeIn" className="mb-4">
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <h3 className="font-semibold text-blue-900 mb-1">Our Resume Builder delivers results!</h3>
                  <p className="text-blue-700 text-sm flex items-center">
                    <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold mr-2">
                      50%
                    </span>
                    <span>increase in interview job prospects</span>
                  </p>
                </div>
              
                <ResumePreview width={234} height={305} />
                
                <div className="mt-3 text-center">
                  <Button 
                    variant="ghost" 
                    className="text-blue-600 text-sm hover:bg-blue-50"
                    onClick={() => window.open('/templates', '_blank')}
                  >
                    Change template
                  </Button>
                </div>
              </AnimatedSection>
            </div>
          </div>
          
          {/* Right column - Form Fields */}
          <div className="lg:w-2/3">
            <AnimatedSection animation="fadeIn" className="bg-white p-6 rounded-lg shadow-sm">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {stepTitles[step - 1]}
              </h1>
              
              {step === 1 && (
                <>
                  <p className="text-gray-600 mb-6">
                    We suggest including an email and phone number.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                    {/* Photo Upload */}
                    <div className="col-span-1 md:col-span-2 flex justify-center md:justify-start">
                      <PhotoUploader />
                    </div>
                    
                    {/* First Name and Surname */}
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-700 flex items-center">
                        FIRST NAME <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="e.g. Robert"
                        value={resumeData.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="surname" className="text-gray-700">
                        SURNAME
                      </Label>
                      <Input
                        id="surname"
                        name="surname"
                        placeholder="e.g. Smith"
                        value={resumeData.surname}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* Profession */}
                    <div className="col-span-1 md:col-span-2 space-y-2">
                      <Label htmlFor="profession" className="text-gray-700">
                        PROFESSION
                      </Label>
                      <Input
                        id="profession"
                        name="profession"
                        placeholder="e.g. Marketing Manager"
                        value={resumeData.profession}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* City and Country */}
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-gray-700">
                        CITY
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        placeholder="e.g. New York"
                        value={resumeData.city}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-700">
                        COUNTRY
                      </Label>
                      <Input
                        id="country"
                        name="country"
                        placeholder="e.g. United States"
                        value={resumeData.country}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* Postal Code */}
                    <div className="space-y-2">
                      <Label htmlFor="postalCode" className="text-gray-700">
                        ZIP CODE
                      </Label>
                      <Input
                        id="postalCode"
                        name="postalCode"
                        placeholder="e.g. 10001"
                        value={resumeData.postalCode}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* Phone */}
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-700">
                        PHONE
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="e.g. +1 123 456 7890"
                        value={resumeData.phone}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    {/* Email */}
                    <div className="space-y-2 col-span-1 md:col-span-2">
                      <Label htmlFor="email" className="text-gray-700 flex items-center">
                        EMAIL <span className="text-red-500 ml-1">*</span>
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="e.g. robert.smith@example.com"
                        value={resumeData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    {/* Additional Info Options */}
                    <div className="col-span-1 md:col-span-2 mt-4">
                      <AdditionalInfoOptions />
                    </div>
                  </div>
                </>
              )}
              
              {/* Other steps would go here */}
              
              {/* Navigation Buttons */}
              <div className="mt-10 flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  {step > 1 ? 'Previous: Personal details' : 'Back'}
                </Button>
                
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handlePreview}>
                    Preview
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  >
                    {step < 3 ? 'Next: Work history' : 'Generate Resume'}
                  </Button>
                </div>
              </div>
            </AnimatedSection>
          </div>
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

export default ResumeBuilderPage;