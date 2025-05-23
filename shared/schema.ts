import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
  xpPoints: integer("xp_points").default(0),
  level: integer("level").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const resumeTemplates = pgTable("resume_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  svgContent: text("svg_content").notNull(),
  htmlContent: text("html_content"),  // HTML template content
  cssContent: text("css_content"),    // CSS for styling the HTML template
  jsContent: text("js_content"),      // Optional JavaScript for the template
  pdfContent: text("pdf_content"),    // Base64 encoded PDF content
  thumbnailUrl: text("thumbnail_url"),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  primaryColor: text("primary_color").default("#5E17EB"),
  secondaryColor: text("secondary_color").default("#4A11C0"),
  displayScale: text("display_scale").default("0.22"),  // Scale factor for template display
  width: integer("width").default(800),                 // Width in pixels
  height: integer("height").default(1100),              // Height in pixels
  aspectRatio: text("aspect_ratio").default("0.73"),    // Width/height ratio
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  reactFramerContent: text("react_framer_content"),
});

export const resumeTemplateVersions = pgTable("resume_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => resumeTemplates.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  svgContent: text("svg_content").notNull(),
  htmlContent: text("html_content"),  // HTML template content
  cssContent: text("css_content"),    // CSS for styling the HTML template
  jsContent: text("js_content"),      // Optional JavaScript for the template
  pdfContent: text("pdf_content"),    // PDF content for version history
  reactFramerContent: text("react_framer_content"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  changelog: text("changelog"),
});

// Template bindings table for storing placeholder mappings
export const templateBindings = pgTable("template_bindings", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => resumeTemplates.id).notNull(),
  placeholderToken: text("placeholder_token").notNull(),
  dataField: text("data_field").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const resumeTemplatesRelations = relations(resumeTemplates, ({ many }) => ({
  versions: many(resumeTemplateVersions),
  bindings: many(templateBindings),
}));

