/**
 * Helper functions to improve template support across different resume template formats
 */

/**
 * Processes HTML content by replacing placeholders with actual resume data
 * This function handles a wider variety of placeholder formats and commonly used template text
 */
export function processTemplateHtml(html: string, resumeData: any): string {
  if (!html) return '';
  
  // Create a map for standard replacements
  const replacementMap: Record<string, string> = {
    // Personal information placeholders - all variations
    '{{firstName}}': resumeData.firstName || '',
    '{{first_name}}': resumeData.firstName || '',
    '{{first-name}}': resumeData.firstName || '',
    '{{fname}}': resumeData.firstName || '',
    '{{lastName}}': resumeData.surname || '',
    '{{last_name}}': resumeData.surname || '',
    '{{last-name}}': resumeData.surname || '',
    '{{lname}}': resumeData.surname || '',
    '{{surname}}': resumeData.surname || '',
    '{{fullName}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{full_name}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{full-name}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{name}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{fullname}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    
    // Professional title/job title
    '{{profession}}': resumeData.profession || '',
    '{{job_title}}': resumeData.profession || '',
    '{{job-title}}': resumeData.profession || '',
    '{{jobTitle}}': resumeData.profession || '',
    '{{title}}': resumeData.profession || '',
    '{{position}}': resumeData.profession || '',
    '{{role}}': resumeData.profession || '',
    
    // Contact information
    '{{email}}': resumeData.email || '',
    '{{mail}}': resumeData.email || '',
    '{{email_address}}': resumeData.email || '',
    '{{emailAddress}}': resumeData.email || '',
    '{{phone}}': resumeData.phone || '',
    '{{telephone}}': resumeData.phone || '',
    '{{mobile}}': resumeData.phone || '',
    '{{cell}}': resumeData.phone || '',
    '{{phoneNumber}}': resumeData.phone || '',
    '{{phone_number}}': resumeData.phone || '',
    
    // Location information
    '{{city}}': resumeData.city || '',
    '{{town}}': resumeData.city || '',
    '{{country}}': resumeData.country || '',
    '{{state}}': resumeData.country || '', // Some templates use state instead of country
    '{{postalCode}}': resumeData.postalCode || '',
    '{{postal_code}}': resumeData.postalCode || '',
    '{{postal-code}}': resumeData.postalCode || '',
    '{{zip}}': resumeData.postalCode || '',
    '{{zipCode}}': resumeData.postalCode || '',
    '{{zip_code}}': resumeData.postalCode || '',
    '{{address}}': [resumeData.city, resumeData.country].filter(Boolean).join(', '),
    '{{full_address}}': [resumeData.city, resumeData.country, resumeData.postalCode].filter(Boolean).join(', '),
    '{{fullAddress}}': [resumeData.city, resumeData.country, resumeData.postalCode].filter(Boolean).join(', '),
    '{{location}}': [resumeData.city, resumeData.country].filter(Boolean).join(', '),
    
    // Summary/profile information
    '{{summary}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{profile}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{aboutMe}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{about_me}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{about-me}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{bio}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{biography}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{description}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{overview}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{professionalSummary}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{professional_summary}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{professional-summary}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{careerObjective}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{career_objective}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{objective}}': resumeData.professionalSummary || resumeData.summary || '',
    
    // Skills
    '{{skills}}': resumeData.skills && resumeData.skills.length > 0 ? resumeData.skills.map((skill: { name: string }) => skill.name).join(', ') : '',
    '{{skillsList}}': resumeData.skills && resumeData.skills.length > 0 ? resumeData.skills.map((skill: { name: string }) => skill.name).join(', ') : '',
    '{{skills_list}}': resumeData.skills && resumeData.skills.length > 0 ? resumeData.skills.map((skill: { name: string }) => skill.name).join(', ') : '',
    
    // Website & social media - only include if explicitly added by user
    '{{website}}': 'website' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.website : '',
    '{{personal_website}}': 'website' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.website : '',
    '{{linkedin}}': 'linkedin' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.linkedin : '',
    '{{linkedinUrl}}': 'linkedin' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.linkedin : '',
    '{{linkedin_url}}': 'linkedin' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.linkedin : '',
    
    // Additional info - only include if explicitly added by user
    '{{drivingLicense}}': 'drivingLicense' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.drivingLicense : '',
    '{{driving_license}}': 'drivingLicense' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.drivingLicense : '',
    '{{license}}': 'drivingLicense' in (resumeData.additionalInfo || {}) ? resumeData.additionalInfo.drivingLicense : '',
    
    // Common template text patterns
    'SAHIB KHAN': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim().toUpperCase(),
    'Stephen John': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    'John Doe': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    'JOHN DOE': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim().toUpperCase(),
    'GRAPHIC DESIGNER': resumeData.profession ? resumeData.profession.toUpperCase() : '',
    'Graphic Designer': resumeData.profession || '',
    'Software Engineer': resumeData.profession || '',
    'SOFTWARE ENGINEER': resumeData.profession ? resumeData.profession.toUpperCase() : '',
    'Web Developer': resumeData.profession || '',
    'WEB DEVELOPER': resumeData.profession ? resumeData.profession.toUpperCase() : '',
    
    // Section headers (preserve these)
    'ABOUT ME': 'ABOUT ME',
    'WORK EXPERIENCE': 'WORK EXPERIENCE',
    'EDUCATION': 'EDUCATION',
    'SKILLS': 'SKILLS',
    'CONTACT': 'CONTACT',
    'CONTACT INFORMATION': 'CONTACT INFORMATION',
    'PROFILE': 'PROFILE',
    'EXPERIENCE': 'EXPERIENCE',
    'PROFESSIONAL EXPERIENCE': 'PROFESSIONAL EXPERIENCE',
    'WORK HISTORY': 'WORK HISTORY',
    'EMPLOYMENT HISTORY': 'EMPLOYMENT HISTORY',
    'QUALIFICATIONS': 'QUALIFICATIONS',
    'ACHIEVEMENTS': 'ACHIEVEMENTS',
    'LANGUAGES': 'LANGUAGES',
    'INTERESTS': 'INTERESTS',
    'HOBBIES': 'HOBBIES',
    'REFERENCES': 'REFERENCES',
    'PERSONAL DETAILS': 'PERSONAL DETAILS',
    
    // Contact info with icons
    '📞 telephone': resumeData.phone ? `📞 ${resumeData.phone}` : '📞 telephone',
    '✉️ email': resumeData.email ? `✉️ ${resumeData.email}` : '✉️ email',
    '📍 address, city, st zip code': [resumeData.city, resumeData.country].filter(Boolean).length > 0 ? 
      `📍 ${[resumeData.city, resumeData.country].filter(Boolean).join(', ')}` : 
      '📍 address, city, st zip code',
    '🔗 website': 'website' in (resumeData.additionalInfo || {}) ? `🔗 ${resumeData.additionalInfo.website}` : '🔗 website',
    '💼 linkedin': 'linkedin' in (resumeData.additionalInfo || {}) ? `💼 ${resumeData.additionalInfo.linkedin}` : '💼 linkedin',
      
    // Professional template patterns and placeholders
    'moahmed': resumeData.firstName || 'moahmed',
    'tabt=rez': resumeData.surname || 'tabt=rez',
    'movewo': resumeData.profession || 'movewo',
    'onewon': resumeData.city || 'onewon',
    'olnvewon': resumeData.country || 'olnvewon',
    'ovnewon': resumeData.postalCode || 'ovnewon',
    
    // Testing template specific placeholders - with more detailed replacements
    'Your Name': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim() || 'Your Name',
    'Job Title': resumeData.profession || 'Job Title',
    'email@example.com': resumeData.email || 'email@example.com',
    '123-456-7890': resumeData.phone || '123-456-7890',
    'Your Location': [resumeData.city, resumeData.country].filter(Boolean).join(', ') || 'Your Location',
    'A brief description about yourself and your career goals.': resumeData.professionalSummary || resumeData.summary || 'A brief description about yourself and your career goals.',
    
    // More specific Testing template text replacements for clearer testing
    'YOUR NAME': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim().toUpperCase() || 'YOUR NAME',
    'YOUR PROFESSION': resumeData.profession?.toUpperCase() || 'YOUR PROFESSION',
    'Your Current Location': [resumeData.city, resumeData.country, resumeData.postalCode].filter(Boolean).join(', ') || 'Your Current Location',
    
    // Additional summary patterns with multiple phrases for better matching
    'professional summary': resumeData.professionalSummary || resumeData.summary || 'Professional Summary',
    'Professional Summary': resumeData.professionalSummary || resumeData.summary || 'Professional Summary',
    'PROFESSIONAL SUMMARY': resumeData.professionalSummary || resumeData.summary || 'PROFESSIONAL SUMMARY',
    'Summary of Qualifications': resumeData.summary || resumeData.professionalSummary || 'Summary of Qualifications',
    'Career Summary': resumeData.summary || resumeData.professionalSummary || 'Career Summary',
    'Profile Summary': resumeData.summary || resumeData.professionalSummary || 'Profile Summary',
    
    // Generic summary placeholder
    'Write your summary here...': resumeData.summary || 'Write your summary here...',
  };
  
  // Apply all replacements
  let processedHtml = html;
  Object.entries(replacementMap).forEach(([pattern, replacement]) => {
    if (replacement) {
      const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      processedHtml = processedHtml.replace(regex, replacement);
    }
  });
  
  // Handle special case for full name with variant spellings - find any double-word name and replace
  const fullName = `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim();
  if (fullName) {
    // This regex finds patterns that look like names (two capitalized words)
    const nameRegex = new RegExp('([A-Z][a-z]+)\\s+([A-Z][a-z]+)', 'g');
    processedHtml = processedHtml.replace(nameRegex, fullName);
  }
  
  // Additional pattern matches for text that appears in templates
  // 1. Process summary/profile content
  const summaryContent = resumeData.professionalSummary || resumeData.summary;
  if (summaryContent) {
    // Replace text between ABOUT ME header and next section
    const aboutMeRegex = new RegExp('<h2[^>]*>ABOUT ME</h2>\\s*<p[^>]*>(.*?)</p>', 'i');
    processedHtml = processedHtml.replace(aboutMeRegex, (match, p1) => {
      return match.replace(p1, summaryContent);
    });
    
    // Also try "About Me" case variation
    const aboutMeRegex2 = new RegExp('<h2[^>]*>About Me</h2>\\s*<p[^>]*>(.*?)</p>', 'i');
    processedHtml = processedHtml.replace(aboutMeRegex2, (match, p1) => {
      return match.replace(p1, summaryContent);
    });
    
    // And "Profile" variations
    const profileRegex = new RegExp('<h2[^>]*>Profile</h2>\\s*<p[^>]*>(.*?)</p>', 'i');
    processedHtml = processedHtml.replace(profileRegex, (match, p1) => {
      return match.replace(p1, summaryContent);
    });
    
    // Professional Summary section
    const professionalSummaryRegex = new RegExp('<h2[^>]*>Professional Summary</h2>\\s*<p[^>]*>(.*?)</p>', 'i');
    processedHtml = processedHtml.replace(professionalSummaryRegex, (match, p1) => {
      return match.replace(p1, summaryContent);
    });
    
    // Summary section
    const summaryRegex = new RegExp('<h2[^>]*>Summary</h2>\\s*<p[^>]*>(.*?)</p>', 'i');
    processedHtml = processedHtml.replace(summaryRegex, (match, p1) => {
      return match.replace(p1, summaryContent);
    });
    
    // Cover additional patterns in the Testing template
    processedHtml = processedHtml.replace(
      /A brief description about yourself and your career goals\./g,
      summaryContent
    );
  }
  
  // 2. Process work experience entries
  if (resumeData.workExperience && resumeData.workExperience.length > 0) {
    // Look for work experience placeholders and replace them
    const workExperienceHTML = resumeData.workExperience.map((exp: {
      jobTitle: string;
      employer: string;
      location: string;
      startDate: string;
      endDate: string;
      isCurrentPosition: boolean;
      description: string;
    }) => {
      const dateRange = exp.isCurrentPosition 
        ? `${exp.startDate} - Present` 
        : `${exp.startDate} - ${exp.endDate}`;
      
      return `
        <div class="work-entry">
          <h3>${exp.jobTitle}</h3>
          <p class="company">${exp.employer}, ${exp.location}</p>
          <p class="date">${dateRange}</p>
          <p class="description">${exp.description}</p>
        </div>
      `;
    }).join('');
    
    // Try to find work experience containers to replace
    const workExperienceContainerRegex = /<div[^>]*class="[^"]*work-experience[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    if (workExperienceContainerRegex.test(processedHtml)) {
      processedHtml = processedHtml.replace(workExperienceContainerRegex, `<div class="work-experience">${workExperienceHTML}</div>`);
    }
    
    // Look for employment history sections
    const employmentHistoryRegex = /<div[^>]*class="[^"]*employment-history[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    if (employmentHistoryRegex.test(processedHtml)) {
      processedHtml = processedHtml.replace(employmentHistoryRegex, `<div class="employment-history">${workExperienceHTML}</div>`);
    }
    
    // Look for experience entries in the Testing template
    const testingTemplateExperienceRegex = /<div class="entry">[\s\S]*?<div class="year">[^<]*<\/div>[\s\S]*?<div class="desc">[^<]*<\/div>[\s\S]*?<\/div>/g;
    
    if (testingTemplateExperienceRegex.test(processedHtml)) {
      // Count how many experience entries we have in the template
      const matches = processedHtml.match(testingTemplateExperienceRegex) || [];
      
      // For each match, replace with corresponding work experience or leave it empty
      matches.forEach((match, index) => {
        if (index < resumeData.workExperience.length) {
          const exp: {
            jobTitle: string;
            employer: string;
            location: string;
            startDate: string;
            endDate: string;
            isCurrentPosition: boolean;
            description: string;
          } = resumeData.workExperience[index];
          
          const dateRange = exp.isCurrentPosition 
            ? `${exp.startDate} - Present` 
            : `${exp.startDate} - ${exp.endDate}`;
            
          const replacement = `
            <div class="entry">
              <div class="year">${dateRange}</div>
              <div class="desc">${exp.jobTitle} at ${exp.employer}, ${exp.location}: ${exp.description}</div>
            </div>
          `;
          
          processedHtml = processedHtml.replace(match, replacement);
        }
      });
    }
  }
  
  // 3. Process education entries
  if (resumeData.education && resumeData.education.length > 0) {
    // Look for education placeholders and replace them
    const educationHTML = resumeData.education.map((edu: {
      degree: string;
      institution: string;
      location: string;
      startDate: string;
      endDate: string;
      description: string;
    }) => {
      return `
        <div class="education-entry">
          <h3>${edu.degree}</h3>
          <p class="institution">${edu.institution}, ${edu.location}</p>
          <p class="date">${edu.startDate} - ${edu.endDate}</p>
          <p class="description">${edu.description}</p>
        </div>
      `;
    }).join('');
    
    // Try to find education containers to replace
    const educationContainerRegex = /<div[^>]*class="[^"]*education[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    if (educationContainerRegex.test(processedHtml)) {
      processedHtml = processedHtml.replace(educationContainerRegex, `<div class="education">${educationHTML}</div>`);
    }
    
    // Education entries in the Testing template
    const testingTemplateEducationRegex = /<div class="entry">[\s\S]*?<div class="year">[^<]*<\/div>[\s\S]*?<div class="desc">[^<]*<\/div>[\s\S]*?<\/div>/g;
    
    // We need to find education section distinctly from work experience section
    const educationSectionRegex = /<h2[^>]*>Education<\/h2>([\s\S]*?)(?=<h2|$)/i;
    const educationSection = processedHtml.match(educationSectionRegex);
    
    if (educationSection && educationSection[1]) {
      let educationHtml = educationSection[1];
      const eduEntries = educationHtml.match(testingTemplateEducationRegex) || [];
      
      // For each match, replace with corresponding education or leave it empty
      eduEntries.forEach((match, index) => {
        if (index < resumeData.education.length) {
          const edu: {
            degree: string;
            institution: string;
            location: string;
            startDate: string;
            endDate: string;
            description: string;
          } = resumeData.education[index];
          
          const replacement = `
            <div class="entry">
              <div class="year">${edu.startDate} - ${edu.endDate}</div>
              <div class="desc">${edu.degree} at ${edu.institution}, ${edu.location}: ${edu.description}</div>
            </div>
          `;
          
          educationHtml = educationHtml.replace(match, replacement);
        }
      });
      
      // Replace the education section with our modified one
      processedHtml = processedHtml.replace(educationSection[1], educationHtml);
    }
  }
  
  // 4. Process skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    // Create a skills HTML list
    const skillsHTML = resumeData.skills.map((skill: { name: string; level?: number }) => {
      return `<li class="skill-item">${skill.name} ${skill.level ? '- ' + '★'.repeat(skill.level) : ''}</li>`;
    }).join('');
    
    // Try to find skills list containers to replace
    const skillsListRegex = /<ul[^>]*class="[^"]*skills-list[^"]*"[^>]*>([\s\S]*?)<\/ul>/i;
    if (skillsListRegex.test(processedHtml)) {
      processedHtml = processedHtml.replace(skillsListRegex, `<ul class="skills-list">${skillsHTML}</ul>`);
    }
    
    // Skills in other formats (comma-separated)
    const skillsTextRegex = /<p[^>]*class="[^"]*skills[^"]*"[^>]*>([\s\S]*?)<\/p>/i;
    if (skillsTextRegex.test(processedHtml)) {
      const skillsText = resumeData.skills.map((s: { name: string }) => s.name).join(', ');
      processedHtml = processedHtml.replace(skillsTextRegex, `<p class="skills">${skillsText}</p>`);
    }
    
    // Testing template specific
    const testingTemplateSkillsRegex = /<div[^>]*class="[^"]*skills[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    if (testingTemplateSkillsRegex.test(processedHtml)) {
      const skillsText = resumeData.skills.map((s: { name: string }) => s.name).join(', ');
      processedHtml = processedHtml.replace(
        testingTemplateSkillsRegex, 
        `<div class="skills">${skillsText}</div>`
      );
    }
  }
  
  // Handle profile photo if present
  if (resumeData.photo) {
    // Replace any image with class containing "profile"
    processedHtml = processedHtml.replace(/<img[^>]*class="[^"]*profile[^"]*"[^>]*>/gi, 
      `<img class="profile-image" src="${resumeData.photo}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`);
      
    // Also look for images in specific containers
    processedHtml = processedHtml.replace(/<div[^>]*class="[^"]*avatar[^"]*"[^>]*>[\s\S]*?<img[^>]*>/gi, 
      `<div class="avatar"><img src="${resumeData.photo}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;"></div>`);
      
    // Replace any image with class="profile-photo"
    processedHtml = processedHtml.replace(/<img[^>]*class="profile-photo"[^>]*>/gi, 
      `<img class="profile-photo" src="${resumeData.photo}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;">`);
    
    // Replace any div with class avatar-container
    processedHtml = processedHtml.replace(/<div[^>]*class="[^"]*avatar-container[^"]*"[^>]*>[\s\S]*?<\/div>/gi,
      `<div class="avatar-container"><img src="${resumeData.photo}" alt="Profile" style="width: 100%; height: 100%; object-fit: cover;"></div>`);
  }
  
  // Special handling for the Professional template in the screenshot
  // This is a template-specific fix for the resume template in the user's screenshot
  if (html.includes('Professional') && html.includes('CONTACT') && html.includes('ABOUT ME')) {
    // Replace name and job title
    if (resumeData.firstName || resumeData.surname) {
      // Find and replace name in specific locations based on template structure
      const namePattern = /<div[^>]*class="[^"]*name[^"]*"[^>]*>[^<]*<\/div>/gi;
      const fullName = `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim();
      processedHtml = processedHtml.replace(namePattern, `<div class="name">${fullName || 'Your Name'}</div>`);
      
      // Replace any h1 with the name
      const h1Pattern = /<h1[^>]*>[^<]*<\/h1>/gi; 
      processedHtml = processedHtml.replace(h1Pattern, `<h1>${fullName || 'Your Name'}</h1>`);
    }
    
    // Replace profession/job title
    if (resumeData.profession) {
      // Find job title in the template
      const jobTitlePattern = /<div[^>]*class="[^"]*job-title[^"]*"[^>]*>[^<]*<\/div>/gi;
      processedHtml = processedHtml.replace(jobTitlePattern, `<div class="job-title">${resumeData.profession}</div>`);
      
      // Replace any element with class="profession"
      const professionPattern = /<[^>]*class="[^"]*profession[^"]*"[^>]*>[^<]*<\/[^>]*>/gi;
      processedHtml = processedHtml.replace(professionPattern, `<div class="profession">${resumeData.profession}</div>`);
    }
    
    // Replace contact information
    if (resumeData.email) {
      const emailPattern = /<div[^>]*class="[^"]*email[^"]*"[^>]*>[^<]*<\/div>/gi;
      processedHtml = processedHtml.replace(emailPattern, `<div class="email">${resumeData.email}</div>`);
    }
    
    if (resumeData.phone) {
      const phonePattern = /<div[^>]*class="[^"]*phone[^"]*"[^>]*>[^<]*<\/div>/gi;
      processedHtml = processedHtml.replace(phonePattern, `<div class="phone">${resumeData.phone}</div>`);
    }
    
    // Replace location information
    if (resumeData.city || resumeData.country) {
      const locationText = [resumeData.city, resumeData.country].filter(Boolean).join(', ');
      const locationPattern = /<div[^>]*class="[^"]*location[^"]*"[^>]*>[^<]*<\/div>/gi;
      processedHtml = processedHtml.replace(locationPattern, `<div class="location">${locationText}</div>`);
      
      // Also try address pattern
      const addressPattern = /<div[^>]*class="[^"]*address[^"]*"[^>]*>[^<]*<\/div>/gi;
      processedHtml = processedHtml.replace(addressPattern, `<div class="address">${locationText}</div>`);
    }
  }
  
  return processedHtml;
}

/**
 * Additional function to extract and enhance styles from template
 */
export function extractAndEnhanceStyles(htmlContent: string): string {
  if (!htmlContent) return '';
  
  // Extract <style> content
  const styleRegex = /<style>([\s\S]*?)<\/style>/;
  const styleMatch = htmlContent.match(styleRegex);
  
  if (!styleMatch || !styleMatch[1]) return '';
  
  let styles = styleMatch[1];
  
  // Add responsive styles
  styles += `
    @media print, screen {
      body {
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden !important;
        background: transparent !important;
      }
      .page, .resume {
        width: 100% !important;
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
      }
      .sidebar, .contact-item, .sidebar-section {
        word-break: break-word;
        overflow-wrap: break-word;
      }
      img.profile-image, img.profile-photo {
        object-fit: cover;
      }
      .avatar-container img, .photo-container img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }
  `;
  
  return styles;
}