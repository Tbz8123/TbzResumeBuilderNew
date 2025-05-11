import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { skills, skillCategories, skillSchema, skillCategorySchema } from "@shared/schema";
import { eq, asc, desc, sql, and, like } from "drizzle-orm";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import multer from "multer";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { EventEmitter } from "events";
import path from "path";
import { unlink } from "fs/promises";

export const skillsRouter = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Get all skill categories
skillsRouter.get("/categories", async (req, res) => {
  try {
    const categories = await db.query.skillCategories.findMany({
      orderBy: asc(skillCategories.name)
    });
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(categories);
  } catch (error) {
    console.error("Error fetching skill categories:", error);
    return res.status(500).json({ error: "Failed to fetch skill categories" });
  }
});

// Get a specific skill category by ID
skillsRouter.get("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill category ID" });
    }

    const category = await db.query.skillCategories.findFirst({
      where: eq(skillCategories.id, id),
      with: {
        skills: true
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Skill category not found" });
    }
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json(category);
  } catch (error) {
    console.error("Error fetching skill category:", error);
    return res.status(500).json({ error: "Failed to fetch skill category" });
  }
});

// Get all skills (optionally filtered by categoryId or jobTitleId)
skillsRouter.get("/", async (req, res) => {
  try {
    // Parse query parameters
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const searchTerm = req.query.search as string || null;
    const jobTitleId = req.query.jobTitleId ? parseInt(req.query.jobTitleId as string) : null;
    
    console.log(`Fetching skills${categoryId ? ` for category ID: ${categoryId}` : ''}${jobTitleId ? ` for job title ID: ${jobTitleId}` : ''}${searchTerm ? ` matching "${searchTerm}"` : ''}`);
    
    // Build the query based on filters
    let query = db.select().from(skills);
    
    // Apply category filter if provided
    if (categoryId && !isNaN(categoryId)) {
      query = query.where(eq(skills.categoryId, categoryId));
    }
    
    // Apply search filter if provided
    if (searchTerm) {
      const searchPattern = `%${searchTerm}%`;
      query = query.where(sql`LOWER(${skills.name}) LIKE LOWER(${searchPattern})`);
    }
    
    // For job title specific skills, we would need a join with a job title skills mapping table
    // For now, we'll return a relevant subset based on each job title
    // This will be enhanced with actual mappings later
    let result = await query.orderBy(desc(skills.isRecommended), asc(skills.name)).execute();
    
    // If we have a job title ID, try to filter the results to show relevant skills
    if (jobTitleId && !isNaN(jobTitleId)) {
      // For demo, we'll do some simple filtering based on job title ID ranges
      // In a production environment, this would be replaced with actual mappings from a join table
      
      // Get the job title to determine its category
      try {
        const jobTitle = await db.query.jobTitles.findFirst({
          where: eq(jobTitles.id, jobTitleId),
        });
        
        if (jobTitle) {
          console.log(`Found job title: ${jobTitle.title}, category: ${jobTitle.category}`);
          
          // Filter skills based on job title's category
          const jobCategory = jobTitle.category.toLowerCase();
          
          // Map job categories to skill categories for better matching
          let skillCategoryIds: number[] = [];
          
          if (jobCategory.includes('tech') || jobCategory.includes('engineering') || jobCategory.includes('development')) {
            // Find technical and programming related categories
            const techCategories = await db.query.skillCategories.findMany({
              where: sql`LOWER(${skillCategories.name}) LIKE '%technical%' OR LOWER(${skillCategories.name}) LIKE '%programming%'`
            });
            skillCategoryIds = techCategories.map(cat => cat.id);
          } 
          else if (jobCategory.includes('management') || jobCategory.includes('executive')) {
            // Find management related categories
            const mgmtCategories = await db.query.skillCategories.findMany({
              where: sql`LOWER(${skillCategories.name}) LIKE '%management%' OR LOWER(${skillCategories.name}) LIKE '%leadership%'`
            });
            skillCategoryIds = mgmtCategories.map(cat => cat.id);
          }
          else if (jobCategory.includes('design') || jobCategory.includes('creative')) {
            // Find design related categories
            const designCategories = await db.query.skillCategories.findMany({
              where: sql`LOWER(${skillCategories.name}) LIKE '%design%' OR LOWER(${skillCategories.name}) LIKE '%creative%'`
            });
            skillCategoryIds = designCategories.map(cat => cat.id);
          }
          
          // If we identified relevant categories, filter by them
          if (skillCategoryIds.length > 0) {
            console.log(`Filtering skills by categories: ${skillCategoryIds.join(', ')}`);
            result = await db.query.skills.findMany({
              where: sql`${skills.categoryId} IN (${skillCategoryIds.join(', ')})`,
              orderBy: [desc(skills.isRecommended), asc(skills.name)]
            });
          }
          
          // Always include soft skills for all job titles
          const softSkillCategory = await db.query.skillCategories.findFirst({
            where: sql`LOWER(${skillCategories.name}) LIKE '%soft%'`
          });
          
          if (softSkillCategory) {
            const softSkills = await db.query.skills.findMany({
              where: eq(skills.categoryId, softSkillCategory.id),
              orderBy: [desc(skills.isRecommended), asc(skills.name)]
            });
            
            // Add soft skills to the result
            result = [...result, ...softSkills.filter(softSkill => 
              !result.some(skill => skill.id === softSkill.id)
            )];
          }
        }
      } catch (error) {
        console.error("Error filtering skills by job title:", error);
        // Continue with unfiltered results if the filtering fails
      }
    }
    
    // Ensure we have at least 50 skills in the response
    if (result.length < 50) {
      console.log(`Only ${result.length} skills found, fetching more to reach minimum of 50`);
      
      // Get additional skills to reach the minimum
      const additionalSkills = await db.query.skills.findMany({
        orderBy: [desc(skills.isRecommended), asc(skills.name)],
        limit: 50 - result.length
      });
      
      // Add additional skills that aren't already in the result
      result = [...result, ...additionalSkills.filter(additional => 
        !result.some(existing => existing.id === additional.id)
      )];
      
      console.log(`Final skill count: ${result.length}`);
    }
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(result);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// Create a new skill category (admin only)
skillsRouter.post("/categories", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = skillCategorySchema.parse(req.body);
    const [newCategory] = await db.insert(skillCategories).values(validatedData).returning();
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error("Error creating skill category:", error);
    return res.status(500).json({ error: "Failed to create skill category" });
  }
});

// Update a skill category (admin only)
skillsRouter.put("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill category ID" });
    }
    
    const validatedData = skillCategorySchema.parse(req.body);
    const [updatedCategory] = await db.update(skillCategories)
      .set(validatedData)
      .where(eq(skillCategories.id, id))
      .returning();
      
    if (!updatedCategory) {
      return res.status(404).json({ error: "Skill category not found" });
    }
    
    return res.json(updatedCategory);
  } catch (error) {
    console.error("Error updating skill category:", error);
    return res.status(500).json({ error: "Failed to update skill category" });
  }
});

