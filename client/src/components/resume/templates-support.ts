/**
 * Helper functions to improve template support across different resume template formats
 */

/**
 * Safely checks if an additionalField exists, has a value, and is set to visible
 */
export function hasAdditionalField(resumeData: any, fieldName: string): boolean {
  // First check for the new additionalFields structure
  if (resumeData?.additionalFields && resumeData.additionalFields[fieldName]) {
    const field = resumeData.additionalFields[fieldName];
    if (field.value && field.visible) {
      return true;
    }
  }
  
  // If not found or not valid, check the legacy structure
  if (resumeData?.additionalInfo && resumeData?.additionalInfoVisibility) {
    const hasValue = fieldName in resumeData.additionalInfo && 
                     resumeData.additionalInfo[fieldName];
    const isVisible = fieldName in resumeData.additionalInfoVisibility && 
                      resumeData.additionalInfoVisibility[fieldName] === true;
    
    return hasValue && isVisible;
  }
  
  return false;
}

/**
 * Gets the value of an additionalField from either structure
 */
export function getAdditionalFieldValue(resumeData: any, fieldName: string): string {
  // First try the new structure
  if (resumeData?.additionalFields && 
      resumeData.additionalFields[fieldName] && 
      resumeData.additionalFields[fieldName].value) {
    return resumeData.additionalFields[fieldName].value;
  }
  
  // Then try the legacy structure
  if (resumeData?.additionalInfo && 
      resumeData.additionalInfo[fieldName]) {
    return resumeData.additionalInfo[fieldName];
  }
  
  return '';
}

/**
 * Safely checks if an object has a property and it's not empty
 */
export function hasProperty(obj: any, prop: string): boolean {
  if (!obj) return false;
  return prop in obj && obj[prop] !== undefined && obj[prop] !== null && obj[prop] !== '';
}

/**
 * Processes HTML content by replacing placeholders with actual resume data
 * This function handles a wider variety of placeholder formats and commonly used template text
 */
