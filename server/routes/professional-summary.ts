import { Router } from "express";
import { db } from "@db";
import { isAdmin, isAuthenticated } from "../auth";
import { 
  professionalSummaryTitles,
  professionalSummaryDescriptions,
  professionalSummaryTitleSchema,
  professionalSummaryDescriptionSchema,
  type ProfessionalSummaryTitle,
  type ProfessionalSummaryDescription
} from "@shared/schema";
import { eq, like, desc, asc, and, or, SQL, sql, inArray } from "drizzle-orm";
import { createObjectCsvStringifier } from "csv-writer";
import { parse } from "csv-parse";
import * as XLSX from "xlsx";
import { EventEmitter } from "events";
import multer from "multer";
import * as fs from 'fs';
import path from "path";
import { unlink } from "fs/promises";

const professionalSummaryRouter = Router();

// Create temp directory if it doesn't exist
if (!fs.existsSync('temp')) {
  fs.mkdirSync('temp', { recursive: true });
  console.log("Created temp directory for file uploads");
}

// Setup file upload middleware with expanded file type support
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'temp/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure file upload handling
const upload = multer({
  storage: storage,
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

// Get all professional summary titles with pagination and search
professionalSummaryRouter.get("/titles", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string || "";
    const category = req.query.category as string || "all";
    
    const offset = (page - 1) * limit;
    
    console.log(`Fetching professional summary titles (page: ${page}, limit: ${limit}, category: ${category}, search: ${search || 'none'})`);
    
    // Build the query
    let whereClause: SQL<unknown> | undefined = undefined;
    
    // Apply search filter if provided
    if (search) {
      whereClause = like(professionalSummaryTitles.title, `%${search}%`);
    }
    
    // Apply category filter if provided and not "all"
    if (category && category !== "all") {
      const categoryFilter = eq(professionalSummaryTitles.category, category);
      whereClause = whereClause ? and(whereClause, categoryFilter) : categoryFilter;
    }
    
    // Count total titles for pagination
    const totalCountResult = await db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(professionalSummaryTitles)
      .where(whereClause);
    
    const totalCount = totalCountResult[0]?.count || 0;
    
    // Get the titles with proper SQL handling
    let query = db
      .select()
      .from(professionalSummaryTitles);
      
    // Only add the where clause if it exists
    if (whereClause) {
      query = query.where(whereClause);
    }
    
    const titles = await query
      .limit(limit)
      .offset(offset)
      .orderBy(desc(professionalSummaryTitles.id));
    
    console.log(`Retrieved ${titles.length} professional summary titles (total: ${totalCount})`);
    
    return res.status(200).json({ 
      data: titles, 
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching professional summary titles:", error);
    return res.status(500).json({ error: "Failed to fetch professional summary titles" });
  }
});

// Get all unique categories
professionalSummaryRouter.get("/categories", async (req, res) => {
  try {
    // Get all distinct categories
    const categories = await db
      .selectDistinct({ category: professionalSummaryTitles.category })
      .from(professionalSummaryTitles)
      .orderBy(asc(professionalSummaryTitles.category));
    
    // Map results to strings
    let categoryList = categories.map(c => c.category);
    
    // Add default categories if the list is empty
    if (categoryList.length === 0) {
      categoryList = [
        "Information Technology",
        "Marketing",
        "Finance",
        "Sales",
        "Human Resources",
        "Engineering",
        "Customer Service",
        "Healthcare",
        "Education",
        "Management"
      ];
    }
    
    return res.status(200).json(categoryList);
  } catch (error) {
    console.error("Error fetching professional summary categories:", error);
    return res.status(500).json({ error: "Failed to fetch professional summary categories" });
  }
});

// Get a professional summary title by ID
professionalSummaryRouter.get("/titles/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    const title = await db
      .select()
      .from(professionalSummaryTitles)
      .where(eq(professionalSummaryTitles.id, id))
      .limit(1);
    
    if (title.length === 0) {
      return res.status(404).json({ error: "Professional summary title not found" });
    }
    
    return res.status(200).json(title[0]);
  } catch (error) {
    console.error("Error fetching professional summary title:", error);
    return res.status(500).json({ error: "Failed to fetch professional summary title" });
  }
});

