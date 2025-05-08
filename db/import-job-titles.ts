import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { jobTitles as localJobTitles } from "../client/src/utils/jobTitlesData";
 
/**
 * Import job titles from the local jobTitlesData.ts file to the database
 * This script preserves existing job titles and descriptions
 */
async function importJobTitles() {
  try {
    console.log("Starting job titles import...");
    
    // Get existing job titles
    const existingTitles = await db.select().from(schema.jobTitles);
    console.log(`Found ${existingTitles.length} existing job titles in the database`);
    
    // Create a map of existing titles for quick lookup
    const existingTitleMap = new Map();
    existingTitles.forEach(title => {
      existingTitleMap.set(title.title.toLowerCase(), title);
    });
    
    // Import job titles from local file
    console.log(`Found ${localJobTitles.length} job titles in the local file`);
    
    let importedCount = 0;
    let skippedCount = 0;
    
    // Process job titles in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < localJobTitles.length; i += batchSize) {
      const batch = localJobTitles.slice(i, i + batchSize);
      const titlesToImport = [];
      
      // Filter out titles that already exist
      for (const localTitle of batch) {
        // Skip if the title already exists
        if (existingTitleMap.has(localTitle.title.toLowerCase())) {
          skippedCount++;
          continue;
        }
        
        // Add to import list
        titlesToImport.push({
          title: localTitle.title,
          category: localTitle.category
        });
      }
      
      // Import the titles
      if (titlesToImport.length > 0) {
        const result = await db.insert(schema.jobTitles).values(titlesToImport).returning();
        importedCount += result.length;
        console.log(`Imported batch of ${result.length} job titles (${i + 1}-${i + batch.length})`);
        
        // Add a basic description for each new job title
        for (const newTitle of result) {
          await db.insert(schema.jobDescriptions).values({
            jobTitleId: newTitle.id,
            content: `As a ${newTitle.title}, I was responsible for managing all aspects of the role, working with cross-functional teams, and driving strategic initiatives.`,
            isRecommended: true
          });
          console.log(`Added basic description for "${newTitle.title}"`);
        }
      }
      
      // Wait a bit to avoid overwhelming the database
      if (i + batchSize < localJobTitles.length) {
        console.log(`Waiting before processing next batch...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.log(`Import complete.`);
    console.log(`- Imported ${importedCount} new job titles with basic descriptions`);
    console.log(`- Skipped ${skippedCount} existing job titles`);
    
  } catch (error) {
    console.error("Error during job titles import:", error);
  }
}

importJobTitles();