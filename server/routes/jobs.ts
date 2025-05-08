import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { jobTitles, jobDescriptions, jobTitleSchema, jobDescriptionSchema } from "@shared/schema";
import { eq, asc, desc, sql } from "drizzle-orm";
import { z } from "zod";

export const jobsRouter = Router();

// Get all job titles with pagination
jobsRouter.get("/titles", async (req, res) => {
  try {
    // Parse pagination parameters from the query
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const offset = (page - 1) * limit;
    
    // Parse additional filter parameters
    const category = req.query.category as string || null;
    const searchQuery = req.query.search as string || null;
    
    console.log(`Fetching job titles (page: ${page}, limit: ${limit}, category: ${category || 'all'}, search: ${searchQuery || 'none'})`);
    
    // Build the query with optional filters
    let query = db.select().from(jobTitles);
    
    // Apply category filter if provided
    if (category) {
      query = query.where(eq(jobTitles.category, category));
    }
    
    // Apply search filter if provided
    if (searchQuery) {
      console.log(`Searching for job titles matching: "${searchQuery}"`);
      // Use more flexible search with special handling for exact match
      const searchPattern = `%${searchQuery}%`;
      
      // First try exact case-insensitive match
      const exactQuery = db.select()
                           .from(jobTitles)
                           .where(sql`LOWER(${jobTitles.title}) = LOWER(${searchQuery})`);
      
      const exactMatches = await exactQuery.execute();
      if (exactMatches.length > 0) {
        console.log(`Found exact match for: "${searchQuery}"`);
        return res.json({
          data: exactMatches,
          meta: {
            page: 1,
            limit,
            totalCount: exactMatches.length,
            totalPages: 1,
          }
        });
      }
      
      // If no exact match, proceed with LIKE search
      query = query.where(
        sql`LOWER(${jobTitles.title}) LIKE LOWER(${searchPattern})
            OR LOWER(${jobTitles.category}) LIKE LOWER(${searchPattern})`
      );
    }
    
    // Get the total count for pagination
    // Use a separate count query to avoid SQL injection issues with dynamic SQL
    let countQuery = db.select({ count: sql`COUNT(*)` }).from(jobTitles);
    
    // Apply the same filters
    if (category) {
      countQuery = countQuery.where(eq(jobTitles.category, category));
    }
    
    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      countQuery = countQuery.where(
        sql`LOWER(${jobTitles.title}) LIKE LOWER(${searchPattern})
            OR LOWER(${jobTitles.category}) LIKE LOWER(${searchPattern})`
      );
    }
    
    const countResult = await countQuery.execute();
    const totalCount = parseInt(countResult[0].count.toString());
    
    // Apply pagination and ordering
    query = query
      .orderBy(asc(jobTitles.title))
      .limit(limit)
      .offset(offset);
    
    // Execute the final query
    const allTitles = await query.execute();
    
    console.log(`Retrieved ${allTitles.length} job titles (total: ${totalCount})`);
    
    // Return the results with pagination metadata
    return res.json({
      data: allTitles,
      meta: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      }
    });
  } catch (error) {
    console.error("Error fetching job titles:", error);
    return res.status(500).json({ error: "Failed to fetch job titles" });
  }
});

// Get a specific job title by ID
jobsRouter.get("/titles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job title ID" });
    }

    const title = await db.query.jobTitles.findFirst({
      where: eq(jobTitles.id, id),
      with: {
        descriptions: true
      }
    });

    if (!title) {
      return res.status(404).json({ error: "Job title not found" });
    }

    return res.json(title);
  } catch (error) {
    console.error("Error fetching job title:", error);
    return res.status(500).json({ error: "Failed to fetch job title" });
  }
});

// Get descriptions for a specific job title
jobsRouter.get("/titles/:id/descriptions", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job title ID" });
    }
    
    console.log(`Fetching descriptions for job title ID: ${id}`);
    const descriptions = await db.query.jobDescriptions.findMany({
      where: eq(jobDescriptions.jobTitleId, id),
      orderBy: [
        desc(jobDescriptions.isRecommended),
        asc(jobDescriptions.id)
      ]
    });
    
    console.log(`Retrieved ${descriptions.length} descriptions for job title ID: ${id}`);
    return res.json(descriptions);
  } catch (error) {
    console.error("Error fetching job descriptions:", error);
    return res.status(500).json({ error: "Failed to fetch job descriptions" });
  }
});

