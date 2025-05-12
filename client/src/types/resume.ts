/**
 * Types for the resume data
 */

export interface WorkExperience {
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
  dbJobTitleId?: number | string; // Add database job title ID for direct API access
}

export interface Education {
  id?: string;
  schoolName: string;
  schoolLocation: string;
  degree: string;
  fieldOfStudy: string;
  graduationMonth: string;
  graduationYear: string;
  description: string;
  achievements?: EducationAchievement[];
}

export interface EducationAchievement {
  id?: string;
  type: 'achievement' | 'prize' | 'coursework' | 'activity' | 'study_abroad' | 'apprenticeship' | 'project';
  title: string;
  description?: string;
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
  professionalSummary?: string; // Added for the Professional Summary feature
  professionalSummaryTitleId?: number; // Added to store the selected professional summary title ID
  skills: string[];
  workExperience: WorkExperience[];
  education: Education[];
  certifications?: any[];
  languages?: any[];
  selectedTemplateId?: number; 
}