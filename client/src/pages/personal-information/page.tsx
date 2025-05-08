import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Info, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResume } from '@/contexts/ResumeContext';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import Logo from '@/components/Logo';
import { useTemplates } from '@/hooks/use-templates';
import { ResumeTemplate } from '@shared/schema';
import TemplateSelectionModal from '@/components/resume/TemplateSelectionModal';

const PersonalInformationPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData, updateAdditionalInfo, selectedTemplateId, setSelectedTemplateId } = useResume();
  const { data: templates } = useTemplates(); // Fetch templates for displaying the correct template
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  
  // Find the selected template from the templates data
  const selectedTemplate = Array.isArray(templates) 
    ? templates.find((template: ResumeTemplate) => template.id === selectedTemplateId) 
    : null;
  
  // Load template ID from localStorage if not set in context
  React.useEffect(() => {
    const storedTemplateId = localStorage.getItem('selectedTemplateId');
    if (storedTemplateId && !selectedTemplateId) {
      setSelectedTemplateId(parseInt(storedTemplateId));
    }
  }, [selectedTemplateId, setSelectedTemplateId]);
  
  const handleBack = () => {
    setLocation('/templates');
  };
  
  const handleNext = () => {
    // Navigate to work history step
    setLocation('/work-history');
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateResumeData({ [name]: value } as any);
  };
  
  // Preview resume
  const handlePreview = () => {
    // Open preview modal or new tab
    console.log('Preview resume');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo - kept from original design */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      {/* Main content area */}
      <div className="flex-1 max-w-[1140px] mx-auto px-4 sm:px-6 py-6">
        {/* Back button */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-1 text-blue-600 hover:bg-transparent hover:text-blue-800 px-0"
            size="sm"
          >
            <ArrowLeft size={14} />
            <span className="text-sm">Go Back</span>
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row lg:gap-20">
          {/* Left column - Form Fields */}
          <div className="lg:flex-1 max-w-[550px]">
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">
                What's the best way for employers to contact you?
              </h1>
              <p className="text-gray-600 text-sm mt-1">
                We suggest including an email and phone number.
              </p>
            </div>
            
            {/* Required field indicator */}
            <div className="text-xs text-gray-500 mb-4">
              <span className="text-red-500">*</span> Indicates a required field
            </div>
            
            {/* Image upload area as a separate element before the form fields */}
            <div className="text-center mb-8">
              <div className="inline-block w-[200px] h-[200px] border border-gray-200 mb-3">
                {resumeData.photo ? (
                  <img 
                    src={resumeData.photo} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
                    <div className="mb-2">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M6 21V19C6 17.4087 6.63214 15.8826 7.75736 14.7574C8.88258 13.6321 10.4087 13 12 13C13.5913 13 15.1174 13.6321 16.2426 14.7574C17.3679 15.8826 18 17.4087 18 19V21" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="link"
                className="text-blue-600 text-sm hover:text-blue-800"
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
            
            {/* Form fields in a more organized layout */}
            <div className="space-y-5">
              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-1">
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-700 uppercase">
                      First Name
                    </Label>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="e.g. John"
                    value={resumeData.firstName}
                    onChange={handleInputChange}
                    required
                    className="border-gray-300 h-10 rounded-md"
                  />
                </div>
                
                <div>
                  <Label htmlFor="surname" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                    Surname
                  </Label>
                  <Input
                    id="surname"
                    name="surname"
                    placeholder="e.g. Patel"
                    value={resumeData.surname}
                    onChange={handleInputChange}
                    className="border-gray-300 h-10 rounded-md"
                  />
                </div>
              </div>
              
              {/* Profession - Full width */}
              <div>
                <Label htmlFor="profession" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                  Profession
                </Label>
                <Input
                  id="profession"
                  name="profession"
                  placeholder="e.g. Retail Sales Associate"
                  value={resumeData.profession}
                  onChange={handleInputChange}
                  className="border-gray-300 h-10 rounded-md w-full"
                />
              </div>
              
              {/* City and Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                    City
                  </Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g. New Delhi"
                    value={resumeData.city}
                    onChange={handleInputChange}
                    className="border-gray-300 h-10 rounded-md"
                  />
                </div>
                
                <div>
                  <Label htmlFor="country" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                    Country
                  </Label>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g. India"
                    value={resumeData.country}
                    onChange={handleInputChange}
                    className="border-gray-300 h-10 rounded-md"
                  />
                </div>
              </div>
              
              {/* PIN Code - Fixed width */}
              <div>
                <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                  Pin Code
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="e.g. 110034"
                  value={resumeData.postalCode}
                  onChange={handleInputChange}
                  className="border-gray-300 h-10 rounded-md w-full sm:w-1/2"
                />
              </div>
              
              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-1 uppercase">
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +91 22 1234 5677"
                  value={resumeData.phone}
                  onChange={handleInputChange}
                  className="border-gray-300 h-10 rounded-md w-full"
                />
              </div>
              
              {/* Email */}
              <div>
                <div className="flex items-center mb-1">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700 uppercase">
                    Email
                  </Label>
                  <span className="text-red-500 ml-1">*</span>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="e.g. example@sample.in"
                  value={resumeData.email}
                  onChange={handleInputChange}
                  required
                  className="border-gray-300 h-10 rounded-md w-full"
                />
              </div>
              
              {/* Additional Information */}
              <div>
                <div className="flex items-center mb-2">
                  <span className="text-sm text-gray-700">Add additional information to your resume</span>
                  <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  <div className="ml-2 inline-flex items-center justify-center w-4 h-4">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#718096" strokeWidth="1.5"/>
                      <path d="M12 7V13M12 17H12.01" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('linkedin', '')}
                  >
                    LinkedIn
                    <Plus size={14} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('website', '')}
                  >
                    Website
                    <Plus size={14} />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('drivingLicense', '')}
                  >
                    Driving license
                    <Plus size={14} />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - well aligned at bottom */}
            <div className="flex justify-between items-center mt-8 pt-5 border-t border-gray-100">
              <Button
                variant="default"
                onClick={handlePreview}
                className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 rounded-full px-8 py-2"
              >
                Preview
              </Button>
              
              <Button
                variant="default"
                onClick={handleNext}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-full px-8 py-2"
              >
                Next: Work history
              </Button>
            </div>
          </div>
          
          {/* Right column - Resume Preview */}
          <div className="lg:w-[350px] mt-10 lg:mt-0">
            {/* Results notification */}
            <div className="mb-4">
              <div className="bg-blue-50 rounded-t-lg p-3 flex items-center">
                <p className="text-sm text-blue-800">Our Resume Builder delivers results¹</p>
              </div>
              <div className="bg-blue-50 rounded-b-lg p-2 flex items-center justify-center text-sm text-blue-800 font-medium">
                <svg className="w-4 h-4 mr-1 text-blue-700" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586l3.293-3.293A1 1 0 0114 7z" clipRule="evenodd"></path>
                </svg>
                <span>+22% Higher response rate from recruiters</span>
              </div>
            </div>
            
            {/* Resume Preview - Cleaner presentation */}
            <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
              <div
                className="relative w-full bg-white overflow-hidden"
                style={{ height: '470px' }}
              >
                {/* Resume preview */}
                <HybridResumePreview 
                  className="h-full w-full" 
                  width={350} 
                  height={470}
                  scaleContent={true}
                />
              </div>
            </div>
            
            {/* Change template button */}
            <div className="text-center mt-3">
              <Button 
                variant="link" 
                className="text-blue-600 text-sm hover:text-blue-800"
                onClick={() => setTemplateModalOpen(true)}
              >
                Change template
              </Button>
            </div>
            
            {/* Study disclaimer */}
            <div className="mt-4 text-xs text-gray-500">
              <p>¹ The results are based on a study with over 1000 participants, among whom 287 used resume tools provided on our family sites.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="mt-auto py-4 border-t border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
            <Link href="/terms" className="hover:text-indigo-600">TERMS AND CONDITIONS</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-indigo-600">PRIVACY POLICY</Link>
            <span>|</span>
            <Link href="/accessibility" className="hover:text-indigo-600">ACCESSIBILITY</Link>
            <span>|</span>
            <Link href="/contact" className="hover:text-indigo-600">CONTACT US</Link>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
      
      {/* Template Selection Modal */}
      <TemplateSelectionModal 
        open={templateModalOpen} 
        onOpenChange={setTemplateModalOpen} 
      />
    </div>
  );
};

export default PersonalInformationPage;