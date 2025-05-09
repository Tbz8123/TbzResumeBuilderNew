import { Router } from "express";
import { db } from "@db";
import { isAdmin } from "../auth";
import { jobTitles, jobDescriptions } from "@shared/schema";
import { eq, asc, sql } from "drizzle-orm";
import { createObjectCsvStringifier } from "csv-writer";
import multer from "multer";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { EventEmitter } from "events";
import path from "path";
import { unlink } from "fs/promises";

export const jobCsvRouter = Router();

// Create temp directory if it doesn't exist
import fs from 'fs';
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
  console.log("Created temp directory for file uploads");
}

// Setup file upload middleware for CSV imports
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure temp directory exists
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp', { recursive: true });
    }
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'job-data-' + uniqueSuffix + '.csv');
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create a central event emitter for tracking import status
const importStatusEmitter = new EventEmitter();
let importStatus = {
  processed: 0,
  created: 0,
  updated: 0,
  errors: [] as Array<{ row: number; message: string }>,
  isComplete: false
};

// Function to download all job data as a CSV
jobCsvRouter.get("/export-csv", isAdmin, async (req, res) => {
  try {
    console.log("Exporting all job data as CSV");
    
    // Get all job titles
    const allTitles = await db.query.jobTitles.findMany({
      with: {
        descriptions: true
      },
      orderBy: asc(jobTitles.title)
    });
    
    // Create the CSV structure
    const csvStringifier = createObjectCsvStringifier({
      header: [
        { id: 'JobTitleID', title: 'JobTitleID' },
        { id: 'JobTitle', title: 'JobTitle' },
        { id: 'Category', title: 'Category' },
        { id: 'Description', title: 'Description' },
        { id: 'IsRecommended', title: 'IsRecommended' }
      ]
    });
    
    // Prepare the data - flatten job titles and their descriptions
    const records: any[] = [];
    allTitles.forEach(title => {
      if (title.descriptions.length === 0) {
        // Include job titles with no descriptions
        records.push({
          JobTitleID: title.id,
          JobTitle: title.title,
          Category: title.category,
          Description: '',
          IsRecommended: false
        });
      } else {
        // Include all descriptions for each job title
        title.descriptions.forEach(desc => {
          records.push({
            JobTitleID: title.id,
            JobTitle: title.title,
            Category: title.category,
            Description: desc.content,
            IsRecommended: desc.isRecommended ? "true" : "false"
          });
        });
      }
    });
    
    // Generate the CSV content
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=job_data_export.csv');
    
    console.log(`Exporting ${records.length} job data records`);
    
    // Send the CSV
    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting job data to CSV:", error);
    return res.status(500).json({ error: "Failed to export job data" });
  }
});

// SSE endpoint for import status updates
jobCsvRouter.get("/import-csv-status", isAdmin, (req, res) => {
  // Setup SSE connection
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send current status immediately
  res.write(`data: ${JSON.stringify(importStatus)}\n\n`);
  
  // Listen for status updates
  const sendStatus = (status: typeof importStatus) => {
    res.write(`data: ${JSON.stringify(status)}\n\n`);
    
    // If complete, end the connection
    if (status.isComplete) {
      res.end();
    }
  };
  
  importStatusEmitter.on('update', sendStatus);
  
  // Clean up when the connection closes
  req.on('close', () => {
    importStatusEmitter.removeListener('update', sendStatus);
  });
});

