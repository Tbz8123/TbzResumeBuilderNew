import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import templateRoutes from "./routes/templates";
import exportRoutes from "./routes/export";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register API routes
  app.use("/api/templates", templateRoutes);
  app.use("/api/export", exportRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