// Create a new professional summary title (admin only)
professionalSummaryRouter.post("/titles", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = professionalSummaryTitleSchema.parse(req.body);
    
    const [newTitle] = await db
      .insert(professionalSummaryTitles)
      .values(validatedData)
      .returning();
    
    return res.status(201).json(newTitle);
  } catch (error) {
    console.error("Error creating professional summary title:", error);
    return res.status(500).json({ error: "Failed to create professional summary title" });
  }
});

// Update a professional summary title (admin only)
professionalSummaryRouter.put("/titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = professionalSummaryTitleSchema.parse(req.body);
    
    const [updatedTitle] = await db
      .update(professionalSummaryTitles)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(professionalSummaryTitles.id, id))
      .returning();
    
    if (!updatedTitle) {
      return res.status(404).json({ error: "Professional summary title not found" });
    }
    
    return res.status(200).json(updatedTitle);
  } catch (error) {
    console.error("Error updating professional summary title:", error);
    return res.status(500).json({ error: "Failed to update professional summary title" });
  }
});

// Delete a professional summary title (admin only)
professionalSummaryRouter.delete("/titles/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // Delete the title (this will cascade delete associated descriptions due to foreign key constraint)
    await db
      .delete(professionalSummaryTitles)
      .where(eq(professionalSummaryTitles.id, id));
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting professional summary title:", error);
    return res.status(500).json({ error: "Failed to delete professional summary title" });
  }
});

// Get descriptions for a professional summary title
professionalSummaryRouter.get("/descriptions/by-title/:titleId", async (req, res) => {
  try {
    const titleId = parseInt(req.params.titleId);
    const search = req.query.search as string || "";
    
    let whereClause = eq(professionalSummaryDescriptions.professionalSummaryTitleId, titleId);
    
    // Add search filter if provided
    if (search) {
      whereClause = and(
        whereClause,
        like(professionalSummaryDescriptions.content, `%${search}%`)
      );
    }
    
    const descriptions = await db
      .select()
      .from(professionalSummaryDescriptions)
      .where(whereClause)
      .orderBy(desc(professionalSummaryDescriptions.isRecommended), desc(professionalSummaryDescriptions.id));
    
    return res.status(200).json(descriptions);
  } catch (error) {
    console.error("Error fetching professional summary descriptions:", error);
    return res.status(500).json({ error: "Failed to fetch professional summary descriptions" });
  }
});

// Create a new professional summary description (admin only)
professionalSummaryRouter.post("/descriptions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const validatedData = professionalSummaryDescriptionSchema.parse(req.body);
    
    const [newDescription] = await db
      .insert(professionalSummaryDescriptions)
      .values(validatedData)
      .returning();
    
    return res.status(201).json(newDescription);
  } catch (error) {
    console.error("Error creating professional summary description:", error);
    return res.status(500).json({ error: "Failed to create professional summary description" });
  }
});

// Update a professional summary description (admin only)
professionalSummaryRouter.put("/descriptions/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const validatedData = professionalSummaryDescriptionSchema.parse(req.body);
    
    const [updatedDescription] = await db
      .update(professionalSummaryDescriptions)
      .set({
        ...validatedData,
        updatedAt: new Date()
      })
      .where(eq(professionalSummaryDescriptions.id, id))
      .returning();
    
    if (!updatedDescription) {
      return res.status(404).json({ error: "Professional summary description not found" });
    }
    
    return res.status(200).json(updatedDescription);
  } catch (error) {
    console.error("Error updating professional summary description:", error);
    return res.status(500).json({ error: "Failed to update professional summary description" });
  }
});

// Delete a professional summary description (admin only)
professionalSummaryRouter.delete("/descriptions/:id", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await db
      .delete(professionalSummaryDescriptions)
      .where(eq(professionalSummaryDescriptions.id, id));
    
    return res.status(204).send();
  } catch (error) {
    console.error("Error deleting professional summary description:", error);
    return res.status(500).json({ error: "Failed to delete professional summary description" });
  }
});

