import express from "express";
import { db } from "../../db";
import { isAuthenticated, isAdmin } from "../auth";
import { skillCategories, skills, skillCategorySchema, skillSchema } from "../../shared/schema";
import { eq, desc, and, asc, sql } from "drizzle-orm";
import { z } from "zod";

export const skillsRouter = express.Router();

// Get all skill categories (for admins and regular users)
skillsRouter.get("/categories", async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const offset = (page - 1) * limit;
    
    const categories = await db.query.skillCategories.findMany({
      limit,
      offset,
      orderBy: [asc(skillCategories.name)],
      with: {
        skills: true
      }
    });

    // Get total count for pagination
    const countResult = await db.select({ count: sql`COUNT(*)` }).from(skillCategories);
    const totalCount = Number(countResult[0].count);
    
    res.json({
      data: categories,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching skill categories:", error);
    res.status(500).json({ error: "Failed to fetch skill categories" });
  }
});

// Get a specific skill category by ID
skillsRouter.get("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
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

    res.json(category);
  } catch (error) {
    console.error("Error fetching skill category:", error);
    res.status(500).json({ error: "Failed to fetch skill category" });
  }
});

// Create a new skill category (admin only)
skillsRouter.post("/categories", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = skillCategorySchema.parse(req.body);
    
    const [newCategory] = await db.insert(skillCategories)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating skill category:", error);
    res.status(500).json({ error: "Failed to create skill category" });
  }
});

// Update a skill category (admin only)
skillsRouter.put("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const validatedData = skillCategorySchema.parse(req.body);
    
    const [updatedCategory] = await db.update(skillCategories)
      .set(validatedData)
      .where(eq(skillCategories.id, id))
      .returning();
      
    if (!updatedCategory) {
      return res.status(404).json({ error: "Skill category not found" });
    }
    
    res.json(updatedCategory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating skill category:", error);
    res.status(500).json({ error: "Failed to update skill category" });
  }
});

// Delete a skill category (admin only)
skillsRouter.delete("/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    // Delete associated skills first due to foreign key constraint
    await db.delete(skills)
      .where(eq(skills.categoryId, id));
      
    // Then delete the category
    const [deletedCategory] = await db.delete(skillCategories)
      .where(eq(skillCategories.id, id))
      .returning();
      
    if (!deletedCategory) {
      return res.status(404).json({ error: "Skill category not found" });
    }
    
    res.json({ success: true, message: "Skill category deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill category:", error);
    res.status(500).json({ error: "Failed to delete skill category" });
  }
});

// Get all skills (optionally filtered by category)
skillsRouter.get("/", async (req, res) => {
  try {
    const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
    const search = req.query.search as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const offset = (page - 1) * limit;
    
    let query = db.select().from(skills);
    
    // Apply category filter if provided
    if (categoryId) {
      query = query.where(eq(skills.categoryId, categoryId));
    }
    
    // Apply search filter if provided
    if (search) {
      query = query.where(sql`LOWER(${skills.name}) LIKE LOWER(${'%' + search + '%'})`);
    }
    
    // Get total count for pagination with the same filters
    const countQuery = db.select({ count: sql`COUNT(*)` }).from(skills);
    if (categoryId) {
      countQuery.where(eq(skills.categoryId, categoryId));
    }
    if (search) {
      countQuery.where(sql`LOWER(${skills.name}) LIKE LOWER(${'%' + search + '%'})`);
    }
    
    const countResult = await countQuery.execute();
    const totalCount = Number(countResult[0].count);
    
    // Apply sorting and pagination
    query = query
      .orderBy(
        desc(skills.isRecommended),
        asc(skills.name)
      )
      .limit(limit)
      .offset(offset);
    
    const allSkills = await query.execute();
    
    // Fetch categories for the skills to include in response
    const skillsWithCategories = await Promise.all(
      allSkills.map(async (skill) => {
        const category = await db.query.skillCategories.findFirst({
          where: eq(skillCategories.id, skill.categoryId)
        });
        return {
          ...skill,
          category: category || { name: 'Unknown' }
        };
      })
    );
    
    res.json({
      data: skillsWithCategories,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching skills:", error);
    res.status(500).json({ error: "Failed to fetch skills" });
  }
});

// Get a specific skill by ID
skillsRouter.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const skill = await db.query.skills.findFirst({
      where: eq(skills.id, id),
      with: {
        category: true
      }
    });

    if (!skill) {
      return res.status(404).json({ error: "Skill not found" });
    }

    res.json(skill);
  } catch (error) {
    console.error("Error fetching skill:", error);
    res.status(500).json({ error: "Failed to fetch skill" });
  }
});

// Create a new skill (admin only)
skillsRouter.post("/", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = skillSchema.parse(req.body);
    
    // Check if the category exists
    const category = await db.query.skillCategories.findFirst({
      where: eq(skillCategories.id, validatedData.categoryId)
    });
    
    if (!category) {
      return res.status(404).json({ error: "Skill category not found" });
    }
    
    const [newSkill] = await db.insert(skills)
      .values(validatedData)
      .returning();
      
    res.status(201).json(newSkill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error creating skill:", error);
    res.status(500).json({ error: "Failed to create skill" });
  }
});

// Update a skill (admin only)
skillsRouter.put("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const validatedData = skillSchema.parse(req.body);
    
    // Check if the category exists if it's being updated
    if (validatedData.categoryId) {
      const category = await db.query.skillCategories.findFirst({
        where: eq(skillCategories.id, validatedData.categoryId)
      });
      
      if (!category) {
        return res.status(404).json({ error: "Skill category not found" });
      }
    }
    
    const [updatedSkill] = await db.update(skills)
      .set(validatedData)
      .where(eq(skills.id, id))
      .returning();
      
    if (!updatedSkill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    res.json(updatedSkill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Error updating skill:", error);
    res.status(500).json({ error: "Failed to update skill" });
  }
});

// Delete a skill (admin only)
skillsRouter.delete("/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }
    
    const [deletedSkill] = await db.delete(skills)
      .where(eq(skills.id, id))
      .returning();
      
    if (!deletedSkill) {
      return res.status(404).json({ error: "Skill not found" });
    }
    
    res.json({ success: true, message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    res.status(500).json({ error: "Failed to delete skill" });
  }
});