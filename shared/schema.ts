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
  thumbnailUrl: text("thumbnail_url"),
  isPopular: boolean("is_popular").default(false),
  isActive: boolean("is_active").default(true),
  primaryColor: text("primary_color").default("#5E17EB"),
  secondaryColor: text("secondary_color").default("#4A11C0"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const resumeTemplateVersions = pgTable("resume_template_versions", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => resumeTemplates.id).notNull(),
  versionNumber: integer("version_number").notNull(),
  svgContent: text("svg_content").notNull(),
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
});

export const resumeTemplateVersionSchema = createInsertSchema(resumeTemplateVersions, {
  svgContent: (schema) => schema.min(50, "SVG content must be valid"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type ResumeTemplate = typeof resumeTemplates.$inferSelect;
export type InsertResumeTemplate = z.infer<typeof resumeTemplateSchema>;

export type ResumeTemplateVersion = typeof resumeTemplateVersions.$inferSelect;
export type InsertResumeTemplateVersion = z.infer<typeof resumeTemplateVersionSchema>;
