import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { jobTitles, jobDescriptions, jobTitleSchema, jobDescriptionSchema } from "@shared/schema";
import { eq, asc, desc, sql, and } from "drizzle-orm";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";
import multer from "multer";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { EventEmitter } from "events";
import path from "path";
import { unlink } from "fs/promises";

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
      
      // First try exact case-insensitive match
      const exactQuery = db.select()
                         .from(jobTitles)
                         .where(sql`LOWER(${jobTitles.title}) = LOWER(${searchQuery})`);
      
      const exactMatches = await exactQuery.execute();
      if (exactMatches.length > 0) {
        console.log(`Found exact match for: "${searchQuery}"`);
        
        // Add cache control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
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
      
      // If no exact match, proceed with more flexible search approach
      
      // Get the most recent imported titles (last 30 days)
      // This ensures recently uploaded titles are prioritized
      const recentlyAddedTitles = await db.query.jobTitles.findMany({
        where: sql`${jobTitles.created_at} > NOW() - INTERVAL '30 days'`,
        orderBy: [desc(jobTitles.created_at)],
        limit: 20  // Limit to most recent 20
      });
      
      // Check if any of the recent titles are likely matches
      const potentialMatches = recentlyAddedTitles.filter(title => {
        // Compare normalized strings (no spaces, lowercase)
        const normalizedTitle = title.title.toLowerCase().replace(/\s+/g, '');
        const normalizedSearch = searchQuery.toLowerCase().replace(/\s+/g, '');
        
        // Check for partial match or common substrings (at least 3 chars)
        return normalizedTitle.includes(normalizedSearch) || 
               normalizedSearch.includes(normalizedTitle) ||
               (normalizedTitle.length >= 3 && normalizedSearch.includes(normalizedTitle.substring(0, 3)));
      });
      
      // If we found potential matches in recent imports, return those
      if (potentialMatches.length > 0) {
        console.log(`Found ${potentialMatches.length} potential matches in recently added titles`);
        
        // Add cache control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.json({
          data: potentialMatches,
          meta: {
            page: 1,
            limit,
            totalCount: potentialMatches.length,
            totalPages: 1,
          }
        });
      }
      
      // Perform standard search with word-level matching
      const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 1) {
        // For multi-word searches, create individual pattern for each word
        // This allows searching "New Test" to match "New Test Title"
        const conditions = searchTerms.map(term => {
          const pattern = `%${term}%`;
          return sql`(LOWER(${jobTitles.title}) LIKE LOWER(${pattern}) 
                    OR LOWER(${jobTitles.category}) LIKE LOWER(${pattern}))`;
        });
        
        // Join conditions with AND so all terms must match
        query = query.where(sql.join(conditions, sql` AND `));
        console.log(`Using multi-word search for "${searchQuery}"`);
      } else {
        // Single word search uses simple pattern matching
        const searchPattern = `%${searchQuery}%`;
        query = query.where(
          sql`LOWER(${jobTitles.title}) LIKE LOWER(${searchPattern})
              OR LOWER(${jobTitles.category}) LIKE LOWER(${searchPattern})`
        );
      }
    }
    
    // Get the total count for pagination
    // Use a separate count query to avoid SQL injection issues with dynamic SQL
    let countQuery = db.select({ count: sql`COUNT(*)` }).from(jobTitles);
    
    // Apply the same filters
    if (category) {
      countQuery = countQuery.where(eq(jobTitles.category, category));
    }
    
    if (searchQuery) {
      // Split search query into words for more flexible matching
      const searchTerms = searchQuery.split(/\s+/).filter(term => term.length > 0);
      
      if (searchTerms.length > 1) {
        // For multi-word searches, create individual pattern for each word
        const conditions = searchTerms.map(term => {
          const pattern = `%${term}%`;
          return sql`(LOWER(${jobTitles.title}) LIKE LOWER(${pattern}) 
                      OR LOWER(${jobTitles.category}) LIKE LOWER(${pattern}))`;
        });
        
        // Join conditions with AND so all terms must match
        countQuery = countQuery.where(sql.join(conditions, sql` AND `));
      } else {
        // Single word search uses simple pattern matching
        const searchPattern = `%${searchQuery}%`;
        countQuery = countQuery.where(
          sql`LOWER(${jobTitles.title}) LIKE LOWER(${searchPattern})
              OR LOWER(${jobTitles.category}) LIKE LOWER(${searchPattern})`
        );
      }
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
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    return res.json(descriptions);
  } catch (error) {
    console.error("Error fetching job descriptions:", error);
    return res.status(500).json({ error: "Failed to fetch job descriptions" });
  }
});

