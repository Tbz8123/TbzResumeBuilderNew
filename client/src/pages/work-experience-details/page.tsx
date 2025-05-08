import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Helper function to generate month options
const generateMonths = () => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months;
};

// Helper function to generate year options
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 50; i--) {
    years.push(i.toString());
  }
  return years;
};

interface WorkExperience {
  id?: string;
  jobTitle: string;
  employer: string;
  location: string;
  isRemote: boolean;
  startMonth: string;
  startYear: string;
  endMonth: string;
  endYear: string;
  isCurrentJob: boolean;
  responsibilities: string;
}

const WorkExperienceDetailsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData } = useResume();
  
  // Initialize with empty values
  const [workExperience, setWorkExperience] = useState<WorkExperience>({
    jobTitle: '',
    employer: '',
    location: '',
    isRemote: false,
    startMonth: '',
    startYear: '',
    endMonth: '',
    endYear: '',
    isCurrentJob: false,
    responsibilities: ''
  });

  const handleBack = () => {
    setLocation('/work-history');
  };

  const handlePreview = () => {
    // Save before previewing
    saveWorkExperience();
    // Navigate to preview (you'll need to create this page)
    setLocation('/preview');
  };

  const handleNext = () => {
    // Save and navigate to the next step
    saveWorkExperience();
    setLocation('/education'); // Assuming education is the next step
  };

  const saveWorkExperience = () => {
    // Only add if there's at least a job title and employer
    if (workExperience.jobTitle && workExperience.employer) {
      const updatedWorkExperience = [...(resumeData.workExperience || [])];
      
      // Add as the first item (most recent job)
      updatedWorkExperience.unshift({
        ...workExperience,
        id: Date.now().toString(), // Generate a unique ID
      });
      
      updateResumeData({ workExperience: updatedWorkExperience });
    }
  };

  const handleInputChange = (field: keyof WorkExperience, value: string | boolean) => {
    setWorkExperience(prev => {
      const updated = { ...prev, [field]: value };
      
      // Real-time update to the preview
      if (field === 'jobTitle' || field === 'employer') {
        // Create a temporary array with the current work experience
        const tempWorkExperience = [...(resumeData.workExperience || [])];
        
        // Add the current form data to the first position
        tempWorkExperience.unshift({
          ...workExperience,
          [field]: value, // Use the updated value
          id: 'temp-' + Date.now(), // Temporary ID
        });
        
        // Update the resume data in real-time
        updateResumeData({ workExperience: tempWorkExperience });
      }
      
      return updated;
    });
  };

  const handleCurrentJobChange = (checked: boolean) => {
    setWorkExperience(prev => ({
      ...prev,
      isCurrentJob: checked,
      // Clear end date if current job
      ...(checked ? { endMonth: '', endYear: '' } : {})
    }));
    
    // Update the preview in real-time
    const tempWorkExperience = [...(resumeData.workExperience || [])];
    tempWorkExperience.unshift({
      ...workExperience,
      isCurrentJob: checked,
      ...(checked ? { endMonth: '', endYear: '' } : {}),
      id: 'temp-' + Date.now(),
    });
    updateResumeData({ workExperience: tempWorkExperience });
  };

  const months = generateMonths();
  const years = generateYears();

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4">
          <Logo size="medium" />
        </div>
      </header>
      
      <main className="flex-grow py-10">
        <div className="w-full max-w-3xl mx-auto px-6">
          {/* Back Button */}
          <div className="mb-6">
            <button 
              onClick={handleBack}
              className="flex items-center text-purple-600 hover:text-purple-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Go Back
            </button>
          </div>
          
          {/* Main Content */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold">Tell us about your most recent job</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-purple-600">
                      <span className="flex items-center">
                        <HelpCircle className="h-4 w-4 ml-1" />
                        Tips
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs p-4">
                    <p>Include your most recent work experience first. If you have gaps in employment, consider including volunteer work or freelance projects.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-gray-600">We'll start there and work backward.</p>
          </div>
          
          <div className="text-xs text-gray-500 mb-6">
            * indicates a required field
          </div>

          {/* Form */}
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              {/* Job Title */}
              <div>
                <label htmlFor="jobTitle" className="block text-xs uppercase font-medium mb-2">
                  JOB TITLE <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="jobTitle"
                  value={workExperience.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="e.g. Analyst"
                  className="rounded-sm border-gray-300 h-10"
                  required
                />
              </div>

              {/* Employer */}
              <div>
                <label htmlFor="employer" className="block text-xs uppercase font-medium mb-2">
                  EMPLOYER <span className="text-red-500">*</span>
                </label>
                <Input 
                  id="employer"
                  value={workExperience.employer}
                  onChange={(e) => handleInputChange('employer', e.target.value)}
                  placeholder="e.g. Tata Group"
                  className="rounded-sm border-gray-300 h-10"
                  required
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-xs uppercase font-medium mb-2">
                LOCATION
              </label>
              <Input 
                id="location"
                value={workExperience.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g. New Delhi, India"
                className="rounded-sm border-gray-300 h-10"
              />
            </div>

            {/* Remote Checkbox */}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="remote"
                checked={workExperience.isRemote}
                onCheckedChange={(checked) => 
                  handleInputChange('isRemote', Boolean(checked))
                }
                className="rounded-sm h-4 w-4"
              />
              <label htmlFor="remote" className="text-sm">
                Remote
              </label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button>
                      <HelpCircle className="h-4 w-4 text-blue-600" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Check this if you worked remotely.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-8 mt-4">
              {/* Start Date */}
              <div>
                <label className="block text-xs uppercase font-medium mb-2">
                  START DATE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={workExperience.startMonth}
                    onValueChange={(value) => handleInputChange('startMonth', value)}
                  >
                    <SelectTrigger className="h-10 rounded-sm border-gray-300">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={workExperience.startYear}
                    onValueChange={(value) => handleInputChange('startYear', value)}
                  >
                    <SelectTrigger className="h-10 rounded-sm border-gray-300">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-xs uppercase font-medium mb-2">
                  END DATE
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Select 
                    value={workExperience.endMonth}
                    onValueChange={(value) => handleInputChange('endMonth', value)}
                    disabled={workExperience.isCurrentJob}
                  >
                    <SelectTrigger className="h-10 rounded-sm border-gray-300">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month} value={month}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select 
                    value={workExperience.endYear}
                    onValueChange={(value) => handleInputChange('endYear', value)}
                    disabled={workExperience.isCurrentJob}
                  >
                    <SelectTrigger className="h-10 rounded-sm border-gray-300">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Current Job Checkbox */}
            <div className="flex items-center gap-2 mt-2">
              <Checkbox 
                id="currentJob"
                checked={workExperience.isCurrentJob}
                onCheckedChange={(checked) => handleCurrentJobChange(Boolean(checked))}
                className="rounded-sm h-4 w-4"
              />
              <label htmlFor="currentJob" className="text-sm">
                I currently work here
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-center items-center gap-6 pt-12 mt-10">
              <button 
                onClick={handlePreview}
                className="text-purple-600 hover:text-purple-800 border border-purple-600 hover:border-purple-800 font-medium rounded-full px-10 py-2.5 text-base w-28"
              >
                Preview
              </button>
              <button 
                onClick={handleNext}
                className="bg-amber-400 hover:bg-amber-500 text-black font-medium rounded-full px-10 py-2.5 text-base w-28"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkExperienceDetailsPage;