import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ResumeData } from './TemplateEngine';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Plus, Trash2, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Define form schema for validation
const formSchema = z.object({
  personalInfo: z.object({
    name: z.string().min(1, 'Name is required'),
    title: z.string().min(1, 'Job title is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    address: z.string().optional(),
    website: z.string().optional(),
    linkedin: z.string().optional(),
    summary: z.string().optional(),
  }),
  workExperience: z.array(
    z.object({
      company: z.string().min(1, 'Company name is required'),
      position: z.string().min(1, 'Position is required'),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().min(1, 'End date is required'),
      description: z.string().min(1, 'Description is required'),
      achievements: z.array(z.string()).optional(),
    })
  ),
  education: z.array(
    z.object({
      institution: z.string().min(1, 'Institution name is required'),
      degree: z.string().min(1, 'Degree is required'),
      field: z.string().min(1, 'Field of study is required'),
      startDate: z.string().min(1, 'Start date is required'),
      endDate: z.string().min(1, 'End date is required'),
      gpa: z.string().optional(),
      achievements: z.array(z.string()).optional(),
    })
  ),
  skills: z.array(
    z.object({
      name: z.string().min(1, 'Skill name is required'),
      level: z.number().min(0).max(100).optional(),
    })
  ),
  certifications: z.array(
    z.object({
      name: z.string().min(1, 'Certification name is required'),
      issuer: z.string().min(1, 'Issuer is required'),
      date: z.string().min(1, 'Date is required'),
    })
  ).optional(),
  languages: z.array(
    z.object({
      language: z.string().min(1, 'Language name is required'),
      proficiency: z.string().min(1, 'Proficiency level is required'),
    })
  ).optional(),
  projects: z.array(
    z.object({
      name: z.string().min(1, 'Project name is required'),
      description: z.string().min(1, 'Description is required'),
      technologies: z.array(z.string()),
      link: z.string().optional(),
    })
  ).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TemplateFormProps {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({ data, onChange }) => {
  // Initialize the form with the current data
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: data as FormValues,
  });

  // Watch form values for live updating
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(value as ResumeData);
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  // Helper function to add a new work experience
  const addWorkExperience = () => {
    const currentExperiences = form.getValues('workExperience') || [];
    form.setValue('workExperience', [
      ...currentExperiences,
      {
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: '',
        achievements: [],
      },
    ]);
  };

  // Helper function to remove a work experience
  const removeWorkExperience = (index: number) => {
    const currentExperiences = form.getValues('workExperience');
    form.setValue(
      'workExperience',
      currentExperiences.filter((_, i) => i !== index)
    );
  };

  // Helper function to add a new education
  const addEducation = () => {
    const currentEducation = form.getValues('education') || [];
    form.setValue('education', [
      ...currentEducation,
      {
        institution: '',
        degree: '',
        field: '',
        startDate: '',
        endDate: '',
        gpa: '',
        achievements: [],
      },
    ]);
  };

  // Helper function to remove an education
  const removeEducation = (index: number) => {
    const currentEducation = form.getValues('education');
    form.setValue(
      'education',
      currentEducation.filter((_, i) => i !== index)
    );
  };

  // Helper function to add a new skill
  const addSkill = () => {
    const currentSkills = form.getValues('skills') || [];
    form.setValue('skills', [
      ...currentSkills,
      {
        name: '',
        level: 75,
      },
    ]);
  };

  // Helper function to remove a skill
  const removeSkill = (index: number) => {
    const currentSkills = form.getValues('skills');
    form.setValue(
      'skills',
      currentSkills.filter((_, i) => i !== index)
    );
  };

  // Helper function to add a new certification
  const addCertification = () => {
    const currentCertifications = form.getValues('certifications') || [];
    form.setValue('certifications', [
      ...currentCertifications,
      {
        name: '',
        issuer: '',
        date: '',
      },
    ]);
  };

  // Helper function to remove a certification
  const removeCertification = (index: number) => {
    const currentCertifications = form.getValues('certifications') || [];
    form.setValue(
      'certifications',
      currentCertifications.filter((_, i) => i !== index)
    );
  };

  // Helper function to add a new language
  const addLanguage = () => {
    const currentLanguages = form.getValues('languages') || [];
    form.setValue('languages', [
      ...currentLanguages,
      {
        language: '',
        proficiency: '',
      },
    ]);
  };

  // Helper function to remove a language
  const removeLanguage = (index: number) => {
    const currentLanguages = form.getValues('languages') || [];
    form.setValue(
      'languages',
      currentLanguages.filter((_, i) => i !== index)
    );
  };

  // Helper function to add a new project
  const addProject = () => {
    const currentProjects = form.getValues('projects') || [];
    form.setValue('projects', [
      ...currentProjects,
      {
        name: '',
        description: '',
        technologies: [],
        link: '',
      },
    ]);
  };

  // Helper function to remove a project
  const removeProject = (index: number) => {
    const currentProjects = form.getValues('projects') || [];
    form.setValue(
      'projects',
      currentProjects.filter((_, i) => i !== index)
    );
  };

  // Helper function to add an achievement to work experience
  const addWorkAchievement = (workIndex: number) => {
    const workExperiences = form.getValues('workExperience');
    const currentAchievements = workExperiences[workIndex].achievements || [];
    const updatedWorkExperience = [...workExperiences];
    updatedWorkExperience[workIndex] = {
      ...updatedWorkExperience[workIndex],
      achievements: [...currentAchievements, ''],
    };
    form.setValue('workExperience', updatedWorkExperience);
  };

  // Helper function to remove an achievement from work experience
  const removeWorkAchievement = (workIndex: number, achievementIndex: number) => {
    const workExperiences = form.getValues('workExperience');
    const currentAchievements = workExperiences[workIndex].achievements || [];
    const updatedWorkExperience = [...workExperiences];
    updatedWorkExperience[workIndex] = {
      ...updatedWorkExperience[workIndex],
      achievements: currentAchievements.filter((_, i) => i !== achievementIndex),
    };
    form.setValue('workExperience', updatedWorkExperience);
  };

  // Helper function to update a work achievement
  const updateWorkAchievement = (workIndex: number, achievementIndex: number, value: string) => {
    const workExperiences = form.getValues('workExperience');
    const currentAchievements = [...(workExperiences[workIndex].achievements || [])];
    currentAchievements[achievementIndex] = value;
    
    const updatedWorkExperience = [...workExperiences];
    updatedWorkExperience[workIndex] = {
      ...updatedWorkExperience[workIndex],
      achievements: currentAchievements,
    };
    
    form.setValue('workExperience', updatedWorkExperience);
  };

  // Helper function to add an achievement to education
  const addEducationAchievement = (educationIndex: number) => {
    const educations = form.getValues('education');
    const currentAchievements = educations[educationIndex].achievements || [];
    const updatedEducation = [...educations];
    updatedEducation[educationIndex] = {
      ...updatedEducation[educationIndex],
      achievements: [...currentAchievements, ''],
    };
    form.setValue('education', updatedEducation);
  };

  // Helper function to remove an achievement from education
  const removeEducationAchievement = (educationIndex: number, achievementIndex: number) => {
    const educations = form.getValues('education');
    const currentAchievements = educations[educationIndex].achievements || [];
    const updatedEducation = [...educations];
    updatedEducation[educationIndex] = {
      ...updatedEducation[educationIndex],
      achievements: currentAchievements.filter((_, i) => i !== achievementIndex),
    };
    form.setValue('education', updatedEducation);
  };

  // Helper function to update an education achievement
  const updateEducationAchievement = (educationIndex: number, achievementIndex: number, value: string) => {
    const educations = form.getValues('education');
    const currentAchievements = [...(educations[educationIndex].achievements || [])];
    currentAchievements[achievementIndex] = value;
    
    const updatedEducation = [...educations];
    updatedEducation[educationIndex] = {
      ...updatedEducation[educationIndex],
      achievements: currentAchievements,
    };
    
    form.setValue('education', updatedEducation);
  };

  // Helper function to add a technology to a project
  const addProjectTechnology = (projectIndex: number) => {
    const projects = form.getValues('projects') || [];
    const currentTechnologies = projects[projectIndex].technologies || [];
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      technologies: [...currentTechnologies, ''],
    };
    form.setValue('projects', updatedProjects);
  };

  // Helper function to remove a technology from a project
  const removeProjectTechnology = (projectIndex: number, technologyIndex: number) => {
    const projects = form.getValues('projects') || [];
    const currentTechnologies = projects[projectIndex].technologies || [];
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      technologies: currentTechnologies.filter((_, i) => i !== technologyIndex),
    };
    form.setValue('projects', updatedProjects);
  };

  // Helper function to update a project technology
  const updateProjectTechnology = (projectIndex: number, technologyIndex: number, value: string) => {
    const projects = form.getValues('projects') || [];
    const currentTechnologies = [...(projects[projectIndex].technologies || [])];
    currentTechnologies[technologyIndex] = value;
    
    const updatedProjects = [...projects];
    updatedProjects[projectIndex] = {
      ...updatedProjects[projectIndex],
      technologies: currentTechnologies,
    };
    
    form.setValue('projects', updatedProjects);
  };

  return (
    <Form {...form}>
      <form className="space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] p-4">
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="personal">Personal Info</TabsTrigger>
            <TabsTrigger value="experience">Experience & Education</TabsTrigger>
            <TabsTrigger value="skills">Skills & More</TabsTrigger>
          </TabsList>
          
          {/* Personal Information Tab */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="personalInfo.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="personalInfo.title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Senior Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personalInfo.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john.doe@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="personalInfo.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personalInfo.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="City, State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="personalInfo.website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input placeholder="yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="personalInfo.linkedin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input placeholder="linkedin.com/in/yourusername" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="personalInfo.summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Summary</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Briefly describe your professional background and key qualifications..." 
                          className="min-h-24"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Experience & Education Tab */}
          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple" className="w-full space-y-4">
                  {form.getValues('workExperience')?.map((work, index) => (
                    <AccordionItem key={index} value={`work-${index}`} className="border rounded-lg px-4">
                      <div className="flex justify-between items-center">
                        <AccordionTrigger className="text-left">
                          {work.position || 'New Position'} at {work.company || 'Company'}
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeWorkExperience(index);
                          }}
                          className="h-8 w-8 mr-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`workExperience.${index}.company`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Company</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`workExperience.${index}.position`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Position</FormLabel>
                                  <FormControl>
                                    <Input {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`workExperience.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Date</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="YYYY-MM" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`workExperience.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Date</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="YYYY-MM or Present" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name={`workExperience.${index}.description`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Textarea className="min-h-20" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel>Key Achievements</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addWorkAchievement(index)}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Achievement
                              </Button>
                            </div>
                            
                            {work.achievements?.map((achievement, achievementIndex) => (
                              <div key={achievementIndex} className="flex items-center mb-2">
                                <Input
                                  value={achievement}
                                  onChange={(e) => updateWorkAchievement(index, achievementIndex, e.target.value)}
                                  placeholder="Describe a key achievement..."
                                  className="flex-grow"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeWorkAchievement(index, achievementIndex)}
                                  className="ml-2 h-8 w-8 text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addWorkExperience}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Work Experience
                </Button>
              </CardContent>
            </Card>
            
            <Separator className="my-8" />
            
            <Card>
              <CardHeader>
                <CardTitle>Education</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Accordion type="multiple" className="w-full space-y-4">
                  {form.getValues('education')?.map((edu, index) => (
                    <AccordionItem key={index} value={`education-${index}`} className="border rounded-lg px-4">
                      <div className="flex justify-between items-center">
                        <AccordionTrigger className="text-left">
                          {edu.degree || 'Degree'} in {edu.field || 'Field'} at {edu.institution || 'Institution'}
                        </AccordionTrigger>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeEducation(index);
                          }}
                          className="h-8 w-8 mr-2 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <AccordionContent className="pt-4">
                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name={`education.${index}.institution`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Institution</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.degree`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Degree</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Bachelor's, Master's, etc." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.field`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Field of Study</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="Computer Science, Business, etc." />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name={`education.${index}.startDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Year</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="YYYY" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.endDate`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Year</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="YYYY or Present" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name={`education.${index}.gpa`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GPA (Optional)</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g. 3.8/4.0" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <FormLabel>Achievements</FormLabel>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addEducationAchievement(index)}
                                className="h-8"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Add Achievement
                              </Button>
                            </div>
                            
                            {edu.achievements?.map((achievement, achievementIndex) => (
                              <div key={achievementIndex} className="flex items-center mb-2">
                                <Input
                                  value={achievement}
                                  onChange={(e) => updateEducationAchievement(index, achievementIndex, e.target.value)}
                                  placeholder="Honors, awards, notable projects..."
                                  className="flex-grow"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeEducationAchievement(index, achievementIndex)}
                                  className="ml-2 h-8 w-8 text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addEducation}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Education
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Skills & More Tab */}
          <TabsContent value="skills">
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues('skills')?.map((skill, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name={`skills.${index}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input {...field} placeholder="Skill name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`skills.${index}.level`}
                      render={({ field }) => (
                        <FormItem className="w-24">
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0" 
                              max="100" 
                              {...field} 
                              value={field.value || 0} 
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              placeholder="Level" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeSkill(index)}
                      className="h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addSkill}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Skill
                </Button>
              </CardContent>
            </Card>
            
            <Separator className="my-8" />
            
            <Card>
              <CardHeader>
                <CardTitle>Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues('certifications')?.map((cert, index) => (
                  <div key={index} className="border rounded-lg p-4 relative">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeCertification(index)}
                      className="absolute top-2 right-2 h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-1">
                            <FormLabel>Certification Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.issuer`}
                        render={({ field }) => (
                          <FormItem className="col-span-1 md:col-span-1">
                            <FormLabel>Issuing Organization</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name={`certifications.${index}.date`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="YYYY" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCertification}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Certification
                </Button>
              </CardContent>
            </Card>
            
            <Separator className="my-8" />
            
            <Card>
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues('languages')?.map((lang, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name={`languages.${index}.language`}
                      render={({ field }) => (
                        <FormItem className="flex-grow">
                          <FormControl>
                            <Input {...field} placeholder="Language" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`languages.${index}.proficiency`}
                      render={({ field }) => (
                        <FormItem className="w-40">
                          <FormControl>
                            <Input {...field} placeholder="Proficiency level" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLanguage(index)}
                      className="h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addLanguage}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Language
                </Button>
              </CardContent>
            </Card>
            
            <Separator className="my-8" />
            
            <Card>
              <CardHeader>
                <CardTitle>Projects</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {form.getValues('projects')?.map((project, index) => (
                  <div key={index} className="border rounded-lg p-4 relative space-y-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeProject(index)}
                      className="absolute top-2 right-2 h-8 w-8 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    <FormField
                      control={form.control}
                      name={`projects.${index}.name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`projects.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`projects.${index}.link`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Link (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel>Technologies Used</FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addProjectTechnology(index)}
                          className="h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Add Technology
                        </Button>
                      </div>
                      
                      {project.technologies?.map((tech, techIndex) => (
                        <div key={techIndex} className="flex items-center mb-2">
                          <Input
                            value={tech}
                            onChange={(e) => updateProjectTechnology(index, techIndex, e.target.value)}
                            placeholder="Technology name"
                            className="flex-grow"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeProjectTechnology(index, techIndex)}
                            className="ml-2 h-8 w-8 text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProject}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add Project
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  );
};

export default TemplateForm;