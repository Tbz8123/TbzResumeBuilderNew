import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import templateRoutes from "./routes/templates";
import exportRoutes from "./routes/export";
import { triggerThumbnailRouter } from "./routes/triggerThumbnailUpdate";
import { jobsRouter } from "./routes/jobs";
import { jobCsvRouter } from "./routes/job-csv";
import { educationRouter } from "./routes/education";
import { skillsRouter } from "./routes/skills";
import { professionalSummaryRouter } from "./routes/professional-summary";
import { professionalSummaryImportRouter } from "./routes/professional-summary-import";
import templateBindingsRouter from "./routes/template-bindings";
import resumeSchemaRouter from "./routes/resume-schema";
import { registerAchievementRoutes } from "./routes/achievements";
import { setupTemplateTokensRoutes } from "./routes/template-tokens";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register API routes
  app.use("/api/templates", templateRoutes);
  app.use("/api", templateBindingsRouter);
  app.use("/api", resumeSchemaRouter);
  app.use("/api/export", exportRoutes);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/jobs", jobCsvRouter);
  app.use("/api/education", educationRouter);
  app.use("/api/skills", skillsRouter);
  app.use("/api/professional-summary", professionalSummaryRouter);
  app.use("/api/professional-summary", professionalSummaryImportRouter);
  
  // Register template token extraction route
  setupTemplateTokensRoutes(app);
  
  // Register achievement routes
  registerAchievementRoutes(app);
  
  // Register development/test routes
  app.use("/api/triggers", triggerThumbnailRouter);

  const httpServer = createServer(app);

  return httpServer;
}
