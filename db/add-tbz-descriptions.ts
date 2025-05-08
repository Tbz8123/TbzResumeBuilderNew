import { db } from "@db";
import { jobTitles, jobDescriptions } from "@shared/schema";
import { eq, or, like } from "drizzle-orm";

/**
 * This script specifically looks for the "Tbz" job title and adds descriptions to it
 * If the job title doesn't exist, it will create it first
 */
async function addTbzDescriptions() {
  try {
    console.log("Starting to add Tbz job descriptions...");
    
    // First try to find the Tbz job title
    console.log("Searching for 'Tbz' job title...");
    const tbzTitle = await db.query.jobTitles.findFirst({
      where: eq(jobTitles.title, "Tbz")
    });
    
    let tbzTitleId: number;
    
    if (!tbzTitle) {
      console.log("'Tbz' job title not found, creating it now...");
      // Insert the job title if it doesn't exist
      const [newTitle] = await db.insert(jobTitles).values({
        title: "Tbz",
        category: "Technology"
      }).returning();
      
      tbzTitleId = newTitle.id;
      console.log(`Created 'Tbz' job title with ID: ${tbzTitleId}`);
    } else {
      tbzTitleId = tbzTitle.id;
      console.log(`Found 'Tbz' job title with ID: ${tbzTitleId}`);
    }
    
    // Check how many descriptions it currently has
    const existingDescriptions = await db.query.jobDescriptions.findMany({
      where: eq(jobDescriptions.jobTitleId, tbzTitleId)
    });
    
    console.log(`Tbz job title has ${existingDescriptions.length} existing descriptions`);
    
    // Sample descriptions for Tbz position
    const sampleDescriptions = [
      {
        jobTitleId: tbzTitleId,
        content: "Developed an innovative AI-driven resume builder platform, streamlining the document creation process and improving user experience.",
        isRecommended: true
      },
      {
        jobTitleId: tbzTitleId,
        content: "Led the technical architecture and implementation of a modular resume template engine with support for multiple export formats.",
        isRecommended: true
      },
      {
        jobTitleId: tbzTitleId,
        content: "Integrated advanced job description suggestion features using natural language processing techniques, resulting in 40% faster resume completion.",
        isRecommended: true
      },
      {
        jobTitleId: tbzTitleId,
        content: "Created responsive design systems with dynamic animations and UI elements, improving user engagement metrics by 35%.",
        isRecommended: false
      },
      {
        jobTitleId: tbzTitleId,
        content: "Implemented a comprehensive admin interface for managing over 500 job titles and descriptions, with robust search and filtering capabilities.",
        isRecommended: false
      }
    ];
    
    // Filter out any descriptions that might be too similar to existing ones
    const newDescriptions = sampleDescriptions.filter(sample => 
      !existingDescriptions.some(existing => 
        existing.content.toLowerCase().includes(sample.content.substring(0, 20).toLowerCase())
      )
    );
    
    if (newDescriptions.length === 0) {
      console.log("All sample descriptions are too similar to existing ones. No new descriptions added.");
      return;
    }
    
    // Insert the new descriptions
    const inserted = await db.insert(jobDescriptions).values(newDescriptions).returning();
    
    console.log(`Successfully added ${inserted.length} new job descriptions for the Tbz title`);
    inserted.forEach((desc, index) => {
      console.log(`${index + 1}. ${desc.content.substring(0, 40)}... (ID: ${desc.id})`);
    });
    
  } catch (error) {
    console.error("Error adding Tbz job descriptions:", error);
  }
}

// Execute the function
addTbzDescriptions()
  .then(() => {
    console.log("Finished adding Tbz job descriptions");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error in add-tbz-descriptions script:", error);
    process.exit(1);
  });