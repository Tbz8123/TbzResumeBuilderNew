import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { skills, skillCategories, skillSchema, skillCategorySchema, jobTitles, jobTitleSkills, skillJobTitles, skillJobTitleSkills, skillJobTitleSchema } from "@shared/schema";
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

// Get skills by job title ID (using the original job title from jobs)
skillsRouter.get("/by-job-title/:jobTitleId", async (req, res) => {
  try {
    const jobTitleId = parseInt(req.params.jobTitleId);
    if (isNaN(jobTitleId)) {
      return res.status(400).json({ error: "Invalid job title ID" });
    }

    // Get job title to verify it exists
    const jobTitle = await db.query.jobTitles.findFirst({
      where: eq(jobTitles.id, jobTitleId),
    });

    if (!jobTitle) {
      return res.status(404).json({ error: "Job title not found" });
    }

    // Find all skills linked to this job title through the junction table
    // including their recommendation status
    const skillMappings = await db.query.jobTitleSkills.findMany({
      where: eq(jobTitleSkills.jobTitleId, jobTitleId),
      with: {
        skill: true
      },
      orderBy: [desc(jobTitleSkills.isRecommended)]
    });

    // Extract the skills with their recommendation status from the mapping
    // Importantly, we use the isRecommended flag from the junction table
    const linkedSkills = skillMappings.map(mapping => ({
      ...mapping.skill,
      isRecommended: mapping.isRecommended
    }));

    console.log(`Found ${linkedSkills.length} skills for job title ID ${jobTitleId} (${jobTitle.title})`);
    
    // If we don't have enough skills specific to this job title, 
    // supplement with some general skills
    if (linkedSkills.length < 10) {
      console.log(`Not enough skills for ${jobTitle.title}, adding generic skills`);
      
      // Get skill categories that might be relevant for this job
      const relevantCategoryIds = await getRelevantCategoriesForJobTitle(jobTitle);
      
      // Get some general skills from these categories that aren't already in the linked skills
      const linkedSkillIds = linkedSkills.map(s => s.id);
      
      // Query for additional skills, excluding the ones we already have
      const additionalSkills = await db.query.skills.findMany({
        where: 
          linkedSkillIds.length > 0 
            ? and(
                sql`${skills.categoryId} IN (${relevantCategoryIds.join(',')})`,
                sql`${skills.id} NOT IN (${linkedSkillIds.join(',')})`
              )
            : sql`${skills.categoryId} IN (${relevantCategoryIds.join(',')})`,
        orderBy: [desc(skills.isRecommended), asc(skills.name)],
        limit: 10 - linkedSkills.length
      });
      
      console.log(`Adding ${additionalSkills.length} additional generic skills`);
      
      // Add these skills to our result, marking them as not recommended
      linkedSkills.push(
        ...additionalSkills.map(skill => ({
          ...skill,
          isRecommended: false // Explicit general skills are not marked as recommended
        }))
      );
    }

    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json(linkedSkills);
  } catch (error) {
    console.error(`Error fetching skills for job title ID ${req.params.jobTitleId}:`, error);
    return res.status(500).json({ error: "Failed to fetch skills for this job title" });
  }
});

// SKILL JOB TITLES (specific to skills management, separate from job descriptions)