// Import job data from CSV
jobCsvRouter.post("/import-csv", isAdmin, upload.single('file'), async (req, res) => {
  console.log("CSV import request received:", req.headers);
  console.log("Request file:", req.file);
  console.log("Request body:", req.body);
  
  if (!req.file) {
    console.error("No file was uploaded");
    return res.status(400).json({ error: "No CSV file uploaded" });
  }
  
  // Reset import status
  importStatus = {
    processed: 0,
    created: 0,
    updated: 0,
    errors: [],
    isComplete: false
  };
  
  // Emit the initial status
  importStatusEmitter.emit('update', importStatus);
  
  // Return success immediately - processing will happen in background
  res.status(200).json({ message: "Import started" });
  
  try {
    // Set up CSV parsing and processing
    const filePath = req.file.path;
    const fileStream = createReadStream(filePath);
    const parser = fileStream.pipe(parse({
      columns: true,
      skipEmptyLines: true,
      trim: true
    }));
    
    // Removed global map since we're using local map in processBatch function
    const batchSize = 500; // Process in batches
    let batch = [];
    let rowNumber = 0;
    
    // Process the file in streaming mode
    for await (const row of parser) {
      rowNumber++;
      
      try {
        // Validate required columns
        if (!row.JobTitleID && !row.JobTitle) {
          importStatus.errors.push({
            row: rowNumber,
            message: "Missing required JobTitleID or JobTitle"
          });
          continue;
        }
        
        if (!row.Description) {
          importStatus.errors.push({
            row: rowNumber,
            message: "Missing required Description"
          });
          continue;
        }
        
        // Add to batch for processing
        batch.push({
          titleId: row.JobTitleID ? parseInt(row.JobTitleID) : null,
          title: row.JobTitle,
          category: row.Category || "",
          description: row.Description,
          isRecommended: row.IsRecommended === "true" || row.IsRecommended === "1" || row.IsRecommended === true
        });
        
        // Process batch if it reaches the threshold
        if (batch.length >= batchSize) {
          await processBatch(batch);
          batch = [];
          
          // Send status update
          importStatusEmitter.emit('update', importStatus);
        }
      } catch (error: any) {
        console.error(`Error processing row ${rowNumber}:`, error);
        importStatus.errors.push({
          row: rowNumber,
          message: error.message || "Unknown error"
        });
      }
    }
    
    // Process any remaining items
    if (batch.length > 0) {
      await processBatch(batch);
    }
    
    // Clean up the temp file
    await unlink(filePath);
    
    // Mark import as complete
    importStatus.isComplete = true;
    importStatusEmitter.emit('update', importStatus);
    
    console.log(`Import completed: ${importStatus.processed} processed, ${importStatus.created} created, ${importStatus.updated} updated, ${importStatus.errors.length} errors`);
  } catch (error: any) {
    console.error("Error processing CSV import:", error);
    
    // Update status with error
    importStatus.errors.push({
      row: 0,
      message: `System error: ${error.message || "Unknown error"}`
    });
    importStatus.isComplete = true;
    importStatusEmitter.emit('update', importStatus);
    
    // Try to clean up temp file if it exists
    try {
      if (req.file && req.file.path) {
        await unlink(req.file.path);
      }
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }
  }
  
  // Helper function to process batches of CSV data
  async function processBatch(items: any[]) {
    // The titleDescriptionMap needs to be accessible to this function
    const titleDescriptionMapLocal: Map<number, Set<string>> = new Map();
    
    for (const item of items) {
      importStatus.processed++;
      
      try {
        // Find or create job title
        let jobTitleId = item.titleId;
        
        if (!jobTitleId) {
          // Try to find existing title by name
          const existingTitle = await db.query.jobTitles.findFirst({
            where: sql`LOWER(${jobTitles.title}) = LOWER(${item.title})`
          });
          
          if (existingTitle) {
            jobTitleId = existingTitle.id;
            
            // Update category if provided and different
            if (item.category && existingTitle.category !== item.category) {
              await db.update(jobTitles)
                .set({ category: item.category })
                .where(eq(jobTitles.id, jobTitleId));
                
              importStatus.updated++;
            }
          } else {
            // Create new job title
            const newTitle = await db.insert(jobTitles)
              .values({ title: item.title, category: item.category })
              .returning();
            
            jobTitleId = newTitle[0].id;
            importStatus.created++;
          }
        }
        
        // Check description uniqueness for this job title
        if (!titleDescriptionMapLocal.has(jobTitleId)) {
          // Fetch existing descriptions for this title
          const existingDescriptions = await db.query.jobDescriptions.findMany({
            where: eq(jobDescriptions.jobTitleId, jobTitleId)
          });
          
          // Store lowercase content for duplicate checking
          titleDescriptionMapLocal.set(
            jobTitleId, 
            new Set(existingDescriptions.map(d => d.content.toLowerCase()))
          );
        }
        
        const descriptionSet = titleDescriptionMapLocal.get(jobTitleId);
        if (!descriptionSet) continue; // Satisfy TypeScript
        
        const normalizedDescription = item.description.toLowerCase();
        
        // Skip if this description already exists for this job title
        if (descriptionSet.has(normalizedDescription)) {
          continue;
        }
        
        // Add the description
        await db.insert(jobDescriptions)
          .values({
            content: item.description,
            jobTitleId: jobTitleId,
            isRecommended: item.isRecommended
          })
          .returning();
        
        // Add to the set to prevent duplicates in further rows
        descriptionSet.add(normalizedDescription);
        importStatus.created++;
        
        // Check if we're exceeding the max descriptions per title (100)
        if (descriptionSet.size > 100) {
          importStatus.errors.push({
            row: importStatus.processed,
            message: `Job title ID ${jobTitleId} has exceeded 100 descriptions (warning only, import continues)`
          });
        }
      } catch (error: any) {
        console.error(`Error processing item ${importStatus.processed}:`, error);
        importStatus.errors.push({
          row: importStatus.processed,
          message: error.message || "Unknown error"
        });
      }
    }
  }
});