import React, { useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { 
  useTemplate, 
  useUpdateTemplate,
  useCreateTemplate
} from '@/hooks/use-templates';
import { ResumeTemplate } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import TemplateBuilder from '@/components/resume/TemplateBuilder';

const defaultTemplate = {
  name: 'New Template',
  description: 'A professional modern resume template',
  category: 'professional',
  svgContent: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="800" height="1120" viewBox="0 0 800 1120" xmlns="http://www.w3.org/2000/svg">
  <!-- Header Section -->
  <rect x="0" y="0" width="800" height="120" fill="#5E17EB" />
  
  <!-- Profile Picture Placeholder -->
  <circle cx="80" cy="60" r="40" fill="#FFFFFF" />
  
  <!-- Name and Title -->
  <text x="140" y="50" font-family="Arial" font-size="24" font-weight="bold" fill="#FFFFFF">{{name}}</text>
  <text x="140" y="80" font-family="Arial" font-size="16" fill="#CCCCFF">{{title}}</text>
  
  <!-- Contact Information -->
  <text x="500" y="40" font-family="Arial" font-size="12" fill="#FFFFFF">{{email}}</text>
  <text x="500" y="60" font-family="Arial" font-size="12" fill="#FFFFFF">{{phone}}</text>
  <text x="500" y="80" font-family="Arial" font-size="12" fill="#FFFFFF">{{address}}</text>
  
  <!-- Main Content Area Background -->
  <rect x="0" y="120" width="800" height="1000" fill="#FFFFFF" />
  
  <!-- Left Column -->
  <rect x="0" y="120" width="250" height="1000" fill="#F8F5FF" />
  
  <!-- Summary Section -->
  <text x="280" y="160" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Professional Summary</text>
  <line x1="280" y1="170" x2="760" y2="170" stroke="#5E17EB" stroke-width="2" />
  
  <text x="280" y="200" font-family="Arial" font-size="14" fill="#333333">
    <tspan x="280" dy="0">{{summary}}</tspan>
  </text>
  
  <!-- Experience Section -->
  <text x="280" y="280" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Experience</text>
  <line x1="280" y1="290" x2="760" y2="290" stroke="#5E17EB" stroke-width="2" />
  
  <!-- Job 1 -->
  <text x="280" y="320" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Senior Software Engineer</text>
  <text x="280" y="340" font-family="Arial" font-size="14" font-style="italic" fill="#666666">Tech Company Inc. | 2020 - Present</text>
  <text x="280" y="370" font-family="Arial" font-size="14" fill="#333333">
    <tspan x="280" dy="0">• Led development of web applications using React and Node.js</tspan>
    <tspan x="280" dy="20">• Implemented CI/CD pipeline that reduced deployment time by 75%</tspan>
    <tspan x="280" dy="20">• Mentored junior developers, improving team productivity</tspan>
  </text>
  
  <!-- Job 2 -->
  <text x="280" y="450" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Software Developer</text>
  <text x="280" y="470" font-family="Arial" font-size="14" font-style="italic" fill="#666666">Digital Solutions LLC | 2017 - 2019</text>
  <text x="280" y="500" font-family="Arial" font-size="14" fill="#333333">
    <tspan x="280" dy="0">• Created responsive web interfaces using modern frontend frameworks</tspan>
    <tspan x="280" dy="20">• Optimized database queries, improving application performance</tspan>
    <tspan x="280" dy="20">• Developed RESTful APIs for mobile and web clients</tspan>
  </text>
  
  <!-- Education Section -->
  <text x="280" y="580" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Education</text>
  <line x1="280" y1="590" x2="760" y2="590" stroke="#5E17EB" stroke-width="2" />
  
  <text x="280" y="620" font-family="Arial" font-size="16" font-weight="bold" fill="#333333">Bachelor of Science in Computer Science</text>
  <text x="280" y="640" font-family="Arial" font-size="14" font-style="italic" fill="#666666">University of Technology | 2013 - 2017</text>
  <text x="280" y="660" font-family="Arial" font-size="14" fill="#333333">GPA: 3.8/4.0</text>
  
  <!-- Skills Section (Left Column) -->
  <text x="40" y="160" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Skills</text>
  <line x1="40" y1="170" x2="210" y2="170" stroke="#5E17EB" stroke-width="2" />
  
  <!-- Skill Bars -->
  <text x="40" y="200" font-family="Arial" font-size="14" fill="#333333">JavaScript</text>
  <rect x="40" y="210" width="170" height="10" rx="5" fill="#E8E0FF" />
  <rect x="40" y="210" width="153" height="10" rx="5" fill="#5E17EB" />
  
  <text x="40" y="240" font-family="Arial" font-size="14" fill="#333333">React</text>
  <rect x="40" y="250" width="170" height="10" rx="5" fill="#E8E0FF" />
  <rect x="40" y="250" width="144" height="10" rx="5" fill="#5E17EB" />
  
  <text x="40" y="280" font-family="Arial" font-size="14" fill="#333333">Node.js</text>
  <rect x="40" y="290" width="170" height="10" rx="5" fill="#E8E0FF" />
  <rect x="40" y="290" width="136" height="10" rx="5" fill="#5E17EB" />
  
  <text x="40" y="320" font-family="Arial" font-size="14" fill="#333333">TypeScript</text>
  <rect x="40" y="330" width="170" height="10" rx="5" fill="#E8E0FF" />
  <rect x="40" y="330" width="127" height="10" rx="5" fill="#5E17EB" />
  
  <text x="40" y="360" font-family="Arial" font-size="14" fill="#333333">HTML/CSS</text>
  <rect x="40" y="370" width="170" height="10" rx="5" fill="#E8E0FF" />
  <rect x="40" y="370" width="144" height="10" rx="5" fill="#5E17EB" />
  
  <!-- Languages Section (Left Column) -->
  <text x="40" y="420" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Languages</text>
  <line x1="40" y1="430" x2="210" y2="430" stroke="#5E17EB" stroke-width="2" />
  
  <text x="40" y="460" font-family="Arial" font-size="14" fill="#333333">English - Native</text>
  <text x="40" y="485" font-family="Arial" font-size="14" fill="#333333">Spanish - Proficient</text>
  <text x="40" y="510" font-family="Arial" font-size="14" fill="#333333">French - Basic</text>
  
  <!-- Certifications Section (Left Column) -->
  <text x="40" y="560" font-family="Arial" font-size="18" font-weight="bold" fill="#333333">Certifications</text>
  <line x1="40" y1="570" x2="210" y2="570" stroke="#5E17EB" stroke-width="2" />
  
  <text x="40" y="600" font-family="Arial" font-size="14" fill="#333333">AWS Certified Developer</text>
  <text x="40" y="625" font-family="Arial" font-size="14" fill="#333333">Google Cloud Professional</text>
  <text x="40" y="650" font-family="Arial" font-size="14" fill="#333333">Scrum Master Certified</text>
</svg>`,
  htmlContent: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Resume Template</title>
  <style>
    /* CSS will be injected here */
  </style>
</head>
<body>
  <div class="resume-container">
    <header>
      <div class="profile-section">
        <div class="profile-picture">
          <!-- Placeholder for profile picture -->
          <div class="avatar-placeholder"></div>
        </div>
        <div class="name-title">
          <h1 id="name">{{name}}</h1>
          <h2 id="jobTitle">{{title}}</h2>
        </div>
      </div>
      <div class="contact-info">
        <p id="email">{{email}}</p>
        <p id="phone">{{phone}}</p>
        <p id="location">{{address}}</p>
      </div>
    </header>
    
    <main>
      <div class="sidebar">
        <section>
          <div class="section-title">SKILLS</div>
          <p class="skill-label">JavaScript</p>
          <div class="skills-bar">
            <div class="skills-fill" style="width: 90%;"></div>
          </div>

          <p class="skill-label">React</p>
          <div class="skills-bar">
            <div class="skills-fill" style="width: 85%;"></div>
          </div>

          <p class="skill-label">Node.js</p>
          <div class="skills-bar">
            <div class="skills-fill" style="width: 80%;"></div>
          </div>

          <p class="skill-label">TypeScript</p>
          <div class="skills-bar">
            <div class="skills-fill" style="width: 75%;"></div>
          </div>

          <p class="skill-label">HTML/CSS</p>
          <div class="skills-bar">
            <div class="skills-fill" style="width: 85%;"></div>
          </div>
        </section>
        
        <section>
          <div class="section-title">LANGUAGES</div>
          <p>English - Native</p>
          <p>Spanish - Proficient</p>
          <p>French - Basic</p>
        </section>
        
        <section>
          <div class="section-title">CERTIFICATIONS</div>
          <p>AWS Certified Developer</p>
          <p>Google Cloud Professional</p>
          <p>Scrum Master Certified</p>
        </section>
      </div>
      
      <div class="main-content">
        <section>
          <div class="section-title">PROFESSIONAL SUMMARY</div>
          <p id="summary">{{summary}}</p>
        </section>
        
        <section>
          <div class="section-title">EXPERIENCE</div>
          
          <div class="job">
            <h3 id="job1Title">Senior Software Engineer</h3>
            <p class="job-info" id="job1Info">Tech Company Inc. | 2020 - Present</p>
            <p id="job1Desc">Led development of web applications using React and Node.js.</p>
            <ul>
              <li>Implemented CI/CD pipeline that reduced deployment time by 75%</li>
              <li>Mentored junior developers, improving team productivity</li>
              <li>Refactored legacy codebase, reducing technical debt by 40%</li>
            </ul>
          </div>
          
          <div class="job">
            <h3 id="job2Title">Software Developer</h3>
            <p class="job-info" id="job2Info">Digital Solutions LLC | 2017 - 2019</p>
            <p id="job2Desc">Developed and maintained web applications for clients in various industries.</p>
            <ul>
              <li>Created responsive web interfaces using modern frontend frameworks</li>
              <li>Optimized database queries, improving application performance by 60%</li>
              <li>Developed RESTful APIs for mobile and web clients</li>
            </ul>
          </div>
        </section>
        
        <section>
          <div class="section-title">EDUCATION</div>
          <div class="education">
            <h3 id="education1">Bachelor of Science in Computer Science</h3>
            <p class="education-info" id="education1Info">University of Technology | 2013 - 2017</p>
            <p>GPA: 3.8/4.0</p>
            <ul>
              <li>Dean's List</li>
              <li>Computer Science Club President</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
    
    <div class="bottom-corner"></div>
  </div>
</body>
</html>`,
  cssContent: `/* Modern Resume Template Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Arial', sans-serif;
}

body {
  background-color: #f5f5f5;
  color: #333;
  line-height: 1.5;
}

.resume-container {
  width: 8.5in;
  height: 11in;
  margin: 0 auto;
  background-color: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

/* Header Styles */
header {
  background-color: #5E17EB;
  color: white;
  padding: 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.profile-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-placeholder {
  width: 80px;
  height: 80px;
  background-color: #fff;
  border-radius: 50%;
}

.name-title h1 {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.name-title h2 {
  font-size: 18px;
  font-weight: normal;
  color: #CCCCFF;
}

.contact-info p {
  font-size: 14px;
  margin-bottom: 5px;
}

/* Main Content Layout */
main {
  display: flex;
  height: calc(11in - 130px); /* Header height is 130px */
}

.sidebar {
  width: 250px;
  background-color: #F8F5FF;
  padding: 30px 20px;
}

.main-content {
  flex: 1;
  padding: 30px;
}

/* Section Styling */
section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #333;
  border-bottom: 2px solid #5E17EB;
  padding-bottom: 5px;
}

/* Skills Bar */
.skill-label {
  margin-top: 15px;
  margin-bottom: 5px;
}

.skills-bar {
  height: 10px;
  background-color: #E8E0FF;
  border-radius: 5px;
  margin-bottom: 15px;
}

.skills-fill {
  height: 100%;
  background-color: #5E17EB;
  border-radius: 5px;
}

/* Job & Education Styling */
.job, .education {
  margin-bottom: 25px;
}

h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.job-info, .education-info {
  font-style: italic;
  color: #666;
  margin-bottom: 10px;
}

ul {
  padding-left: 20px;
  margin-top: 10px;
}

li {
  margin-bottom: 5px;
}

/* Decorative Elements */
.bottom-corner {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 0 50px 50px;
  border-color: transparent transparent #5E17EB transparent;
}

/* Print Styles */
@media print {
  body {
    background-color: white;
  }
  
  .resume-container {
    box-shadow: none;
    height: 100%;
  }
}`,
  jsContent: `// Add your optional JavaScript functionality here
document.addEventListener('DOMContentLoaded', function() {
  console.log('Resume template loaded');
  
  // Example: Add click event to profile picture
  const avatar = document.querySelector('.avatar-placeholder');
  if (avatar) {
    avatar.addEventListener('click', function() {
      console.log('Profile picture clicked');
      // This could be used to trigger a photo upload in a builder
    });
  }
  
  // Example: Format dates or other dynamic content
  const formatDates = () => {
    const dateElements = document.querySelectorAll('.job-info, .education-info');
    dateElements.forEach(el => {
      // For a real implementation, you might parse and reformat dates here
      console.log('Formatting date element:', el.textContent);
    });
  };
  
  // Call initialization functions
  formatDates();
});`,
  pdfContent: null,
  isActive: true,
  isPopular: false,
  primaryColor: '#5E17EB',
  secondaryColor: '#4A11C0',
  thumbnailUrl: null,
};

const AdvancedTemplateEditPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const isNewTemplate = id === 'new';
  
  // Fetch template data if editing an existing template
  const { data: templateData, isLoading, error } = useTemplate(
    isNewTemplate ? undefined : id
  );
  
  // Set up mutations for create/update
  const updateTemplateMutation = useUpdateTemplate(isNewTemplate ? undefined : id);
  const createTemplateMutation = useCreateTemplate();
  
  // Empty template to use when creating a new one
  const emptyTemplate = defaultTemplate;
  
  // Handle template save
  const handleSaveTemplate = async (templateData: Partial<ResumeTemplate>) => {
    try {
      if (isNewTemplate) {
        await createTemplateMutation.mutateAsync(templateData as any);
        toast({
          title: 'Success',
          description: 'Template created successfully',
        });
        // Navigate to the templates list after creation
        navigate('/admin/templates/management');
      } else {
        await updateTemplateMutation.mutateAsync(templateData);
        toast({
          title: 'Success',
          description: 'Template updated successfully',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to save template: ${(error as Error).message}`,
        variant: 'destructive',
      });
      throw error; // Re-throw to handle in the component
    }
  };
  
  // Handle error state
  if (error && !isNewTemplate) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin/templates/management')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-3xl font-bold text-red-500">Error Loading Template</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-6">
          <p className="text-red-800">
            {(error as Error).message}
          </p>
          <Button 
            variant="outline"
            onClick={() => navigate('/admin/templates/management')}
            className="mt-4"
          >
            Return to Templates
          </Button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (isLoading && !isNewTemplate) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/admin/templates/management')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>
      
      <TemplateBuilder 
        template={templateData || emptyTemplate as ResumeTemplate}
        onSave={handleSaveTemplate}
        isNew={isNewTemplate}
      />
    </div>
  );
};

export default AdvancedTemplateEditPage;