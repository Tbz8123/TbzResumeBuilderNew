import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { AnimatedSection } from '@/components/AnimationComponents';
import { ArrowLeft, Info, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResume } from '@/contexts/ResumeContext';
import ResumePreview from '@/components/resume/ResumePreview';
import PhotoUploader from '@/components/resume/PhotoUploader';
import AdditionalInfoOptions from '@/components/resume/AdditionalInfoOptions';
import Logo from '@/components/Logo';

const PersonalInformationPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData, updateAdditionalInfo, removeAdditionalInfo } = useResume();
  const [step, setStep] = useState(1); // For multi-step form navigation
  
  const handleBack = () => {
    setLocation('/templates');
  };
  
  const handleNext = () => {
    // Navigate to work history step
    console.log('Moving to work history step');
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
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with logo - consistent across all pages */}
      <header className="py-6 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="large" />
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-12 max-w-5xl">
        <div className="mb-10 ml-2">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 px-0 mb-6 hover:bg-transparent hover:text-indigo-800"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            What's the best way for employers to contact you?
          </h1>
          <p className="text-gray-600">
            We suggest including an email and phone number.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left column - Form Fields */}
          <div className="lg:w-2/3">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100">
              {/* Indicator for required fields */}
              <div className="mb-6 text-sm text-gray-500">
                <span className="text-red-500">*</span> Indicates a required field
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-8 mb-8">
                {/* Photo Upload */}
                <div className="flex-shrink-0 w-auto">
                  <div className="w-36 h-36 bg-gray-100 rounded-md flex items-center justify-center border border-gray-200 overflow-hidden">
                    {resumeData.photo ? (
                      <img 
                        src={resumeData.photo} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <Button
                          variant="link"
                          className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          Upload Photo
                        </Button>
                        <input 
                          id="photo-upload" 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                updateResumeData({ photo: event.target?.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* First Name and Surname */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 font-medium block">
                      FIRST NAME <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="e.g. Saanvi"
                      value={resumeData.firstName}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 p-3 rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-gray-700 font-medium block">
                      SURNAME
                    </Label>
                    <Input
                      id="surname"
                      name="surname"
                      placeholder="e.g. Patel"
                      value={resumeData.surname}
                      onChange={handleInputChange}
                      className="border-gray-300 p-3 rounded-md"
                    />
                  </div>
                </div>
              </div>
              
              {/* Profession */}
              <div className="mb-6">
                <Label htmlFor="profession" className="text-gray-700 font-medium block mb-2">
                  PROFESSION
                </Label>
                <Input
                  id="profession"
                  name="profession"
                  placeholder="e.g. Retail Sales Associate"
                  value={resumeData.profession}
                  onChange={handleInputChange}
                  className="border-gray-300 p-3 rounded-md w-full"
                />
              </div>
              
              {/* City, Country, and PIN Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700 font-medium block">
                    CITY
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g. New Delhi"
                    value={resumeData.city}
                    onChange={handleInputChange}
                    className="border-gray-300 p-3 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-700 font-medium block">
                    COUNTRY
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g. India"
                    value={resumeData.country}
                    onChange={handleInputChange}
                    className="border-gray-300 p-3 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-gray-700 font-medium block">
                    PIN CODE
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g. 110034"
                    value={resumeData.postalCode}
                    onChange={handleInputChange}
                    className="border-gray-300 p-3 rounded-md"
                  />
                </div>
              </div>
              
              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 mb-10">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 font-medium block">
                    PHONE
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 22 1234 5677"
                    value={resumeData.phone}
                    onChange={handleInputChange}
                    className="border-gray-300 p-3 rounded-md"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium block">
                    EMAIL <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. saanvipatel@sample.in"
                    value={resumeData.email}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 p-3 rounded-md"
                  />
                </div>
              </div>
              
              {/* Additional Info Options */}
              <div className="mb-12">
                <AdditionalInfoOptions className="rounded-full" />
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="default" 
                  className="bg-indigo-900 hover:bg-indigo-800 text-white rounded-full px-8 py-3 font-medium"
                  onClick={() => {}}
                >
                  Optional: Personal details
                </Button>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-8 py-3 font-medium"
                  >
                    Preview
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-full px-8 py-3 font-medium"
                  >
                    Next: Work history
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right column - Resume Preview */}
          <div className="lg:w-1/3">
            <div className="sticky top-8">
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-2">Our Resume Builder delivers results! <sup>1</sup></h3>
                <p className="text-blue-700 text-sm flex items-center">
                  <span className="bg-blue-100 text-blue-600 px-2 py-1 rounded-full text-xs font-bold mr-2">
                    42%
                  </span>
                  <span>Higher response rate from recruiters</span>
                </p>
              </div>
              
              <div className="border border-gray-200 rounded-md p-1 shadow-sm mb-3">
                <div className="bg-gray-50 py-2 px-3 text-center border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    Your Name
                  </p>
                </div>
                <div className="flex justify-center">
                  <ResumePreview width={280} height={360} />
                </div>
              </div>
              
              <div className="text-center">
                <Button 
                  variant="link" 
                  className="text-indigo-600 text-sm font-medium hover:text-indigo-800"
                  onClick={() => window.open('/templates', '_blank')}
                >
                  Change template
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500 text-center">
                <p><sup>1</sup> The results are based on a study with over</p>
                <p>1000 participants, among whom 287 used</p>
                <p>resume tools provided on our family sites.</p>
              </div>
            </div>
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

export default PersonalInformationPage;