// Get all job descriptions (optionally filtered by jobTitleId or search term)
jobsRouter.get("/descriptions", async (req, res) => {
  try {
    // Log the raw query parameter for debugging
    console.log("Raw jobTitleId from request:", req.query.jobTitleId, "Type:", typeof req.query.jobTitleId);
    
    // Handle jobTitleId more robustly - ensure proper parsing and validation
    let jobTitleId: number | null = null;
    if (req.query.jobTitleId) {
      // Force conversion to string
      const jobTitleIdStr = String(req.query.jobTitleId).trim();
      console.log(`Job title ID as string: "${jobTitleIdStr}"`);
      
      const parsedId = parseInt(jobTitleIdStr);
      if (!isNaN(parsedId) && parsedId > 0) {
        jobTitleId = parsedId;
        console.log(`Successfully parsed jobTitleId to number: ${jobTitleId}`);
        
        // Double-check the job title exists
        const jobTitle = await db.query.jobTitles.findFirst({
          where: eq(jobTitles.id, jobTitleId)
        });
        
        if (jobTitle) {
          console.log(`Job title found: "${jobTitle.title}" (ID: ${jobTitle.id})`);
        } else {
          console.warn(`Job title with ID ${jobTitleId} not found in database`);
        }
      } else {
        console.warn(`Invalid jobTitleId provided: ${req.query.jobTitleId}`);
      }
    }
    const searchTerm = req.query.search as string || null;
    
    console.log(`Fetching job descriptions${jobTitleId ? ` for job title ID: ${jobTitleId}` : ' (all)'}${searchTerm ? ` containing "${searchTerm}"` : ''}`);
    
    let descriptions = [];
    
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
        .limit(200); // Increased limit to ensure enough suggestions
    } else {
      // No direct filters, but we might have a jobTitleId for prioritization
      if (jobTitleId) {
        // First get descriptions for this specific job title
        const titleDescriptions = await db.query.jobDescriptions.findMany({
          where: eq(jobDescriptions.jobTitleId, jobTitleId),
          orderBy: [
            desc(jobDescriptions.isRecommended),
            asc(jobDescriptions.id)
          ]
        });
        
        // Then get other descriptions to fill up to the limit
        const remainingLimit = 200 - titleDescriptions.length; // Increased limit to ensure more suggestions
        
        if (remainingLimit > 0) {
          const otherDescriptions = await db.query.jobDescriptions.findMany({
            where: sql`${jobDescriptions.jobTitleId} != ${jobTitleId}`,
            orderBy: [
              desc(jobDescriptions.isRecommended),
              asc(jobDescriptions.id)
            ],
            limit: remainingLimit
          });
          
          // Combine both sets
          descriptions = [...titleDescriptions, ...otherDescriptions];
          console.log(`Retrieved ${titleDescriptions.length} descriptions for job title ID: ${jobTitleId} and ${otherDescriptions.length} other descriptions`);
        } else {
          descriptions = titleDescriptions;
          console.log(`Retrieved ${titleDescriptions.length} descriptions for job title ID: ${jobTitleId} (no room for other descriptions)`);
        }
      } else {
        // No filters and no prioritization, get all descriptions with a limit
        descriptions = await db.query.jobDescriptions.findMany({
          orderBy: [
            asc(jobDescriptions.jobTitleId),
            desc(jobDescriptions.isRecommended),
            asc(jobDescriptions.id)
          ],
          limit: 200 // Increased limit to ensure enough suggestions
        });
      }
    }
    
    // If we need to return all descriptions but have a preferred job title ID,
    // we'll organize them with that title's descriptions at the top
    if (descriptions.length > 0 && jobTitleId && !searchTerm) {
      // If we have less than 50 descriptions but have a specific job title,
      // we need to fetch more descriptions to meet the minimum requirement
      if (descriptions.length < 50) {
        console.log(`Only ${descriptions.length} descriptions found for job title ID ${jobTitleId}, fetching additional descriptions to meet minimum 50 requirement`);
        
        // Fetch additional descriptions from other job titles
        const additionalDescriptions = await db.query.jobDescriptions.findMany({
          where: sql`${jobDescriptions.jobTitleId} != ${jobTitleId}`,
          orderBy: [
            desc(jobDescriptions.isRecommended),
            asc(jobDescriptions.id)
          ],
          limit: 50 - descriptions.length
        });
        
        console.log(`Retrieved ${additionalDescriptions.length} additional descriptions from other job titles`);
        
        // Add the additional descriptions to the results
        descriptions = [...descriptions, ...additionalDescriptions];
      }
    } else if (descriptions.length > 0 && jobTitleId) {
      // We have a preferred job title ID, but we're showing other descriptions too
      // Re-sort the array to put the target title's descriptions first
      const titleDescriptions = descriptions.filter(desc => desc.jobTitleId === jobTitleId);
      const otherDescriptions = descriptions.filter(desc => desc.jobTitleId !== jobTitleId);
      
      // Sort each group by recommended status and then by ID
      titleDescriptions.sort((a, b) => {
        // Sort by recommended first (true comes before false)
        if (a.isRecommended !== b.isRecommended) {
          return a.isRecommended ? -1 : 1;
        }
        // Then sort by ID
        return a.id - b.id;
      });
      
      otherDescriptions.sort((a, b) => {
        // Sort by recommended first
        if (a.isRecommended !== b.isRecommended) {
          return a.isRecommended ? -1 : 1;
        }
        // Then sort by ID
        return a.id - b.id;
      });
      
      // If we have less than 50 total descriptions, fetch more to meet minimum requirement
      if (titleDescriptions.length + otherDescriptions.length < 50 && otherDescriptions.length < 50 - titleDescriptions.length) {
        const neededCount = 50 - titleDescriptions.length - otherDescriptions.length;
        console.log(`Need ${neededCount} more descriptions to meet minimum 50 requirement`);
        
        // Fetch additional descriptions from other job titles
        const additionalDescriptions = await db.query.jobDescriptions.findMany({
          where: sql`${jobDescriptions.jobTitleId} != ${jobTitleId} AND 
                     ${jobDescriptions.id} NOT IN (${otherDescriptions.map(d => d.id).join(',') || 0})`,
          orderBy: [
            desc(jobDescriptions.isRecommended),
            asc(jobDescriptions.id)
          ],
          limit: neededCount
        });
        
        console.log(`Retrieved ${additionalDescriptions.length} additional descriptions from other job titles`);
        
        // Combine the arrays with title descriptions first, then other descriptions we already had, then additional ones
        descriptions = [...titleDescriptions, ...otherDescriptions, ...additionalDescriptions];
      } else {
        // Combine the arrays with title descriptions first
        descriptions = [...titleDescriptions, ...otherDescriptions];
      }
      
      console.log(`Prioritized ${titleDescriptions.length} descriptions for job title ID: ${jobTitleId} (total: ${descriptions.length})`);
    } else if (descriptions.length < 50) {
      // No job title specified but we have less than 50 descriptions, fetch more
      console.log(`Only ${descriptions.length} descriptions found, fetching more to meet minimum 50 requirement`);
      
      // Get the IDs of descriptions we already have to avoid duplicates
      const existingIds = descriptions.map(d => d.id);
      
      // Fetch additional descriptions
      const additionalDescriptions = await db.query.jobDescriptions.findMany({
        where: sql`${jobDescriptions.id} NOT IN (${existingIds.join(',') || 0})`,
        orderBy: [
          desc(jobDescriptions.isRecommended),
          asc(jobDescriptions.id)
        ],
        limit: 50 - descriptions.length
      });
      
      console.log(`Retrieved ${additionalDescriptions.length} additional descriptions`);
      
      // Add the additional descriptions to the results
      descriptions = [...descriptions, ...additionalDescriptions];
    }
    
    // ALWAYS ensure we have at least 50 descriptions, even if none match the criteria
    if (descriptions.length < 50) {
      console.log(`Only ${descriptions.length} descriptions found. Fetching more to ensure at least 50 results.`);
      
      // Get the IDs of descriptions we already have to avoid duplicates
      const existingIds = descriptions.map(d => d.id);
      let additionalDescriptions = [];
      
      try {
        // If we have existing IDs to exclude
        if (existingIds.length > 0) {
          // If we also have a job title ID to filter by
          if (jobTitleId) {
            // Fetch descriptions from other job titles
            additionalDescriptions = await db.query.jobDescriptions.findMany({
              where: sql`${jobDescriptions.id} NOT IN (${existingIds.join(',')}) 
                        AND ${jobDescriptions.jobTitleId} != ${jobTitleId}`,
              orderBy: [
                desc(jobDescriptions.isRecommended), 
                asc(jobDescriptions.id)
              ],
              limit: Math.max(50 - descriptions.length, 0)
            });
          } else {
            // No job title filter, just exclude existing IDs
            additionalDescriptions = await db.query.jobDescriptions.findMany({
              where: sql`${jobDescriptions.id} NOT IN (${existingIds.join(',')})`,
              orderBy: [
                desc(jobDescriptions.isRecommended), 
                asc(jobDescriptions.id)
              ],
              limit: Math.max(50 - descriptions.length, 0)
            });
          }
        } else {
          // No existing IDs to exclude
          if (jobTitleId) {
            // Fetch descriptions from other job titles
            additionalDescriptions = await db.query.jobDescriptions.findMany({
              where: sql`${jobDescriptions.jobTitleId} != ${jobTitleId}`,
              orderBy: [
                desc(jobDescriptions.isRecommended), 
                asc(jobDescriptions.id)
              ],
              limit: Math.max(50 - descriptions.length, 0)
            });
          } else {
            // No job title filter, fetch any descriptions
            additionalDescriptions = await db.query.jobDescriptions.findMany({
              orderBy: [
                desc(jobDescriptions.isRecommended), 
                asc(jobDescriptions.id)
              ],
              limit: Math.max(50 - descriptions.length, 0)
            });
          }
        }
      } catch (err) {
        console.error("Error fetching additional descriptions:", err);
        // Create an empty array as fallback
        additionalDescriptions = [];
      }
      
      console.log(`Retrieved ${additionalDescriptions.length} additional descriptions to meet minimum requirement`);
      
      // Add the additional descriptions to the results
      descriptions = [...descriptions, ...additionalDescriptions];
    }
    
    // If STILL no descriptions found but we have a job title ID, check if the title exists
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
    
    // Add cache control headers to prevent browser caching
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
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