// Get all job descriptions (optionally filtered by jobTitleId or search term)
jobsRouter.get("/descriptions", async (req, res) => {
  try {
    const jobTitleId = req.query.jobTitleId ? parseInt(req.query.jobTitleId as string) : null;
    const searchTerm = req.query.search as string || null;
    
    console.log(`Fetching job descriptions${jobTitleId ? ` for job title ID: ${jobTitleId}` : ' (all)'}${searchTerm ? ` containing "${searchTerm}"` : ''}`);
    
    let descriptions;
    
    // Build query based on parameters
    if (jobTitleId && searchTerm) {
      // Filter by both job title ID and search term
      const searchPattern = `%${searchTerm}%`;
      descriptions = await db.select()
        .from(jobDescriptions)
        .where(
          sql`${jobDescriptions.jobTitleId} = ${jobTitleId} AND 
              LOWER(${jobDescriptions.content}) LIKE LOWER(${searchPattern})`
        )
        .orderBy(
          desc(jobDescriptions.isRecommended),
          asc(jobDescriptions.id)
        );
    } else if (jobTitleId) {
      // Filter by job title ID only
      descriptions = await db.query.jobDescriptions.findMany({
        where: eq(jobDescriptions.jobTitleId, jobTitleId),
        orderBy: [
          desc(jobDescriptions.isRecommended),
          asc(jobDescriptions.id)
        ]
      });
    } else if (searchTerm) {
      // Filter by search term only
      const searchPattern = `%${searchTerm}%`;
      descriptions = await db.select()
        .from(jobDescriptions)
        .where(
          sql`LOWER(${jobDescriptions.content}) LIKE LOWER(${searchPattern})`
        )
        .orderBy(
          desc(jobDescriptions.isRecommended),
          asc(jobDescriptions.id)
        )
        .limit(100);
    } else {
      // No filters, get all descriptions with a limit
      descriptions = await db.query.jobDescriptions.findMany({
        orderBy: [
          asc(jobDescriptions.jobTitleId),
          desc(jobDescriptions.isRecommended),
          asc(jobDescriptions.id)
        ],
        limit: 100 // Limit to avoid returning too much data
      });
    }
    
    // If no descriptions found but we have a job title ID, check if the title exists
    if (descriptions.length === 0 && jobTitleId) {
      const jobTitle = await db.query.jobTitles.findFirst({
        where: eq(jobTitles.id, jobTitleId)
      });
      
      if (jobTitle) {
        console.log(`Job title "${jobTitle.title}" exists but has no descriptions`);
      } else {
        console.log(`Job title with ID ${jobTitleId} doesn't exist`);
      }
    }
    
    console.log(`Retrieved ${descriptions.length} job descriptions`);
    return res.json(descriptions);
  } catch (error) {
    console.error("Error fetching job descriptions:", error);
    return res.status(500).json({ error: "Failed to fetch job descriptions" });
  }
});

// Admin routes requiring authentication
// Create a new job title
jobsRouter.post("/titles", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = jobTitleSchema.parse(req.body);
    
    // First check if a job title with this name already exists
    const existingTitle = await db.query.jobTitles.findFirst({
      where: eq(jobTitles.title, validatedData.title)
    });
    
    if (existingTitle) {
      return res.status(409).json({ 
        error: "Duplicate job title", 
        message: `A job title with the name "${validatedData.title}" already exists.` 
      });
    }
    
    const [newTitle] = await db.insert(jobTitles).values(validatedData).returning();
    return res.status(201).json(newTitle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    // Check for database constraint violations
    const pgError = error as any;
    if (pgError.code === '23505' && pgError.constraint === 'job_titles_title_key') {
      return res.status(409).json({ 
        error: "Duplicate job title", 
        message: "A job title with this name already exists." 
      });
    }
    
    console.error("Error creating job title:", error);
    return res.status(500).json({ error: "Failed to create job title" });
  }
});

// Update an existing job title
jobsRouter.put("/titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job title ID" });
    }

    const validatedData = jobTitleSchema.parse(req.body);
    
    // Check if another job title with this name already exists (excluding current record)
    const existingTitle = await db.query.jobTitles.findFirst({
      where: sql`${jobTitles.title} = ${validatedData.title} AND ${jobTitles.id} != ${id}`
    });
    
    if (existingTitle) {
      return res.status(409).json({ 
        error: "Duplicate job title", 
        message: `A job title with the name "${validatedData.title}" already exists.` 
      });
    }
    
    const [updatedTitle] = await db
      .update(jobTitles)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(jobTitles.id, id))
      .returning();

    if (!updatedTitle) {
      return res.status(404).json({ error: "Job title not found" });
    }

    return res.json(updatedTitle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    
    // Check for database constraint violations
    const pgError = error as any;
    if (pgError.code === '23505' && pgError.constraint === 'job_titles_title_key') {
      return res.status(409).json({ 
        error: "Duplicate job title", 
        message: "A job title with this name already exists." 
      });
    }
    
    console.error("Error updating job title:", error);
    return res.status(500).json({ error: "Failed to update job title" });
  }
});

// Delete a job title (will cascade delete its descriptions)
jobsRouter.delete("/titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job title ID" });
    }

    const [deletedTitle] = await db
      .delete(jobTitles)
      .where(eq(jobTitles.id, id))
      .returning();

    if (!deletedTitle) {
      return res.status(404).json({ error: "Job title not found" });
    }

    return res.json({ message: "Job title deleted successfully" });
  } catch (error) {
    console.error("Error deleting job title:", error);
    return res.status(500).json({ error: "Failed to delete job title" });
  }
});

// Create a new job description
jobsRouter.post("/descriptions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = jobDescriptionSchema.parse(req.body);
    const [newDescription] = await db.insert(jobDescriptions).values(validatedData).returning();
    return res.status(201).json(newDescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error creating job description:", error);
    return res.status(500).json({ error: "Failed to create job description" });
  }
});

// Update an existing job description
jobsRouter.put("/descriptions/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job description ID" });
    }

    const validatedData = jobDescriptionSchema.parse(req.body);
    const [updatedDescription] = await db
      .update(jobDescriptions)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(jobDescriptions.id, id))
      .returning();

    if (!updatedDescription) {
      return res.status(404).json({ error: "Job description not found" });
    }

    return res.json(updatedDescription);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    console.error("Error updating job description:", error);
    return res.status(500).json({ error: "Failed to update job description" });
  }
});

// Delete a job description
jobsRouter.delete("/descriptions/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid job description ID" });
    }

    const [deletedDescription] = await db
      .delete(jobDescriptions)
      .where(eq(jobDescriptions.id, id))
      .returning();

    if (!deletedDescription) {
      return res.status(404).json({ error: "Job description not found" });
    }

    return res.json({ message: "Job description deleted successfully" });
  } catch (error) {
    console.error("Error deleting job description:", error);
    return res.status(500).json({ error: "Failed to delete job description" });
  }
});