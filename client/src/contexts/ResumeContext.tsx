import React, { createContext, useState, useContext, ReactNode } from 'react';
import { WorkExperience as WorkExperienceType, Education as EducationType } from '@/types/resume';

// Use types from resume.ts
export type WorkExperience = WorkExperienceType;
export type Education = EducationType;

export interface Skill {
  id: string;
  name: string;
  level: number; // 1-5 for skill level
}

export interface AdditionalInfoItem {
  value: string;
  visible: boolean;
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
  _previewTimestamp?: number; // Used to force template re-processing
  
  // Simplified approach - store each additional field as an object with value and visibility
  additionalFields: {
    linkedin?: AdditionalInfoItem;
    website?: AdditionalInfoItem;
    drivingLicense?: AdditionalInfoItem;
    [key: string]: AdditionalInfoItem | undefined;
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
  additionalFields: {}
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
  
  // Enhanced setSelectedTemplateId with tracking and localStorage persistence
  const setSelectedTemplateId = (id: number | null) => {
    console.log("Template ID set in ResumeContext:", id);
    
    // Save to localStorage for persistence between page navigations
    if (id) {
      localStorage.setItem('selectedTemplateId', id.toString());
      console.log("Template ID saved to localStorage:", id);
    } else {
      localStorage.removeItem('selectedTemplateId');
      console.log("Template ID removed from localStorage");
    }
    
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

  // Add or update additional field
  const updateAdditionalInfo = (key: string, value: string) => {
    console.log(`[CONTEXT] Adding/updating additional field: "${key}" with value: "${value}"`);
    
    // Log the current state before update for debugging
    console.log(`[CONTEXT] Before update - additionalFields:`, resumeData.additionalFields);
    
    setResumeData(prev => {
      const updatedData = {
        ...prev,
        additionalFields: {
          ...prev.additionalFields,
          [key]: {
            value: value,
            visible: true
          }
        }
      };
      
      // Debug the after state
      console.log(`[CONTEXT] After update - additionalFields:`, updatedData.additionalFields);
      
      return updatedData;
    });
  };

  // Remove additional field
  const removeAdditionalInfo = (key: string) => {
    console.log(`[CONTEXT] Removing additional field: "${key}"`);
    
    // Log the current state before removal for debugging
    console.log(`[CONTEXT] Before removal - additionalFields:`, resumeData.additionalFields);
    
    setResumeData(prev => {
      // Create a new object to avoid mutating state
      const newAdditionalFields = { ...prev.additionalFields };
      
      // Remove the field
      delete newAdditionalFields[key];
      
      const updatedData = {
        ...prev,
        additionalFields: newAdditionalFields
      };
      
      // Debug the after state  
      console.log(`[CONTEXT] After removal - additionalFields:`, updatedData.additionalFields);
      
      return updatedData;
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