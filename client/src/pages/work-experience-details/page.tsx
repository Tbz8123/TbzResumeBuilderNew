import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useResume } from '@/contexts/ResumeContext';
import Logo from '@/components/Logo';
import { ArrowLeft, HelpCircle, Search, X } from 'lucide-react';
import { getJobTitleSuggestions } from '@/utils/jobTitlesData';
import { apiRequest } from '@/lib/queryClient';
import { JobTitle, ResumeTemplate } from '@shared/schema';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import { useTemplates } from '@/hooks/use-templates';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose
} from '@/components/ui/dialog';
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
import { WorkExperience } from '@/types/resume';

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

const WorkExperienceDetailsPage = () => {
  const [, setLocation] = useLocation();
  const { resumeData, updateResumeData, selectedTemplateId, setSelectedTemplateId } = useResume();
  const jobTitleRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { data: templates } = useTemplates();
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Initialize with empty values
  const [workExperience, setWorkExperience] = useState<WorkExperience>({
    id: `temp-${Date.now()}`,
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
  
  // State for job title suggestions
  const [jobTitleSuggestions, setJobTitleSuggestions] = useState<JobTitle[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Effect to update job title suggestions when the job title input changes
  useEffect(() => {
    const fetchJobTitles = async () => {
      if (workExperience.jobTitle.trim()) {
        try {
          console.log('Searching for job title:', workExperience.jobTitle);
          const response = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(workExperience.jobTitle)}&limit=10`);
          const data = await response.json();
          console.log('Job titles search results:', data);
          
          if (data.data && Array.isArray(data.data)) {
            setJobTitleSuggestions(data.data);
            setShowSuggestions(data.data.length > 0);
          } else {
            console.error('Invalid job titles data structure:', data);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Error fetching job titles:', error);
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    };
    
    // Debounce the API call to prevent excessive requests
    const timeoutId = setTimeout(() => {
      fetchJobTitles();
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [workExperience.jobTitle]);
  
  // Effect to handle clicks outside the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        jobTitleRef.current && 
        !jobTitleRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBack = () => {
    setLocation('/work-history');
  };

  const handlePreview = () => {
    // Save before previewing
    saveWorkExperience();
    // Open the preview modal instead of navigating
    console.log('Opening resume preview modal');
    setPreviewModalOpen(true);
  };

  const handleNext = () => {
    // Save and navigate to the next step
    saveWorkExperience();
    setLocation('/job-description');
  };

  const saveWorkExperience = () => {
    // Only add if there's at least a job title and employer
    if (workExperience.jobTitle && workExperience.employer) {
      const updatedWorkExperience = [...(resumeData.workExperience || [])];
      
      // Add as the first item (most recent job)
      updatedWorkExperience.unshift({
        ...workExperience,
        id: Date.now().toString(), // Generate a unique ID
        // Ensure dbJobTitleId is saved - console log for debugging
        ...(workExperience.dbJobTitleId ? { dbJobTitleId: workExperience.dbJobTitleId } : {})
      });
      
      console.log('Saving work experience with job title ID:', workExperience.dbJobTitleId);
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
  
  // Handle job title suggestion selection
  const handleSelectJobTitle = (jobTitle: JobTitle) => {
    setWorkExperience(prev => ({
      ...prev,
      jobTitle: jobTitle.title,
      dbJobTitleId: jobTitle.id // Store the database job title ID
    }));
    
    // Update the resume preview
    const tempWorkExperience = [...(resumeData.workExperience || [])];
    tempWorkExperience.unshift({
      ...workExperience,
      jobTitle: jobTitle.title,
      dbJobTitleId: jobTitle.id, // Store the database job title ID
      id: 'temp-' + Date.now(),
    });
    updateResumeData({ workExperience: tempWorkExperience });
    
    // Hide suggestions after selection
    setShowSuggestions(false);
    console.log('Selected job title:', jobTitle.title, 'with ID:', jobTitle.id);
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
              <div className="relative">
                <label htmlFor="jobTitle" className="block text-xs uppercase font-medium mb-2">
                  JOB TITLE <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input 
                    id="jobTitle"
                    ref={jobTitleRef}
                    value={workExperience.jobTitle}
                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                    placeholder="e.g. Analyst"
                    className="rounded-sm border-gray-300 h-10 pr-10"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                
                {/* Job title suggestions dropdown */}
                {showSuggestions && (
                  <div 
                    ref={suggestionsRef}
                    className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    <div className="py-1">
                      {jobTitleSuggestions.map((jobTitle) => (
                        <button
                          key={jobTitle.id}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex justify-between items-center"
                          onClick={() => handleSelectJobTitle(jobTitle)}
                        >
                          <div>
                            <span className="font-medium">{jobTitle.title}</span>
                            <span className="text-xs text-gray-500 ml-2">({jobTitle.category})</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
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