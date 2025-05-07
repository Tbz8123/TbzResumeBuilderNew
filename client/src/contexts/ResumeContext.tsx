import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the resume data structure
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
  additionalInfo: {
    linkedin?: string;
    website?: string;
    drivingLicense?: string;
    [key: string]: string | undefined;
  };
  // Will add more fields for education, experience, etc. later
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
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);

  // Initialize with template ID from localStorage if available
  React.useEffect(() => {
    const storedTemplateId = localStorage.getItem('selectedTemplateId');
    if (storedTemplateId) {
      setSelectedTemplateId(parseInt(storedTemplateId, 10));
    }
  }, []);

  // Update resume data
  const updateResumeData = (newData: Partial<ResumeData>) => {
    setResumeData(prev => ({
      ...prev,
      ...newData
    }));
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