// Get all skill job titles with optional pagination and search
skillsRouter.get("/job-titles", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const searchQuery = req.query.search as string;
    const category = req.query.category as string;
    
    console.log(`Fetching skill job titles (page: ${page}, limit: ${limit}, category: ${category || 'all'}, search: ${searchQuery || 'none'})`);
    
    // Calculate offset for pagination
    const offset = (page - 1) * limit;
    
    // Build the query
    let queryBuilder = db.select().from(skillJobTitles);
    
    // Add search filter if provided
    if (searchQuery) {
      console.log(`Searching for skill job titles matching: "${searchQuery}"`);
      
      // Use a word-based approach to find titles containing any words from the search
      const searchWords = searchQuery.toLowerCase().split(/\s+/).filter(word => word.length > 0);
      
      if (searchWords.length > 0) {
        console.log(`Search words: ${searchWords.join(', ')}`);
        
        // Search for exact match first
        const exactMatchQuery = db.select().from(skillJobTitles)
          .where(sql`LOWER(${skillJobTitles.title}) = LOWER(${searchQuery})`)
          .limit(1);
        
        const exactMatches = await exactMatchQuery;
        if (exactMatches.length > 0) {
          console.log(`Found exact match for "${searchQuery}": "${exactMatches[0].title}"`);
          queryBuilder = queryBuilder.where(sql`LOWER(${skillJobTitles.title}) = LOWER(${searchQuery})`);
        } else {
          // For partial matches, look for titles containing any of the search words
          const firstSearchWord = searchWords[0];
          console.log(`Using first search word: "${firstSearchWord}"`);
          queryBuilder = queryBuilder.where(sql`LOWER(${skillJobTitles.title}) LIKE LOWER(${'%' + firstSearchWord + '%'})`);
        }
      } else {
        // Fallback to standard search if no words found
        queryBuilder = queryBuilder.where(sql`LOWER(${skillJobTitles.title}) LIKE LOWER(${'%' + searchQuery + '%'})`);
      }
    }
    
    // Add category filter if provided and not 'all'
    if (category && category !== 'all') {
      queryBuilder = queryBuilder.where(eq(skillJobTitles.category, category));
    }
    
    // Get total count for pagination
    const totalCountQuery = db.select({ count: sql<number>`count(*)` }).from(skillJobTitles);
    if (searchQuery) {
      totalCountQuery.where(sql`LOWER(${skillJobTitles.title}) LIKE LOWER(${'%' + searchQuery + '%'})`);
    }
    if (category && category !== 'all') {
      totalCountQuery.where(eq(skillJobTitles.category, category));
    }
    
    const [{ count }] = await totalCountQuery;
    const total = Number(count);
    
    // Execute the query with pagination and ordering
    const data = await queryBuilder
      .orderBy(asc(skillJobTitles.title))
      .limit(limit)
      .offset(offset);
    
    console.log(`Retrieved ${data.length} skill job titles (total: ${total})`);
    
    // More detailed logging for search results
    if (searchQuery) {
      if (data.length > 0) {
        console.log(`Found skill job titles matching "${searchQuery}":`);
        data.forEach((item, index) => {
          console.log(`  ${index+1}. "${item.title}" (ID: ${item.id})`);
        });
      } else {
        console.log(`No skill job titles found matching "${searchQuery}"`);
        
        // If search failed, let's try a more permissive search just for debugging
        const debugQuery = await db.select()
          .from(skillJobTitles)
          .where(sql`${skillJobTitles.title} LIKE ${'%' + searchQuery.split(' ')[0] + '%'}`)
          .limit(5);
        
        if (debugQuery.length > 0) {
          console.log(`Debug: found ${debugQuery.length} results with more permissive search:`);
          debugQuery.forEach((item, index) => {
            console.log(`  ${index+1}. "${item.title}" (ID: ${item.id})`);
          });
        } else {
          console.log(`Debug: no results even with permissive search`);
        }
      }
    }
    
    // Return the result with pagination info
    return res.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching skill job titles:", error);
    return res.status(500).json({ error: "Failed to fetch skill job titles" });
  }
});

// Import our fixed helper functions
import { getAdditionalSkills } from './fixed-skills-helper';

