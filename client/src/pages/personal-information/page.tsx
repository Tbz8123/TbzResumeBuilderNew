import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Info } from 'lucide-react';
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
  const { data: templates } = useTemplates();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  
  // Find the selected template
  const selectedTemplate = Array.isArray(templates) 
    ? templates.find((template: ResumeTemplate) => template.id === selectedTemplateId) 
    : null;
  
  // Load template ID from localStorage if not set
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
    setLocation('/work-history');
  };
  
  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    updateResumeData({ [name]: value } as any);
  };
  
  // Preview resume
  const handlePreview = () => {
    console.log('Preview resume');
  };
  
  // Render check icon for input validation
  const renderCheckmark = () => (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
  
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 max-w-[1000px] mx-auto px-4 py-8">
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
        
        <div className="flex flex-col lg:flex-row lg:gap-16">
          {/* Left column - Form Fields */}
          <div className="lg:w-[60%]">
            <div className="mb-2">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                What's the best way for employers to contact you?
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                We suggest including an email and phone number.
              </p>
            </div>
            
            {/* Required field indicator */}
            <div className="text-xs text-gray-500 mb-3">
              <span className="text-red-500">*</span> Indicates a required field
            </div>
            
            {/* Form with Photo on Left */}
            <div className="flex mb-4">
              {/* Image upload section - left aligned */}
              <div className="mr-8">
                <div className="w-[80px] h-[100px] border border-gray-300 flex items-center justify-center mb-1">
                  {resumeData.photo ? (
                    <img 
                      src={resumeData.photo} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full w-full">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_1_2" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                          <rect width="24" height="24" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_1_2)">
                          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="#717171"/>
                          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="#717171"/>
                        </g>
                      </svg>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <a
                    className="text-blue-600 text-sm hover:text-blue-800 hover:underline"
                    onClick={() => document.getElementById('photo-upload')?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    Upload Photo
                  </a>
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
              
              {/* First fields aligned next to photo */}
              <div className="flex-1">
                <div className="mb-4">
                  <div className="mb-1">
                    <div className="flex items-center">
                      <div className="text-xs font-medium text-gray-700 uppercase">
                        First Name
                      </div>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="e.g. John"
                      value={resumeData.firstName}
                      onChange={handleInputChange}
                      className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                    />
                    {resumeData.firstName && renderCheckmark()}
                  </div>
                </div>
                
                <div>
                  <div className="mb-1">
                    <div className="text-xs font-medium text-gray-700 uppercase">
                      SURNAME
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="surname"
                      name="surname"
                      placeholder="e.g. Patel"
                      value={resumeData.surname}
                      onChange={handleInputChange}
                      className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                    />
                    {resumeData.surname && renderCheckmark()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profession - Full width */}
            <div className="mb-4">
              <div className="mb-1">
                <div className="text-xs font-medium text-gray-700 uppercase">
                  PROFESSION
                </div>
              </div>
              <div className="relative">
                <Input
                  id="profession"
                  name="profession"
                  placeholder="e.g. Retail Sales Associate"
                  value={resumeData.profession}
                  onChange={handleInputChange}
                  className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                />
                {resumeData.profession && renderCheckmark()}
              </div>
            </div>
            
            {/* City, Country and PIN Code - Exact layout */}
            <div className="mb-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <div className="mb-1">
                    <div className="text-xs font-medium text-gray-700 uppercase">
                      CITY
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g. New Delhi"
                      value={resumeData.city}
                      onChange={handleInputChange}
                      className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                    />
                    {resumeData.city && renderCheckmark()}
                  </div>
                </div>
                
                <div className="w-1/2">
                  <div className="mb-1">
                    <div className="text-xs font-medium text-gray-700 uppercase">
                      COUNTRY
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      id="country"
                      name="country"
                      placeholder="e.g. India"
                      value={resumeData.country}
                      onChange={handleInputChange}
                      className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                    />
                    {resumeData.country && renderCheckmark()}
                  </div>
                </div>
              </div>
            </div>
            
            {/* PIN Code - Exact width */}
            <div className="mb-4">
              <div className="mb-1">
                <div className="text-xs font-medium text-gray-700 uppercase">
                  PIN CODE
                </div>
              </div>
              <div className="relative w-1/3">
                <Input
                  id="postalCode"
                  name="postalCode"
                  placeholder="e.g. 110034"
                  value={resumeData.postalCode}
                  onChange={handleInputChange}
                  className="border border-gray-300 h-10 rounded-sm w-full pr-8"
                />
                {resumeData.postalCode && renderCheckmark()}
              </div>
            </div>
            
            {/* Phone and Email - 2 columns */}
            <div className="mb-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <div className="mb-1">
                    <div className="text-xs font-medium text-gray-700 uppercase">
                      PHONE
                    </div>
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 22 1234 5677"
                    value={resumeData.phone}
                    onChange={handleInputChange}
                    className="border border-gray-300 h-10 rounded-sm w-full"
                  />
                </div>
                
                <div className="w-1/2">
                  <div className="mb-1">
                    <div className="flex items-center">
                      <div className="text-xs font-medium text-gray-700 uppercase">
                        EMAIL
                      </div>
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. example@sample.in"
                    value={resumeData.email}
                    onChange={handleInputChange}
                    required
                    className="border border-gray-300 h-10 rounded-sm w-full"
                  />
                </div>
              </div>
            </div>
            
            {/* Additional Information Section - exactly like Zety */}
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <span className="text-sm text-gray-700">Add additional information to your resume</span>
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
                <div className="ml-2 inline-flex items-center justify-center">
                  <Info size={16} className="text-gray-500" />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                  onClick={() => updateAdditionalInfo('linkedin', '')}
                >
                  LinkedIn
                  <span className="ml-2 font-bold">+</span>
                </button>
                
                <button
                  className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                  onClick={() => updateAdditionalInfo('website', '')}
                >
                  Website
                  <span className="ml-2 font-bold">+</span>
                </button>
                
                <button
                  className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                  onClick={() => updateAdditionalInfo('drivingLicense', '')}
                >
                  Driving licence
                  <span className="ml-2 font-bold">+</span>
                </button>
              </div>
            </div>
            
            {/* Navigation Buttons - exactly like Zety */}
            <div className="mt-20 flex justify-between">
              <Button
                variant="default"
                onClick={() => {}}
                className="bg-[#400b92] hover:bg-[#33076c] text-white rounded-full px-8 py-2 font-normal"
              >
                Optional: Personal details
              </Button>
              
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  className="border border-gray-400 bg-white hover:bg-gray-50 text-gray-800 rounded-full px-8 py-2 font-normal"
                >
                  Preview
                </Button>
                
                <Button
                  variant="default"
                  onClick={handleNext}
                  className="bg-[#ffc431] hover:bg-[#ffbb1c] text-black font-normal rounded-full px-8 py-2"
                >
                  Next: Work history
                </Button>
              </div>
            </div>
          </div>
          
          {/* Right column - Resume Preview */}
          <div className="lg:w-[40%] mt-10 lg:mt-0">
            {/* Results notification with exact styling */}
            <div className="mb-4">
              <div className="bg-blue-50 rounded-lg p-2 px-3">
                <div className="flex items-center">
                  <p className="text-sm text-blue-800">Our Resume Builder delivers results¹</p>
                </div>
              </div>
              <div className="bg-blue-50 rounded-b-lg p-2 flex items-center justify-center text-sm text-blue-800 font-semibold -mt-1">
                <svg className="w-4 h-4 mr-1 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span>42% Higher response rate from recruiters</span>
              </div>
            </div>
            
            {/* Resume Preview - Exactly like Zety */}
            <div className="border border-gray-200 overflow-hidden">
              <div className="relative bg-white" style={{ height: '400px' }}>
                <HybridResumePreview 
                  className="h-full w-full" 
                  width={400} 
                  height={400}
                  scaleContent={true}
                />
              </div>
            </div>
            
            {/* Change template button */}
            <div className="text-center mt-3">
              <button 
                className="text-blue-600 text-sm hover:text-blue-800 hover:underline bg-transparent font-normal px-0 py-0"
                onClick={() => setTemplateModalOpen(true)}
              >
                Change template
              </button>
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