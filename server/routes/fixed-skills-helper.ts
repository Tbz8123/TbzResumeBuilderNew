// This is a helper file to demonstrate the fixed query logic

import { db } from "@db";
import { skills, skillCategories, skillJobTitles, skillJobTitleSkills } from "@shared/schema";
import { eq, desc, asc, and, or, not, sql } from "drizzle-orm";

/**
 * Fixed implementation of the by-skill-job-title endpoint
 */
async function getSkillsByJobTitle(skillJobTitleId: number) {
  try {
    console.log(`Looking up skills for job title ID: ${skillJobTitleId}`);
    
    // Get skill job title to verify it exists
    const skillJobTitle = await db.query.skillJobTitles.findFirst({
      where: eq(skillJobTitles.id, skillJobTitleId),
    });

    if (!skillJobTitle) {
      console.log(`Skill job title with ID: ${skillJobTitleId} not found`);
      return null;
    }
    
    console.log(`Found skill job title: "${skillJobTitle.title}" (ID: ${skillJobTitleId})`);

    // Find all skills linked to this skill job title
    const skillMappings = await db.query.skillJobTitleSkills.findMany({
      where: eq(skillJobTitleSkills.skillJobTitleId, skillJobTitleId),
      with: {
        skill: true
      },
      orderBy: [desc(skillJobTitleSkills.isRecommended)]
    });

    // Extract skills with recommendation status
    const linkedSkills = skillMappings.map((mapping: any) => ({
      ...mapping.skill,
      isRecommended: mapping.isRecommended
    }));

    console.log(`Found ${linkedSkills.length} skills for skill job title ID ${skillJobTitleId}`);
    
    // If we don't have enough skills, add general skills
    if (linkedSkills.length < 10) {
      console.log(`Not enough skills for ${skillJobTitle.title}, adding generic skills`);
      
      // Get relevant categories
      const relevantCategoryIds = await getRelevantCategoriesForJobTitle(skillJobTitle);
      
      // Extract IDs of skills we already have
      const linkedSkillIds = linkedSkills.map(s => s.id);
      
      // Add additional skills using our fixed query
      const additionalSkills = await getAdditionalSkills(
        relevantCategoryIds, 
        linkedSkillIds,
        10 - linkedSkills.length
      );
      
      console.log(`Adding ${additionalSkills.length} additional generic skills`);
      
      // Add to our result
      linkedSkills.push(
        ...additionalSkills.map(skill => ({
          ...skill,
          isRecommended: false // Generic skills are not recommended
        }))
      );
    }
    
    return linkedSkills;
  } catch (error) {
    console.error("Error getting skills by job title:", error);
    return null;
  }
}

/**
 * Fixed implementation of getting category IDs for a job title
 */
async function getRelevantCategoriesForJobTitle(jobTitle: any): Promise<number[]> {
  // Default to these categories
  const defaultCategoryIds = [1, 2]; // Technical, soft skills
  
  try {
    console.log(`Finding relevant categories for job title: "${jobTitle.title}"`);
    
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
    
    // Find relevant category names
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
    relevantCategoryNames = Array.from(new Set(relevantCategoryNames));
    
    console.log(`Looking up categories matching: ${relevantCategoryNames.join(', ')}`);
    
    // Get all categories first
    const allCategories = await db.select().from(skillCategories);
    
    // Filter them in memory 
    const matchingCategories = allCategories.filter(category => {
      const categoryName = category.name.toLowerCase();
      return relevantCategoryNames.some(name => 
        categoryName.includes(name.toLowerCase())
      );
    });
    
    console.log(`Matched ${matchingCategories.length} categories`);
    
    // Extract category IDs
    const categoryIds = matchingCategories.map(c => c.id);
    
    // If no categories were found, return defaults
    return categoryIds.length > 0 ? categoryIds : defaultCategoryIds;
  } catch (error) {
    console.error("Error determining relevant categories:", error);
    return defaultCategoryIds;
  }
}

/**
 * Fixed implementation of the additional skills query
 */
async function getAdditionalSkills(
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
    
    // Execute and return
    const results = await query;
    console.log(`Found ${results.length} additional skills matching criteria`);
    return results;
  } catch (error) {
    console.error("Error fetching additional skills:", error);
    return [];
  }
}

// Export the fixed implementations for reference
export {
  getSkillsByJobTitle,
  getRelevantCategoriesForJobTitle,
  getAdditionalSkills
};