// Get skills by skill job title ID (using our skill-specific job titles)
skillsRouter.get("/by-skill-job-title/:skillJobTitleId", async (req, res) => {
  try {
    console.log(`Received request for skills by job title ID: ${req.params.skillJobTitleId}`);
    
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    if (isNaN(skillJobTitleId)) {
      console.log(`Invalid skill job title ID: ${req.params.skillJobTitleId}`);
      return res.status(400).json({ error: "Invalid skill job title ID" });
    }

    // Get skill job title to verify it exists
    console.log(`Looking up skill job title with ID: ${skillJobTitleId}`);
    const skillJobTitle = await db.query.skillJobTitles.findFirst({
      where: eq(skillJobTitles.id, skillJobTitleId),
    });

    if (!skillJobTitle) {
      console.log(`Skill job title with ID: ${skillJobTitleId} not found`);
      return res.status(404).json({ error: "Skill job title not found" });
    }
    
    console.log(`Found skill job title: "${skillJobTitle.title}" (ID: ${skillJobTitleId})`);

    // Find all skills linked to this skill job title through the junction table
    // including their recommendation status
    console.log(`Looking up skills for job title: "${skillJobTitle.title}" (ID: ${skillJobTitleId})`);
    const skillMappings = await db.query.skillJobTitleSkills.findMany({
      where: eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
      with: {
        skill: true
      },
      orderBy: [desc(skillJobTitleSkills.isRecommended)]
    });

    // Extract the skills with their recommendation status from the mapping
    const linkedSkills = skillMappings.map(mapping => ({
      ...mapping.skill,
      isRecommended: mapping.isRecommended
    }));

    console.log(`Found ${linkedSkills.length} skills for skill job title ID ${skillJobTitleId} (${skillJobTitle.title})`);
    
    // If we don't have enough skills specific to this job title, 
    // supplement with some general skills
    if (linkedSkills.length < 10) {
      console.log(`Not enough skills for ${skillJobTitle.title}, adding generic skills`);
      
      try {
        // Find the original job title from the jobs table to get its category
        const originalJobTitle = await db.query.jobTitles.findFirst({
          where: sql`LOWER(${jobTitles.title}) LIKE LOWER(${'%' + skillJobTitle.title + '%'})`,
        });

        if (originalJobTitle) {
          console.log(`Found job title: ${originalJobTitle.title}, category: ${originalJobTitle.category}`);
          // Get skill categories that might be relevant for this job title
          const relevantCategoryIds = await getRelevantCategoriesForJobTitle(originalJobTitle);
          console.log(`Filtering skills by categories: ${relevantCategoryIds.join(', ')}`);
        } else {
          console.log(`Could not find matching job title for ${skillJobTitle.title}`);
        }
      } catch (err) {
        console.error("Error looking up original job title:", err);
      }
      
      // Get skill categories that might be relevant for this job
      const relevantCategoryIds = await getRelevantCategoriesForJobTitle(skillJobTitle);
      
      // Get some general skills from these categories that aren't already in the linked skills
      const linkedSkillIds = linkedSkills.map(s => s.id);
      
      // Use our fixed helper function to get additional skills
      const additionalSkills = await getAdditionalSkills(
        relevantCategoryIds,
        linkedSkillIds,
        10 - linkedSkills.length
      );
      
      console.log(`Adding ${additionalSkills.length} additional generic skills`);
      
      // Add these skills to our result, marking them as not recommended
      linkedSkills.push(
        ...additionalSkills.map(skill => ({
          ...skill,
          isRecommended: false // Explicit general skills are not marked as recommended
        }))
      );
    }

    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    return res.json(linkedSkills);
  } catch (error) {
    console.error(`Error fetching skills for skill job title ID ${req.params.skillJobTitleId}:`, error);
    return res.status(500).json({ error: "Failed to fetch skills for this skill job title" });
  }
});

// Create a new skill job title
skillsRouter.post("/job-titles", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = skillJobTitleSchema.parse(req.body);
    const [newSkillJobTitle] = await db.insert(skillJobTitles).values(validatedData).returning();
    return res.status(201).json(newSkillJobTitle);
  } catch (error) {
    console.error("Error creating skill job title:", error);
    return res.status(500).json({ error: "Failed to create skill job title" });
  }
});

// Update a skill job title
skillsRouter.put("/job-titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill job title ID" });
    }
    
    const validatedData = skillJobTitleSchema.parse(req.body);
    const [updatedSkillJobTitle] = await db.update(skillJobTitles)
      .set(validatedData)
      .where(eq(skillJobTitles.id, id))
      .returning();
      
    if (!updatedSkillJobTitle) {
      return res.status(404).json({ error: "Skill job title not found" });
    }
    
    return res.json(updatedSkillJobTitle);
  } catch (error) {
    console.error("Error updating skill job title:", error);
    return res.status(500).json({ error: "Failed to update skill job title" });
  }
});

// Delete a skill job title
skillsRouter.delete("/job-titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid skill job title ID" });
    }
    
    // First check if there are any skills linked to this job title
    const skillLinks = await db.query.skillJobTitleSkills.findMany({
      where: eq(skillJobTitleSkills.skillJobTitleId, id),
      limit: 1
    });
    
    if (skillLinks.length > 0) {
      // Delete all skill links first
      await db.delete(skillJobTitleSkills)
        .where(eq(skillJobTitleSkills.skillJobTitleId, id));
    }
    
    // Then delete the job title
    await db.delete(skillJobTitles).where(eq(skillJobTitles.id, id));
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting skill job title:", error);
    return res.status(500).json({ error: "Failed to delete skill job title" });
  }
});

