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
    <div className="flex min-h-screen">
      {/* Left sidebar - progressive steps */}
      <div className="hidden md:block w-[90px] bg-indigo-950 flex-shrink-0">
        <div className="flex flex-col items-center pt-6">
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-500 mb-4">
            <span className="text-white font-medium">1</span>
          </div>
          <span className="text-white text-xs mb-8">Heading</span>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-4">
            <span className="text-white font-medium">2</span>
          </div>
          <span className="text-white text-xs mb-8">Work history</span>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-4">
            <span className="text-white font-medium">3</span>
          </div>
          <span className="text-white text-xs mb-8">Education</span>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-4">
            <span className="text-white font-medium">4</span>
          </div>
          <span className="text-white text-xs mb-8">Skills</span>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-4">
            <span className="text-white font-medium">5</span>
          </div>
          <span className="text-white text-xs mb-8">Summary</span>
          
          <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-700 mb-4">
            <span className="text-white font-medium">6</span>
          </div>
          <span className="text-white text-xs">Finalize</span>
          
          <div className="mt-8 px-2 py-1 bg-white rounded-sm text-[10px] text-center font-medium">
            RESUME COMPLETION:
            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-1">
              <div className="bg-indigo-600 h-1.5 rounded-full w-[20%]"></div>
            </div>
            <span className="text-xs font-semibold">20%</span>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 bg-white">
        <div className="px-10 py-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-2 text-indigo-600 mb-6 hover:bg-transparent hover:text-indigo-800"
          >
            <ArrowLeft size={16} />
            Go Back
          </Button>
          
          <div className="mx-auto max-w-5xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                What's the best way for employers to contact you?
              </h1>
              <p className="text-gray-600">
                We suggest including an email and phone number.
              </p>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:gap-8">
              {/* Left column - Form Fields */}
              <div className="lg:flex-1">
                {/* Required fields indicator */}
                <div className="text-xs text-gray-500 mb-6">
                  <span className="text-red-500">*</span> Indicates a required field
                </div>
                
                {/* Photo section */}
                <div className="mb-8 flex items-start gap-6">
                  <div className="w-[8.5rem] h-[8.5rem] overflow-hidden border border-gray-200">
                    {resumeData.photo ? (
                      <img 
                        src={resumeData.photo} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                        <div className="mb-2">
                          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M6 21V19C6 17.4087 6.63214 15.8826 7.75736 14.7574C8.88258 13.6321 10.4087 13 12 13C13.5913 13 15.1174 13.6321 16.2426 14.7574C17.3679 15.8826 18 17.4087 18 19V21" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <div className="text-center">
                          <Button
                            variant="link"
                            className="text-indigo-600 text-xs hover:text-indigo-800"
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
                      </div>
                    )}
                  </div>
                  
                  {/* First Name and Surname */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="e.g. Saanvi"
                        value={resumeData.firstName}
                        onChange={handleInputChange}
                        required
                        className="border-gray-300 h-10 rounded"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="surname" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                        Surname
                      </Label>
                      <Input
                        id="surname"
                        name="surname"
                        placeholder="e.g. Patel"
                        value={resumeData.surname}
                        onChange={handleInputChange}
                        className="border-gray-300 h-10 rounded"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Profession */}
                <div className="mb-6">
                  <Label htmlFor="profession" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                    Profession
                  </Label>
                  <Input
                    id="profession"
                    name="profession"
                    placeholder="e.g. Retail Sales Associate"
                    value={resumeData.profession}
                    onChange={handleInputChange}
                    className="border-gray-300 h-10 rounded w-full"
                  />
                </div>
                
                {/* City, Country, and PIN Code */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="city" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      City
                    </Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g. New Delhi"
                      value={resumeData.city}
                      onChange={handleInputChange}
                      className="border-gray-300 h-10 rounded"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="country" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      Country
                    </Label>
                    <Input
                      id="country"
                      name="country"
                      placeholder="e.g. India"
                      value={resumeData.country}
                      onChange={handleInputChange}
                      className="border-gray-300 h-10 rounded"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      Pin Code
                    </Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="e.g. 110034"
                      value={resumeData.postalCode}
                      onChange={handleInputChange}
                      className="border-gray-300 h-10 rounded"
                    />
                  </div>
                </div>
                
                {/* Phone and Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div>
                    <Label htmlFor="phone" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="e.g. +91 22 1234 5677"
                      value={resumeData.phone}
                      onChange={handleInputChange}
                      className="border-gray-300 h-10 rounded"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="email" className="text-xs font-medium text-gray-600 uppercase mb-1 block">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="e.g. saanvipatel@sample.in"
                      value={resumeData.email}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 h-10 rounded"
                    />
                  </div>
                </div>
                
                {/* Additional Info Options */}
                <div className="mb-12">
                  <AdditionalInfoOptions />
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex items-center justify-between">
                  <Button 
                    variant="default" 
                    className="bg-indigo-900 hover:bg-indigo-800 text-white rounded-full px-6"
                  >
                    Optional: Personal details
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      onClick={handlePreview}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full px-6"
                    >
                      Preview
                    </Button>
                    <Button 
                      onClick={handleNext}
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-full px-6"
                    >
                      Next: Work history
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Right column - Resume Preview */}
              <div className="hidden lg:block lg:w-80 mt-12 lg:mt-0">
                <div className="sticky top-8">
                  <div className="bg-blue-50 rounded-lg p-3 mb-4">
                    <h3 className="font-semibold text-blue-900 text-sm mb-1">Our Resume Builder delivers results!<sup>1</sup></h3>
                    <p className="text-blue-700 text-xs flex items-center">
                      <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold mr-2">
                        42%
                      </span>
                      <span>Higher response rate from recruiters</span>
                    </p>
                  </div>
                  
                  <div className="mb-2">
                    <div className="border border-gray-200 rounded overflow-hidden shadow-sm">
                      <div className="bg-gray-50 py-1.5 px-3 text-center border-b border-gray-100">
                        <p className="text-xs font-medium text-gray-700">
                          Your Name
                        </p>
                      </div>
                      <div className="flex justify-center">
                        <ResumePreview width={240} height={320} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <Button 
                      variant="link" 
                      className="text-indigo-600 text-xs font-medium hover:text-indigo-800"
                      onClick={() => window.open('/templates', '_blank')}
                    >
                      Change template
                    </Button>
                  </div>
                  
                  <div className="mt-4 text-[10px] text-gray-500 text-center">
                    <p>¹ The results are based on a study with over 1000 participants,</p>
                    <p>among whom 287 used resume tools provided on our family sites.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-auto py-4 border-t border-gray-100 text-center">
          <div className="flex justify-center items-center gap-3 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-indigo-600">TERMS AND CONDITIONS</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-indigo-600">PRIVACY POLICY</Link>
            <span>|</span>
            <Link href="/accessibility" className="hover:text-indigo-600">ACCESSIBILITY</Link>
            <span>|</span>
            <Link href="/contact" className="hover:text-indigo-600">CONTACT US</Link>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default PersonalInformationPage;
