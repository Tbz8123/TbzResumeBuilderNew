import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, Link } from 'wouter';
import { ArrowLeft, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { useTemplates } from '@/hooks/use-templates';
import { ResumeTemplate } from '@shared/schema';
import TemplateSelectionModal from '@/components/resume/TemplateSelectionModal';
import ResumePreviewModal from '@/components/resume/ResumePreviewModal.new';
import HybridResumePreview from '@/components/resume/HybridResumePreview';

const PersonalInformationPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData, updateAdditionalInfo, removeAdditionalInfo, selectedTemplateId, setSelectedTemplateId } = useResume();
  const { data: templates } = useTemplates();
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  
  // Initialize local state from the resumeData context
  // This ensures our UI state reflects what's stored in the context
  const [showLinkedIn, setShowLinkedIn] = useState(Boolean(resumeData.additionalFields?.linkedin));
  const [showWebsite, setShowWebsite] = useState(Boolean(resumeData.additionalFields?.website));
  const [showDrivingLicense, setShowDrivingLicense] = useState(Boolean(resumeData.additionalFields?.drivingLicense));
  
  // Initialize field values from the resumeData context
  const [linkedInValue, setLinkedInValue] = useState(resumeData.additionalFields?.linkedin?.value || '');
  const [websiteValue, setWebsiteValue] = useState(resumeData.additionalFields?.website?.value || '');
  const [drivingLicenseValue, setDrivingLicenseValue] = useState(resumeData.additionalFields?.drivingLicense?.value || '');
  
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
  
  // Create state to track form inputs with debounced updates
  const [formState, setFormState] = useState({
    firstName: resumeData.firstName || '',
    surname: resumeData.surname || '',
    profession: resumeData.profession || '',
    email: resumeData.email || '',
    phone: resumeData.phone || '',
    city: resumeData.city || '',
    country: resumeData.country || '',
    postalCode: resumeData.postalCode || '',
    summary: resumeData.summary || '',
    photo: resumeData.photo || null
  });
  
  // Effect to update resume data when form state changes with improved logging
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log("Debounced update with form state:", formState);
      
      // Use direct update approach for better reactivity
      updateResumeData((prevData) => ({
        ...prevData,
        firstName: formState.firstName,
        surname: formState.surname,
        profession: formState.profession,
        email: formState.email,
        phone: formState.phone,
        city: formState.city,
        country: formState.country,
        postalCode: formState.postalCode,
        summary: formState.summary,
        photo: formState.photo
      }));
      
      console.log("Personal information update triggered");
    }, 100); // Reduced to 100ms for more responsive updates
    
    return () => clearTimeout(timeoutId);
  }, [formState, updateResumeData]);
  
  // Handle input changes with enhanced real-time feedback and immediate updates
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Update local form state first
    setFormState(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Directly update ALL personal info fields in resumeData for immediate feedback
    // This ensures the preview updates instantly for better user experience
    updateResumeData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // For special fields like name, also update the document title to show real-time changes
    if (name === 'firstName' || name === 'surname') {
      const firstName = name === 'firstName' ? value : formState.firstName;
      const surname = name === 'surname' ? value : formState.surname;
      const fullName = `${firstName || ''} ${surname || ''}`.trim();
      if (fullName) {
        document.title = `${fullName}'s Resume | TbzResumeBuilder`;
      }
    }
    
    // Log update for debugging
    console.log(`Field changed ${name} to:`, value);
  };
  
  // State for preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Preview resume - opens a modal with the full preview
  const handlePreview = () => {
    console.log('Opening resume preview modal');
    setPreviewModalOpen(true);
  };
  
  // New simplified direct-state handlers for additional fields
  
  // Add field handlers
  const handleAddLinkedIn = () => {
    setShowLinkedIn(true);
    console.log('[DIRECT] Added LinkedIn field');
    updateAdditionalInfo('linkedin', linkedInValue);
  };
  
  const handleAddWebsite = () => {
    setShowWebsite(true);
    console.log('[DIRECT] Added Website field');
    updateAdditionalInfo('website', websiteValue);
  };
  
  const handleAddDrivingLicense = () => {
    setShowDrivingLicense(true);
    console.log('[DIRECT] Added Driving License field');
    updateAdditionalInfo('drivingLicense', drivingLicenseValue);
  };
  
  // Remove field handlers
  const handleRemoveLinkedIn = () => {
    setShowLinkedIn(false);
    setLinkedInValue('');
    console.log('[DIRECT] Removed LinkedIn field');
    removeAdditionalInfo('linkedin');
  };
  
  const handleRemoveWebsite = () => {
    setShowWebsite(false);
    setWebsiteValue('');
    console.log('[DIRECT] Removed Website field');
    removeAdditionalInfo('website');
  };
  
  const handleRemoveDrivingLicense = () => {
    setShowDrivingLicense(false);
    setDrivingLicenseValue('');
    console.log('[DIRECT] Removed Driving License field');
    removeAdditionalInfo('drivingLicense');
  };
  
  // Change handlers
  const handleLinkedInChange = (value: string) => {
    setLinkedInValue(value);
    console.log('[DIRECT] Changed LinkedIn value to:', value);
    updateAdditionalInfo('linkedin', value);
  };
  
  const handleWebsiteChange = (value: string) => {
    setWebsiteValue(value);
    console.log('[DIRECT] Changed Website value to:', value);
    updateAdditionalInfo('website', value);
  };
  
  const handleDrivingLicenseChange = (value: string) => {
    setDrivingLicenseValue(value);
    console.log('[DIRECT] Changed Driving License value to:', value);
    updateAdditionalInfo('drivingLicense', value);
  };

  return (
    <div className="flex flex-col min-h-screen" style={{ overflowY: 'auto', maxHeight: '100vh' }}>
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      {/* Main content */}
      <div className="flex-1 max-w-[1200px] mx-auto px-4 py-8 bg-gradient-to-b from-white to-blue-50">
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
          {/* Left column - Form Fields - EXPANDED */}
          <div className="lg:w-[68%]">
            <div className="mb-2">
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                What's the best way for employers to contact you?
              </h1>
              <p className="text-gray-600 text-sm mb-4">
                We suggest including an email and phone number.
              </p>
            </div>
            
            {/* Required field indicator */}
            <div className="text-xs text-gray-500 mb-4">
              <span className="text-red-500">*</span> Indicates a required field
            </div>
            
            {/* Form layout - EXACTLY like the screenshot */}
            <div className="mb-10">
              {/* Photo and Name Row */}
              <div className="flex mb-5">
                <div className="w-[83px]">
                  <div className="w-full aspect-square border border-gray-300 bg-gray-100 flex items-center justify-center mb-1">
                    {resumeData.photo ? (
                      <img 
                        src={resumeData.photo} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <mask id="mask0_1_2" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
                          <rect width="24" height="24" fill="#D9D9D9"/>
                        </mask>
                        <g mask="url(#mask0_1_2)">
                          <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" fill="#717171"/>
                          <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" fill="#717171"/>
                        </g>
                      </svg>
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
                            // Update both form state and resume data
                            const photoData = event.target?.result as string;
                            setFormState(prev => ({
                              ...prev,
                              photo: photoData
                            }));
                            console.log('Photo updated');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="flex-1 ml-12">
                  <div className="flex gap-5 mb-6">
                    <div className="flex-1">
                      <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                        FIRST NAME
                      </div>
                      <Input
                        id="firstName"
                        name="firstName"
                        placeholder="e.g. Saanvi"
                        value={formState.firstName}
                        onChange={handleInputChange}
                        className="border border-gray-300 h-10 rounded-none"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                        SURNAME
                      </div>
                      <Input
                        id="surname"
                        name="surname"
                        placeholder="e.g. Patel"
                        value={formState.surname}
                        onChange={handleInputChange}
                        className="border border-gray-300 h-10 rounded-none"
                      />
                    </div>
                  </div>
                  
                  {/* Profession */}
                  <div className="mb-6">
                    <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                      PROFESSION
                    </div>
                    <Input
                      id="profession"
                      name="profession"
                      placeholder="e.g. Retail Sales Associate"
                      value={formState.profession}
                      onChange={handleInputChange}
                      className="border border-gray-300 h-10 rounded-none w-full"
                    />
                  </div>
                </div>
              </div>
              
              {/* City, Country, PIN Code - FIXED */}
              <div className="flex gap-5 mb-6">
                <div className="flex-1">
                  <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                    CITY
                  </div>
                  <Input
                    id="city"
                    name="city"
                    placeholder="e.g. New Delhi"
                    value={formState.city}
                    onChange={handleInputChange}
                    className="border border-gray-300 h-10 rounded-none w-full"
                  />
                </div>
                
                <div className="w-[200px]">
                  <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                    COUNTRY
                  </div>
                  <Input
                    id="country"
                    name="country"
                    placeholder="e.g. India"
                    value={formState.country}
                    onChange={handleInputChange}
                    className="border border-gray-300 h-10 rounded-none w-full"
                  />
                </div>
                
                <div className="w-[200px]">
                  <div className="mb-2 text-xs font-medium text-gray-700 uppercase">
                    PIN CODE
                  </div>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    placeholder="e.g. 110034"
                    value={formState.postalCode}
                    onChange={handleInputChange}
                    className="border border-gray-300 h-10 rounded-none w-full"
                  />
                </div>
              </div>
              
              {/* Phone and Email - FIXED ALIGNMENT */}
              <div className="flex gap-5 mb-7">
                <div className="flex-1">
                  <div className="mb-4 text-xs font-medium text-gray-700 uppercase">
                    PHONE
                  </div>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="e.g. +91 22 1234 5677"
                    value={formState.phone}
                    onChange={handleInputChange}
                    className="border border-gray-300 h-10 rounded-none w-full"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="mb-2 flex items-center">
                    <div className="text-xs font-medium text-gray-700 uppercase">
                      EMAIL
                    </div>
                    <span className="text-red-500 ml-1">*</span>
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="e.g. saanvipatel@sample.in"
                    value={formState.email}
                    onChange={handleInputChange}
                    required
                    className="border border-gray-300 h-10 rounded-none w-full"
                  />
                </div>
              </div>
              
              {/* Summary section removed as requested */}
              
              {/* Additional Information Section */}
              <div className="mb-20">
                <div className="flex items-center mb-4">
                  <span className="text-sm text-gray-700">Add additional information to your resume</span>
                  <span className="text-xs text-gray-500 ml-1">(optional)</span>
                  <div className="ml-2 inline-flex items-center justify-center">
                    <Info size={16} className="text-gray-500" />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-8">
                  {/* LinkedIn with direct local state */}
                  {showLinkedIn ? (
                    <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg mb-2 w-full">
                      <label className="text-sm text-gray-700 whitespace-nowrap">LinkedIn:</label>
                      <input
                        type="text"
                        value={linkedInValue}
                        onChange={(e) => handleLinkedInChange(e.target.value)}
                        placeholder="Your LinkedIn URL"
                        className="border border-gray-200 p-1 text-sm rounded flex-1"
                      />
                      <button
                        onClick={handleRemoveLinkedIn}
                        className="p-1 text-red-500 hover:text-red-700 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                      onClick={handleAddLinkedIn}
                    >
                      LinkedIn
                      <span className="ml-2 font-bold">+</span>
                    </button>
                  )}
                  
                  {/* Website with direct local state */}
                  {showWebsite ? (
                    <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg mb-2 w-full">
                      <label className="text-sm text-gray-700 whitespace-nowrap">Website:</label>
                      <input
                        type="text"
                        value={websiteValue}
                        onChange={(e) => handleWebsiteChange(e.target.value)}
                        placeholder="Your website URL"
                        className="border border-gray-200 p-1 text-sm rounded flex-1"
                      />
                      <button
                        onClick={handleRemoveWebsite}
                        className="p-1 text-red-500 hover:text-red-700 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                      onClick={handleAddWebsite}
                    >
                      Website
                      <span className="ml-2 font-bold">+</span>
                    </button>
                  )}
                  
                  {/* Driving License with direct local state */}
                  {showDrivingLicense ? (
                    <div className="flex items-center gap-2 border border-blue-200 bg-blue-50 px-4 py-2 rounded-lg mb-2 w-full">
                      <label className="text-sm text-gray-700 whitespace-nowrap">Driving License:</label>
                      <input
                        type="text"
                        value={drivingLicenseValue}
                        onChange={(e) => handleDrivingLicenseChange(e.target.value)}
                        placeholder="Your license details"
                        className="border border-gray-200 p-1 text-sm rounded flex-1"
                      />
                      <button
                        onClick={handleRemoveDrivingLicense}
                        className="p-1 text-red-500 hover:text-red-700 rounded-full"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <button
                      className="border border-[#450da5] text-[#450da5] px-4 py-1.5 rounded-full text-sm font-normal flex items-center"
                      onClick={handleAddDrivingLicense}
                    >
                      Driving licence
                      <span className="ml-2 font-bold">+</span>
                    </button>
                  )}
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="pb-10 flex justify-between">
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
          </div>
          
          {/* Right column - Resume Preview */}
          <div className="lg:w-[32%] mt-10 lg:mt-0">
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
            
            {/* Resume Preview */}
            <div className="border border-gray-200 overflow-hidden mx-auto" style={{ maxWidth: '280px' }}>
              <div className="relative bg-white" style={{ height: '400px' }}>
                <HybridResumePreview 
                  className="h-full w-full" 
                  width={280} 
                  height={410}
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
      <footer className="py-4 border-t border-gray-200">
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
      
      {/* Use the centralized Resume Preview Modal component */}
      <ResumePreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        resumeData={resumeData}
        selectedTemplateId={selectedTemplateId}
        setSelectedTemplateId={setSelectedTemplateId}
        templates={templates as any}
        hideSkills={true}
        onNextStep={handleNext}
      />
      
      {/* Template selection modal */}
    </div>
  );
};

export default PersonalInformationPage;