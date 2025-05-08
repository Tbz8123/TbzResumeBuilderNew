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
  skills: string[];
  workExperience: WorkExperience[];
  education?: any[];
  certifications?: any[];
  languages?: any[];
  selectedTemplateId?: number; 
}