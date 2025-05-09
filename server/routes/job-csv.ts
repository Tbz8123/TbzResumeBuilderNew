import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { jobTitles, jobDescriptions } from "@shared/schema";
import { eq, asc, sql, inArray } from "drizzle-orm";
import { createObjectCsvStringifier, createObjectCsvWriter } from "csv-writer";
import multer from "multer";
import { createReadStream } from "fs";
import { parse } from "csv-parse";
import { EventEmitter } from "events";
import path from "path";
import { unlink } from "fs/promises";
import * as XLSX from 'xlsx';
import * as fs from 'fs';

export const jobCsvRouter = Router();

// Create temp directory if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
  console.log("Created temp directory for file uploads");
}

// Setup file upload middleware with expanded file type support
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure temp directory exists
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp', { recursive: true });
    }
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    // Use original file extension
    const ext = path.extname(file.originalname).toLowerCase() || '.csv';
    cb(null, `job-data-${timestamp}-${randomNum}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Get the file extension
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Accept CSV, Excel, and JSON files
    if (ext === '.csv' || file.mimetype === 'text/csv' || 
        ext === '.xlsx' || ext === '.xls' || 
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
        file.mimetype === 'application/vnd.ms-excel' ||
        ext === '.json' || file.mimetype === 'application/json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// Create a central event emitter for tracking import status
const importStatusEmitter = new EventEmitter();
let importStatus = {
  processed: 0,
  created: 0,
  updated: 0,
  deleted: 0,
  errors: [] as Array<{ row: number; message: string }>,
  isComplete: false,
  syncMode: 'update-only' as string
};

// Function to generate data for exports
async function generateExportData() {
  // Get all job titles
  const allTitles = await db.query.jobTitles.findMany({
    with: {
      descriptions: true
    },
    orderBy: asc(jobTitles.title)
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
  
  return records;
}

// Function to download all job data as a CSV
jobCsvRouter.get("/export-csv", isAdmin, async (req, res) => {
  try {
    console.log("Exporting all job data as CSV");
    
    const records = await generateExportData();
    
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
    
    // Generate the CSV content
    const csvContent = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=job_data_export.csv');
    
    console.log(`Exporting ${records.length} job data records as CSV`);
    
    // Send the CSV
    return res.send(csvContent);
  } catch (error) {
    console.error("Error exporting job data to CSV:", error);
    return res.status(500).json({ error: "Failed to export job data" });
  }
});

// Function to download all job data as Excel
jobCsvRouter.get("/export-excel", isAdmin, async (req, res) => {
  try {
    console.log("Exporting all job data as Excel");
    
    const records = await generateExportData();
    
    // Create a new workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(records);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Job Data");
    
    // Create a buffer with the Excel data
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set headers for Excel download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=job_data_export.xlsx');
    res.setHeader('Content-Length', excelBuffer.length);
    
    console.log(`Exporting ${records.length} job data records as Excel`);
    
    // Send the Excel file
    return res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting job data to Excel:", error);
    return res.status(500).json({ error: "Failed to export job data" });
  }
});

// Function to download all job data as JSON
jobCsvRouter.get("/export-json", isAdmin, async (req, res) => {
  try {
    console.log("Exporting all job data as JSON");
    
    const records = await generateExportData();
    
    // Set headers for JSON download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=job_data_export.json');
    
    console.log(`Exporting ${records.length} job data records as JSON`);
    
    // Send the JSON
    return res.json(records);
  } catch (error) {
    console.error("Error exporting job data to JSON:", error);
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

// Import job data from multiple formats (CSV, Excel, JSON)
jobCsvRouter.post("/import-csv", isAdmin, upload.single('file'), async (req, res) => {
  console.log("Import request received:", req.headers);
  console.log("Request file:", req.file);
  console.log("Request body:", req.body);
  
  if (!req.file) {
    console.error("No file was uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }
  
  // Check if sync mode is specified (defaults to update-only)
  const syncMode = req.body.syncMode || 'update-only';
  console.log(`Import sync mode: ${syncMode}`);
  
  // Reset import status
  importStatus = {
    processed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
    isComplete: false,
    syncMode: syncMode
  };
  
  // Emit the initial status
  importStatusEmitter.emit('update', importStatus);
  
  // Return success immediately - processing will happen in background
  res.status(200).json({ message: "Import started" });
  
  try {
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let rows: any[] = [];
    
    console.log(`Processing ${fileExt} file: ${req.file.originalname}`);
    
    // Parse the file based on its extension
    if (fileExt === '.json') {
      // Process JSON file
      try {
        const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        if (Array.isArray(jsonData)) {
          rows = jsonData;
        } else {
          importStatus.errors.push({
            row: 0,
            message: "JSON data must be an array of job data objects"
          });
        }
      } catch (jsonError: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse JSON file: ${jsonError.message}`
        });
      }
    } else if (fileExt === '.xlsx' || fileExt === '.xls') {
      // Process Excel file
      try {
        console.log(`Reading Excel file: ${filePath}`);
        const workbook = XLSX.readFile(filePath);
        
        if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error('Excel file has no sheets');
        }
        
        const sheetName = workbook.SheetNames[0]; // Get the first sheet
        console.log(`Using first sheet: ${sheetName}`);
        
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) {
          throw new Error(`Could not access sheet "${sheetName}"`);
        }
        
        // Check if worksheet has data
        if (!worksheet['!ref']) {
          throw new Error('Excel sheet is empty');
        }
        
        // Convert to JSON with headers and more debug info
        console.log(`Converting Excel data to JSON format`);
        rows = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",
          raw: false, // Convert all data to strings
          blankrows: false // Skip blank rows
        });
        
        console.log(`Successfully parsed ${rows.length} rows from Excel`);
        
        // Validate required columns
        if (rows.length > 0) {
          const firstRow = rows[0];
          const requiredColumns = ['JobTitle', 'Description'];
          const foundColumns = Object.keys(firstRow).map(k => k.toLowerCase());
          
          const missingColumns = requiredColumns.filter(col => 
            !foundColumns.some(f => f.toLowerCase() === col.toLowerCase() || 
                                 f.toLowerCase().includes(col.toLowerCase().replace(/\s+/g, ''))));
          
          if (missingColumns.length > 0) {
            throw new Error(`Required columns missing: ${missingColumns.join(', ')}. Please ensure your Excel file has the following headers: JobTitleID or JobTitle, and Description.`);
          }
        }
      } catch (excelError: any) {
        console.error("Excel parsing error:", excelError);
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse Excel file: ${excelError.message}`
        });
      }
    } else {
      // Default to CSV processing
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        rows = await new Promise((resolve, reject) => {
          parse(fileContent, {
            columns: true,
            skipEmptyLines: true,
            trim: true
          }, (err, output) => {
            if (err) reject(err);
            else resolve(output);
          });
        });
      } catch (csvError: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse CSV file: ${csvError.message}`
        });
      }
    }
    
    // Process the parsed data in batches
    if (rows.length > 0) {
      const batchSize = 500;
      let batch = [];
      let rowNumber = 0;
      
      for (const row of rows) {
        rowNumber++;
        
        try {
          // Normalize field names - handle case sensitivity and different naming conventions
          const normalizedRow = {
            JobTitleID: row.JobTitleID || row.jobTitleID || row.jobtitleid || row['Job Title ID'] || row['job_title_id'] || null,
            JobTitle: row.JobTitle || row.jobTitle || row.jobtitle || row['Job Title'] || row['job_title'] || '',
            Category: row.Category || row.category || row['Job Category'] || row['job_category'] || '',
            Description: row.Description || row.description || row['Job Description'] || row['job_description'] || '',
            IsRecommended: row.IsRecommended || row.isRecommended || row.isrecommended || row['Is Recommended'] || row['is_recommended'] || false
          };
          
          // Validate required fields
          if (!normalizedRow.JobTitleID && !normalizedRow.JobTitle) {
            importStatus.errors.push({
              row: rowNumber,
              message: "Missing required JobTitleID or JobTitle"
            });
            continue;
          }
          
          if (!normalizedRow.Description) {
            importStatus.errors.push({
              row: rowNumber,
              message: "Missing required Description"
            });
            continue;
          }
          
          // Add to batch for processing
          batch.push({
            titleId: normalizedRow.JobTitleID ? parseInt(normalizedRow.JobTitleID.toString()) : null,
            title: normalizedRow.JobTitle,
            category: normalizedRow.Category || "",
            description: normalizedRow.Description,
            isRecommended: normalizedRow.IsRecommended === true || 
                          normalizedRow.IsRecommended === "true" || 
                          normalizedRow.IsRecommended === "1" || 
                          normalizedRow.IsRecommended === 1
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
    }
    
    // Clean up the temp file
    await unlink(filePath);
    
    // Mark import as complete
    importStatus.isComplete = true;
    importStatusEmitter.emit('update', importStatus);
    
    console.log(`Import completed: ${importStatus.processed} processed, ${importStatus.created} created, ${importStatus.updated} updated, ${importStatus.errors.length} errors`);
  } catch (error: any) {
    console.error("Error processing file import:", error);
    
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
    
    // Track job titles and descriptions in import file for potential deletion
    const importedTitleIds = new Set<number>();
    const importedDescriptionHashes = new Map<number, Set<string>>();
    
    // First, collect all job title IDs that need to be created
    const missingJobTitleIds = new Set<number>();
    
    // First pass - collect all job title IDs from the CSV that need verification
    for (const item of items) {
      if (item.titleId && !isNaN(parseInt(item.titleId))) {
        missingJobTitleIds.add(parseInt(item.titleId));
      }
    }
    
    // Pre-check all job title IDs and create any missing ones
    if (missingJobTitleIds.size > 0) {
      console.log(`Pre-checking ${missingJobTitleIds.size} job title IDs from CSV...`);
      
      // Get all existing title IDs
      const existingTitles = await db.query.jobTitles.findMany({
        where: sql`${jobTitles.id} IN (${Array.from(missingJobTitleIds).join(',')})`
      });
      
      // Create a set of existing IDs for faster lookup
      const existingTitleIds = new Set(existingTitles.map(t => t.id));
      
      // Find IDs that don't exist and need to be created
      const titlesToCreate = Array.from(missingJobTitleIds).filter(id => !existingTitleIds.has(id));
      
      if (titlesToCreate.length > 0) {
        console.log(`Found ${titlesToCreate.length} missing job title IDs: ${titlesToCreate.join(', ')}`);
        
        // Create placeholder job titles for missing IDs
        for (const id of titlesToCreate) {
          try {
            // Find the first item in the batch with this job title ID to get the title text
            const matchingItem = items.find(item => parseInt(item.titleId) === id);
            const titleText = matchingItem && matchingItem.title ? matchingItem.title : `Imported Title ${id}`;
            const category = matchingItem && matchingItem.category ? matchingItem.category : 'General';
            
            console.log(`Creating placeholder job title with ID ${id}: "${titleText}"`);
            
            // Use SQL to insert with a specific ID
            // Execute raw SQL query using db.execute
            await db.execute(sql`
              INSERT INTO job_titles (id, title, category) 
              VALUES (${id}, ${titleText}, ${category})
              ON CONFLICT (id) DO NOTHING
            `);
            
            importStatus.created++;
            console.log(`Successfully created placeholder job title with ID ${id}`);
          } catch (error: any) {
            console.error(`Error creating placeholder job title with ID ${id}:`, error);
            importStatus.errors.push({
              row: 0,
              message: `Failed to create placeholder job title with ID ${id}: ${error.message || "Unknown error"}`
            });
          }
        }
      }
    }
    
    // Now process the individual items in the batch
    for (const item of items) {
      importStatus.processed++;
      
      try {
        // Find or create job title
        let jobTitleId = item.titleId ? parseInt(item.titleId) : null;
        
        if (!jobTitleId) {
          // Try to find existing title by name
          const existingTitle = await db.query.jobTitles.findFirst({
            where: sql`LOWER(${jobTitles.title}) = LOWER(${item.title})`
          });
          
          if (existingTitle) {
            jobTitleId = existingTitle.id;
            console.log(`Found existing job title: "${existingTitle.title}" (ID: ${existingTitle.id})`);
            
            // Update category if provided and different
            if (item.category && existingTitle.category !== item.category) {
              await db.update(jobTitles)
                .set({ category: item.category })
                .where(eq(jobTitles.id, jobTitleId));
                
              importStatus.updated++;
              console.log(`Updated category for job title "${existingTitle.title}" to: ${item.category}`);
            }
          } else {
            // Create new job title - use the exact title as in the CSV
            console.log(`Creating new job title: "${item.title}" with category: ${item.category}`);
            const insertResult = await db.insert(jobTitles)
              .values({ 
                title: item.title, 
                category: item.category || 'General' 
              })
              .returning();
            
            if (insertResult && insertResult.length > 0) {
              jobTitleId = insertResult[0].id;
              console.log(`Successfully created job title "${item.title}" with ID: ${jobTitleId}`);
              importStatus.created++;
            } else {
              throw new Error(`Failed to create job title: ${item.title}`);
            }
          }
        } else {
          // Double-check that job title ID exists
          const existingTitle = await db.query.jobTitles.findFirst({
            where: eq(jobTitles.id, jobTitleId)
          });
          
          if (!existingTitle) {
            // This shouldn't happen due to our pre-check, but just in case:
            console.warn(`Job title ID ${jobTitleId} not found, creating placeholder...`);
            
            // Create placeholder job title
            const titleText = item.title || `Imported Title ${jobTitleId}`;
            const category = item.category || 'General';
            
            // Execute raw SQL query using db.execute
            await db.execute(sql`
              INSERT INTO job_titles (id, title, category) 
              VALUES (${jobTitleId}, ${titleText}, ${category})
              ON CONFLICT (id) DO NOTHING
            `);
            
            importStatus.created++;
            console.log(`Created placeholder job title with ID ${jobTitleId}`);
          }
        }
        
        // Skip if we don't have a description to add
        if (!item.description) {
          console.log(`Skipping item ${importStatus.processed} - no description provided`);
          continue;
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
          console.log(`Skipping duplicate description for job title ID ${jobTitleId}`);
          continue;
        }
        
        // Add the description
        try {
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
        } catch (error: any) {
          // Handle specific FK violation errors
          if (error.code === '23503' && error.constraint === 'job_descriptions_job_title_id_fkey') {
            console.error(`Foreign key error for job title ID ${jobTitleId} - job title does not exist`);
            importStatus.errors.push({
              row: importStatus.processed,
              message: `Job title ID ${jobTitleId} does not exist in the database - try importing the job title first`
            });
          } else {
            // Re-throw other errors to be caught by the outer catch
            throw error;
          }
        }
        
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