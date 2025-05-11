import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isAdmin: boolean("is_admin").default(false),
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdById: integer("created_by_id").references(() => users.id),
  changelog: text("changelog"),
});

// Relations
export const resumeTemplatesRelations = relations(resumeTemplates, ({ many }) => ({
  versions: many(resumeTemplateVersions),
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

// Job Title - Skills mapping (many-to-many relationship)
export const jobTitleSkills = pgTable("job_title_skills", {
  id: serial("id").primaryKey(),
  jobTitleId: integer("job_title_id").notNull().references(() => jobTitles.id),
  skillId: integer("skill_id").notNull().references(() => skills.id),
  isRecommended: boolean("is_recommended").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define additional relations
export const jobTitlesSkillsRelations = relations(jobTitles, ({ many }) => ({
  jobTitleSkills: many(jobTitleSkills),
}));

export const skillsJobTitlesRelations = relations(skills, ({ many }) => ({
  jobTitleSkills: many(jobTitleSkills),
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