// Search professional summary descriptions
professionalSummaryRouter.get("/descriptions/search", async (req, res) => {
  try {
    const search = req.query.search as string || "";
    const titleId = parseInt(req.query.titleId as string) || undefined;
    
    let whereClause: SQL<unknown> | undefined = undefined;
    
    // Apply search filter if provided
    if (search) {
      whereClause = like(professionalSummaryDescriptions.content, `%${search}%`);
    }
    
    // Apply title ID filter if provided
    if (titleId) {
      const titleFilter = eq(professionalSummaryDescriptions.professionalSummaryTitleId, titleId);
      whereClause = whereClause ? and(whereClause, titleFilter) : titleFilter;
    }
    
    // Build the query with proper SQL handling
    let query = db
      .select({
        description: professionalSummaryDescriptions,
        title: professionalSummaryTitles
      })
      .from(professionalSummaryDescriptions)
      .leftJoin(
        professionalSummaryTitles, 
        eq(professionalSummaryDescriptions.professionalSummaryTitleId, professionalSummaryTitles.id)
      );
      
    // Only add the where clause if it exists
    if (whereClause) {
      query = query.where(whereClause);
    }
      
    // Execute the query
    const descriptions = await query
      .orderBy(
        desc(professionalSummaryDescriptions.isRecommended),
        desc(professionalSummaryDescriptions.id)
      )
      .limit(100);
    
    // Format the results with null safety
    const formattedResults = descriptions.map(item => ({
      ...item.description,
      titleName: item.title?.title || "Unknown Title",
      titleCategory: item.title?.category || "Uncategorized"
    }));
    
    return res.status(200).json(formattedResults);
  } catch (error) {
    console.error("Error searching professional summary descriptions:", error);
    return res.status(500).json({ error: "Failed to search professional summary descriptions" });
  }
});

// Export professional summary titles and descriptions as CSV (admin only)
professionalSummaryRouter.get("/export/csv", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all titles
    const titles = await db.select().from(professionalSummaryTitles);
    
    // Create a map for quick title lookup
    const titleMap = new Map(titles.map(t => [t.id, t]));
    
    // Get all descriptions with their title IDs
    const descriptions = await db.select().from(professionalSummaryDescriptions);
    
    // Format the data for CSV - ensure consistency with Excel export format
    const records = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        JobTitleID: desc.professionalSummaryTitleId,
        JobTitle: title?.title || 'Unknown',
        Category: title?.category || 'Unknown',
        Description: desc.content,
        IsRecommended: desc.isRecommended ? "TRUE" : "FALSE" // Uppercase for consistency
      };
    });
    
    // Create CSV stringifier with column names matching the Excel export
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'JobTitleID', title: 'JobTitleID'},
        {id: 'JobTitle', title: 'JobTitle'},
        {id: 'Category', title: 'Category'},
        {id: 'Description', title: 'Description'}, // Use consistent naming
        {id: 'IsRecommended', title: 'IsRecommended'}
      ]
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=professional-summaries-export.csv');
    
    // Write headers and records
    res.write(csvStringifier.getHeaderString());
    res.write(csvStringifier.stringifyRecords(records));
    
    res.end();
  } catch (error) {
    console.error("Error exporting professional summaries as CSV:", error);
    return res.status(500).json({ error: "Failed to export professional summaries as CSV" });
  }
});

// Export professional summary titles and descriptions as JSON (admin only)
professionalSummaryRouter.get("/export/json", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all titles
    const titles = await db.select().from(professionalSummaryTitles);
    
    // Create a map for quick title lookup
    const titleMap = new Map(titles.map(t => [t.id, t]));
    
    // Get all descriptions with their title IDs
    const descriptions = await db.select().from(professionalSummaryDescriptions);
    
    // Format the data for JSON
    const records = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        titleId: desc.professionalSummaryTitleId,
        title: title?.title || 'Unknown',
        category: title?.category || 'Unknown',
        description: desc.content,
        isRecommended: desc.isRecommended
      };
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=professional-summaries-export.json');
    
    // Send JSON response
    res.json(records);
  } catch (error) {
    console.error("Error exporting professional summaries as JSON:", error);
    return res.status(500).json({ error: "Failed to export professional summaries as JSON" });
  }
});

