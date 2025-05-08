import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { jobTitles, jobDescriptions, jobTitleSchema, jobDescriptionSchema } from "@shared/schema";
import { eq, asc, desc } from "drizzle-orm";
import { z } from "zod";

export const jobsRouter = Router();

// Get all job titles
jobsRouter.get("/titles", async (req, res) => {
  try {
    const allTitles = await db.query.jobTitles.findMany({
      orderBy: asc(jobTitles.title)
    });
    return res.json(allTitles);
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

    const descriptions = await db.query.jobDescriptions.findMany({
      where: eq(jobDescriptions.jobTitleId, id),
      orderBy: [
        desc(jobDescriptions.isRecommended),
        asc(jobDescriptions.id)
      ]
    });

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
    const [newTitle] = await db.insert(jobTitles).values(validatedData).returning();
    return res.status(201).json(newTitle);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
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