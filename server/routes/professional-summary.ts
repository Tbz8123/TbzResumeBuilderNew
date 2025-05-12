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
import { eq, like, desc, asc, and, or, SQL, sql } from "drizzle-orm";
import { createObjectCsvStringifier } from "csv-writer";
import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { EventEmitter } from "events";
import multer from "multer";
import * as fs from 'fs';
import path from "path";

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
    
    // Get the titles
    const titles = await db
      .select()
      .from(professionalSummaryTitles)
      .where(whereClause)
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
    
    const descriptions = await db
      .select({
        description: professionalSummaryDescriptions,
        title: professionalSummaryTitles
      })
      .from(professionalSummaryDescriptions)
      .leftJoin(
        professionalSummaryTitles, 
        eq(professionalSummaryDescriptions.professionalSummaryTitleId, professionalSummaryTitles.id)
      )
      .where(whereClause)
      .orderBy(
        desc(professionalSummaryDescriptions.isRecommended),
        desc(professionalSummaryDescriptions.id)
      )
      .limit(100);
    
    // Format the results
    const formattedResults = descriptions.map(item => ({
      ...item.description,
      titleName: item.title.title,
      titleCategory: item.title.category
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
    
    // Format the data for CSV
    const records = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        titleId: desc.professionalSummaryTitleId,
        title: title?.title || 'Unknown',
        category: title?.category || 'Unknown',
        description: desc.content,
        isRecommended: desc.isRecommended ? 'Yes' : 'No'
      };
    });
    
    // Create CSV stringifier
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'titleId', title: 'Title ID'},
        {id: 'title', title: 'Title'},
        {id: 'category', title: 'Category'},
        {id: 'description', title: 'Description'},
        {id: 'isRecommended', title: 'Is Recommended'}
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
    
    // Format the data for Excel
    const records = descriptions.map(desc => {
      const title = titleMap.get(desc.professionalSummaryTitleId);
      return {
        'Title ID': desc.professionalSummaryTitleId,
        'Title': title?.title || 'Unknown',
        'Category': title?.category || 'Unknown',
        'Description': desc.content,
        'Is Recommended': desc.isRecommended ? 'Yes' : 'No'
      };
    });
    
    // Create a buffer containing our Excel data
    // For simplicity, we'll actually just send a CSV with Excel extension
    // In a real app, you'd use a library like exceljs to create a proper Excel file
    const csvStringifier = createObjectCsvStringifier({
      header: [
        {id: 'Title ID', title: 'Title ID'},
        {id: 'Title', title: 'Title'},
        {id: 'Category', title: 'Category'},
        {id: 'Description', title: 'Description'},
        {id: 'Is Recommended', title: 'Is Recommended'}
      ]
    });
    
    const csv = csvStringifier.getHeaderString() + csvStringifier.stringifyRecords(records);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=professional-summaries-export.xlsx');
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Title ID', 'Title', 'Category', 'Description', 'Is Recommended'],
      ...records.map(r => [
        r['Title ID'], 
        r['Title'], 
        r['Category'], 
        r['Description'], 
        r['Is Recommended']
      ])
    ]);
    
    XLSX.utils.book_append_sheet(wb, ws, 'Professional Summaries');
    
    // Write to buffer and send response
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.send(buf);
  } catch (error) {
    console.error("Error exporting professional summaries as Excel:", error);
    return res.status(500).json({ error: "Failed to export professional summaries as Excel" });
  }
});

// Import professional summary titles and descriptions from CSV (admin only)
professionalSummaryRouter.post("/import/csv", isAuthenticated, isAdmin, upload.single('file'), async (req, res) => {
  try {
    // Reset import status
    importStatus = {
      inProgress: true,
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [],
      isComplete: false
    };
    importStatusEmitter.emit('update', importStatus);
    
    if (!req.file) {
      importStatus.isComplete = true;
      importStatus.inProgress = false;
      importStatus.errors.push("No file uploaded");
      importStatusEmitter.emit('update', importStatus);
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Clean up the file after reading
    fs.unlinkSync(filePath);
    
    const csvData = fileContent;
    
    // Parse CSV data
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true
    });
    
    if (records.length === 0) {
      return res.status(400).json({ error: "No valid records found in CSV" });
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
        const titleLower = record.Title?.toLowerCase() || "";
        let titleId = null;
        
        if (!titleLower) {
          results.errors.push(`Row ${i + 2}: Missing title`);
          continue;
        }
        
        // Check if title already exists
        if (titleMap.has(titleLower)) {
          titleId = titleMap.get(titleLower)?.id;
        } else {
          // Create new title
          const newTitle = {
            title: record.Title,
            category: record.Category || "General",
            description: ""
          };
          
          const [insertedTitle] = await db.insert(professionalSummaryTitles).values(newTitle).returning();
          titleId = insertedTitle.id;
          titleMap.set(titleLower, insertedTitle);
          results.titlesAdded++;
        }
        
        // Add description if it exists
        if (record.Description) {
          const newDescription = {
            content: record.Description,
            isRecommended: record["Is Recommended"]?.toLowerCase() === "yes",
            professionalSummaryTitleId: titleId
          };
          
          await db.insert(professionalSummaryDescriptions).values(newDescription);
          results.descriptionsAdded++;
        }
      } catch (error) {
        console.error(`Error processing row ${i + 2}:`, error);
        results.errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return res.status(200).json(results);
  } catch (error) {
    console.error("Error importing professional summaries from CSV:", error);
    return res.status(500).json({ error: "Failed to import professional summaries from CSV" });
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
          const newDescription = {
            content: record.description,
            isRecommended: !!record.isRecommended,
            professionalSummaryTitleId: titleId
          };
          
          await db.insert(professionalSummaryDescriptions).values(newDescription);
          results.descriptionsAdded++;
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
professionalSummaryRouter.get("/import-status", isAdmin, (req, res) => {
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

export { professionalSummaryRouter };