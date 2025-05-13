import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { professionalSummaryTitles, professionalSummaryDescriptions, professionalSummaryDescriptionSchema } from "@shared/schema";
import { eq, inArray } from "drizzle-orm";
import * as XLSX from 'xlsx';
import multer from "multer";
import { parse } from "csv-parse";
import path from "path";
import * as fs from 'fs';
import { unlink } from "fs/promises";

export const professionalSummaryImportRouter = Router();

// Create temp directory if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
  console.log("Created temp directory for file uploads");
}

// Setup file upload middleware
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase() || '.csv';
    cb(null, `professional-summary-${timestamp}-${randomNum}${ext}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept CSV, Excel, and JSON files
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || file.mimetype === 'text/csv' || 
        ext === '.xlsx' || ext === '.xls' || 
        ext === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  }
});

// Store the last import status for polling
let lastImportStatus: any = null;

// Endpoint to check import status
professionalSummaryImportRouter.get("/import-status", isAuthenticated, isAdmin, (req, res) => {
  res.json(lastImportStatus || { isComplete: true, processed: 0, errors: [] });
});

// Import professional summaries from various formats
professionalSummaryImportRouter.post("/import", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Determine sync mode
    const syncMode = req.query.mode === 'full-sync' ? 'full-sync' : 'update-only';
    console.log(`Processing ${req.file.originalname} in ${syncMode} mode`);
    
    // Initialize import status
    const importStatus = {
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as {row: number, message: string}[],
      isComplete: false,
      syncMode
    };
    
    // Store the initial status
    lastImportStatus = importStatus;
    
    // Return success immediately - processing will continue in background
    res.status(200).json({ message: "Import started" });
    
    const filePath = req.file.path;
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    let rows: any[] = [];
    
    // Parse file based on extension
    if (fileExt === '.json') {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(fileContent);
        if (Array.isArray(jsonData)) {
          rows = jsonData;
        } else {
          importStatus.errors.push({
            row: 0,
            message: "JSON must contain an array of data rows"
          });
        }
      } catch (error: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse JSON: ${error.message}`
        });
      }
    } 
    else if (fileExt === '.xlsx' || fileExt === '.xls') {
      try {
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert Excel to JSON with column headers
        rows = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false
        });
        
        console.log(`Excel file parsed, found ${rows.length} rows`);
        
        if (rows.length > 0) {
          console.log("First row fields:", Object.keys(rows[0]));
        }
      } catch (error: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse Excel file: ${error.message}`
        });
      }
    }
    else {
      // Process CSV
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        rows = await new Promise((resolve, reject) => {
          parse(fileContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true
          }, (error, output) => {
            if (error) reject(error);
            else resolve(output);
          });
        });
        
        console.log(`CSV file parsed, found ${rows.length} rows`);
      } catch (error: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse CSV: ${error.message}`
        });
      }
    }
    
    // Clean up temp file
    try {
      await unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete temp file: ${filePath}`, error);
    }
    
    // Process the parsed data
    if (rows.length > 0) {
      try {
        // Fetch existing titles for reference
        const existingTitles = await db.select().from(professionalSummaryTitles);
        const titleMap = new Map(existingTitles.map(t => [t.title.toLowerCase(), t]));
        const titleIdMap = new Map(existingTitles.map(t => [t.id, t]));
        
        console.log(`Found ${existingTitles.length} existing titles`);
        
        // Track processed IDs for deletion in full-sync mode
        const processedTitleIds = new Set<number>();
        const processedDescriptionIds = new Set<number>();
        
        // Get existing descriptions if in full-sync mode
        let existingDescriptions: any[] = [];
        if (syncMode === 'full-sync') {
          existingDescriptions = await db.select().from(professionalSummaryDescriptions);
          console.log(`Found ${existingDescriptions.length} existing descriptions`);
        }
        
        // Process each row
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowIdx = i + 1; // 1-based for error messages
          importStatus.processed++;
          
          try {
            // Extract fields from row
            const data = {
              jobTitleId: extractValue(row, ['JobTitleID', 'jobtitleid', 'id', 'A']),
              jobTitle: extractValue(row, ['JobTitle', 'jobtitle', 'title', 'B']),
              category: extractValue(row, ['Category', 'category', 'C']) || 'General',
              description: extractValue(row, ['Description', 'description', 'Professional Summary Description', 'summary', 'D']),
              isRecommended: toBool(extractValue(row, ['IsRecommended', 'isrecommended', 'recommended', 'E']))
            };
            
            // Validate required fields
            if (!data.jobTitleId && !data.jobTitle) {
              importStatus.errors.push({
                row: rowIdx,
                message: "Missing required JobTitleID or JobTitle"
              });
              continue;
            }
            
            if (!data.description) {
              importStatus.errors.push({
                row: rowIdx,
                message: "Missing required Description"
              });
              continue;
            }
            
            // Process the title (find or create)
            let titleId: number;
            
            if (data.jobTitleId) {
              // Try to find title by ID
              const id = Number(data.jobTitleId);
              if (isNaN(id)) {
                importStatus.errors.push({
                  row: rowIdx,
                  message: `Invalid JobTitleID: ${data.jobTitleId}`
                });
                continue;
              }
              
              const existingTitle = titleIdMap.get(id);
              if (!existingTitle) {
                importStatus.errors.push({
                  row: rowIdx,
                  message: `Title with ID ${id} not found`
                });
                continue;
              }
              
              titleId = id;
              processedTitleIds.add(titleId);
            } 
            else {
              // Try to find by title name or create new
              const titleKey = data.jobTitle.toLowerCase();
              const existingTitle = titleMap.get(titleKey);
              
              if (existingTitle) {
                titleId = existingTitle.id;
                processedTitleIds.add(titleId);
              } else {
                // Create new title
                const newTitle = {
                  title: data.jobTitle,
                  category: data.category,
                  description: ''
                };
                
                const [insertedTitle] = await db.insert(professionalSummaryTitles)
                  .values(newTitle)
                  .returning();
                
                titleId = insertedTitle.id;
                
                // Update maps for future reference
                titleMap.set(titleKey, insertedTitle);
                titleIdMap.set(titleId, insertedTitle);
                
                processedTitleIds.add(titleId);
                importStatus.created++;
                
                console.log(`Created new title: "${data.jobTitle}" (ID: ${titleId})`);
              }
            }
            
            // Create the description 
            const descriptionData = {
              content: data.description,
              isRecommended: data.isRecommended,
              professionalSummaryTitleId: titleId
            };
            
            // Validate with schema before inserting
            const validDescription = professionalSummaryDescriptionSchema.parse(descriptionData);
            
            // Insert the description
            const [insertedDescription] = await db.insert(professionalSummaryDescriptions)
              .values(validDescription)
              .returning();
            
            processedDescriptionIds.add(insertedDescription.id);
            importStatus.updated++;
            
            console.log(`Added description for title ID ${titleId}, isRecommended: ${data.isRecommended}`);
            
          } catch (error: any) {
            importStatus.errors.push({
              row: rowIdx,
              message: error.message || "Unknown error"
            });
            console.error(`Error processing row ${rowIdx}:`, error);
          }
        }
        
        // Handle full-sync deletion if needed
        if (syncMode === 'full-sync' && processedTitleIds.size > 0) {
          const descriptionsToDelete = existingDescriptions.filter(d => 
            processedTitleIds.has(d.professionalSummaryTitleId) && 
            !processedDescriptionIds.has(d.id)
          );
          
          if (descriptionsToDelete.length > 0) {
            console.log(`Deleting ${descriptionsToDelete.length} descriptions not in import`);
            
            const idsToDelete = descriptionsToDelete.map(d => d.id);
            await db.delete(professionalSummaryDescriptions)
              .where(inArray(professionalSummaryDescriptions.id, idsToDelete));
            
            importStatus.deleted = descriptionsToDelete.length;
          }
        }
        
      } catch (processingError: any) {
        console.error("Error processing parsed data:", processingError);
        importStatus.errors.push({
          row: 0,
          message: `Processing error: ${processingError.message}`
        });
      }
    }
    
    // Mark import as complete
    importStatus.isComplete = true;
    lastImportStatus = importStatus;
    
    console.log("Import completed:", {
      processed: importStatus.processed,
      created: importStatus.created,
      updated: importStatus.updated,
      deleted: importStatus.deleted,
      errors: importStatus.errors.length
    });
    
  } catch (error: any) {
    console.error("Fatal import error:", error);
    
    // Update status with error
    if (lastImportStatus) {
      lastImportStatus.errors.push({
        row: 0,
        message: `Fatal error: ${error.message}`
      });
      lastImportStatus.isComplete = true;
    }
    
    return res.status(500).json({ error: `Import failed: ${error.message}` });
  }
});

// Helper function to extract value from row using multiple possible keys
function extractValue(row: any, keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }
  return '';
}

// Helper function to convert various values to boolean
function toBool(value: string): boolean {
  if (!value) return false;
  
  const trimmed = value.trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 't'].includes(trimmed);
}