// Export professional summary titles and descriptions as Excel (admin only)
professionalSummaryRouter.get("/export/excel", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all titles
    const titles = await db.select().from(professionalSummaryTitles);
    
    // Create a map for quick title lookup
    const titleMap = new Map(titles.map(t => [t.id, t]));
    
    // Get all descriptions with their title IDs
    const descriptions = await db.select().from(professionalSummaryDescriptions);
    
    // Format the data for Excel with standard column names that match the import format
    const excelData = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        JobTitleID: desc.professionalSummaryTitleId,
        JobTitle: title?.title || 'Unknown',
        Category: title?.category || 'Unknown',
        Description: desc.content, // Using "Description" for compatibility
        IsRecommended: desc.isRecommended ? "TRUE" : "FALSE" // Using uppercase for boolean values
      };
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=professional-summaries-export.xlsx');
    
    // Create workbook with proper column formatting
    const wb = XLSX.utils.book_new();
    
    // Convert array of objects to worksheet - this preserves column names better than AOA format
    const ws = XLSX.utils.json_to_sheet(excelData, {
      header: ['JobTitleID', 'JobTitle', 'Category', 'Description', 'IsRecommended']
    });
    
    // Add column widths for better readability
    const colWidths = [
      { wch: 10 },  // JobTitleID
      { wch: 30 },  // JobTitle
      { wch: 15 },  // Category
      { wch: 60 },  // Description
      { wch: 15 },  // IsRecommended
    ];
    ws['!cols'] = colWidths;
    
    XLSX.utils.book_append_sheet(wb, ws, 'Professional Summaries');
    
    // Write directly to Excel format and send
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(excelBuffer);
  } catch (error) {
    console.error("Error exporting professional summaries as Excel:", error);
    return res.status(500).json({ error: "Failed to export professional summaries as Excel" });
  }
});

