import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the resume data structure
export interface WorkExperience {
  jobTitle: string;
  employer: string;
  location: string;
  startDate: string;
  endDate: string;
  isCurrentPosition: boolean;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5 for skill level
}

export interface ResumeData {
  firstName: string;
  surname: string;
  profession: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  photo: string | null;
  summary: string;
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  additionalInfo: {
    linkedin?: string;
    website?: string;
    drivingLicense?: string;
    [key: string]: string | undefined;
  };
}

// Create initial state
const initialResumeData: ResumeData = {
  firstName: '',
  surname: '',
  profession: '',
  city: '',
  country: '',
  postalCode: '',
  phone: '',
  email: '',
  photo: null,
  summary: '',
  skills: [],
  workExperience: [],
  education: [],
  additionalInfo: {}
};

// Define context type
interface ResumeContextType {
  resumeData: ResumeData;
  updateResumeData: (newData: Partial<ResumeData>) => void;
  updateAdditionalInfo: (key: string, value: string) => void;
  removeAdditionalInfo: (key: string) => void;
  selectedTemplateId: number | null;
  setSelectedTemplateId: (id: number | null) => void;
}

// Create context
export const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

// Create provider component
export const ResumeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [selectedTemplateId, setSelectedTemplateIdState] = useState<number | null>(null);
  
  // Enhanced setSelectedTemplateId with tracking
  const setSelectedTemplateId = (id: number | null) => {
    console.log("Template ID set in ResumeContext:", id);
    setSelectedTemplateIdState(id);
  };

  // Initialize with template ID from localStorage if available
  React.useEffect(() => {
    const storedTemplateId = localStorage.getItem('selectedTemplateId');
    if (storedTemplateId) {
      setSelectedTemplateId(parseInt(storedTemplateId, 10));
    }
  }, []);

  // Update resume data with improved reactivity
  const updateResumeData = (newData: Partial<ResumeData>) => {
    console.log("ResumeContext - Updating data:", newData);
    setResumeData(prev => {
      const updated = {
        ...prev,
        ...newData
      };
      console.log("ResumeContext - Updated data:", updated);
      return updated;
    });
  };

  // Add or update additional info
  const updateAdditionalInfo = (key: string, value: string) => {
    setResumeData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        [key]: value
      }
    }));
  };

  // Remove additional info
  const removeAdditionalInfo = (key: string) => {
    setResumeData(prev => {
      const newAdditionalInfo = { ...prev.additionalInfo };
      delete newAdditionalInfo[key];
      return {
        ...prev,
        additionalInfo: newAdditionalInfo
      };
    });
  };

  const contextValue: ResumeContextType = {
    resumeData,
    updateResumeData,
    updateAdditionalInfo,
    removeAdditionalInfo,
    selectedTemplateId,
    setSelectedTemplateId
  };

  return (
    <ResumeContext.Provider value={contextValue}>
      {children}
    </ResumeContext.Provider>
  );
};

// Create hook for using the resume context
export const useResume = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResume must be used within a ResumeProvider');
  }
  return context;
};