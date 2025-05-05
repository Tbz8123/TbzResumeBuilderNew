import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import templateRoutes from "./routes/templates";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Register API routes
  app.use("/api/templates", templateRoutes);

  const httpServer = createServer(app);

  return httpServer;
}
