import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface ResumeDataField {
  key: string;
  path: string;
  description: string;
  sampleValue: string;
}

// Define the available resume data field categories
const RESUME_DATA_FIELDS: Record<string, ResumeDataField[]> = {
  "Personal Information": [
    { key: "name", path: "firstName", description: "First name", sampleValue: "John" },
    { key: "surname", path: "surname", description: "Last name", sampleValue: "Doe" },
    { key: "fullName", path: "fullName", description: "Full name", sampleValue: "John Doe" },
    { key: "email", path: "email", description: "Email address", sampleValue: "john.doe@example.com" },
    { key: "phone", path: "phone", description: "Phone number", sampleValue: "+1 (555) 123-4567" },
    { key: "profession", path: "profession", description: "Job title/profession", sampleValue: "Software Engineer" },
    { key: "address", path: "address", description: "Full address", sampleValue: "123 Main St, San Francisco, CA" },
    { key: "city", path: "city", description: "City", sampleValue: "San Francisco" },
    { key: "country", path: "country", description: "Country", sampleValue: "United States" },
    { key: "postalCode", path: "postalCode", description: "Postal code", sampleValue: "94105" },
    { key: "photoUrl", path: "photoUrl", description: "Photo URL", sampleValue: "https://example.com/photo.jpg" },
  ],
  "Professional Summary": [
    { key: "professionalSummary", path: "professionalSummary", description: "Professional summary text", sampleValue: "Experienced software engineer with 5+ years..." },
    { key: "summary", path: "summary", description: "Alternative summary field", sampleValue: "Dedicated professional with a track record..." },
  ],
  "Work Experience": [
    { key: "workExperience[0].company", path: "workExperience[0].company", description: "Company name (first entry)", sampleValue: "Acme Inc." },
    { key: "workExperience[0].position", path: "workExperience[0].position", description: "Job title (first entry)", sampleValue: "Senior Developer" },
    { key: "workExperience[0].startDate", path: "workExperience[0].startDate", description: "Start date (first entry)", sampleValue: "Jan 2020" },
    { key: "workExperience[0].endDate", path: "workExperience[0].endDate", description: "End date (first entry)", sampleValue: "Present" },
    { key: "workExperience[0].description", path: "workExperience[0].description", description: "Job description (first entry)", sampleValue: "Led a team of developers..." },
  ],
  "Education": [
    { key: "education[0].institution", path: "education[0].institution", description: "Institution name (first entry)", sampleValue: "University of California" },
    { key: "education[0].degree", path: "education[0].degree", description: "Degree (first entry)", sampleValue: "Bachelor of Science" },
    { key: "education[0].field", path: "education[0].field", description: "Field of study (first entry)", sampleValue: "Computer Science" },
    { key: "education[0].startDate", path: "education[0].startDate", description: "Start date (first entry)", sampleValue: "Sep 2014" },
    { key: "education[0].endDate", path: "education[0].endDate", description: "End date (first entry)", sampleValue: "May 2018" },
    { key: "education[0].description", path: "education[0].description", description: "Education description (first entry)", sampleValue: "Graduated with honors..." },
  ],
  "Skills": [
    { key: "skills", path: "skills", description: "All skills as comma-separated list", sampleValue: "JavaScript, React, Node.js" },
    { key: "skills[0].name", path: "skills[0].name", description: "First skill name", sampleValue: "JavaScript" },
    { key: "skills[0].level", path: "skills[0].level", description: "First skill level (1-5)", sampleValue: "5" },
  ],
  "Custom Sections": [
    { key: "customSections[0].title", path: "customSections[0].title", description: "First custom section title", sampleValue: "Certifications" },
    { key: "customSections[0].items[0]", path: "customSections[0].items[0]", description: "First item in first custom section", sampleValue: "AWS Certified Solutions Architect" },
  ],
};

interface ResumeDataFieldsProps {
  onSelectDataField: (fieldPath: string) => void;
}

export function ResumeDataFields({ onSelectDataField }: ResumeDataFieldsProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter fields based on search query
  const getFilteredFields = (fields: ResumeDataField[]) => {
    if (!searchQuery) return fields;
    
    return fields.filter(field => 
      field.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };
  
  // Check if any fields in a category match the search
  const categoryHasMatch = (fields: ResumeDataField[]) => {
    if (!searchQuery) return true;
    return getFilteredFields(fields).length > 0;
  };
  
  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search data fields..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Accordion type="multiple" className="w-full">
        {Object.entries(RESUME_DATA_FIELDS).map(([category, fields]) => (
          categoryHasMatch(fields) && (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="text-sm font-medium">
                {category} <span className="ml-2 text-xs text-muted-foreground">({getFilteredFields(fields).length} fields)</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 p-1">
                  {getFilteredFields(fields).map((field) => (
                    <div 
                      key={field.key}
                      className="flex items-start justify-between p-2 rounded-md bg-card hover:bg-accent cursor-pointer"
                      onClick={() => onSelectDataField(field.path)}
                    >
                      <div className="flex-1">
                        <div className="font-mono text-xs text-muted-foreground">{field.path}</div>
                        <div className="text-sm">{field.description}</div>
                      </div>
                      <div className="text-xs italic text-muted-foreground truncate max-w-[120px]">
                        {field.sampleValue}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        ))}
      </Accordion>
    </div>
  );
}