// Add skills to a skill job title
skillsRouter.post("/job-titles/:skillJobTitleId/skills", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    if (isNaN(skillJobTitleId)) {
      return res.status(400).json({ error: "Invalid skill job title ID" });
    }
    
    const { skillId, isRecommended } = req.body;
    if (!skillId || isNaN(parseInt(skillId))) {
      return res.status(400).json({ error: "Invalid skill ID in request body" });
    }
    
    const skillIdNum = parseInt(skillId);
    
    // Check if both skill job title and skill exist
    const skillJobTitle = await db.query.skillJobTitles.findFirst({
      where: eq(skillJobTitles.id, skillJobTitleId)
    });
    
    if (!skillJobTitle) {
      return res.status(404).json({ error: "Skill job title not found" });
    }
    
    const skillItem = await db.query.skills.findFirst({
      where: eq(skills.id, skillIdNum)
    });
    
    if (!skillItem) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    // Check if the association already exists
    const existingAssociation = await db.query.skillJobTitleSkills.findFirst({
      where: and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillIdNum)
      )
    });
    
    if (existingAssociation) {
      console.log(`Association already exists between skill ${skillIdNum} and skill job title ${skillJobTitleId}`);
      return res.status(409).json({ 
        error: "Association already exists",
        association: existingAssociation
      });
    }
    
    // Create the association
    console.log(`Creating association between skill ${skillIdNum} and skill job title ${skillJobTitleId}`);
    const isRecommendedValue = isRecommended === undefined ? false : !!isRecommended;
    
    const [association] = await db.insert(skillJobTitleSkills)
      .values({
        skillJobTitleId,
        skillId: skillIdNum,
        isRecommended: isRecommendedValue
      })
      .returning();
    
    return res.status(201).json(association);
  } catch (error) {
    console.error("Error adding skill to skill job title:", error);
    return res.status(500).json({ error: "Failed to add skill to skill job title" });
  }
});

// Associate a skill with a skill job title (using URL parameters)
skillsRouter.post("/job-titles/:skillJobTitleId/skills/:skillId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(skillJobTitleId) || isNaN(skillId)) {
      return res.status(400).json({ error: "Invalid skill job title ID or skill ID" });
    }
    
    // Check if both exist
    const skillJobTitle = await db.query.skillJobTitles.findFirst({
      where: eq(skillJobTitles.id, skillJobTitleId)
    });
    
    if (!skillJobTitle) {
      return res.status(404).json({ error: "Skill job title not found" });
    }
    
    const skillItem = await db.query.skills.findFirst({
      where: eq(skills.id, skillId)
    });
    
    if (!skillItem) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    // Check if the association already exists
    const existingAssociation = await db.query.skillJobTitleSkills.findFirst({
      where: and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      )
    });
    
    if (existingAssociation) {
      // If it exists, update the isRecommended status if needed
      const isRecommended = req.body.isRecommended === undefined ? 
        existingAssociation.isRecommended : !!req.body.isRecommended;
        
      if (isRecommended !== existingAssociation.isRecommended) {
        const [updated] = await db.update(skillJobTitleSkills)
          .set({ isRecommended })
          .where(eq(skillJobTitleSkills.id, existingAssociation.id))
          .returning();
          
        return res.json(updated);
      }
      
      return res.json(existingAssociation);
    }
    
    // Create the association
    const isRecommended = req.body.isRecommended === undefined ? false : !!req.body.isRecommended;
    const [association] = await db.insert(skillJobTitleSkills)
      .values({
        skillJobTitleId,
        skillId,
        isRecommended
      })
      .returning();
      
    return res.status(201).json(association);
  } catch (error) {
    console.error("Error associating skill with skill job title:", error);
    return res.status(500).json({ error: "Failed to associate skill with skill job title" });
  }
});

