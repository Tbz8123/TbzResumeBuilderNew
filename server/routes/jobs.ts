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
    
    // Apply search filter if provided
    if (searchQuery) {
      console.log(`Searching for job titles matching: "${searchQuery}"`);
      
      // JavaScript-based search to avoid SQL operator issues
      try {
        const allTitles = await db.select().from(jobTitles).execute();
        const lowercaseSearch = searchQuery.toLowerCase();
        
        // First try to find exact matches (case insensitive)
        console.log(`Performing case-insensitive search for exact matches of: "${searchQuery}"`);
        const exactMatches = allTitles.filter(title => {
          const titleLower = title.title.toLowerCase().trim();
          const searchLower = lowercaseSearch.trim();
          const isMatch = titleLower === searchLower;
          if (isMatch) {
            console.log(`Found exact match: "${title.title}" (id: ${title.id}) matches "${searchQuery}"`);
          }
          return isMatch;
        });
        
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
        
        // If no exact match, find titles that contain the search query
        console.log(`No exact matches found, looking for titles containing: "${searchQuery}"`);
        const partialMatches = allTitles
          .filter(title => {
            const titleLower = title.title.toLowerCase().trim();
            const searchLower = lowercaseSearch.trim();
            const contains = titleLower.includes(searchLower);
            if (contains) {
              console.log(`Found partial match: "${title.title}" (id: ${title.id}) contains "${searchQuery}"`);
            }
            return contains;
          })
          .sort((a, b) => {
            // Sort by how closely the title matches the search string
            const aTitle = a.title.toLowerCase();
            const bTitle = b.title.toLowerCase();
            
            // Starts with search term
            if (aTitle.startsWith(lowercaseSearch) && !bTitle.startsWith(lowercaseSearch)) return -1;
            if (bTitle.startsWith(lowercaseSearch) && !aTitle.startsWith(lowercaseSearch)) return 1;
            
            // Ends with search term
            if (aTitle.endsWith(lowercaseSearch) && !bTitle.endsWith(lowercaseSearch)) return -1;
            if (bTitle.endsWith(lowercaseSearch) && !aTitle.endsWith(lowercaseSearch)) return 1;
            
            // Default to newest first
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .slice(0, 10); // Limit to 10 results
          
        if (partialMatches.length > 0) {
          console.log(`Found ${partialMatches.length} partial matches for search term: "${searchQuery}"`);
          
          // Add cache control headers to prevent browser caching
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          return res.json({
            data: partialMatches,
            meta: {
              page: 1,
              limit,
              totalCount: partialMatches.length,
              totalPages: 1,
            }
          });
        }
        
        // If we have category filter, we need to apply it
        if (category) {
          const filteredTitles = allTitles.filter(title => title.category === category);
          
          console.log(`Retrieved ${filteredTitles.length} job titles in category: ${category}`);
          
          // Add cache control headers to prevent browser caching
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
          
          // Apply pagination
          const paginatedTitles = filteredTitles.slice(offset, offset + limit);
          const totalFilteredCount = filteredTitles.length;
          
          return res.json({
            data: paginatedTitles,
            meta: {
              page,
              limit,
              totalCount: totalFilteredCount,
              totalPages: Math.ceil(totalFilteredCount / limit),
            }
          });
        }
        
        // If no matches and no category filter, return all results with pagination
        const paginatedTitles = allTitles.slice(offset, offset + limit);
        
        console.log(`No matches found for search term: "${searchQuery}", returning paginated results`);
        
        // Add cache control headers to prevent browser caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        return res.json({
          data: paginatedTitles,
          meta: {
            page,
            limit,
            totalCount: allTitles.length,
            totalPages: Math.ceil(allTitles.length / limit),
          }
        });
      } catch (error) {
        console.error("Error during JavaScript-based search:", error);
        // If JavaScript-based search fails, fall through to the standard SQL approach
      }
    }
    
    // If we reach here, either there was no search query or the JavaScript search failed
    // Do a simple database query with pagination
    
    // Build the query with optional filters
    let query = db.select().from(jobTitles);
    
    // Apply category filter if provided
    if (category) {
      query = query.where(eq(jobTitles.category, category));
    }
    
    // Get total count for pagination
    const countQuery = db.select({ count: sql`COUNT(*)` }).from(jobTitles);
    
    // Apply same category filter to count query if needed
    if (category) {
      countQuery.where(eq(jobTitles.category, category));
    }
    
    // Execute count query
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
        const additionalDescriptions: typeof descriptions = await db.query.jobDescriptions.findMany({
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
      let additionalDescriptions: typeof descriptions = [];
      
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