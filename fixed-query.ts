// This is a temporary helper file to demonstrate how to fix the SQL skills query

import { db } from "../db";
import { skills, skillCategories } from "@shared/schema";
import { eq, desc, asc, and, or, not, sql } from "drizzle-orm";

/**
 * Function to safely query for skills by category IDs and excluding specific skill IDs
 */
async function getSkillsByCategoryIdsExcludingSkills(
  categoryIds: number[], 
  excludeSkillIds: number[] = [],
  limit: number = 10
) {
  try {
    console.log(`Looking for skills in categories: ${categoryIds.join(', ')}`);
    
    // Start with a base query
    let query = db.select().from(skills);
    
    // Add category filter
    if (categoryIds.length === 1) {
      // For a single category, use simple equals
      query = query.where(eq(skills.categoryId, categoryIds[0]));
    } else if (categoryIds.length > 1) {
      // For multiple categories, build an OR condition for each categoryId
      const categoryConditions = categoryIds.map(id => eq(skills.categoryId, id));
      query = query.where(or(...categoryConditions));
    }
    
    // Add conditions to exclude specific skill IDs
    if (excludeSkillIds.length > 0) {
      console.log(`Excluding skills with IDs: ${excludeSkillIds.join(', ')}`);
      // Add a NOT condition for each ID to exclude
      excludeSkillIds.forEach(id => {
        query = query.where(not(eq(skills.id, id)));
      });
    }
    
    // Add ordering and limit
    query = query
      .orderBy(desc(skills.isRecommended), asc(skills.name))
      .limit(limit);
    
    // Execute the query and return results
    const results = await query;
    console.log(`Found ${results.length} skills matching criteria`);
    return results;
  } catch (error) {
    console.error("Error fetching skills by category IDs:", error);
    return [];
  }
}

/**
 * Function to safely get category IDs by their names
 */
async function getCategoryIdsByNames(categoryNames: string[]) {
  try {
    console.log(`Looking for categories with names: ${categoryNames.join(', ')}`);
    
    // Get all categories first
    const allCategories = await db.select().from(skillCategories);
    
    // Filter in memory to find categories with matching names
    const matchingCategories = allCategories.filter(category => {
      const lowerCatName = category.name.toLowerCase();
      return categoryNames.some(name => 
        lowerCatName.includes(name.toLowerCase())
      );
    });
    
    // Extract and return IDs
    const categoryIds = matchingCategories.map(cat => cat.id);
    console.log(`Found ${categoryIds.length} matching categories with IDs: ${categoryIds.join(', ')}`);
    return categoryIds;
  } catch (error) {
    console.error("Error getting category IDs by names:", error);
    return [];
  }
}

// Example usage
/*
// Get category IDs for specified names
const categoryIds = await getCategoryIdsByNames(['technical', 'soft']);

// Get skills from those categories, excluding specific skills
const additionalSkills = await getSkillsByCategoryIdsExcludingSkills(
  categoryIds,
  [1, 2, 3], // skills to exclude
  5 // limit
);
*/
