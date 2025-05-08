import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft } from 'lucide-react';
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
      <div className="flex-1 max-w-[1080px] mx-auto px-4 py-6">
        {/* Back button - exactly like Zety */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="flex items-center gap-1 text-blue-600 hover:bg-transparent hover:text-blue-800 px-0 py-0"
            size="sm"
          >
            <ArrowLeft size={12} />
            <span className="text-xs font-normal">Go Back</span>
          </Button>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Left column - Form Fields */}
          <div className="lg:w-[58%]">
            <div className="mb-5">
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">
                What's the best way for employers to contact you?
              </h1>
              <p className="text-gray-600 text-sm">
                We suggest including an email and phone number.
              </p>
            </div>
            
            {/* Required field indicator */}
            <div className="text-xs text-gray-500 mb-4">
              <span className="text-red-500">*</span> Indicates a required field
            </div>
            
            {/* Photo upload area at the left side of the page */}
            <div className="mb-6 flex">
              <div className="w-[135px] h-[135px] border border-gray-200 flex items-center justify-center">
                {resumeData.photo ? (
                  <img 
                    src={resumeData.photo} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M6 21V19C6 17.4087 6.63214 15.8826 7.75736 14.7574C8.88258 13.6321 10.4087 13 12 13C13.5913 13 15.1174 13.6321 16.2426 14.7574C17.3679 15.8826 18 17.4087 18 19V21" stroke="#718096" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="ml-2">
                <Button
                  variant="link"
                  className="text-blue-600 text-sm hover:text-blue-800 font-normal p-0"
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
            
            {/* Form fields laid out exactly like Zety */}
            <div className="space-y-5">
              {/* First Name & Surname - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center mb-2">
                    <Label htmlFor="firstName" className="text-xs font-medium text-gray-700 uppercase">
                      First Name
                    </Label>
                    <span className="text-red-500 ml-1 font-medium">*</span>
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
                  <Label htmlFor="surname" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
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
                <Label htmlFor="profession" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
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
              
              {/* City and Country - 2 columns */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
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
                  <Label htmlFor="country" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
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
              
              {/* PIN Code - Single column */}
              <div>
                <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
                  Pin Code
                </Label>
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="e.g. 110034"
                  value={resumeData.postalCode}
                  onChange={handleInputChange}
                  className="border-gray-300 h-10 rounded-md w-full"
                />
              </div>
              
              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="text-xs font-medium text-gray-700 mb-2 block uppercase">
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
                <div className="flex items-center mb-2">
                  <Label htmlFor="email" className="text-xs font-medium text-gray-700 uppercase">
                    Email
                  </Label>
                  <span className="text-red-500 ml-1 font-medium">*</span>
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
                  <button className="ml-2 w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs">
                    i
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('linkedin', '')}
                  >
                    LinkedIn
                    <span className="text-gray-500 font-bold">+</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('website', '')}
                  >
                    Website
                    <span className="text-gray-500 font-bold">+</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-gray-300 text-xs py-1 px-3 flex items-center gap-1"
                    onClick={() => updateAdditionalInfo('drivingLicense', '')}
                  >
                    Driving licence
                    <span className="text-gray-500 font-bold">+</span>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - exact positioning */}
            <div className="flex justify-between items-center mt-14">
              <Button
                variant="default"
                onClick={() => {}}
                className="bg-[#3a078f] hover:bg-[#33067c] text-white rounded-full px-8 py-2 font-normal"
              >
                Optional: Personal details
              </Button>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 rounded-full px-8 py-2 font-normal"
                >
                  Preview
                </Button>
                
                <Button
                  variant="default"
                  onClick={handleNext}
                  className="bg-yellow-400 hover:bg-yellow-500 text-black font-normal rounded-full px-8 py-2"
                >
                  Next: Work history
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right column - Resume Preview */}
          <div className="lg:w-[42%] mt-10 lg:mt-0">
            {/* Results notification */}
            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-2 px-3">
                <p className="text-sm text-blue-800">Our Resume Builder delivers results¹</p>
              </div>
              <div className="bg-blue-50 rounded-b-lg p-2 flex items-center justify-center text-sm text-blue-800 font-medium -mt-1">
                <span className="mr-1">+22%</span>
                <span>Higher response rate from recruiters</span>
              </div>
            </div>
            
            {/* Resume Preview - Exactly like Zety */}
            <div className="border border-gray-200 overflow-hidden">
              <div className="relative w-full bg-white overflow-hidden" style={{ height: '430px' }}>
                <HybridResumePreview 
                  className="h-full w-full" 
                  width={400} 
                  height={430}
                  scaleContent={true}
                />
              </div>
            </div>
            
            {/* Change template button */}
            <div className="text-center mt-3">
              <Button 
                variant="link" 
                className="text-blue-600 text-sm hover:text-blue-800 font-normal"
                onClick={() => setTemplateModalOpen(true)}
              >
                Change template
              </Button>
            </div>
            
            {/* Study disclaimer */}
            <div className="mt-3 text-xs text-gray-500">
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