// Import professional summary titles and descriptions from CSV (admin only)
professionalSummaryRouter.post("/import/csv", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  console.log("Professional summary import request received:", req.headers);
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
            message: "JSON data must be an array of professional summary data objects"
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

        // Special handling for the Excel format from the screenshot
        // First, try with column headers to see what we get
        console.log(`First attempting to parse Excel with headers`);
        const rowsWithHeaders = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",
          raw: false, // Convert all data to strings
          blankrows: false // Skip blank rows
        });
        
        console.log(`Parsed ${rowsWithHeaders.length} rows with headers`);
        if (rowsWithHeaders.length > 0) {
          console.log("Headers detected:", Object.keys(rowsWithHeaders[0]));
        }
        
        // Now try with positional headers (A, B, C, D, E)
        console.log(`Now trying with positional headers`);
        const rowsWithPositionalHeaders = XLSX.utils.sheet_to_json(worksheet, { 
          defval: "",
          raw: false,
          blankrows: false,
          header: 'A' // Use A, B, C as positional headers
        });
        
        console.log(`Parsed ${rowsWithPositionalHeaders.length} rows with positional headers`);
        if (rowsWithPositionalHeaders.length > 0) {
          console.log("Positional headers:", Object.keys(rowsWithPositionalHeaders[0]));
        }
        
        // Decide which approach to use based on the results
        if (rowsWithHeaders.length > 0 && Object.keys(rowsWithHeaders[0]).some(k => 
          k.toLowerCase().includes('title') || k.toLowerCase().includes('description'))) {
          // The named headers approach seems to work
          console.log("Using named headers approach");
          rows = rowsWithHeaders;
        } else {
          // Either no named headers or they don't contain our expected columns
          console.log("Using positional headers approach");
          rows = rowsWithPositionalHeaders;
          
          // If we used positional headers, check if the first row seems to be a header
          // and map values to our expected columns
          if (rows.length > 0) {
            const firstRowValues = Object.values(rows[0]);
            const hasHeaderValues = firstRowValues.some(v => 
              String(v).toLowerCase().includes('title') || 
              String(v).toLowerCase().includes('description') || 
              String(v).toLowerCase().includes('recommended'));
            
            if (hasHeaderValues) {
              console.log("First row with positional headers appears to be a header row, skipping it");
              rows = rows.slice(1);
            }
            
            // Map positional columns to meaningful names based on the format in the screenshot
            console.log("Mapping positional columns to meaningful names");
            rows = rows.map(row => {
              // From the screenshot: A=ID, B=Title, C=Category, D=Description, E=IsRecommended
              return {
                JobTitleID: row.A || '',
                JobTitle: row.B || '',
                Category: row.C || '',
                Description: row.D || '',
                IsRecommended: (row.E || '').toString().toLowerCase() === 'true'
              };
            });
            
            console.log("After mapping positional headers, first row:", rows.length > 0 ? rows[0] : 'No rows');
          }
        }
        
        console.log(`Final Excel parse result: ${rows.length} rows`);
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
        const parsedData = parse(fileContent, {
          columns: true,
          skip_empty_lines: true,
          trim: true
        });
        // Safely convert to array
        rows = Array.isArray(parsedData) ? parsedData : [];
        
        if (rows.length === 0 && parsedData) {
          // Handle case where parse returns an object but not an array
          rows = [parsedData];
        }
      } catch (csvError: any) {
        importStatus.errors.push({
          row: 0,
          message: `Failed to parse CSV file: ${csvError.message}`
        });
      }
    }
    
    // Clean up the file after reading
    try {
      await unlink(filePath);
      console.log(`Temporary file ${filePath} deleted`);
    } catch (unlinkError) {
      console.error(`Failed to delete temporary file ${filePath}:`, unlinkError);
    }
    
    // Add additional debug logs to understand the rows structure
    console.log("File type:", fileExt);
    console.log("Number of rows parsed:", rows.length);
    if (rows.length > 0) {
      console.log("First row:", rows[0]);
      console.log("Keys in first row:", Object.keys(rows[0]));
    }
    
    // Process the parsed data in batches
    if (rows.length > 0) {
      const batchSize = 500;
      let batch = [];
      let rowNumber = 0;
      
      // Get existing titles and descriptions for sync and duplicate checking
      const existingTitles = await db.select().from(professionalSummaryTitles);
      const titleMap = new Map(existingTitles.map(t => [t.title.toLowerCase(), t]));
      
      // Keep track of processed titles and descriptions for full-sync mode
      const processedTitleIds = new Set<number>();
      const processedDescriptionIds = new Set<number>();
      
      // Get all existing descriptions if in full-sync mode
      let allExistingDescriptions: any[] = [];
      if (syncMode === 'full-sync') {
        allExistingDescriptions = await db.select().from(professionalSummaryDescriptions);
      }
      
      // Skip first row if it looks like a header row (especially for CSV files)
      let startFrom = 0;
      if (rows.length > 1) {
        const firstRow = rows[0];
        const firstRowKeys = Object.keys(firstRow);
        
        // Check if the first row contains header-like values
        const looksLikeHeader = firstRowKeys.some(key => {
          const value = String(firstRow[key] || '').toLowerCase();
          return value.includes('title') || value.includes('description') || 
                 value.includes('category') || value.includes('recommended');
        });
        
        if (looksLikeHeader) {
          console.log("First row appears to be a header, skipping it:", firstRow);
          startFrom = 1;
        }
      }
      
      console.log(`Processing rows starting from index ${startFrom}, total rows: ${rows.length}`);
      
      // Process rows, skipping header if needed
      for (let i = startFrom; i < rows.length; i++) {
        const row = rows[i];
        rowNumber = i + 1; // 1-based row number for user-friendly messages
        importStatus.processed++;
        
        try {
          // Log the raw row for debugging
          console.log(`Original row ${rowNumber} keys:`, Object.keys(row));
          console.log(`Original row ${rowNumber} values:`, Object.values(row));
          
          // Enhanced column mapping for Excel imports
          // Create a map of column patterns to field names for more robust matching
          const columnMappings = [
            { field: 'jobTitleId', patterns: ['titleid', 'jobtitleid', 'title id', 'title_id', 'job_title_id', 'id'] },
            { field: 'jobTitle', patterns: ['jobtitle', 'job title', 'title', 'job_title', 'title name'] },
            { field: 'category', patterns: ['category', 'job category', 'job_category'] },
            { field: 'description', patterns: ['description', 'summary', 'professional summary', 'professional_summary', 'professional summary description', 'summary_description'] },
            { field: 'isRecommended', patterns: ['recommended', 'isrecommended', 'is recommended', 'is_recommended', 'recommended flag'] }
          ];
          
          // Log the row data for debugging
          console.log(`Processing row ${rowNumber} with fields:`, row);
          
          // DIRECT ROW PROCESSING - Get values directly from row with fallbacks
          // This handles both Excel-style (A,B,C) and named column formats
          
          console.log("Direct row access - Row keys:", Object.keys(row));
          
          // Try to get JobTitleID first
          let jobTitleId = null;
          if (row.JobTitleID !== undefined) {
            jobTitleId = row.JobTitleID;
          } else if (row.A !== undefined) {
            jobTitleId = row.A;
          } else {
            // Try to find any key that might contain 'id' and 'title'
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('id') && lowerKey.includes('title')) {
                jobTitleId = row[key];
                break;
              }
            }
          }
          
          // Try to get JobTitle
          let jobTitle = '';
          if (row.JobTitle !== undefined) {
            jobTitle = row.JobTitle;
          } else if (row.B !== undefined) {
            jobTitle = row.B;
          } else {
            // Try to find any key that might contain 'title' but not 'id'
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('title') && !lowerKey.includes('id')) {
                jobTitle = row[key];
                break;
              }
            }
          }
          
          // Try to get Category
          let category = 'General';
          if (row.Category !== undefined) {
            category = row.Category;
          } else if (row.C !== undefined) {
            category = row.C;
          } else {
            // Try to find any key that might contain 'category'
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('category')) {
                category = row[key];
                break;
              }
            }
          }
          
          // Try to get Description
          let description = '';
          if (row.Description !== undefined) {
            description = row.Description;
          } else if (row['Professional Summary Description'] !== undefined) {
            description = row['Professional Summary Description'];
          } else if (row.D !== undefined) {
            description = row.D;
          } else {
            // Try to find any key that might contain 'description' or 'summary'
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('description') || lowerKey.includes('summary')) {
                description = row[key];
                break;
              }
            }
          }
          
          // Try to get IsRecommended
          let isRecommended = false;
          if (row.IsRecommended !== undefined) {
            const value = row.IsRecommended;
            isRecommended = typeof value === 'string'
              ? ['true', 'yes', '1', 'y', 't', 'TRUE'].includes(value.toString().toLowerCase())
              : !!value;
          } else if (row.E !== undefined) {
            const value = row.E;
            isRecommended = typeof value === 'string'
              ? ['true', 'yes', '1', 'y', 't', 'TRUE'].includes(value.toString().toLowerCase())
              : !!value;
          } else {
            // Try to find any key that might contain 'recommended'
            for (const key of Object.keys(row)) {
              const lowerKey = key.toLowerCase();
              if (lowerKey.includes('recommended')) {
                const value = row[key];
                isRecommended = typeof value === 'string'
                  ? ['true', 'yes', '1', 'y', 't', 'TRUE'].includes(value.toString().toLowerCase())
                  : !!value;
                break;
              }
            }
          }
          
          console.log("Final values extracted:", {
            jobTitleId,
            jobTitle,
            category,
            description,
            isRecommended
          });
          
          const normalizedRow = {
            JobTitleID: jobTitleId,
            JobTitle: jobTitle,
            Category: category,
            Description: description,
            IsRecommended: isRecommended
          };
          
          // Debug the parsed row data
          console.log(`Normalized row ${rowNumber}:`, normalizedRow);
          
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
          
          // IsRecommended value is already normalized
          
          // Process the title
          let titleId: number | null = null;
          let title: string = '';
          
          if (normalizedRow.JobTitleID) {
            // Check if a title with this ID exists
            const existingTitle = existingTitles.find(t => t.id === Number(normalizedRow.JobTitleID));
            if (existingTitle) {
              titleId = existingTitle.id;
              title = existingTitle.title;
              processedTitleIds.add(titleId);
            } else {
              importStatus.errors.push({
                row: rowNumber,
                message: `JobTitleID ${normalizedRow.JobTitleID} not found in database`
              });
              continue;
            }
          } else {
            // Look up by title name
            const titleLower = normalizedRow.JobTitle.toLowerCase();
            const existingTitle = titleMap.get(titleLower);
            
            if (existingTitle) {
              titleId = existingTitle.id;
              title = existingTitle.title;
              processedTitleIds.add(titleId);
            } else {
              // Create a new title
              const newTitle = {
                title: normalizedRow.JobTitle,
                category: normalizedRow.Category || 'General',
                description: ''
              };
              
              const [insertedTitle] = await db.insert(professionalSummaryTitles).values(newTitle).returning();
              titleId = insertedTitle.id;
              title = insertedTitle.title;
              titleMap.set(titleLower, insertedTitle);
              processedTitleIds.add(titleId);
              importStatus.created++;
            }
          }
          
          // Now insert the description - use the schema to validate
          const descriptionData = professionalSummaryDescriptionSchema.parse({
            content: normalizedRow.Description,
            isRecommended: normalizedRow.IsRecommended,
            professionalSummaryTitleId: titleId
          });
          
          const [insertedDescription] = await db.insert(professionalSummaryDescriptions)
            .values(descriptionData)
            .returning();
            
          processedDescriptionIds.add(insertedDescription.id);
          importStatus.created++;
          
          // Update status periodically
          if (rowNumber % 100 === 0 || rowNumber === rows.length) {
            importStatusEmitter.emit('update', importStatus);
          }
        } catch (error) {
          console.error(`Error processing row ${rowNumber}:`, error);
          importStatus.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : String(error)
          });
        }
      }
      
      // If in full-sync mode, delete records that weren't in the import
      if (syncMode === 'full-sync') {
        try {
          // Delete descriptions not in the import
          if (processedDescriptionIds.size > 0) {
            const descriptionsToDelete = allExistingDescriptions.filter(d => !processedDescriptionIds.has(d.id));
            
            if (descriptionsToDelete.length > 0) {
              console.log(`Deleting ${descriptionsToDelete.length} descriptions in full-sync mode`);
              const descriptionIds = descriptionsToDelete.map(d => d.id);
              
              for (let i = 0; i < descriptionIds.length; i += 500) {
                const batch = descriptionIds.slice(i, i + 500);
                await db.delete(professionalSummaryDescriptions)
                  .where(inArray(professionalSummaryDescriptions.id, batch));
              }
              
              importStatus.deleted += descriptionsToDelete.length;
            }
          }
        } catch (error) {
          console.error("Error performing full sync cleanup:", error);
          importStatus.errors.push({
            row: 0,
            message: `Error performing full sync cleanup: ${error instanceof Error ? error.message : String(error)}`
          });
        }
      }
    }
    
    // Mark import as complete
    importStatus.isComplete = true;
    importStatusEmitter.emit('update', importStatus);
    
    console.log("Professional summary import completed:", importStatus);
  } catch (error) {
    console.error("Error importing professional summaries:", error);
    
    // Mark import as complete with error
    importStatus.isComplete = true;
    importStatus.errors.push({
      row: 0,
      message: `Import failed: ${error instanceof Error ? error.message : String(error)}`
    });
    importStatusEmitter.emit('update', importStatus);
  }
});