// Remove a skill from a skill job title
skillsRouter.delete("/job-titles/:skillJobTitleId/skills/:skillId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(skillJobTitleId) || isNaN(skillId)) {
      return res.status(400).json({ error: "Invalid skill job title ID or skill ID" });
    }
    
    await db.delete(skillJobTitleSkills)
      .where(and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      ));
      
    return res.status(204).send();
  } catch (error) {
    console.error("Error removing skill from skill job title:", error);
    return res.status(500).json({ error: "Failed to remove skill from skill job title" });
  }
});

// Helper function to get relevant skill categories for a job title
async function getRelevantCategoriesForJobTitle(jobTitle: any): Promise<number[]> {
  // Default to these categories which should exist in most systems
  const defaultCategoryIds = [1, 2]; // Assuming categories 1, 2 are common (technical, soft skills)
  
  try {
    console.log(`Finding relevant categories for job title: "${jobTitle.title}", category: "${jobTitle.category}"`);
    
    // Map job categories to potential skill categories
    const jobCategory = (jobTitle.category || '').toLowerCase();
    const categoryMappings: Record<string, string[]> = {
      'technology': ['technical', 'programming', 'development', 'software'],
      'engineering': ['technical', 'engineering', 'scientific'],
      'management': ['management', 'leadership', 'business'],
      'design': ['design', 'creative', 'visual'],
      'marketing': ['marketing', 'communications', 'creative'],
      'sales': ['sales', 'customer service', 'communication'],
      'healthcare': ['healthcare', 'medical', 'scientific'],
      'education': ['education', 'teaching', 'academic'],
      'finance': ['finance', 'business', 'analytical']
    };
    
    // Find all relevant category names based on job category
    let relevantCategoryNames: string[] = [];
    
    // Add general soft skills for all jobs
    relevantCategoryNames.push('soft');
    
    // Add job-specific skills based on job category
    for (const [key, values] of Object.entries(categoryMappings)) {
      if (jobCategory.includes(key)) {
        relevantCategoryNames.push(...values);
      }
    }
    
    // If we couldn't determine categories, add default ones
    if (relevantCategoryNames.length === 0) {
      relevantCategoryNames = ['technical', 'soft', 'general'];
    }
    
    // Remove duplicates
    relevantCategoryNames = [...new Set(relevantCategoryNames)];
    
    console.log(`Looking up categories matching: ${relevantCategoryNames.join(', ')}`);
    
    // Get all categories first
    const allCategories = await db.select().from(skillCategories);
    console.log(`Found ${allCategories.length} total categories`);
    
    // Filter them in memory for safer handling
    const matchingCategories = allCategories.filter(category => {
      const categoryName = category.name.toLowerCase();
      return relevantCategoryNames.some(name => 
        categoryName.includes(name.toLowerCase())
      );
    });
    
    console.log(`Matched ${matchingCategories.length} categories: ${matchingCategories.map(c => c.name).join(', ')}`);
    
    const categories = matchingCategories;
    
    // Extract the category IDs
    const categoryIds = categories.map(c => c.id);
    
    // If no categories were found, return defaults
    return categoryIds.length > 0 ? categoryIds : defaultCategoryIds;
  } catch (error) {
    console.error("Error determining relevant categories:", error);
    return defaultCategoryIds;
  }
}

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
    // Extract job title ID from the request if present
    const { jobTitleId, ...skillData } = req.body;
    
    // Validate the skill data
    const validatedData = skillSchema.parse(skillData);
    
    // Create the skill
    const [newSkill] = await db.insert(skills).values(validatedData).returning();
    
    // If a job title ID was provided, create the relationship
    if (jobTitleId) {
      console.log(`Creating relationship between skill ${newSkill.id} and job title ${jobTitleId}`);
      
      try {
        // Insert into the junction table to establish the many-to-many relationship
        await db.insert(jobTitleSkills).values({
          jobTitleId: jobTitleId,
          skillId: newSkill.id,
          isRecommended: true // New skills added to job titles are recommended by default
        });
        
        console.log(`Successfully mapped skill to job title`);
      } catch (mappingError) {
        console.error("Error mapping skill to job title:", mappingError);
        // We don't fail the entire operation if mapping fails, the skill is still created
      }
    }
    
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