// Delete a skill category (admin only)
skillsRouter.delete("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill category ID" });
    }
    
    // Check if there are any skills in this category
    const hasSkills = await db.query.skills.findFirst({
      where: eq(skills.categoryId, id)
    });
    
    if (hasSkills) {
      return res.status(400).json({
        error: "Cannot delete category with existing skills. Delete or reassign skills first."
      });
    }
    
    // Delete the category
    await db.delete(skillCategories).where(eq(skillCategories.id, id));
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting skill category:", error);
    return res.status(500).json({ error: "Failed to delete skill category" });
  }
});

// Create a new skill (admin only)
skillsRouter.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = skillSchema.parse(req.body);
    const [newSkill] = await db.insert(skills).values(validatedData).returning();
    return res.status(201).json(newSkill);
  } catch (error) {
    console.error("Error creating skill:", error);
    return res.status(500).json({ error: "Failed to create skill" });
  }
});

// Update a skill (admin only)
skillsRouter.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill ID" });
    }
    
    const validatedData = skillSchema.parse(req.body);
    const [updatedSkill] = await db.update(skills)
      .set(validatedData)
      .where(eq(skills.id, id))
      .returning();
      
    if (!updatedSkill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    return res.json(updatedSkill);
  } catch (error) {
    console.error("Error updating skill:", error);
    return res.status(500).json({ error: "Failed to update skill" });
  }
});

// Delete a skill (admin only)
skillsRouter.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill ID" });
    }
    
    await db.delete(skills).where(eq(skills.id, id));
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting skill:", error);
    return res.status(500).json({ error: "Failed to delete skill" });
  }
});

// Export skills as CSV (admin only)
skillsRouter.get("/export/csv", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all skill categories
    const categories = await db.query.skillCategories.findMany({
      orderBy: asc(skillCategories.name)
    });
    
    // Get all skills with their category info
    const allSkills = await db.query.skills.findMany({
      with: {
        category: true
      },
      orderBy: [asc(skills.categoryId), asc(skills.name)]
    });
    
    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'id', title: 'ID'},
        {id: 'name', title: 'Skill Name'},
        {id: 'categoryId', title: 'Category ID'},
        {id: 'categoryName', title: 'Category Name'},
        {id: 'description', title: 'Description'},
        {id: 'isRecommended', title: 'Is Recommended'}
      ]
    });
    
    // Format data for CSV
    const records = allSkills.map(skill => ({
      id: skill.id,
      name: skill.name,
      categoryId: skill.categoryId,
      categoryName: skill.category.name,
      description: skill.description || '',
      isRecommended: skill.isRecommended ? 'Yes' : 'No'
    }));
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=skills-export.csv');
    
    // Write CSV header and records
    res.write(csvStringifier.getHeaderString());
    res.write(csvStringifier.stringifyRecords(records));
    res.end();
  } catch (error) {
    console.error("Error exporting skills:", error);
    return res.status(500).json({ error: "Failed to export skills" });
  }
});

