import { db } from "@db";
import { jobTitles, jobDescriptions } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Adds sample job descriptions for titles that have few or no descriptions
 * This is a development utility script to help test the job descriptions feature
 */
async function addSampleDescriptions() {
  try {
    console.log("Starting to add sample job descriptions...");
    
    // First find a job title to add descriptions to - we'll use "Manager" for now
    const manager = await db.query.jobTitles.findFirst({
      where: eq(jobTitles.title, "Manager")
    });
    
    if (!manager) {
      console.log("No 'Manager' job title found in the database");
      return;
    }
    
    console.log(`Found Manager job title with ID: ${manager.id}`);
    
    // Check how many descriptions it currently has
    const existingDescriptions = await db.query.jobDescriptions.findMany({
      where: eq(jobDescriptions.jobTitleId, manager.id)
    });
    
    console.log(`Manager job title has ${existingDescriptions.length} existing descriptions`);
    
    // Only add more if it has fewer than 5
    if (existingDescriptions.length >= 5) {
      console.log("Manager already has enough descriptions, no need to add more");
      return;
    }
    
    // Sample descriptions for a Manager position
    const sampleDescriptions = [
      {
        jobTitleId: manager.id,
        content: "Led a team of 10 professionals, overseeing daily operations and ensuring project deliverables were met on time and within budget.",
        isRecommended: true
      },
      {
        jobTitleId: manager.id,
        content: "Developed and implemented strategic plans that resulted in 25% increase in department efficiency and 15% reduction in operational costs.",
        isRecommended: true
      },
      {
        jobTitleId: manager.id,
        content: "Managed cross-functional teams to deliver complex projects, coordinating resources and resolving conflicts to ensure successful outcomes.",
        isRecommended: false
      },
      {
        jobTitleId: manager.id,
        content: "Created and maintained project schedules, conducted regular status meetings, and communicated progress to executive leadership.",
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
    
    console.log(`Successfully added ${inserted.length} new job descriptions for the Manager title`);
    inserted.forEach((desc, index) => {
      console.log(`${index + 1}. ${desc.content.substring(0, 40)}... (ID: ${desc.id})`);
    });
    
  } catch (error) {
    console.error("Error adding sample job descriptions:", error);
  }
}

// Execute the function
addSampleDescriptions()
  .then(() => {
    console.log("Finished adding sample job descriptions");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error in add-sample-descriptions script:", error);
    process.exit(1);
  });