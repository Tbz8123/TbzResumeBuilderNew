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
    // Personal information placeholders
    '{{firstName}}': resumeData.firstName || '',
    '{{lastName}}': resumeData.surname || '',
    '{{fullName}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{name}}': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    '{{profession}}': resumeData.profession || '',
    '{{email}}': resumeData.email || '',
    '{{phone}}': resumeData.phone || '',
    '{{city}}': resumeData.city || '',
    '{{country}}': resumeData.country || '',
    '{{address}}': [resumeData.city, resumeData.country].filter(Boolean).join(', '),
    
    // Different variations of summary/profile
    '{{summary}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{profile}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{aboutMe}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{bio}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{description}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{about-me}}': resumeData.professionalSummary || resumeData.summary || '',
    '{{professionalSummary}}': resumeData.professionalSummary || '',
    
    // Common template placeholder patterns
    'SAHIB KHAN': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim().toUpperCase(),
    'Stephen John': `${resumeData.firstName || ''} ${resumeData.surname || ''}`.trim(),
    'GRAPHIC DESIGNER': resumeData.profession ? resumeData.profession.toUpperCase() : '',
    'Graphic Designer': resumeData.profession || '',
    'ABOUT ME': 'ABOUT ME',
    'WORK EXPERIENCE': 'WORK EXPERIENCE',
    'EDUCATION': 'EDUCATION',
    'SKILLS': 'SKILLS',
    
    // Contact info placeholders
    '📞 telephone': resumeData.phone ? `📞 ${resumeData.phone}` : '📞 telephone',
    '✉️ email': resumeData.email ? `✉️ ${resumeData.email}` : '✉️ email',
    '📍 address, city, st zip code': [resumeData.city, resumeData.country].filter(Boolean).length > 0 ? 
      `📍 ${[resumeData.city, resumeData.country].filter(Boolean).join(', ')}` : 
      '📍 address, city, st zip code',
      
    // Professional template patterns (from the screenshot)
    'moahmed': resumeData.firstName || 'moahmed',
    'tabt=rez': resumeData.surname || 'tabt=rez',
    'movewo': resumeData.profession || 'movewo',
    'onewon': resumeData.city || 'onewon',
    'olnvewon': resumeData.country || 'olnvewon',
    'ovnewon': resumeData.postalCode || 'ovnewon',
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