// Import professional summary titles and descriptions from JSON (admin only)
professionalSummaryRouter.post("/import/json", isAuthenticated, isAdmin, async (req, res) => {
  try {
    if (!req.body.jsonData || !Array.isArray(req.body.jsonData)) {
      return res.status(400).json({ error: "Invalid JSON data provided" });
    }
    
    const records = req.body.jsonData;
    
    if (records.length === 0) {
      return res.status(400).json({ error: "No valid records found in JSON" });
    }
    
    // Process the records
    const results = {
      titlesAdded: 0,
      descriptionsAdded: 0,
      errors: [] as string[]
    };
    
    // Get existing titles for duplicate checking
    const existingTitles = await db.select().from(professionalSummaryTitles);
    const titleMap = new Map(existingTitles.map(t => [t.title.toLowerCase(), t]));
    
    // Process each record
    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      
      try {
        // Check if title exists
        const titleLower = record.title?.toLowerCase() || "";
        let titleId = null;
        
        if (!titleLower) {
          results.errors.push(`Item ${i + 1}: Missing title`);
          continue;
        }
        
        // Check if title already exists
        if (titleMap.has(titleLower)) {
          titleId = titleMap.get(titleLower)?.id;
        } else {
          // Create new title
          const newTitle = {
            title: record.title,
            category: record.category || "General",
            description: ""
          };
          
          const [insertedTitle] = await db.insert(professionalSummaryTitles).values(newTitle).returning();
          titleId = insertedTitle.id;
          titleMap.set(titleLower, insertedTitle);
          results.titlesAdded++;
        }
        
        // Add description if it exists
        if (record.description) {
          try {
            const newDescriptionData = professionalSummaryDescriptionSchema.parse({
              content: record.description,
              isRecommended: !!record.isRecommended,
              professionalSummaryTitleId: titleId
            });
            
            await db.insert(professionalSummaryDescriptions).values(newDescriptionData);
            results.descriptionsAdded++;
          } catch (validationError) {
            results.errors.push(`Item ${i + 1}: Invalid description data - ${validationError}`);
          }
        }
      } catch (error) {
        console.error(`Error processing item ${i + 1}:`, error);
        results.errors.push(`Item ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error importing professional summaries from JSON:", error);
    return res.status(500).json({ error: "Failed to import professional summaries from JSON" });
  }
});

// Server-sent events endpoint for import status updates
professionalSummaryRouter.get("/import-status", isAuthenticated, isAdmin, (req, res) => {
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
  
  // Register event listener
  importStatusEmitter.on('update', sendStatus);
  
  // Clean up event listener when client disconnects
  req.on('close', () => {
    importStatusEmitter.removeListener('update', sendStatus);
  });
});

// Dedicated endpoint for CSV export matching the frontend URL pattern
professionalSummaryRouter.get("/export-csv", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Get all titles
    const titles = await db.select().from(professionalSummaryTitles);
    
    // Create a map for quick title lookup
    const titleMap = new Map(titles.map(t => [t.id, t]));
    
    // Get all descriptions with their title IDs
    const descriptions = await db.select().from(professionalSummaryDescriptions);
    
    // Format the data for CSV - match the job export format but with one column name change
    const records = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        JobTitleID: desc.professionalSummaryTitleId,
        JobTitle: title?.title || 'Unknown',
        Category: title?.category || 'Unknown',
        Description: desc.content,
        IsRecommended: desc.isRecommended ? "true" : "false"
      };
    });
    
    // Create CSV stringifier - match the job export format exactly but rename Description column
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'JobTitleID', title: 'JobTitleID'},
        {id: 'JobTitle', title: 'JobTitle'},
        {id: 'Category', title: 'Category'},
        {id: 'Description', title: 'Professional Summary Description'},
        {id: 'IsRecommended', title: 'IsRecommended'}
      ]
    });
    
    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=professional-summaries-export.csv');
    
    // Write headers and records
    res.write(csvStringifier.getHeaderString());
    res.write(csvStringifier.stringifyRecords(records));
    
    res.end();
  } catch (error) {
    console.error("Error exporting professional summaries as CSV:", error);
    return res.status(500).json({ error: "Failed to export professional summaries as CSV" });
  }
});

export { professionalSummaryRouter };