export const resumeTemplateVersionsRelations = relations(resumeTemplateVersions, ({ one }) => ({
  template: one(resumeTemplates, {
    fields: [resumeTemplateVersions.templateId],
    references: [resumeTemplates.id],
  }),
  createdBy: one(users, {
    fields: [resumeTemplateVersions.createdById],
    references: [users.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  isAdmin: true,
});

export const resumeTemplateSchema = createInsertSchema(resumeTemplates, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
  svgContent: (schema) => schema.min(50, "SVG content must be valid"),
  htmlContent: (schema) => schema.optional(),
  cssContent: (schema) => schema.optional(),
  jsContent: (schema) => schema.optional(),
  pdfContent: (schema) => schema.optional(),
  thumbnailUrl: (schema) => schema.optional(),
  displayScale: (schema) => schema.optional(),
  width: (schema) => schema.optional(),
  height: (schema) => schema.optional(),
  aspectRatio: (schema) => schema.optional(),
  reactFramerContent: (schema) => schema.optional(),
});

export const resumeTemplateVersionSchema = createInsertSchema(resumeTemplateVersions, {
  svgContent: (schema) => schema.min(50, "SVG content must be valid"),
  htmlContent: (schema) => schema.optional(),
  cssContent: (schema) => schema.optional(),
  jsContent: (schema) => schema.optional(),
  pdfContent: (schema) => schema.optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type InsertResumeTemplate = z.infer<typeof resumeTemplateSchema>;

export type ResumeTemplateVersion = typeof resumeTemplateVersions.$inferSelect;
export type InsertResumeTemplateVersion = z.infer<typeof resumeTemplateVersionSchema>;

// Template binding schema
export const templateBindingSchema = createInsertSchema(templateBindings, {
  placeholderToken: (schema) => schema.min(2, "Placeholder token must be at least 2 characters"),
  dataField: (schema) => schema.min(2, "Data field must be at least 2 characters"),
  description: (schema) => schema.optional(),
});

export type TemplateBinding = typeof templateBindings.$inferSelect;
export type InsertTemplateBinding = z.infer<typeof templateBindingSchema>;

// Job Titles and Descriptions Schema
export const jobTitles = pgTable("job_titles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().unique(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobDescriptions = pgTable("job_descriptions", {
  id: serial("id").primaryKey(),
  jobTitleId: integer("job_title_id").references(() => jobTitles.id).notNull(),
  content: text("content").notNull(),
  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const jobTitlesRelations = relations(jobTitles, ({ many }) => ({
  descriptions: many(jobDescriptions),
}));

export const jobDescriptionsRelations = relations(jobDescriptions, ({ one }) => ({
  jobTitle: one(jobTitles, {
    fields: [jobDescriptions.jobTitleId],
    references: [jobTitles.id],
  }),
}));

// Schemas for validation
export const jobTitleSchema = createInsertSchema(jobTitles, {
  title: (schema) => schema.min(2, "Title must be at least 2 characters"),
  category: (schema) => schema.min(2, "Category must be at least 2 characters"),
});

export const jobDescriptionSchema = createInsertSchema(jobDescriptions, {
  content: (schema) => schema.min(10, "Description must be at least 10 characters"),
});

export type JobTitle = typeof jobTitles.$inferSelect;
export type InsertJobTitle = z.infer<typeof jobTitleSchema>;

export type JobDescription = typeof jobDescriptions.$inferSelect;
export type InsertJobDescription = z.infer<typeof jobDescriptionSchema>;

// Education Categories and Examples Schema
export const educationCategories = pgTable("education_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  type: text("type").notNull(), // Like 'achievement', 'prize', 'coursework', etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const educationExamples = pgTable("education_examples", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => educationCategories.id).notNull(),
  content: text("content").notNull(),
  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const educationCategoriesRelations = relations(educationCategories, ({ many }) => ({
  examples: many(educationExamples),
}));

export const educationExamplesRelations = relations(educationExamples, ({ one }) => ({
  category: one(educationCategories, {
    fields: [educationExamples.categoryId],
    references: [educationCategories.id],
  }),
}));

// Schemas for validation
export const educationCategorySchema = createInsertSchema(educationCategories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  type: (schema) => schema.min(2, "Type must be at least 2 characters"),
});

export const educationExampleSchema = createInsertSchema(educationExamples, {
  content: (schema) => schema.min(3, "Example content must be at least 3 characters"),
});

export type EducationCategory = typeof educationCategories.$inferSelect;
export type InsertEducationCategory = z.infer<typeof educationCategorySchema>;

export type EducationExample = typeof educationExamples.$inferSelect;
export type InsertEducationExample = z.infer<typeof educationExampleSchema>;

// Skills Categories and Skills Schema
export const skillCategories = pgTable("skill_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  categoryId: integer("category_id").references(() => skillCategories.id).notNull(),
  description: text("description"),
  isRecommended: boolean("is_recommended").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Relations
export const skillCategoriesRelations = relations(skillCategories, ({ many }) => ({
  skills: many(skills),
}));

export const skillsRelations = relations(skills, ({ one }) => ({
  category: one(skillCategories, {
    fields: [skills.categoryId],
    references: [skillCategories.id],
  }),
}));

// Schemas for validation
export const skillCategorySchema = createInsertSchema(skillCategories, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: (schema) => schema.min(5, "Description must be at least 5 characters"),
});

export const skillSchema = createInsertSchema(skills, {
  name: (schema) => schema.min(2, "Name must be at least 2 characters"),
  description: (schema) => schema.optional(),
});

export type SkillCategory = typeof skillCategories.$inferSelect;
export type InsertSkillCategory = z.infer<typeof skillCategorySchema>;

export type Skill = typeof skills.$inferSelect;
export type InsertSkill = z.infer<typeof skillSchema>;

// Skill-specific job titles (separate from job descriptions titles)
export const skillJobTitles = pgTable("skill_job_titles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const skillJobTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable(),
});

export type SkillJobTitle = typeof skillJobTitles.$inferSelect;
export type InsertSkillJobTitle = z.infer<typeof skillJobTitleSchema>;

// Job Title - Skills mapping (many-to-many relationship)
export const jobTitleSkills = pgTable("job_title_skills", {
  id: serial("id").primaryKey(),
  jobTitleId: integer("job_title_id").notNull().references(() => jobTitles.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  isRecommended: boolean("is_recommended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Skill Job Title - Skills mapping (many-to-many relationship)
export const skillJobTitleSkills = pgTable("skill_job_title_skills", {
  id: serial("id").primaryKey(),
  skillJobTitleId: integer("skill_job_title_id").notNull().references(() => skillJobTitles.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  isRecommended: boolean("is_recommended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Professional Summary tables
export const professionalSummaryTitles = pgTable("professional_summary_titles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const professionalSummaryTitleSchema = z.object({
  title: z.string().min(1, "Title is required"),
  category: z.string().min(1, "Category is required"),
  description: z.string().nullable(),
});

export type ProfessionalSummaryTitle = typeof professionalSummaryTitles.$inferSelect;
export type InsertProfessionalSummaryTitle = z.infer<typeof professionalSummaryTitleSchema>;

export const professionalSummaryDescriptions = pgTable("professional_summary_descriptions", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isRecommended: boolean("is_recommended").default(false),
  professionalSummaryTitleId: integer("professional_summary_title_id").notNull().references(() => professionalSummaryTitles.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const professionalSummaryDescriptionSchema = z.object({
  content: z.string().min(1, "Content is required"),
  isRecommended: z.boolean().optional(),
  professionalSummaryTitleId: z.number(),
});

export type ProfessionalSummaryDescription = typeof professionalSummaryDescriptions.$inferSelect;
export type InsertProfessionalSummaryDescription = z.infer<typeof professionalSummaryDescriptionSchema>;

// Professional Summary Relations
export const professionalSummaryTitlesRelations = relations(professionalSummaryTitles, ({ many }) => ({
  descriptions: many(professionalSummaryDescriptions),
}));

export const professionalSummaryDescriptionsRelations = relations(professionalSummaryDescriptions, ({ one }) => ({
  title: one(professionalSummaryTitles, {
    fields: [professionalSummaryDescriptions.professionalSummaryTitleId],
    references: [professionalSummaryTitles.id],
  }),
}));

// Define additional relations
export const jobTitlesSkillsRelations = relations(jobTitles, ({ many }) => ({
  jobTitleSkills: many(jobTitleSkills),
}));

export const skillsJobTitlesRelations = relations(skills, ({ many }) => ({
  jobTitleSkills: many(jobTitleSkills),
  skillJobTitleSkills: many(skillJobTitleSkills),
}));

export const skillJobTitlesRelations = relations(skillJobTitles, ({ many }) => ({
  skillJobTitleSkills: many(skillJobTitleSkills),
}));

export const jobTitleSkillsRelations = relations(jobTitleSkills, ({ one }) => ({
  jobTitle: one(jobTitles, {
    fields: [jobTitleSkills.jobTitleId],
    references: [jobTitles.id],
  }),
  skill: one(skills, {
    fields: [jobTitleSkills.skillId],
    references: [skills.id],
  }),
}));

export const skillJobTitleSkillsRelations = relations(skillJobTitleSkills, ({ one }) => ({
  skillJobTitle: one(skillJobTitles, {
    fields: [skillJobTitleSkills.skillJobTitleId],
    references: [skillJobTitles.id],
  }),
  skill: one(skills, {
    fields: [skillJobTitleSkills.skillId],
    references: [skills.id],
  }),
}));

// Achievements system tables
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  xpPoints: integer("xp_points").notNull(),
  type: text("type").notNull(), // 'section_completion', 'milestone', 'quality', etc.
  triggerCondition: jsonb("trigger_condition").notNull(), // JSON with conditions to trigger the achievement
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  achievementId: integer("achievement_id").references(() => achievements.id).notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  sectionKey: text("section_key").notNull(), // 'personal_info', 'work_history', 'education', etc.
  status: text("status").notNull(), // 'not_started', 'in_progress', 'completed'
  progress: integer("progress").default(0).notNull(), // percentage of completion (0-100)
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Add relation definitions for achievement tables
export const usersAchievementsRelations = relations(users, ({ many }) => ({
  achievements: many(userAchievements),
  progress: many(userProgress)
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements)
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, {
    fields: [userAchievements.userId],
    references: [users.id]
  }),
  achievement: one(achievements, {
    fields: [userAchievements.achievementId],
    references: [achievements.id]
  })
}));

export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id]
  })
}));

// Schema definitions for achievements tables
export const achievementSchema = createInsertSchema(achievements, {
  name: (schema) => schema.min(3, "Name must be at least 3 characters"),
  description: (schema) => schema.min(10, "Description must be at least 10 characters"),
  xpPoints: (schema) => schema.min(1, "XP points must be at least 1")
});

export const userAchievementSchema = createInsertSchema(userAchievements);
export const userProgressSchema = createInsertSchema(userProgress);

// Type definitions
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof achievementSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof userAchievementSchema>;

export type UserProgress = typeof userProgress.$inferSelect;
export type InsertUserProgress = z.infer<typeof userProgressSchema>;
