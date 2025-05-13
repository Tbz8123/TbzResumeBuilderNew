import { db } from "./index";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";
import { seedAchievements } from "./achievements-seed";

async function seed() {
  try {
    console.log("Starting database seeding...");
    
    // Create initial admin user if not exists
    const existingAdmins = await db.select().from(schema.users).where(eq(schema.users.isAdmin, true));
    
    if (existingAdmins.length === 0) {
      console.log("Creating admin user...");
      await db.insert(schema.users).values({
        username: "admin",
        password: "$argon2id$v=19$m=65536,t=3,p=4$tP0s8A4lp3LM+q6qYLU75A$+rhr6NLc3bX9Q7PV0qmVLhLh5uxAvAJnFQC5QlUs+rk", // password: admin123
        isAdmin: true
      });
    }
    
    // Add sample job titles
    console.log("Seeding job titles...");
    
    // First check if we already have job titles
    const existingTitles = await db.select().from(schema.jobTitles);
    
    if (existingTitles.length === 0) {
      // Sample job titles with categories
      const sampleJobTitles = [
        { title: "Product Manager", category: "Management" },
        { title: "Software Engineer", category: "Technology" },
        { title: "Marketing Manager", category: "Marketing" },
        { title: "Financial Analyst", category: "Finance" },
        { title: "Graphic Designer", category: "Creative" },
      ];
      
      // Insert job titles
      for (const jobTitle of sampleJobTitles) {
        const [title] = await db.insert(schema.jobTitles).values(jobTitle).returning();
        console.log(`Added job title: ${title.title}`);
        
        // Add sample descriptions for each job title
        const descriptions = [
          {
            jobTitleId: title.id,
            content: `Led cross-functional teams to deliver ${title.title} projects, increasing efficiency by 25%.`,
            isRecommended: true
          },
          {
            jobTitleId: title.id,
            content: `Developed strategic plans as ${title.title}, resulting in 30% growth year over year.`,
            isRecommended: false
          },
          {
            jobTitleId: title.id,
            content: `Implemented new processes as ${title.title} that reduced operational costs by 15%.`,
            isRecommended: true
          }
        ];
        
        // Insert descriptions
        for (const description of descriptions) {
          await db.insert(schema.jobDescriptions).values(description);
          console.log(`Added description for ${title.title}`);
        }
      }
      console.log("Job titles and descriptions seeded successfully!");
    } else {
      console.log(`Skipping job titles seeding as ${existingTitles.length} titles already exist.`);
    }
    
    // Seed achievements
    await seedAchievements();
    
    console.log("Seeding completed successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
  }
}

seed();
