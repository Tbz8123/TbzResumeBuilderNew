import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { professionalSummaryTitles, professionalSummaryDescriptions, professionalSummaryDescriptionSchema } from "@shared/schema";
import { eq, inArray, sql, and } from "drizzle-orm";
import * as XLSX from 'xlsx';
import multer from "multer";
import { parse } from "csv-parse";
import path from "path";
import * as fs from 'fs';
import { unlink } from "fs/promises";

export const professionalSummaryImportRouter = Router();

// Helper functions
function extractValue(row: any, keys: string[]): string {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) {
      return String(row[key]).trim();
    }
  }
  return '';
}

function toBool(value: string): boolean {
  if (!value) return false;
  const trimmed = value.trim().toLowerCase();
  return ['true', 'yes', 'y', '1', 't'].includes(trimmed);
}

// Create temp directory
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
}

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'temp/'),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase() || '.csv';
    cb(null, `professional-summary-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls' || ext === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV, Excel, and JSON files are allowed'));
    }
  }
});

// Store the last import status for polling
let lastImportStatus: any = null;

// Status endpoints
professionalSummaryImportRouter.get("/import-status", isAuthenticated, isAdmin, (req, res) => {
  console.log("Import status requested, returning:", lastImportStatus);
  res.json(lastImportStatus || { isComplete: true, processed: 0, errors: [] });
});

professionalSummaryImportRouter.get("/debug-import-status", (req, res) => {
  console.log("Debug import status requested, returning:", lastImportStatus);
  res.json(lastImportStatus || { isComplete: true, processed: 0, errors: [] });
});

// Import endpoint
professionalSummaryImportRouter.post("/import", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const syncMode = req.query.mode === 'full-sync' ? 'full-sync' : 'update-only';
    console.log(`Processing ${req.file.originalname} in ${syncMode} mode`);
    
    // Initialize status
    const importStatus = {
      processed: 0,
      created: 0,
      updated: 0,
      deleted: 0,
      errors: [] as {row: number, message: string}[],
      isComplete: false,
      syncMode
    };
    
    // Update global status
    lastImportStatus = {...importStatus};
    
    // Return immediately
    res.status(200).json({ message: "Import started" });
    
    // Process in background
    processImport(req.file, importStatus, syncMode).catch(error => {
      console.error("Import error:", error);
      importStatus.errors.push({ row: -1, message: error.message || 'Unknown error' });
      importStatus.isComplete = true;
      lastImportStatus = {...importStatus, errors: [...importStatus.errors]};
    });
  } catch (error: any) {
    console.error("Error handling upload:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Background processing function
async function processImport(file: Express.Multer.File, status: any, syncMode: string) {
  try {
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();
    let rows: any[] = [];
    
    // Parse file
    if (fileExt === '.json') {
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const jsonData = JSON.parse(fileContent);
      rows = Array.isArray(jsonData) ? jsonData : [];
      if (!Array.isArray(jsonData)) {
        status.errors.push({ row: 0, message: "JSON must contain an array" });
      }
    } 
    else if (fileExt === '.xlsx' || fileExt === '.xls') {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      console.log(`Excel file parsed, found ${rows.length} rows`);
    }
    else {
      // CSV
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
    }
    
    // Clean up temp file
    try { await unlink(filePath); } catch (e) { console.error("File cleanup error:", e); }
    
    // Process rows
    if (rows.length > 0) {
      // Fetch existing titles
      const existingTitles = await db.select().from(professionalSummaryTitles);
      const titleMap = new Map(existingTitles.map(t => [t.title.toLowerCase(), t]));
      const titleIdMap = new Map(existingTitles.map(t => [t.id, t]));
      console.log(`Found ${existingTitles.length} existing titles`);
      
      // Track processed IDs
      const processedTitleIds = new Set<number>();
      const processedDescriptionIds = new Set<number>();
      
      // Get existing descriptions for full-sync
      let existingDescriptions: any[] = [];
      if (syncMode === 'full-sync') {
        existingDescriptions = await db.select().from(professionalSummaryDescriptions);
      }
      
      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowIdx = i + 1;
        status.processed++;
        
        try {
          // Extract fields
          const data = {
            jobTitleId: extractValue(row, ['JobTitleID', 'jobtitleid', 'id', 'A']),
            jobTitle: extractValue(row, ['JobTitle', 'jobtitle', 'title', 'B']),
            category: extractValue(row, ['Category', 'category', 'C']) || 'General',
            description: extractValue(row, ['Description', 'description', 'Professional Summary Description', 'summary', 'D']),
            isRecommended: toBool(extractValue(row, ['IsRecommended', 'isrecommended', 'recommended', 'E']))
          };
          
          // Validate required fields
          if (!data.jobTitleId && !data.jobTitle) {
            status.errors.push({ row: rowIdx, message: "Missing JobTitleID or JobTitle" });
            continue;
          }
          
          if (!data.description) {
            status.errors.push({ row: rowIdx, message: "Missing Description" });
            continue;
          }
          
          // Find or create title
          let titleId: number;
          if (data.jobTitleId) {
            const id = Number(data.jobTitleId);
            if (isNaN(id)) {
              status.errors.push({ row: rowIdx, message: `Invalid JobTitleID: ${data.jobTitleId}` });
              continue;
            }
            
            const existingTitle = titleIdMap.get(id);
            if (!existingTitle) {
              // Title doesn't exist, create a new one with the specified ID
              console.log(`Title with ID ${id} not found. Creating a new title.`);
              
              // Create title using Job Title from the file or a default
              const titleText = data.jobTitle || `Professional Summary Title ${id}`;
              const category = data.category || 'General';
              
              try {
                // Use SQL to insert with a specific ID
                await db.execute(sql`
                  INSERT INTO professional_summary_titles (id, title, category) 
                  VALUES (${id}, ${titleText}, ${category})
                  ON CONFLICT (id) DO NOTHING
                `);
                
                // Add to maps and sets
                const newTitle = {
                  id: id,
                  title: titleText,
                  category: category,
                  description: '',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                titleIdMap.set(id, newTitle);
                titleMap.set(titleText.toLowerCase(), newTitle);
                status.created++;
                console.log(`Successfully created professional summary title with ID ${id}`);
              } catch (error: any) {
                console.error(`Error creating title with ID ${id}:`, error);
                status.errors.push({ row: rowIdx, message: `Failed to create title with ID ${id}: ${error.message || "Unknown error"}` });
                continue;
              }
            } else if (data.jobTitle && existingTitle.title !== data.jobTitle) {
              // Title exists but name is different, update the title
              console.log(`Updating title ID ${id} from "${existingTitle.title}" to "${data.jobTitle}"`);
              
              try {
                // Update the title name and category
                await db.update(professionalSummaryTitles)
                  .set({ 
                    title: data.jobTitle,
                    category: data.category || existingTitle.category,
                    updatedAt: new Date()
                  })
                  .where(eq(professionalSummaryTitles.id, id));
                
                // Update maps with new data
                const updatedTitle = {
                  ...existingTitle,
                  title: data.jobTitle,
                  category: data.category || existingTitle.category,
                  updatedAt: new Date()
                };
                
                // Remove old title from map
                titleMap.delete(existingTitle.title.toLowerCase());
                
                // Update maps with new title data
                titleIdMap.set(id, updatedTitle);
                titleMap.set(data.jobTitle.toLowerCase(), updatedTitle);
                
                status.updated++;
                console.log(`Successfully updated professional summary title with ID ${id}`);
              } catch (error: any) {
                console.error(`Error updating title with ID ${id}:`, error);
                status.errors.push({ row: rowIdx, message: `Failed to update title with ID ${id}: ${error.message || "Unknown error"}` });
              }
            }
            
            titleId = id;
            processedTitleIds.add(titleId);
          } 
          else {
            // Find by name or create
            const titleKey = data.jobTitle.toLowerCase();
            const existingTitle = titleMap.get(titleKey);
            
            if (existingTitle) {
              titleId = existingTitle.id;
              processedTitleIds.add(titleId);
              
              // Check if we need to update the category
              if (data.category && existingTitle.category !== data.category) {
                console.log(`Updating category for title "${data.jobTitle}" from "${existingTitle.category}" to "${data.category}"`);
                
                try {
                  // Update just the category
                  await db.update(professionalSummaryTitles)
                    .set({ 
                      category: data.category,
                      updatedAt: new Date()
                    })
                    .where(eq(professionalSummaryTitles.id, existingTitle.id));
                  
                  // Update maps
                  const updatedTitle = {
                    ...existingTitle,
                    category: data.category,
                    updatedAt: new Date()
                  };
                  
                  titleIdMap.set(existingTitle.id, updatedTitle);
                  titleMap.set(titleKey, updatedTitle);
                  
                  status.updated++;
                } catch (error: any) {
                  console.error(`Error updating category for title "${data.jobTitle}":`, error);
                }
              }
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
              titleMap.set(titleKey, insertedTitle);
              titleIdMap.set(titleId, insertedTitle);
              processedTitleIds.add(titleId);
              status.created++;
            }
          }
          
          // Check if we should clear existing descriptions first (for full-sync mode)
          if (syncMode === 'full-sync') {
            // In full-sync mode, we need to delete any existing descriptions for this title that aren't in the import file
            try {
              // We no longer delete all descriptions for a title ID in full-sync mode
              // Instead we'll just check for duplicates and add new descriptions
              console.log(`Processing title ID ${titleId} with full-sync mode, preserving multiple descriptions`);
              
              // Get existing descriptions for this title just to track them
              const existingDescForTitle = await db
                .select()
                .from(professionalSummaryDescriptions)
                .where(eq(professionalSummaryDescriptions.professionalSummaryTitleId, titleId));
                
              // Add all existing description IDs to the processed set so they won't be deleted
              for (const desc of existingDescForTitle) {
                processedDescriptionIds.add(desc.id);
              }
              
              console.log(`Found ${existingDescForTitle.length} existing descriptions for title ID ${titleId}, preserving them`);
            } catch (error) {
              console.error(`Error processing existing descriptions for title ID ${titleId}:`, error);
            }
          }
          
          // In replace mode, we don't check for duplicates
          // We want to add all descriptions from the import file
          // and will delete the others after processing
            
          // Create new description
          const descriptionData = {
            content: data.description,
            isRecommended: data.isRecommended,
            professionalSummaryTitleId: titleId
          };
          
          const validDescription = professionalSummaryDescriptionSchema.parse(descriptionData);
          const [insertedDescription] = await db.insert(professionalSummaryDescriptions)
            .values(validDescription)
            .returning();
          
          processedDescriptionIds.add(insertedDescription.id);
          status.updated++;
          console.log(`Added description for title ID ${titleId}, isRecommended: ${data.isRecommended}`);
          
          // Update status periodically for polling
          lastImportStatus = { ...status, errors: [...status.errors] };
          
        } catch (error: any) {
          status.errors.push({ row: rowIdx, message: error.message || "Unknown error" });
        }
      }
      
      // In full-sync mode, we now only delete descriptions that weren't processed
      // This allows us to keep multiple descriptions per job title
      if (syncMode === 'full-sync' && processedTitleIds.size > 0) {
        try {
          // Find descriptions for processed titles that weren't included in the import
          const descriptionsToDelete = existingDescriptions.filter(d => 
            processedTitleIds.has(d.professionalSummaryTitleId) && 
            !processedDescriptionIds.has(d.id)
          );
          
          if (descriptionsToDelete.length > 0) {
            console.log(`Found ${descriptionsToDelete.length} descriptions to delete in full-sync cleanup`);
            
            // Delete these descriptions in batches to avoid overwhelming the database
            const batchSize = 100;
            for (let i = 0; i < descriptionsToDelete.length; i += batchSize) {
              const batch = descriptionsToDelete.slice(i, i + batchSize);
              const idsToDelete = batch.map(d => d.id);
              
              await db.delete(professionalSummaryDescriptions)
                .where(inArray(professionalSummaryDescriptions.id, idsToDelete));
              
              console.log(`Deleted batch of ${batch.length} descriptions`);
            }
            
            status.deleted = descriptionsToDelete.length;
          } else {
            console.log("No descriptions to delete in full-sync cleanup");
          }
        } catch (error: any) {
          console.error("Error in full-sync cleanup:", error);
          status.errors.push({ row: 0, message: `Error in full-sync cleanup: ${error.message || String(error)}` });
        }
      }
    }
    
    // Finalize
    status.isComplete = true;
    console.log(`Import completed: { processed: ${status.processed}, created: ${status.created}, updated: ${status.updated}, deleted: ${status.deleted}, errors: ${status.errors.length} }`);
    
    // Final status update
    lastImportStatus = { ...status, errors: [...status.errors] };
    
  } catch (error: any) {
    console.error("Fatal import error:", error);
    status.errors.push({ row: 0, message: `Fatal error: ${error.message}` });
    status.isComplete = true;
    lastImportStatus = { ...status, errors: [...status.errors] };
    throw error;
  }
}