// This helper function fetches professional summary descriptions based on job title ID
export async function fetchProfessionalSummaryDescriptions(jobTitleId: number | string | null) {
  try {
    // Default fallback ID if none provided
    const DEFAULT_JOB_TITLE_ID = 1;
    
    // Convert job title ID to number if it's a string
    let titleId = DEFAULT_JOB_TITLE_ID;
    
    if (jobTitleId !== null) {
      if (typeof jobTitleId === 'number') {
        titleId = jobTitleId;
      } else if (typeof jobTitleId === 'string') {
        const parsedId = parseInt(jobTitleId, 10);
        if (!isNaN(parsedId)) {
          titleId = parsedId;
        }
      }
    }
    
    console.log(`Fetching professional summary descriptions for job title ID: ${titleId}`);
    
    // Make the API call
    const response = await fetch(`/api/professional-summary/descriptions/by-title/${titleId}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} professional summary descriptions`);
    
    // Process and return the data
    if (Array.isArray(data) && data.length > 0) {
      return data.map(item => ({
        id: item.id,
        content: item.content,
        isRecommended: item.isRecommended === true,
        professionalSummaryTitleId: item.professionalSummaryTitleId
      }));
    }
    
    // If no data or empty array, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching professional summary descriptions:', error);
    return [];
  }
}