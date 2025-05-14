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
  professionalSummary?: string; // Added for Professional Summary feature
  professionalSummaryTitleId?: number; // Added to store the selected professional summary title ID
  skills: Skill[];
  workExperience: WorkExperience[];
  education: Education[];
  additionalInfo: {
    linkedin?: string;
    website?: string;
    drivingLicense?: string;
    [key: string]: string | undefined;
  };
  additionalInfoVisibility: {
    linkedin?: boolean;
    website?: boolean;
    drivingLicense?: boolean;
    [key: string]: boolean | undefined;
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
  professionalSummary: '',
  professionalSummaryTitleId: undefined,
  skills: [],
  workExperience: [],
  education: [],
  additionalInfo: {},
  additionalInfoVisibility: {}
};

// Define context type
interface ResumeContextType {
  resumeData: ResumeData;
  updateResumeData: (newData: Partial<ResumeData> | ((prevData: ResumeData) => ResumeData)) => void;
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
  const updateResumeData = (
    newData: Partial<ResumeData> | ((prevData: ResumeData) => ResumeData)
  ) => {
    console.log("ResumeContext - Updating data");
    
    // Handle both direct and functional updates
    if (typeof newData === 'function') {
      setResumeData(prev => {
        const updated = newData(prev);
        console.log("ResumeContext - Updated data via function:", updated);
        return updated;
      });
    } else {
      setResumeData(prev => {
        const updated = {
          ...prev,
          ...newData
        };
        console.log("ResumeContext - Updated data directly:", updated);
        return updated;
      });
    }
  };

  // Add or update additional info
  const updateAdditionalInfo = (key: string, value: string) => {
    console.log(`Adding/updating additionalInfo field: "${key}" with value: "${value}"`);
    setResumeData(prev => {
      const updatedData = {
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          [key]: value
        },
        // Also set the visibility to true when adding/updating a field
        additionalInfoVisibility: {
          ...prev.additionalInfoVisibility,
          [key]: true
        }
      };
      console.log("Updated additionalInfo:", updatedData.additionalInfo);
      console.log("Updated additionalInfoVisibility:", updatedData.additionalInfoVisibility);
      return updatedData;
    });
  };

  // Remove additional info
  const removeAdditionalInfo = (key: string) => {
    console.log(`Removing additionalInfo field: "${key}"`);
    setResumeData(prev => {
      // Create new objects to avoid mutating state
      const newAdditionalInfo = { ...prev.additionalInfo };
      const newAdditionalInfoVisibility = { ...prev.additionalInfoVisibility };
      
      // Remove both the value and visibility flag
      delete newAdditionalInfo[key];
      delete newAdditionalInfoVisibility[key];
      
      console.log("Updated additionalInfo after removal:", newAdditionalInfo);
      console.log("Updated additionalInfoVisibility after removal:", newAdditionalInfoVisibility);
      
      return {
        ...prev,
        additionalInfo: newAdditionalInfo,
        additionalInfoVisibility: newAdditionalInfoVisibility
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