// Import skills from CSV (admin only)
skillsRouter.post("/import/csv", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  // Create an event emitter for progress updates
  const progressEmitter = new EventEmitter();
  let progress = 0;
  let total = 0;
  let error: any = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Set up CSV parser
    const parser = createReadStream(req.file.path).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      })
    );
    
    // Process each row from the CSV
    const records: any[] = [];
    for await (const record of parser) {
      records.push(record);
    }
    
    total = records.length;
    console.log(`Importing ${total} skills from CSV`);
    
    // Import each record
    const results = {
      categories: {
        created: 0,
        existing: 0,
        errors: 0
      },
      skills: {
        created: 0,
        updated: 0,
        errors: 0
      }
    };
    
    // Get existing categories for faster lookup
    const existingCategories = await db.query.skillCategories.findMany();
    const categoryMap = new Map(existingCategories.map(cat => [cat.name.toLowerCase(), cat]));
    
    // Process records
    for (const [index, record] of records.entries()) {
      try {
        progress = index + 1;
        
        // Extract category name and ensure it exists
        const categoryName = record['Category Name'] || record['CategoryName'] || record['categoryName'] || '';
        if (!categoryName) {
          console.warn(`Row ${progress}: Missing category name, skipping`);
          results.skills.errors++;
          continue;
        }
        
        // Find or create the category
        let category = categoryMap.get(categoryName.toLowerCase());
        if (!category) {
          // Create new category
          try {
            const [newCategory] = await db.insert(skillCategories)
              .values({
                name: categoryName,
                description: `Category for ${categoryName} skills`
              })
              .returning();
              
            category = newCategory;
            categoryMap.set(categoryName.toLowerCase(), newCategory);
            results.categories.created++;
          } catch (err) {
            console.error(`Error creating category "${categoryName}":`, err);
            results.categories.errors++;
            continue;
          }
        } else {
          results.categories.existing++;
        }
        
        // Extract skill data
        const skillName = record['Skill Name'] || record['SkillName'] || record['skillName'] || record['name'] || '';
        if (!skillName) {
          console.warn(`Row ${progress}: Missing skill name, skipping`);
          results.skills.errors++;
          continue;
        }
        
        const skillDescription = record['Description'] || record['description'] || '';
        const isRecommended = 
          record['Is Recommended'] === 'Yes' || 
          record['IsRecommended'] === 'Yes' || 
          record['isRecommended'] === 'Yes' || 
          record['Is Recommended'] === 'true' || 
          record['IsRecommended'] === 'true' || 
          record['isRecommended'] === 'true';
        
        // Check if skill already exists
        const existingSkill = await db.query.skills.findFirst({
          where: and(
            eq(skills.name, skillName),
            eq(skills.categoryId, category.id)
          )
        });
        
        if (existingSkill) {
          // Update existing skill
          await db.update(skills)
            .set({
              description: skillDescription || existingSkill.description,
              isRecommended: isRecommended
            })
            .where(eq(skills.id, existingSkill.id));
            
          results.skills.updated++;
        } else {
          // Create new skill
          await db.insert(skills)
            .values({
              name: skillName,
              categoryId: category.id,
              description: skillDescription,
              isRecommended: isRecommended
            });
            
          results.skills.created++;
        }
        
        // Emit progress update
        progressEmitter.emit('progress', { progress, total });
      } catch (err) {
        console.error(`Error processing row ${progress}:`, err);
        results.skills.errors++;
      }
    }
    
    // Clean up the uploaded file
    await unlink(req.file.path);
    
    // Return the results
    return res.json({
      success: true,
      processed: total,
      results
    });
  } catch (error) {
    console.error("Error importing skills:", error);
    
    // Clean up the uploaded file if it exists
    if (req.file) {
      try {
        await unlink(req.file.path);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    }
    
    return res.status(500).json({ error: "Failed to import skills" });
  }
});

// Add bulk job-title related skills (admin only)
skillsRouter.post("/bulk", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const schema = z.object({
      jobTitleId: z.number(),
      skills: z.array(z.object({
        name: z.string().min(1),
        categoryId: z.number(),
        description: z.string().optional(),
        isRecommended: z.boolean().default(false)
      }))
    });
    
    const validatedData = schema.parse(req.body);
    
    // For each skill, create if it doesn't exist
    const results = {
      created: 0,
      existing: 0,
      errors: 0
    };
    
    for (const skillData of validatedData.skills) {
      try {
        // Check if skill already exists
        const existingSkill = await db.query.skills.findFirst({
          where: and(
            eq(skills.name, skillData.name),
            eq(skills.categoryId, skillData.categoryId)
          )
        });
        
        if (existingSkill) {
          results.existing++;
          continue;
        }
        
        // Create new skill
        await db.insert(skills).values(skillData);
        results.created++;
      } catch (error) {
        console.error(`Error creating skill "${skillData.name}":`, error);
        results.errors++;
      }
    }
    
    return res.json({
      success: true,
      jobTitleId: validatedData.jobTitleId,
      results
    });
  } catch (error) {
    console.error("Error adding bulk skills:", error);
    return res.status(500).json({ error: "Failed to add bulk skills" });
  }
});