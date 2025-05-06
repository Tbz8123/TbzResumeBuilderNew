import React, { useState } from 'react';
import { ResumeData } from './TemplateEngine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PlusCircle, MinusCircle, User, Briefcase, GraduationCap, Award, Globe, Code } from 'lucide-react';

interface TemplateFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ data, onChange }) => {
  // Personal Info Section
  const updatePersonalInfo = (field: string, value: string) => {
    onChange({
      ...data,
      personalInfo: {
        ...data.personalInfo,
        [field]: value
      }
    });
  };

  // Work Experience Section
  const addWorkExperience = () => {
    onChange({
      ...data,
      workExperience: [
        ...data.workExperience,
        {
          company: '',
          position: '',
          startDate: '',
          endDate: '',
          description: '',
          achievements: []
        }
      ]
    });
  };

  const updateWorkExperience = (index: number, field: string, value: string | string[]) => {
    const updatedExperiences = [...data.workExperience];
    updatedExperiences[index] = {
      ...updatedExperiences[index],
      [field]: value
    };
    
    onChange({
      ...data,
      workExperience: updatedExperiences
    });
  };

  const removeWorkExperience = (index: number) => {
    const updatedExperiences = [...data.workExperience];
    updatedExperiences.splice(index, 1);
    
    onChange({
      ...data,
      workExperience: updatedExperiences
    });
  };

  // Education Section
  const addEducation = () => {
    onChange({
      ...data,
      education: [
        ...data.education,
        {
          institution: '',
          degree: '',
          field: '',
          startDate: '',
          endDate: '',
          achievements: []
        }
      ]
    });
  };

  const updateEducation = (index: number, field: string, value: string | string[]) => {
    const updatedEducation = [...data.education];
    updatedEducation[index] = {
      ...updatedEducation[index],
      [field]: value
    };
    
    onChange({
      ...data,
      education: updatedEducation
    });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = [...data.education];
    updatedEducation.splice(index, 1);
    
    onChange({
      ...data,
      education: updatedEducation
    });
  };

  // Skills Section
  const addSkill = () => {
    onChange({
      ...data,
      skills: [
        ...data.skills,
        {
          name: '',
          level: 50
        }
      ]
    });
  };

  const updateSkill = (index: number, field: string, value: string | number) => {
    const updatedSkills = [...data.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: field === 'level' ? Number(value) : value
    };
    
    onChange({
      ...data,
      skills: updatedSkills
    });
  };

  const removeSkill = (index: number) => {
    const updatedSkills = [...data.skills];
    updatedSkills.splice(index, 1);
    
    onChange({
      ...data,
      skills: updatedSkills
    });
  };

  // Helper function to handle achievements (arrays)
  const handleAchievementChange = (
    section: 'workExperience' | 'education',
    sectionIndex: number,
    achievementIndex: number,
    value: string
  ) => {
    const updatedSection = [...data[section]];
    const achievements = [...(updatedSection[sectionIndex].achievements || [])];
    
    achievements[achievementIndex] = value;
    
    updatedSection[sectionIndex] = {
      ...updatedSection[sectionIndex],
      achievements
    };
    
    onChange({
      ...data,
      [section]: updatedSection
    });
  };

  const addAchievement = (section: 'workExperience' | 'education', sectionIndex: number) => {
    const updatedSection = [...data[section]];
    const achievements = [...(updatedSection[sectionIndex].achievements || []), ''];
    
    updatedSection[sectionIndex] = {
      ...updatedSection[sectionIndex],
      achievements
    };
    
    onChange({
      ...data,
      [section]: updatedSection
    });
  };

  const removeAchievement = (
    section: 'workExperience' | 'education',
    sectionIndex: number,
    achievementIndex: number
  ) => {
    const updatedSection = [...data[section]];
    const achievements = [...(updatedSection[sectionIndex].achievements || [])];
    
    achievements.splice(achievementIndex, 1);
    
    updatedSection[sectionIndex] = {
      ...updatedSection[sectionIndex],
      achievements
    };
    
    onChange({
      ...data,
      [section]: updatedSection
    });
  };

  return (
    <div className="resume-form space-y-6 p-4">
      <Accordion type="single" collapsible defaultValue="personal-info" className="w-full">
        {/* Personal Information */}
        <AccordionItem value="personal-info">
          <AccordionTrigger className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            <span>Personal Information</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={data.personalInfo.name}
                    onChange={(e) => updatePersonalInfo('name', e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    value={data.personalInfo.title}
                    onChange={(e) => updatePersonalInfo('title', e.target.value)}
                    placeholder="Software Engineer"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={data.personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={data.personalInfo.phone}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Location</Label>
                  <Input
                    id="address"
                    value={data.personalInfo.address || ''}
                    onChange={(e) => updatePersonalInfo('address', e.target.value)}
                    placeholder="New York, NY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={data.personalInfo.website || ''}
                    onChange={(e) => updatePersonalInfo('website', e.target.value)}
                    placeholder="yourwebsite.com"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn</Label>
                <Input
                  id="linkedin"
                  value={data.personalInfo.linkedin || ''}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/johndoe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="summary">Professional Summary</Label>
                <Textarea
                  id="summary"
                  value={data.personalInfo.summary || ''}
                  onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                  placeholder="A brief overview of your professional background and strengths"
                  rows={4}
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Work Experience */}
        <AccordionItem value="work-experience">
          <AccordionTrigger className="flex items-center">
            <Briefcase className="h-5 w-5 mr-2" />
            <span>Work Experience</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {data.workExperience.map((experience, index) => (
                <div key={`work-${index}`} className="border p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removeWorkExperience(index)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    aria-label="Remove experience"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`company-${index}`}>Company</Label>
                      <Input
                        id={`company-${index}`}
                        value={experience.company}
                        onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                        placeholder="Company Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`position-${index}`}>Position</Label>
                      <Input
                        id={`position-${index}`}
                        value={experience.position}
                        onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                        placeholder="Job Title"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`start-date-${index}`}>Start Date</Label>
                      <Input
                        id={`start-date-${index}`}
                        value={experience.startDate}
                        onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                        placeholder="YYYY-MM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`end-date-${index}`}>End Date</Label>
                      <Input
                        id={`end-date-${index}`}
                        value={experience.endDate}
                        onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                        placeholder="YYYY-MM or Present"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor={`description-${index}`}>Description</Label>
                    <Textarea
                      id={`description-${index}`}
                      value={experience.description}
                      onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                      placeholder="Brief description of your role and responsibilities"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Key Achievements</Label>
                      <button
                        type="button"
                        onClick={() => addAchievement('workExperience', index)}
                        className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Achievement
                      </button>
                    </div>
                    
                    {experience.achievements?.map((achievement, achievementIndex) => (
                      <div key={`work-achievement-${index}-${achievementIndex}`} className="flex items-center gap-2">
                        <Input
                          value={achievement}
                          onChange={(e) => handleAchievementChange('workExperience', index, achievementIndex, e.target.value)}
                          placeholder="Describe a key achievement"
                        />
                        <button
                          type="button"
                          onClick={() => removeAchievement('workExperience', index, achievementIndex)}
                          className="text-gray-500 hover:text-red-500"
                          aria-label="Remove achievement"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addWorkExperience}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Work Experience
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Education */}
        <AccordionItem value="education">
          <AccordionTrigger className="flex items-center">
            <GraduationCap className="h-5 w-5 mr-2" />
            <span>Education</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pt-2">
              {data.education.map((edu, index) => (
                <div key={`education-${index}`} className="border p-4 rounded-md relative">
                  <button
                    type="button"
                    onClick={() => removeEducation(index)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                    aria-label="Remove education"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                  
                  <div className="space-y-2 mb-4">
                    <Label htmlFor={`institution-${index}`}>Institution</Label>
                    <Input
                      id={`institution-${index}`}
                      value={edu.institution}
                      onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                      placeholder="University or School Name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`degree-${index}`}>Degree</Label>
                      <Input
                        id={`degree-${index}`}
                        value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`field-${index}`}>Field of Study</Label>
                      <Input
                        id={`field-${index}`}
                        value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        placeholder="Computer Science"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edu-start-date-${index}`}>Start Date</Label>
                      <Input
                        id={`edu-start-date-${index}`}
                        value={edu.startDate}
                        onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                        placeholder="YYYY-MM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-end-date-${index}`}>End Date</Label>
                      <Input
                        id={`edu-end-date-${index}`}
                        value={edu.endDate}
                        onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                        placeholder="YYYY-MM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`gpa-${index}`}>GPA (Optional)</Label>
                      <Input
                        id={`gpa-${index}`}
                        value={edu.gpa || ''}
                        onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                        placeholder="3.8/4.0"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Achievements & Activities</Label>
                      <button
                        type="button"
                        onClick={() => addAchievement('education', index)}
                        className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
                      >
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Achievement
                      </button>
                    </div>
                    
                    {edu.achievements?.map((achievement, achievementIndex) => (
                      <div key={`edu-achievement-${index}-${achievementIndex}`} className="flex items-center gap-2">
                        <Input
                          value={achievement}
                          onChange={(e) => handleAchievementChange('education', index, achievementIndex, e.target.value)}
                          placeholder="Honors, awards, activities"
                        />
                        <button
                          type="button"
                          onClick={() => removeAchievement('education', index, achievementIndex)}
                          className="text-gray-500 hover:text-red-500"
                          aria-label="Remove achievement"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addEducation}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Education
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Skills */}
        <AccordionItem value="skills">
          <AccordionTrigger className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            <span>Skills</span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {data.skills.map((skill, index) => (
                <div key={`skill-${index}`} className="flex items-center gap-4">
                  <div className="flex-grow">
                    <Input
                      value={skill.name}
                      onChange={(e) => updateSkill(index, 'name', e.target.value)}
                      placeholder="Skill name (e.g., JavaScript, Project Management)"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="range"
                      min="0"
                      max="100"
                      value={skill.level || 50}
                      onChange={(e) => updateSkill(index, 'level', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="w-12 text-center">
                    {skill.level || 50}%
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSkill(index)}
                    className="text-gray-500 hover:text-red-500"
                    aria-label="Remove skill"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addSkill}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Skill
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TemplateForm;