// Export skills as JSON (admin only)
skillsRouter.get("/export/json", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all skills with categories
    const allSkills = await db.query.skills.findMany({
      with: {
        category: true
      }
    });
    
    // Get all job titles
    const allJobTitles = await db.query.jobTitles.findMany();
    
    // Get skill-job title mappings
    const mappings = await db.query.jobTitleSkills.findMany({
      with: {
        skill: true,
        jobTitle: true
      }
    });
    
    // Format the data for JSON - focusing on job title ID, job title, and skill name
    const formattedSkills = [];
    
    // Process each mapping record
    for (const mapping of mappings) {
      if (mapping.skill && mapping.jobTitle) {
        // Find the skill's category
        const skill = allSkills.find(s => s.id === mapping.skillId);
        
        formattedSkills.push({
          id: mapping.jobTitleId,
          jobTitle: mapping.jobTitle.title,
          categoryId: skill?.categoryId || '',
          categoryName: skill?.category?.name || '',
          skillName: mapping.skill.name,
          isRecommended: mapping.isRecommended
        });
      }
    }
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=skills-export.json');
    
    // Send the JSON data
    res.json(formattedSkills);
  } catch (error) {
    console.error("Error exporting skills:", error);
    return res.status(500).json({ error: "Failed to export skills as JSON" });
  }
});

// Export skills as Excel (admin only)
skillsRouter.get("/export/excel", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all skills with categories
    const allSkills = await db.query.skills.findMany({
      with: {
        category: true
      }
    });
    
    // Get all job titles
    const allJobTitles = await db.query.jobTitles.findMany();
    
    // Get skill-job title mappings
    const mappings = await db.query.jobTitleSkills.findMany({
      with: {
        skill: true,
        jobTitle: true
      }
    });
    
    // Format the data for Excel - focusing on job title ID, job title, and skill name
    const records = [];
    
    // Process each mapping record
    for (const mapping of mappings) {
      if (mapping.skill && mapping.jobTitle) {
        // Find the skill's category
        const skill = allSkills.find(s => s.id === mapping.skillId);
        
        records.push({
          'ID': mapping.jobTitleId,
          'Job Title': mapping.jobTitle.title,
          'Category ID': skill?.categoryId || '',
          'Category Name': skill?.category?.name || '',
          'Skill Name': mapping.skill.name,
          'Is Recommended': mapping.isRecommended ? 'Yes' : 'No'
        });
      }
    }
    
    // Create a buffer containing our Excel data
    // For simplicity, we'll actually just send a CSV with Excel extension
    // In a real app, you'd use a library like exceljs to create a proper Excel file
    
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'ID', title: 'ID'},
        {id: 'Job Title', title: 'Job Title'},
        {id: 'Category ID', title: 'Category ID'},
        {id: 'Category Name', title: 'Category Name'},
        {id: 'Skill Name', title: 'Skill Name'},
        {id: 'Is Recommended', title: 'Is Recommended'}
      ]
    });
    
    // Create a string from the CSV data
    let csvData = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=skills-export.xlsx');
    
    // Send the CSV data
    res.send(csvData);
  } catch (error) {
    console.error("Error exporting skills:", error);
    return res.status(500).json({ error: "Failed to export skills as Excel" });
  }
});

// Export skills as CSV (admin only)
skillsRouter.get("/export/csv", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all skills with categories
    const allSkills = await db.query.skills.findMany({
      with: {
        category: true
      }
    });
    
    // Get all job titles
    const allJobTitles = await db.query.jobTitles.findMany();
    
    // Create a mapping of job title IDs to titles
    const jobTitleMap = new Map();
    for (const jt of allJobTitles) {
      jobTitleMap.set(jt.id, jt.title);
    }
    
    // Get skill-job title mappings
    const mappings = await db.query.jobTitleSkills.findMany({
      with: {
        skill: true,
        jobTitle: true
      }
    });
    
    // Format the data for CSV - focusing on job title ID, job title, and skill name
    const records = [];
    
    // Process each mapping record
    for (const mapping of mappings) {
      if (mapping.skill && mapping.jobTitle) {
        // Find the skill's category
        const skill = allSkills.find(s => s.id === mapping.skillId);
        
        records.push({
          id: mapping.jobTitleId,
          jobTitle: mapping.jobTitle.title,
          categoryId: skill?.categoryId || '',
          categoryName: skill?.category?.name || '',
          skillName: mapping.skill.name,
          isRecommended: mapping.isRecommended ? 'Yes' : 'No'
        });
      }
    }
    
    // Create CSV stringifier with the requested column order
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'id', title: 'ID'},
        {id: 'jobTitle', title: 'Job Title'},
        {id: 'categoryId', title: 'Category ID'},
        {id: 'categoryName', title: 'Category Name'},
        {id: 'skillName', title: 'Skill Name'},
        {id: 'isRecommended', title: 'Is Recommended'}
      ]
    });
    
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

