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

const PersonalInformationPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
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
      <header className="border-b border-gray-200 py-4">
        <div className="container mx-auto px-6 flex items-center">
          <div className="flex-1 flex items-center">
            <Button 
              variant="ghost" 
              onClick={handleBack}
              className="flex items-center gap-2 text-indigo-600"
            >
              <ArrowLeft size={16} />
              Go Back
            </Button>
          </div>
          
          <div className="flex-1 text-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              TbzResumeBuilder
            </h1>
          </div>
          
          <div className="flex-1"></div> {/* Spacer for centered logo */}
        </div>
      </header>
      
      <main className="flex-1 container mx-auto px-6 py-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            What's the best way for employers to contact you?
          </h1>
          <p className="text-gray-600">
            We suggest including an email and phone number.
          </p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-10">
          {/* Left column - Form Fields */}
          <div className="lg:w-2/3">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              {/* Indicator for required fields */}
              <div className="mb-4 text-xs text-gray-500">
                * Indicates a required field
              </div>
              
              <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
                {/* Photo Upload */}
                <div className="flex-shrink-0 w-auto">
                  <PhotoUploader />
                </div>
                
                {/* First Name and Surname */}
                <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-gray-700 text-xs uppercase font-medium">
                      First Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="e.g. Saanvi"
                      value={resumeData.firstName}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surname" className="text-gray-700 text-xs uppercase font-medium">
                      Surname
                    </Label>
                    <Input
                      id="surname"
                      name="surname"
                      placeholder="e.g. Patel"
                      value={resumeData.surname}
                      onChange={handleInputChange}
                      className="border-gray-300"
                    />
                  </div>
                </div>
              </div>
              
              {/* Profession */}
              <div className="mb-4">
                <Label htmlFor="profession" className="text-gray-700 text-xs uppercase font-medium">
                  Profession
                </Label>
                <Input
                  id="profession"
                  name="profession"
                  placeholder="e.g. Retail Sales Associate"
                  value={resumeData.profession}
                  onChange={handleInputChange}
                  className="border-gray-300"
                />
              </div>
              
              {/* City, Country, and PIN Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-gray-700 text-xs uppercase font-medium">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g. New Delhi"
                    value={resumeData.city}
                    onChange={handleInputChange}
                    className="border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-gray-700 text-xs uppercase font-medium">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g. India"
                    value={resumeData.country}
                    onChange={handleInputChange}
                    className="border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode" className="text-gray-700 text-xs uppercase font-medium">
                    Pin Code
                  </Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g. 110034"
                    value={resumeData.postalCode}
                    onChange={handleInputChange}
                    className="border-gray-300"
                  />
                </div>
              </div>
              
              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-gray-700 text-xs uppercase font-medium">
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 22 1234 5677"
                    value={resumeData.phone}
                    onChange={handleInputChange}
                    className="border-gray-300"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 text-xs uppercase font-medium">
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
                    className="border-gray-300"
                  />
                </div>
              </div>
              
              {/* Additional Info Options */}
              <div className="mb-10">
                <AdditionalInfoOptions />
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="default" 
                  className="bg-indigo-900 hover:bg-indigo-800 text-white rounded-3xl px-6"
                  onClick={() => {}}
                >
                  Optional: Personal details
                </Button>
                
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={handlePreview}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-3xl px-6"
                  >
                    Preview
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-3xl px-6"
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
              <div className="bg-blue-50 rounded-lg p-3 mb-4">
                <h3 className="font-semibold text-blue-900 mb-1">Our Resume Builder delivers results!</h3>
                <p className="text-blue-700 text-sm flex items-center">
                  <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full text-xs font-bold mr-2">
                    30%
                  </span>
                  <span>Higher chance of getting a job</span>
                </p>
              </div>
              
              <div className="flex justify-center">
                <ResumePreview width={280} height={365} />
              </div>
              
              <div className="mt-3 text-center">
                <Button 
                  variant="ghost" 
                  className="text-blue-600 text-sm hover:bg-blue-50"
                  onClick={() => window.open('/templates', '_blank')}
                >
                  Change template
                </Button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 text-center">
                <p className="mb-1">¹ The results are based on a study with over</p>
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