export function processTemplateHtml(html: string, resumeData: any): string {
  if (!html) return '';
  
  console.log("[TEMPLATES] Processing template HTML with additionalFields:", resumeData.additionalFields);
  console.log("[TEMPLATES] additionalFields keys:", Object.keys(resumeData.additionalFields || {}));
  
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
    
    // Website & social media - only include if explicitly added by user and visibility is true, replace with removal marker to completely remove from template
    '{{website}}': hasAdditionalField(resumeData, 'website') ? getAdditionalFieldValue(resumeData, 'website') : '##REMOVE_THIS##',
    '{{personal_website}}': hasAdditionalField(resumeData, 'website') ? getAdditionalFieldValue(resumeData, 'website') : '##REMOVE_THIS##',
    '{{website_url}}': hasAdditionalField(resumeData, 'website') ? getAdditionalFieldValue(resumeData, 'website') : '##REMOVE_THIS##',
    '{{linkedin}}': hasAdditionalField(resumeData, 'linkedin') ? getAdditionalFieldValue(resumeData, 'linkedin') : '##REMOVE_THIS##',
    '{{linkedinUrl}}': hasAdditionalField(resumeData, 'linkedin') ? getAdditionalFieldValue(resumeData, 'linkedin') : '##REMOVE_THIS##',
    '{{linkedin_url}}': hasAdditionalField(resumeData, 'linkedin') ? getAdditionalFieldValue(resumeData, 'linkedin') : '##REMOVE_THIS##',
    
    // Additional info - only include if explicitly added by user and visibility is true, replace with removal marker to completely remove from template
    '{{drivingLicense}}': hasAdditionalField(resumeData, 'drivingLicense') ? getAdditionalFieldValue(resumeData, 'drivingLicense') : '##REMOVE_THIS##',
    '{{driving_license}}': hasAdditionalField(resumeData, 'drivingLicense') ? getAdditionalFieldValue(resumeData, 'drivingLicense') : '##REMOVE_THIS##',
    '{{license}}': hasAdditionalField(resumeData, 'drivingLicense') ? getAdditionalFieldValue(resumeData, 'drivingLicense') : '##REMOVE_THIS##',
    
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
    '🔗 website': hasAdditionalField(resumeData, 'website') ? `🔗 ${getAdditionalFieldValue(resumeData, 'website')}` : '##REMOVE_THIS##',
    '💼 linkedin': hasAdditionalField(resumeData, 'linkedin') ? `💼 ${getAdditionalFieldValue(resumeData, 'linkedin')}` : '##REMOVE_THIS##',
      
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
  
  // Add explicit support for Handlebars syntax in the template for additional fields
  const handlebarsFieldsMap: Record<string, string> = {
    // Create direct mappings for the Handlebars syntax
    '{{linkedin}}': hasAdditionalField(resumeData, 'linkedin') ? getAdditionalFieldValue(resumeData, 'linkedin') : '##REMOVE_THIS##',
    '{{website}}': hasAdditionalField(resumeData, 'website') ? getAdditionalFieldValue(resumeData, 'website') : '##REMOVE_THIS##',
    '{{drivingLicense}}': hasAdditionalField(resumeData, 'drivingLicense') ? getAdditionalFieldValue(resumeData, 'drivingLicense') : '##REMOVE_THIS##',
  };
  
  // Apply the Handlebars specific mappings
  Object.entries(handlebarsFieldsMap).forEach(([pattern, replacement]) => {
    if (replacement) {
      // Handle the exact Handlebars pattern with literal syntax
      processedHtml = processedHtml.replace(pattern, replacement);
    }
  });
  
  // Debug the replacements for additional fields
  console.log("[TEMPLATES] Applied special Handlebars replacements for additional fields:", {
    linkedin: hasAdditionalField(resumeData, 'linkedin') ? getAdditionalFieldValue(resumeData, 'linkedin') : '##REMOVE_THIS##',
    website: hasAdditionalField(resumeData, 'website') ? getAdditionalFieldValue(resumeData, 'website') : '##REMOVE_THIS##',
    drivingLicense: hasAdditionalField(resumeData, 'drivingLicense') ? getAdditionalFieldValue(resumeData, 'drivingLicense') : '##REMOVE_THIS##'
  });
  
  console.log("Starting post-processing to remove elements with ##REMOVE_THIS## marker");
  console.log("HTML before post-processing:", processedHtml.substring(0, 500) + "...");
  
  // Post-processing to completely remove any DOM elements containing our removal marker
  // This will remove entire elements (like list items, div elements, etc.) that contain the marker
  let count = 0;
  
  // First, check specifically for the optional-info div pattern from the template
  const optionalInfoRegex = /<div\s+class=["']optional-info["'][^>]*>[\s\S]*?##REMOVE_THIS##[\s\S]*?<\/div>/gi;
  processedHtml = processedHtml.replace(optionalInfoRegex, (match) => {
    count++;
    console.log(`Removing optional-info div: ${match.substring(0, 100)}...`);
    return '';
  });
  
  // First, try to remove entire sections or elements that contain our removal marker
  // This regex matches any HTML tag containing our marker (more comprehensive than previous approach)
  const htmlTagRegex = /<([a-z][a-z0-9]*)[^>]*>([^<]*##REMOVE_THIS##[^<]*)<\/\1>/gi;
  
  // Remove elements with the marker (this will catch any HTML tag, not just specific ones)
  processedHtml = processedHtml.replace(htmlTagRegex, (match, tagName) => {
    count++;
    console.log(`Removing ${tagName} element: ${match.substring(0, 50)}...`);
    return '';
  });
  
  // Attempt more aggressive removal for nested structures
  // This looks for parent elements with children that contain the marker
  const nestedElementRegex = /<([a-z][a-z0-9]*)[^>]*>([^<]*<[^>]*>[^<]*##REMOVE_THIS##[^<]*<\/[^>]*>[^<]*)<\/\1>/gi;
  
  processedHtml = processedHtml.replace(nestedElementRegex, (match, tagName) => {
    count++;
    console.log(`Removing nested ${tagName} element: ${match.substring(0, 50)}...`);
    return '';
  });
  
  // Also remove specific common elements explicitly
  // Replace list items
  processedHtml = processedHtml.replace(/<li[^>]*>([^<]*##REMOVE_THIS##[^<]*)<\/li>/gi, (match) => {
    count++;
    console.log(`Removing list item: ${match.substring(0, 50)}...`);
    return '';
  });
  
  // Replace div elements containing the marker - more aggressive version that matches across multiple lines
  processedHtml = processedHtml.replace(/<div[^>]*>[\s\S]*?##REMOVE_THIS##[\s\S]*?<\/div>/gi, (match) => {
    count++;
    console.log(`Removing div with nested content: ${match.substring(0, 100)}...`);
    return '';
  });
  
  // Replace paragraphs
  processedHtml = processedHtml.replace(/<p[^>]*>([^<]*##REMOVE_THIS##[^<]*)<\/p>/gi, (match) => {
    count++;
    console.log(`Removing paragraph: ${match.substring(0, 50)}...`);
    return '';
  });
  
  // Replace spans
  processedHtml = processedHtml.replace(/<span[^>]*>([^<]*##REMOVE_THIS##[^<]*)<\/span>/gi, (match) => {
    count++;
    console.log(`Removing span: ${match.substring(0, 50)}...`);
    return '';
  });
  
  // Also remove any remaining instances of the marker
  processedHtml = processedHtml.replace(/##REMOVE_THIS##/g, (match) => {
    count++;
    console.log(`Removing marker instance`);
    return '';
  });
  
  console.log(`Post-processing complete: removed ${count} elements or instances of ##REMOVE_THIS##`);
  console.log("HTML after post-processing:", processedHtml.substring(0, 500) + "...");
  
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
    // Filter out temporary entries
    const realExperiences = resumeData.workExperience.filter((exp: any) => 
      !(typeof exp.id === 'string' && exp.id === 'temp-entry')
    );

    console.log("[TEMPLATES] Processing work experience entries. Total entries:", 
      resumeData.workExperience.length, "Real entries:", realExperiences.length);

    // Check if this is the specific template that's having issues
    // By detecting unique patterns in the template HTML
    const isSpecialTemplate = processedHtml.includes('SAHIB KHAN') || 
                             processedHtml.includes('GRAPHIC DESIGNER') || 
                             (processedHtml.includes('WORK EXPERIENCE') && processedHtml.includes('HOBBIES'));
    
    console.log("[TEMPLATES] Template type detection:", isSpecialTemplate ? "Using special template formatting" : "Using standard formatting");
    
    // Generate HTML for work experience based on template type
    let workExpHtml = '';
    
    if (isSpecialTemplate) {
      // Special formatting for the template with the blue sidebar
      workExpHtml = realExperiences.map((exp: any, index: number) => {
        const jobTitle = (exp.jobTitle || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const employer = (exp.employer || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const startDate = exp.startMonth && exp.startYear ? `${exp.startMonth} ${exp.startYear}` : '';
        const endDate = exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '';
        const dateRange = exp.isCurrentJob 
          ? `${startDate} - Present` 
          : `${startDate}${endDate ? ` - ${endDate}` : ''}`;
        const description = (exp.responsibilities || exp.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        // Format each entry as individual HTML elements with proper spacing
        return `
          ${index > 0 ? '<br/>' : ''}
          <div>
            <strong>${jobTitle}</strong><br/>
            ${employer}<br/>
            ${dateRange}<br/>
            ${description}
          </div>
        `;
      }).join('');
    } else {
      // Default formatting for other templates
      workExpHtml = realExperiences.map((exp: any) => {
        const startDate = exp.startMonth && exp.startYear ? `${exp.startMonth} ${exp.startYear}` : '';
        const endDate = exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '';
        const dateRange = exp.isCurrentJob 
          ? `${startDate} - Present` 
          : `${startDate}${endDate ? ` - ${endDate}` : ''}`;
        const jobTitle = (exp.jobTitle || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const employer = (exp.employer || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const description = (exp.responsibilities || exp.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        
        return `
        <div class="work-experience-item">
          <h3>${jobTitle}</h3>
          <p class="company">${employer}</p>
          <p class="work-dates">${dateRange}</p>
          <p>${description}</p>
        </div>
        `;
      }).join('');
    }

    // Different replacement strategy based on template type
    if (isSpecialTemplate) {
      // For the special template, look for a different pattern
      const specialWorkExpSectionRegex = /<div[^>]*>\s*<h2[^>]*>WORK EXPERIENCE<\/h2>[\s\S]*?(?=<div[^>]*>\s*<h2[^>]*>|$)/i;
      
      if (specialWorkExpSectionRegex.test(processedHtml)) {
        processedHtml = processedHtml.replace(
          specialWorkExpSectionRegex,
          `<div class="section">
            <h2>WORK EXPERIENCE</h2>
            ${workExpHtml}
          </div>`
        );
        console.log("[TEMPLATES] Successfully replaced work experience section in special template");
      } else {
        console.log("[TEMPLATES] Could not find work experience section in special template");
      }
    } else {
      // Standard template replacement
      const workExpSectionRegex = /<div class="section">\s*<h2>WORK EXPERIENCE<\/h2>[\s\S]*?<\/div>/i;
      if (workExpSectionRegex.test(processedHtml)) {
        processedHtml = processedHtml.replace(
          workExpSectionRegex,
          `<div class="section">
            <h2>WORK EXPERIENCE</h2>
            ${workExpHtml}
          </div>`
        );
        console.log("[TEMPLATES] Successfully replaced work experience section");
      } else {
        console.log("[TEMPLATES] Could not find work experience section in template");
      }
    }
    
    // Look for experience entries in the Testing template
    const testingTemplateExperienceRegex = /<div class="entry">[\s\S]*?<div class="year">[^<]*<\/div>[\s\S]*?<div class="desc">[^<]*<\/div>[\s\S]*?<\/div>/g;
    
    if (testingTemplateExperienceRegex.test(processedHtml)) {
      // Count how many experience entries we have in the template
      const matches = processedHtml.match(testingTemplateExperienceRegex) || [];
      
      // For each match, replace with corresponding work experience or leave it empty
      matches.forEach((match, index) => {
        if (index < realExperiences.length) {
          const exp = realExperiences[index];
          
          // Format the date range based on our actual data model
          const startDate = exp.startMonth && exp.startYear ? `${exp.startMonth} ${exp.startYear}` : '';
          const endDate = exp.endMonth && exp.endYear ? `${exp.endMonth} ${exp.endYear}` : '';
          
          const dateRange = exp.isCurrentJob 
            ? `${startDate} - Present` 
            : `${startDate}${endDate ? ` - ${endDate}` : ''}`;
            
          // Get responsibilities or fall back to description
          const description = exp.responsibilities || exp.description || '';
            
          // Get location and add Remote if flagged
          const locationText = exp.location + (exp.isRemote ? ' (Remote)' : '');
          
          const replacement = `
            <div class="entry">
              <div class="year">${dateRange}</div>
              <div class="desc">${exp.jobTitle} at ${exp.employer}${exp.location ? `, ${locationText}` : ''}: ${description}</div>
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
      }
      
      /* Zety-style content-fitting styles */
      .content-exceeds h1, .content-exceeds h2, .content-exceeds h3 {
        margin-top: 0.5em !important;
        margin-bottom: 0.5em !important;
      }
      
      .content-exceeds p {
        margin-top: 0.3em !important;
        margin-bottom: 0.3em !important;
        line-height: 1.3 !important;
      }
      
      .content-exceeds-large h1, .content-exceeds-large h2, .content-exceeds-large h3 {
        margin-top: 0.4em !important;
        margin-bottom: 0.4em !important;
        font-size: 0.95em !important;
      }
      
      .content-exceeds-large p {
        margin-top: 0.2em !important;
        margin-bottom: 0.2em !important;
        line-height: 1.2 !important;
      }
      
      .content-exceeds-large .section {
        margin-bottom: 0.5em !important;
        padding-bottom: 0.5em !important;
      }
      
      .page, .resume {
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