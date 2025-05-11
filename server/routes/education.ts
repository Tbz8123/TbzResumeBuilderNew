import express from "express";
import { db } from "../../db";
import { isAuthenticated, isAdmin } from "../auth";
import { educationCategories, educationExamples, educationCategorySchema, educationExampleSchema } from "../../shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { z } from "zod";

export const educationRouter = express.Router();

// Get all education categories (for admins and regular users)
educationRouter.get("/categories", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const offset = (page - 1) * limit;
    
    const categories = await db.query.educationCategories.findMany({
      limit,
      offset,
      orderBy: [desc(educationCategories.name)],
      with: {
        examples: true
      }
    });

    // For pagination, just use the length of the entire result set
    // This is simpler than trying to use count() with the ORM
    
    res.json({
      data: categories,
      pagination: {
        total: categories.length,
        page,
        limit
      }
    });
  } catch (error) {
    console.error("Error fetching education categories:", error);
    res.status(500).json({ error: "Failed to fetch education categories" });
  }
});

// Get a specific education category by ID
educationRouter.get("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const category = await db.query.educationCategories.findFirst({
      where: eq(educationCategories.id, id),
      with: {
        examples: true
      }
    });

    if (!category) {
      return res.status(404).json({ error: "Education category not found" });
    }

    res.json(category);
  } catch (error) {
    console.error("Error fetching education category:", error);
    res.status(500).json({ error: "Failed to fetch education category" });
  }
});

// Create a new education category (admin only)
educationRouter.post("/categories", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = educationCategorySchema.parse(req.body);
    
    const [newCategory] = await db.insert(educationCategories)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating education category:", error);
    res.status(500).json({ error: "Failed to create education category" });
  }
});

// Update an education category (admin only)
educationRouter.put("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const validatedData = educationCategorySchema.parse(req.body);
    
    const [updatedCategory] = await db.update(educationCategories)
      .set(validatedData)
      .where(eq(educationCategories.id, id))
      .returning();
      
    if (!updatedCategory) {
      return res.status(404).json({ error: "Education category not found" });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating education category:", error);
    res.status(500).json({ error: "Failed to update education category" });
  }
});

// Delete an education category (admin only)
educationRouter.delete("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Delete associated examples first due to foreign key constraint
    await db.delete(educationExamples)
      .where(eq(educationExamples.categoryId, id));
      
    // Then delete the category
    const [deletedCategory] = await db.delete(educationCategories)
      .where(eq(educationCategories.id, id))
      .returning();
      
    if (!deletedCategory) {
      return res.status(404).json({ error: "Education category not found" });
    }
    
    res.json({ success: true, message: "Education category deleted successfully" });
  } catch (error) {
    console.error("Error deleting education category:", error);
    res.status(500).json({ error: "Failed to delete education category" });
  }
});

// Get examples for a specific category
educationRouter.get("/examples", async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    
    const examples = await db.query.educationExamples.findMany({
      where: categoryId ? eq(educationExamples.categoryId, categoryId) : undefined,
      orderBy: [desc(educationExamples.createdAt)],
      with: {
        category: true
      }
    });
    
    res.json(examples);
  } catch (error) {
    console.error("Error fetching education examples:", error);
    res.status(500).json({ error: "Failed to fetch education examples" });
  }
});

// Create a new education example (admin only)
educationRouter.post("/examples", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = educationExampleSchema.parse(req.body);
    
    // Check if the category exists
    const category = await db.query.educationCategories.findFirst({
      where: eq(educationCategories.id, validatedData.categoryId)
    });
    
    if (!category) {
      return res.status(404).json({ error: "Education category not found" });
    }
    
    const [newExample] = await db.insert(educationExamples)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newExample);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating education example:", error);
    res.status(500).json({ error: "Failed to create education example" });
  }
});

// Update an education example (admin only)
educationRouter.put("/examples/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const validatedData = educationExampleSchema.parse(req.body);
    
    // Check if the category exists if it's being updated
    if (validatedData.categoryId) {
      const category = await db.query.educationCategories.findFirst({
        where: eq(educationCategories.id, validatedData.categoryId)
      });
      
      if (!category) {
        return res.status(404).json({ error: "Education category not found" });
      }
    }
    
    const [updatedExample] = await db.update(educationExamples)
      .set(validatedData)
      .where(eq(educationExamples.id, id))
      .returning();
      
    if (!updatedExample) {
      return res.status(404).json({ error: "Education example not found" });
    }
    
    res.json(updatedExample);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating education example:", error);
    res.status(500).json({ error: "Failed to update education example" });
  }
});

// Delete an education example (admin only)
educationRouter.delete("/examples/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const [deletedExample] = await db.delete(educationExamples)
      .where(eq(educationExamples.id, id))
      .returning();
      
    if (!deletedExample) {
      return res.status(404).json({ error: "Education example not found" });
    }
    
    res.json({ success: true, message: "Education example deleted successfully" });
  } catch (error) {
    console.error("Error deleting education example:", error);
    res.status(500).json({ error: "Failed to delete education example" });
  }
});