/**
 * Template Job Description Fix
 * 
 * This module automatically injects the job description content into the 
 * resume template preview by directly working with the DOM API.
 * 
 * It is designed to run in the browser environment to ensure descriptions
 * are always present in the preview regardless of template structure.
 */

/**
 * Adds the job description to a template if it's missing
 * @param {ResumeData} resumeData - The resume data object
 */
export function ensureJobDescriptionInTemplate(resumeData) {
  // This function will be called after the template is rendered
  setTimeout(() => {
    try {
      // Check if we have work experience data
      if (!resumeData?.workExperience?.length) return;
      
      // Find the work experience section in the template
      const workExpSection = document.querySelector('.resume-document .work-experience-item') || 
                              document.querySelector('[data-section="work-experience"]') ||
                              document.querySelector('div:contains("WORK EXPERIENCE")');
                              
      if (!workExpSection) {
        // Try a different approach - look for job title elements
        const jobTitleElements = Array.from(document.querySelectorAll('p.job-title, .job-title, h3'));
        
        for (const element of jobTitleElements) {
          // Check if this element contains job title text
          const job = resumeData.workExperience[0];
          if (job && element.textContent?.includes(job.jobTitle)) {
            // This is likely a job title element, look for description below it
            let descElement = null;
            
            // Look for the closest description paragraph
            let sibling = element.nextElementSibling;
            let foundEmployer = false;
            
            while (sibling && !descElement) {
              // If we haven't found the employer yet, check if this is it
              if (!foundEmployer && sibling.textContent?.includes(job.employer)) {
                foundEmployer = true;
                sibling = sibling.nextElementSibling;
                continue;
              }
              
              // If we've found a paragraph after the employer that's not a date range, use it
              if (foundEmployer && 
                  sibling.tagName === 'P' && 
                  !sibling.textContent?.includes(`${job.startMonth} ${job.startYear}`)) {
                descElement = sibling;
                break;
              }
              
              // If we find a p tag that has "Description here..." text, use it
              if (sibling.tagName === 'P' && 
                  sibling.textContent?.includes('Description here')) {
                descElement = sibling;
                break;
              }
              
              sibling = sibling.nextElementSibling;
            }
            
            // If we found a description element, update its content
            if (descElement) {
              descElement.textContent = job.responsibilities || 'No job description available';
              console.log('Successfully updated job description in template');
            } else {
              // No suitable element found, create one
              const newDescElement = document.createElement('p');
              newDescElement.textContent = job.responsibilities || 'No job description available';
              element.parentNode.appendChild(newDescElement);
              console.log('Created new job description element in template');
            }
            
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error ensuring job description in template:', error);
    }
  }, 500);
}