// Use a global event emitter for import status updates
const csvImportEmitter = new EventEmitter();

// SSE endpoint for monitoring CSV import progress
skillsRouter.get("/import/csv-status", isAuthenticated, isAdmin, (req, res) => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial status
  const initialStatus = {
    processed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
    isComplete: false
  };
  
  res.write(`data: ${JSON.stringify(initialStatus)}\n\n`);
  
  // Set up listener for progress updates
  const progressHandler = (data: any) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    
    // If complete, end the connection
    if (data.isComplete) {
      csvImportEmitter.removeListener('progress', progressHandler);
      res.end();
    }
  };
  
  // Register the event listener
  csvImportEmitter.on('progress', progressHandler);
  
  // Handle client disconnect
  req.on('close', () => {
    csvImportEmitter.removeListener('progress', progressHandler);
  });
});

// Import skills from CSV (admin only)
skillsRouter.post("/import/csv", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  // Progress tracking variables
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
    
    // Send initial progress update
    csvImportEmitter.emit('progress', {
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [],
      isComplete: false
    });
    
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
    
    // Track errors for reporting
    const errors: Array<{ row: number; message: string }> = [];
    
    // Get the sync mode from the request
    const syncMode = req.body.syncMode || 'update-only';
    console.log(`Import mode: ${syncMode}`);
    
    // Get existing categories for faster lookup
    const existingCategories = await db.query.skillCategories.findMany();
    const categoryMap = new Map(existingCategories.map(cat => [cat.name.toLowerCase(), cat]));
    
    // Process records
    for (const [index, record] of records.entries()) {
      try {
        progress = index + 1;
        
        // Send progress update every 5 records or for the first/last one
        if (progress % 5 === 0 || progress === 1 || progress === total) {
          csvImportEmitter.emit('progress', {
            processed: progress,
            created: results.skills.created,
            updated: results.skills.updated,
            deleted: 0, // We don't delete in this implementation
            errors: errors,
            isComplete: false
          });
        }
        
        // Extract category name and ensure it exists
        const categoryName = record['Category Name'] || record['CategoryName'] || record['categoryName'] || '';
        if (!categoryName) {
          console.warn(`Row ${progress}: Missing category name, skipping`);
          errors.push({ row: progress, message: 'Missing category name' });
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
        csvImportEmitter.emit('progress', { 
          processed: progress,
          created: results.skills.created,
          updated: results.skills.updated,
          deleted: 0,
          errors: [],
          isComplete: false
        });
      } catch (err) {
        console.error(`Error processing row ${progress}:`, err);
        results.skills.errors++;
      }
    }
    
    // Clean up the uploaded file
    await unlink(req.file.path);
    
    // Send final progress update
    csvImportEmitter.emit('progress', {
      processed: total,
      created: results.skills.created,
      updated: results.skills.updated,
      deleted: 0, // We don't delete in this implementation
      errors: errors,
      isComplete: true
    });
    
    // Return the results
    return res.json({
      success: true,
      processed: total,
      results
    });
  } catch (error) {
    console.error("Error importing skills:", error);
    
    // Initialize default results if not available
    const defaultResults = {
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
    
    // Send error progress update
    csvImportEmitter.emit('progress', {
      processed: progress,
      created: results?.skills?.created || defaultResults.skills.created,
      updated: results?.skills?.updated || defaultResults.skills.updated,
      deleted: 0,
      errors: [{ row: 0, message: error instanceof Error ? error.message : 'Unknown error occurred' }],
      isComplete: true
    });
    
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
// Copy job titles from job_titles table to skill_job_titles table
skillsRouter.post("/copy-job-titles", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Fetch all job titles from the job_titles table
    const existingJobTitles = await db.select().from(jobTitles);
    console.log(`Found ${existingJobTitles.length} job titles to copy`);
    
    let created = 0;
    let skipped = 0;
    
    // Process each job title
    for (const jobTitle of existingJobTitles) {
      // Check if this title already exists in skill_job_titles
      const existingSkillJobTitle = await db.query.skillJobTitles.findFirst({
        where: sql`LOWER(${skillJobTitles.title}) = LOWER(${jobTitle.title})`
      });
      
      if (existingSkillJobTitle) {
        console.log(`Skipping "${jobTitle.title}" - already exists in skill_job_titles`);
        skipped++;
        continue;
      }
      
      // Insert the job title into skill_job_titles
      await db.insert(skillJobTitles).values({
        title: jobTitle.title,
        category: jobTitle.category,
        description: `Imported from job titles on ${new Date().toISOString()}`
      });
      
      created++;
      console.log(`Copied job title: "${jobTitle.title}"`);
    }
    
    return res.json({
      success: true,
      message: `Successfully copied job titles to skill job titles.`,
      stats: {
        total: existingJobTitles.length,
        created,
        skipped
      }
    });
  } catch (error) {
    console.error("Error copying job titles:", error);
    return res.status(500).json({ 
      error: "Failed to copy job titles",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

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

// Update a skill association with a skill job title (admin only)
skillsRouter.put("/job-titles/:skillJobTitleId/skills/:skillId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(skillJobTitleId) || isNaN(skillId)) {
      return res.status(400).json({ error: "Invalid skill job title ID or skill ID" });
    }
    
    // Check if the association exists
    const existingAssociation = await db.query.skillJobTitleSkills.findFirst({
      where: and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      )
    });
    
    if (!existingAssociation) {
      return res.status(404).json({ error: "Skill is not associated with this skill job title" });
    }
    
    // Get the new isRecommended value
    const isRecommended = req.body.isRecommended === undefined ? 
      existingAssociation.isRecommended : !!req.body.isRecommended;
    
    console.log(`Updating association between skill ${skillId} and skill job title ${skillJobTitleId}, setting isRecommended=${isRecommended}`);
    
    // Update the association
    const [updatedAssociation] = await db.update(skillJobTitleSkills)
      .set({ isRecommended })
      .where(and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      ))
      .returning();
    
    return res.json(updatedAssociation);
  } catch (error) {
    console.error("Error updating skill association with skill job title:", error);
    return res.status(500).json({ error: "Failed to update skill association with skill job title" });
  }
});

// Remove a skill from a skill job title (admin only)
skillsRouter.delete("/job-titles/:skillJobTitleId/skills/:skillId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const skillJobTitleId = parseInt(req.params.skillJobTitleId);
    const skillId = parseInt(req.params.skillId);
    
    if (isNaN(skillJobTitleId) || isNaN(skillId)) {
      return res.status(400).json({ error: "Invalid skill job title ID or skill ID" });
    }
    
    // Check if the association exists
    const existingAssociation = await db.query.skillJobTitleSkills.findFirst({
      where: and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      )
    });
    
    if (!existingAssociation) {
      return res.status(404).json({ error: "Skill is not associated with this skill job title" });
    }
    
    console.log(`Removing association between skill ${skillId} and skill job title ${skillJobTitleId}`);
    
    // Delete the association
    await db.delete(skillJobTitleSkills).where(
      and(
        eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
        eq(skillJobTitleSkills.skillId, skillId)
      )
    );
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error removing skill from skill job title:", error);
    return res.status(500).json({ error: "Failed to remove skill from skill job title" });
  }
});
// Search for skills by exact name (used for checking existing skills)
skillsRouter.get("/search", async (req, res) => {
  try {
    const nameQuery = req.query.name as string;
    
    if (!nameQuery) {
      return res.status(400).json({ error: "Name query parameter is required" });
    }
    
    console.log(`Searching for skills with exact name: "${nameQuery}"`);
    
    // Find skills with exact name match (case insensitive)
    const matchingSkills = await db.select()
      .from(skills)
      .where(sql`LOWER(${skills.name}) = LOWER(${nameQuery})`)
      .limit(5);
    
    console.log(`Found ${matchingSkills.length} skills matching name "${nameQuery}"`);
    
    return res.json(matchingSkills);
  } catch (error) {
    console.error(`Error searching for skills by name "${req.query.name}":`, error);
    return res.status(500).json({ error: "Failed to search for skills" });
  }
});
