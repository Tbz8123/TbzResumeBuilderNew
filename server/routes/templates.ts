import { Router } from "express";
import { db } from "../../db";
import { resumeTemplates, resumeTemplateVersions, resumeTemplateSchema, resumeTemplateVersionSchema } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { isAdmin, isAuthenticated } from "../auth";
import { z } from "zod";

const router = Router();

// Get all templates (public route - available to all users)
router.get("/", async (req, res) => {
  try {
    const templates = await db.select({
      id: resumeTemplates.id,
      name: resumeTemplates.name,
      description: resumeTemplates.description,
      category: resumeTemplates.category,
      thumbnailUrl: resumeTemplates.thumbnailUrl,
      isPopular: resumeTemplates.isPopular,
      isActive: resumeTemplates.isActive,
      primaryColor: resumeTemplates.primaryColor,
      secondaryColor: resumeTemplates.secondaryColor,
      createdAt: resumeTemplates.createdAt,
    })
    .from(resumeTemplates)
    .where(
      // If not admin, only show active templates
      req.isAuthenticated() && req.user && req.user.isAdmin 
        ? undefined 
        : eq(resumeTemplates.isActive, true)
    )
    .orderBy(desc(resumeTemplates.createdAt));
    
    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a single template by ID
router.get("/:id", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const templates = await db.select().from(resumeTemplates)
      .where(
        and(
          eq(resumeTemplates.id, templateId),
          // If not admin, only show active templates
          req.isAuthenticated() && req.user && req.user.isAdmin 
            ? undefined 
            : eq(resumeTemplates.isActive, true)
        )
      )
      .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    res.json(templates[0]);
  } catch (error) {
    console.error("Error fetching template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template SVG content
router.get("/:id/svg", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Get the complete template to include name for fallback preview
    const templates = await db.select({
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name,
      primaryColor: resumeTemplates.primaryColor,
      secondaryColor: resumeTemplates.secondaryColor,
    })
    .from(resumeTemplates)
    .where(
      and(
        eq(resumeTemplates.id, templateId),
        // If not admin, only show active templates
        req.isAuthenticated() && req.user && req.user.isAdmin 
          ? undefined 
          : eq(resumeTemplates.isActive, true)
      )
    )
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Extract template details for possible fallback
    const template = templates[0];
    let content = template.svgContent || '';
    
    // Add security headers
    res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // Create a sample template based on template.name and type
    const getRandomTemplate = () => {
      // Templates collection based on template's characteristics
      const templates = [
        // Purple-themed "Cascade" style template - for creative roles
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
            .cascade-template { display: flex; width: 100%; height: 100vh; }
            .sidebar { background-color: ${template.primaryColor || '#5E17EB'}; width: 220px; color: white; padding: 30px 20px; }
            .main-content { flex: 1; padding: 40px; background: white; }
            h1, h2, h3 { margin: 0; }
            h1 { font-size: 24px; margin-bottom: 5px; }
            h2 { font-size: 18px; margin: 25px 0 10px; color: ${template.primaryColor || '#5E17EB'}; border-bottom: 2px solid ${template.secondaryColor || '#4A11C0'}; padding-bottom: 5px; }
            h3 { font-size: 16px; margin-bottom: 5px; }
            .sidebar h2 { color: white; border-bottom: 2px solid rgba(255,255,255,0.3); }
            p { margin: 0 0 5px; font-size: 14px; line-height: 1.5; }
            .contact-item { display: flex; align-items: center; margin-bottom: 10px; font-size: 14px; }
            .skill-bar { height: 6px; background: #e0e0e0; margin-bottom: 15px; border-radius: 3px; }
            .skill-level { height: 100%; background: ${template.secondaryColor || '#4A11C0'}; border-radius: 3px; }
            .job { margin-bottom: 20px; }
            .job-title { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .date { color: #666; font-style: italic; font-size: 14px; }
            .bullet { margin-left: 20px; position: relative; }
            .bullet:before { content: "•"; position: absolute; left: -15px; }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="cascade-template">
            <div class="sidebar">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 120px; height: 120px; border-radius: 60px; background-color: #eee; margin: 0 auto 15px; overflow: hidden;">
                  <div style="width: 100%; height: 100%; background-color: #ddd; display: flex; align-items: center; justify-content: center; font-size: 40px; color: #999;">JD</div>
                </div>
                <h1>John Doe</h1>
                <p>Senior UX Designer</p>
              </div>
              
              <h2>CONTACT</h2>
              <div class="contact-item">Email: john@example.com</div>
              <div class="contact-item">Phone: (123) 456-7890</div>
              <div class="contact-item">Location: San Francisco, CA</div>
              
              <h2>SKILLS</h2>
              <p>UX Design</p>
              <div class="skill-bar"><div class="skill-level" style="width: 95%;"></div></div>
              <p>UI/Visual Design</p>
              <div class="skill-bar"><div class="skill-level" style="width: 90%;"></div></div>
              <p>Prototyping</p>
              <div class="skill-bar"><div class="skill-level" style="width: 85%;"></div></div>
              <p>User Research</p>
              <div class="skill-bar"><div class="skill-level" style="width: 80%;"></div></div>
              <p>Figma</p>
              <div class="skill-bar"><div class="skill-level" style="width: 95%;"></div></div>
              
              <h2>EDUCATION</h2>
              <h3>Design University</h3>
              <p>B.A. Interactive Design</p>
              <p class="date">2014 - 2018</p>
            </div>
            
            <div class="main-content">
              <h2>EXPERIENCE</h2>
              
              <div class="job">
                <div class="job-title">
                  <h3>Senior UX Designer at TechCorp</h3>
                  <span class="date">2020 - Present</span>
                </div>
                <p class="bullet">Led redesign of flagship product resulting in 30% increase in user engagement</p>
                <p class="bullet">Conducted user research sessions to identify pain points and opportunities</p>
                <p class="bullet">Collaborated with engineers to implement design system across platforms</p>
                <p class="bullet">Mentored junior designers and facilitated design thinking workshops</p>
              </div>
              
              <div class="job">
                <div class="job-title">
                  <h3>UX Designer at InnovateCo</h3>
                  <span class="date">2018 - 2020</span>
                </div>
                <p class="bullet">Created user flows, wireframes, and prototypes for mobile applications</p>
                <p class="bullet">Developed style guides and component libraries to ensure consistency</p>
                <p class="bullet">Collaborated with product managers to define feature requirements</p>
              </div>
              
              <h2>PROJECTS</h2>
              
              <div class="job">
                <div class="job-title">
                  <h3>HealthTracker App Redesign</h3>
                </div>
                <p class="bullet">Redesigned health tracking app with focus on accessibility and simplicity</p>
                <p class="bullet">Increased user retention by 25% through improved onboarding flow</p>
              </div>
              
              <div class="job">
                <div class="job-title">
                  <h3>E-commerce Website Optimization</h3>
                </div>
                <p class="bullet">Streamlined checkout process reducing cart abandonment by 15%</p>
                <p class="bullet">Implemented responsive design principles for mobile-first approach</p>
              </div>
              
              <h2>CERTIFICATIONS</h2>
              <p class="bullet">Google UX Design Professional Certificate</p>
              <p class="bullet">Interaction Design Foundation UX Master Certification</p>
            </div>
          </div>
        </body>
        </html>`,

        // Clean minimal "Crisp" style template with teal accents - for corporate roles
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; color: #333; }
            .crisp-template { max-width: 800px; margin: 0 auto; padding: 40px; }
            .header { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
            h1 { font-size: 28px; margin: 0; color: #333; }
            h2 { font-size: 18px; color: ${template.primaryColor || '#0ca789'}; margin: 25px 0 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            h3 { font-size: 16px; margin: 0 0 5px; color: #444; }
            .subheader { color: #666; margin: 5px 0; }
            .contact-info { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 10px; }
            .contact-info div { display: flex; align-items: center; color: #666; font-size: 14px; }
            .contact-item:before { content: "•"; margin-right: 5px; color: ${template.secondaryColor || '#0a8c72'}; }
            .timeline-item { margin-bottom: 20px; position: relative; }
            .timeline-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .timeline-date { color: #888; font-size: 14px; text-align: right; }
            .timeline-content { margin-left: 15px; }
            .timeline-content p { margin: 5px 0; font-size: 14px; line-height: 1.4; }
            .skills-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .skill-item { background: #f5f5f5; padding: 8px 12px; border-radius: 4px; font-size: 14px; }
            .bullet { position: relative; padding-left: 15px; font-size: 14px; margin-bottom: 5px; line-height: 1.4; }
            .bullet:before { content: "•"; position: absolute; left: 0; color: ${template.primaryColor || '#0ca789'}; }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="crisp-template">
            <div class="header">
              <h1>Alex Johnson</h1>
              <div class="subheader">Marketing Specialist</div>
              <div class="contact-info">
                <div class="contact-item">alex@example.com</div>
                <div class="contact-item">(555) 123-4567</div>
                <div class="contact-item">Boston, MA</div>
                <div class="contact-item">linkedin.com/in/alexjohnson</div>
              </div>
            </div>
            
            <h2>Professional Experience</h2>
            
            <div class="timeline-item">
              <div class="timeline-header">
                <h3>Senior Marketing Specialist</h3>
                <div class="timeline-date">Mar 2020 - Present</div>
              </div>
              <div class="subheader">Global Marketing Solutions</div>
              <div class="timeline-content">
                <p class="bullet">Developed comprehensive marketing campaigns that increased customer engagement by 45%</p>
                <p class="bullet">Managed social media strategy across 5 platforms, growing follower base by 10,000+ annually</p>
                <p class="bullet">Collaborated with product teams to create targeted messaging strategies for new features</p>
                <p class="bullet">Led email marketing initiatives with a 25% average open rate and 3.5% CTR</p>
              </div>
            </div>
            
            <div class="timeline-item">
              <div class="timeline-header">
                <h3>Marketing Coordinator</h3>
                <div class="timeline-date">Jun 2018 - Feb 2020</div>
              </div>
              <div class="subheader">Innovative Marketing Inc.</div>
              <div class="timeline-content">
                <p class="bullet">Assisted in creating content calendar for blog posts, social media, and email campaigns</p>
                <p class="bullet">Conducted market research to identify trends and opportunities for growth</p>
                <p class="bullet">Maintained and updated CRM database of 5,000+ contacts</p>
              </div>
            </div>
            
            <h2>Education</h2>
            
            <div class="timeline-item">
              <div class="timeline-header">
                <h3>Bachelor of Science in Marketing</h3>
                <div class="timeline-date">2014 - 2018</div>
              </div>
              <div class="subheader">State University</div>
              <div class="timeline-content">
                <p class="bullet">Graduated with honors (3.8 GPA)</p>
                <p class="bullet">Marketing Club President</p>
              </div>
            </div>
            
            <h2>Skills</h2>
            
            <div class="skills-grid">
              <div class="skill-item">Social Media Marketing</div>
              <div class="skill-item">Content Strategy</div>
              <div class="skill-item">Google Analytics</div>
              <div class="skill-item">SEO/SEM</div>
              <div class="skill-item">Email Marketing</div>
              <div class="skill-item">Project Management</div>
              <div class="skill-item">Copywriting</div>
              <div class="skill-item">Data Analysis</div>
              <div class="skill-item">Adobe Creative Suite</div>
              <div class="skill-item">CRM Software</div>
            </div>
            
            <h2>Certifications</h2>
            <p class="bullet">Google Analytics Individual Qualification</p>
            <p class="bullet">HubSpot Content Marketing Certification</p>
            <p class="bullet">Facebook Blueprint Certification</p>
          </div>
        </body>
        </html>`,

        // Geometric "Cubic" style template with gold accents - for professional/executive roles
        `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { 
              margin: 0; padding: 0; 
              font-family: 'Georgia', serif; 
              color: #333;
              background-color: #fbfbfb;
            }
            .cubic-template { 
              width: 100%; 
              max-width: 800px; 
              margin: 0 auto; 
              background-color: white;
              box-shadow: 0 1px 5px rgba(0,0,0,0.05);
              display: flex;
            }
            .cubic-template .sidebar {
              width: 33%;
              padding: 40px 20px;
              background-color: ${template.primaryColor || '#84754e'};
              color: white;
            }
            .cubic-template .main {
              width: 67%;
              padding: 40px;
            }
            h1 { font-size: 24px; font-weight: normal; margin: 0 0 5px; letter-spacing: 1px; }
            h2 { 
              font-size: 14px; 
              text-transform: uppercase; 
              letter-spacing: 2px; 
              color: ${template.primaryColor || '#84754e'}; 
              margin: 30px 0 15px; 
              padding-bottom: 5px; 
              border-bottom: 1px solid ${template.secondaryColor || '#e0d5b3'};
              font-weight: bold;
            }
            .sidebar h2 { color: white; border-bottom-color: rgba(255,255,255,0.3); }
            h3 { font-size: 16px; margin: 0 0 5px; font-weight: normal; }
            p { margin: 0 0 10px; font-size: 14px; line-height: 1.5; }
            .contact-item { margin-bottom: 8px; font-size: 14px; }
            .job { margin-bottom: 25px; }
            .job-title { display: flex; justify-content: space-between; font-style: italic; color: #666; margin-bottom: 10px; }
            .job-details { margin-left: 0; }
            .job-details p { position: relative; padding-left: 15px; margin-bottom: 5px; }
            .job-details p:before { content: "•"; position: absolute; left: 0; color: ${template.primaryColor || '#84754e'}; }
            .profile { margin-bottom: 30px; }
            .skill-item { margin-bottom: 10px; }
            .skill-name { margin-bottom: 3px; }
            .skill-bar { height: 4px; background: rgba(255,255,255,0.2); position: relative; }
            .skill-level { height: 100%; background: white; position: absolute; top: 0; left: 0; }
          </style>
          <title>${template.name} Resume Template</title>
        </head>
        <body>
          <div class="cubic-template">
            <div class="sidebar">
              <div style="margin-bottom: 30px;">
                <h1>ASHLEY MCLEOD</h1>
                <p>Financial Analyst</p>
              </div>
              
              <div>
                <h2>Contact</h2>
                <div class="contact-item">ashley@example.com</div>
                <div class="contact-item">(555) 987-6543</div>
                <div class="contact-item">Chicago, IL</div>
                <div class="contact-item">linkedin.com/in/ashleym</div>
              </div>
              
              <div>
                <h2>Skills</h2>
                <div class="skill-item">
                  <div class="skill-name">Financial Modeling</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 95%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">Data Analysis</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 90%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">Financial Reporting</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 85%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">Forecasting</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 80%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">Excel/VBA</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 95%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">Power BI</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 85%;"></div></div>
                </div>
                <div class="skill-item">
                  <div class="skill-name">SQL</div>
                  <div class="skill-bar"><div class="skill-level" style="width: 80%;"></div></div>
                </div>
              </div>
              
              <div>
                <h2>Certifications</h2>
                <div class="contact-item">CFA Level II Candidate</div>
                <div class="contact-item">Financial Modeling Certificate</div>
                <div class="contact-item">Bloomberg Market Concepts</div>
              </div>
            </div>
            
            <div class="main">
              <div class="profile">
                <h2>Professional Profile</h2>
                <p>Dedicated Financial Analyst with 5+ years of experience in financial modeling, forecasting, and data analysis. Adept at providing strategic insights to inform business decisions and optimize financial performance.</p>
              </div>
              
              <div>
                <h2>Experience</h2>
                
                <div class="job">
                  <h3>Senior Financial Analyst</h3>
                  <div class="job-title">
                    <span>Global Financial Group</span>
                    <span>2020 - Present</span>
                  </div>
                  <div class="job-details">
                    <p>Developed complex financial models that improved forecast accuracy by 15%</p>
                    <p>Generated monthly financial reports and presented findings to executive leadership</p>
                    <p>Led budget planning process for department with $5M annual budget</p>
                    <p>Performed variance analysis to identify performance trends and opportunities</p>
                    <p>Collaborated with cross-functional teams to implement cost-saving initiatives</p>
                  </div>
                </div>
                
                <div class="job">
                  <h3>Financial Analyst</h3>
                  <div class="job-title">
                    <span>Business Solutions Inc.</span>
                    <span>2017 - 2020</span>
                  </div>
                  <div class="job-details">
                    <p>Conducted financial analysis to assess investment opportunities and risks</p>
                    <p>Created automated dashboards to track key performance indicators</p>
                    <p>Assisted in preparing quarterly financial statements and investor presentations</p>
                    <p>Supported annual budgeting and quarterly forecasting processes</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h2>Education</h2>
                
                <div class="job">
                  <h3>Master of Science in Finance</h3>
                  <div class="job-title">
                    <span>University of Finance</span>
                    <span>2015 - 2017</span>
                  </div>
                  <div class="job-details">
                    <p>GPA: 3.9/4.0</p>
                    <p>Finance Club Treasurer</p>
                  </div>
                </div>
                
                <div class="job">
                  <h3>Bachelor of Business Administration</h3>
                  <div class="job-title">
                    <span>State University</span>
                    <span>2011 - 2015</span>
                  </div>
                  <div class="job-details">
                    <p>Major: Finance, Minor: Economics</p>
                    <p>Dean's List: All semesters</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>`
      ];
      
      // Select a template based on the name or pick a random one if we can't determine
      const templateIndex = templateId % templates.length;
      return templates[templateIndex];
    };

    // If content is empty or too short, provide a fallback
    if (!content || content.trim().length < 50) {
      try {
        const fallbackContent = getRandomTemplate();
        
        // Set appropriate content type
        res.setHeader('Content-Type', 'text/html');
        res.send(fallbackContent);
        console.log(`Serving generated template for ${templateId} as text/html`);
        return;
      } catch (err) {
        console.error("Error generating fallback template:", err);
        // If the fallback template generation fails, we'll continue with the regular flow
      }
    }
    
    // Check if content is SVG or HTML
    if (content.trim().startsWith('<svg') || content.trim().startsWith('<?xml')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    } else if (content.trim().startsWith('<!DOCTYPE html>') || content.trim().startsWith('<html')) {
      // Add CSP meta tag for HTML content if not present
      if (!content.includes('<meta http-equiv="Content-Security-Policy"')) {
        const metaTag = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; img-src \'self\' data:; style-src \'self\' \'unsafe-inline\'; font-src \'self\'; script-src \'none\';">';
        content = content.replace('<head>', '<head>' + metaTag);
      }
      
      // Add proper viewport meta tag for responsive display if not present
      if (!content.includes('<meta name="viewport"')) {
        const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        content = content.replace('<head>', '<head>' + viewportTag);
      }
      
      res.setHeader('Content-Type', 'text/html');
    } else {
      // If content doesn't look like SVG or HTML, try to wrap it in an HTML document
      content = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self'; script-src 'none';">
        <title>${template.name} Template</title>
        <style>
          body { 
            margin: 0; 
            padding: 0; 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: #fff;
            color: #333;
          }
          .container {
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${content}
        </div>
      </body>
      </html>`;
      
      res.setHeader('Content-Type', 'text/html');
    }
    
    // Log content type for debugging
    console.log(`Serving template ${templateId} as ${res.getHeader('Content-Type')}`);
    
    res.send(content);
  } catch (error) {
    console.error("Error fetching template content:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get template preview image
router.get("/:id/preview", async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    // Get template with both thumbnailUrl and svgContent
    const templates = await db.select({
      thumbnailUrl: resumeTemplates.thumbnailUrl,
      svgContent: resumeTemplates.svgContent,
      name: resumeTemplates.name
    })
    .from(resumeTemplates)
    .where(
      and(
        eq(resumeTemplates.id, templateId),
        // If not admin, only show active templates
        req.isAuthenticated() && req.user && req.user.isAdmin 
          ? undefined 
          : eq(resumeTemplates.isActive, true)
      )
    )
    .limit(1);
    
    if (templates.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }

    const template = templates[0];
    
    // If template has a thumbnailUrl, redirect to it
    if (template.thumbnailUrl) {
      return res.redirect(template.thumbnailUrl);
    }
    
    // If the template has SVG content, convert to a simpler SVG preview
    if (template.svgContent) {
      // Create a simple preview image based on the template name
      const previewSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
        <rect width="100%" height="100%" fill="#f1f5f9" />
        <rect x="40" y="40" width="320" height="120" fill="#ffffff" rx="8" stroke="#e2e8f0" stroke-width="2" />
        <text x="200" y="100" font-family="Arial" font-size="24" text-anchor="middle" fill="#0f172a" font-weight="bold">${template.name}</text>
        
        <rect x="40" y="180" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="40" y="230" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="40" y="280" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <rect x="40" y="340" width="150" height="180" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        <rect x="210" y="340" width="150" height="180" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <rect x="40" y="540" width="320" height="40" fill="#ffffff" rx="6" stroke="#e2e8f0" stroke-width="2" />
        
        <text x="200" y="570" font-family="Arial" font-size="14" text-anchor="middle" fill="#64748b">Resume Template</text>
      </svg>
      `;
      
      res.setHeader('Content-Type', 'image/svg+xml');
      res.send(previewSvg);
      return;
    }
    
    // If all else fails, serve a default placeholder image
    const placeholderSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600">
      <rect width="100%" height="100%" fill="#f8f9fa" />
      <rect x="50" y="50" width="300" height="80" fill="#e9ecef" rx="4" />
      <rect x="50" y="150" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="190" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="230" width="300" height="30" fill="#e9ecef" rx="4" />
      <rect x="50" y="290" width="140" height="180" fill="#e9ecef" rx="4" />
      <rect x="210" y="290" width="140" height="180" fill="#e9ecef" rx="4" />
      <rect x="50" y="490" width="300" height="60" fill="#e9ecef" rx="4" />
      <text x="200" y="320" font-family="Arial" font-size="20" text-anchor="middle" fill="#6c757d">Template Preview</text>
    </svg>
    `;
    
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(placeholderSvg);
  } catch (error) {
    console.error("Error fetching template preview:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ADMIN ROUTES

// Create a new template (admin only)
router.post("/", isAdmin, async (req, res) => {
  try {
    console.log("Creating template with data:", req.body);
    
    // Create a clean object with only the needed fields
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      svgContent: req.body.svgContent,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isPopular: req.body.isPopular !== undefined ? req.body.isPopular : false,
      primaryColor: req.body.primaryColor || "#5E17EB",
      secondaryColor: req.body.secondaryColor || "#4A11C0",
      thumbnailUrl: req.body.thumbnailUrl || null,
    };
    
    const validatedData = resumeTemplateSchema.parse(templateData);
    
    const [template] = await db.insert(resumeTemplates)
      .values(validatedData)
      .returning();
    
    // Also create the first version
    await db.insert(resumeTemplateVersions).values({
      templateId: template.id,
      versionNumber: 1,
      svgContent: template.svgContent,
      createdById: req.user?.id,
      changelog: "Initial version",
    });
    
    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error creating template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Update a template (admin only)
router.put("/:id", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    console.log("Updating template with ID:", templateId, "and data:", req.body);
    
    // Create a clean object with only the needed fields
    const templateData = {
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      svgContent: req.body.svgContent,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isPopular: req.body.isPopular !== undefined ? req.body.isPopular : false,
      primaryColor: req.body.primaryColor || "#5E17EB",
      secondaryColor: req.body.secondaryColor || "#4A11C0",
      thumbnailUrl: req.body.thumbnailUrl || null,
    };
    
    const validatedData = resumeTemplateSchema.parse(templateData);
    
    // Check if the template exists
    const existingTemplate = await db.select({ id: resumeTemplates.id })
      .from(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId))
      .limit(1);
      
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Get the latest version number
    const versionResult = await db.select({ 
      versionNumber: resumeTemplateVersions.versionNumber 
    })
    .from(resumeTemplateVersions)
    .where(eq(resumeTemplateVersions.templateId, templateId))
    .orderBy(desc(resumeTemplateVersions.versionNumber))
    .limit(1);
    
    const nextVersionNumber = versionResult.length > 0 ? versionResult[0].versionNumber + 1 : 1;
    
    // Update the template
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    // Create a new version
    await db.insert(resumeTemplateVersions).values({
      templateId: templateId,
      versionNumber: nextVersionNumber,
      svgContent: validatedData.svgContent,
      createdById: req.user?.id,
      changelog: req.body.changelog || `Version ${nextVersionNumber}`,
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Validation error:", error.errors);
      return res.status(400).json({ message: "Validation error", errors: error.errors });
    }
    console.error("Error updating template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete a template (admin only)
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    // Check if the template exists
    const existingTemplate = await db.select({ id: resumeTemplates.id })
      .from(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId))
      .limit(1);
      
    if (existingTemplate.length === 0) {
      return res.status(404).json({ message: "Template not found" });
    }
    
    // Delete all versions first (due to foreign key constraint)
    await db.delete(resumeTemplateVersions)
      .where(eq(resumeTemplateVersions.templateId, templateId));
    
    // Delete the template
    await db.delete(resumeTemplates)
      .where(eq(resumeTemplates.id, templateId));
    
    res.status(204).end();
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get all versions of a template (admin only)
router.get("/:id/versions", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    if (isNaN(templateId)) {
      return res.status(400).json({ message: "Invalid template ID" });
    }
    
    const versions = await db.select().from(resumeTemplateVersions)
      .where(eq(resumeTemplateVersions.templateId, templateId))
      .orderBy(desc(resumeTemplateVersions.versionNumber));
    
    res.json(versions);
  } catch (error) {
    console.error("Error fetching template versions:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Get a specific version of a template (admin only)
router.get("/:id/versions/:versionNumber", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    if (isNaN(templateId) || isNaN(versionNumber)) {
      return res.status(400).json({ message: "Invalid template ID or version number" });
    }
    
    const versions = await db.select().from(resumeTemplateVersions)
      .where(
        and(
          eq(resumeTemplateVersions.templateId, templateId),
          eq(resumeTemplateVersions.versionNumber, versionNumber)
        )
      )
      .limit(1);
    
    if (versions.length === 0) {
      return res.status(404).json({ message: "Version not found" });
    }
    
    res.json(versions[0]);
  } catch (error) {
    console.error("Error fetching template version:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Restore a previous version (admin only)
router.post("/:id/versions/:versionNumber/restore", isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const versionNumber = parseInt(req.params.versionNumber);
    
    if (isNaN(templateId) || isNaN(versionNumber)) {
      return res.status(400).json({ message: "Invalid template ID or version number" });
    }
    
    // Get the version to restore
    const versions = await db.select({
      svgContent: resumeTemplateVersions.svgContent,
    })
    .from(resumeTemplateVersions)
    .where(
      and(
        eq(resumeTemplateVersions.templateId, templateId),
        eq(resumeTemplateVersions.versionNumber, versionNumber)
      )
    )
    .limit(1);
    
    if (versions.length === 0) {
      return res.status(404).json({ message: "Version not found" });
    }
    
    // Update the template with the old version's SVG content
    const [updatedTemplate] = await db.update(resumeTemplates)
      .set({
        svgContent: versions[0].svgContent,
        updatedAt: new Date(),
      })
      .where(eq(resumeTemplates.id, templateId))
      .returning();
    
    // Get the latest version number
    const versionResult = await db.select({ 
      versionNumber: resumeTemplateVersions.versionNumber 
    })
    .from(resumeTemplateVersions)
    .where(eq(resumeTemplateVersions.templateId, templateId))
    .orderBy(desc(resumeTemplateVersions.versionNumber))
    .limit(1);
    
    const nextVersionNumber = versionResult[0].versionNumber + 1;
    
    // Create a new version entry for the restoration
    await db.insert(resumeTemplateVersions).values({
      templateId: templateId,
      versionNumber: nextVersionNumber,
      svgContent: versions[0].svgContent,
      createdById: req.user?.id,
      changelog: `Restored from version ${versionNumber}`,
    });
    
    res.json(updatedTemplate);
  } catch (error) {
    console.error("Error restoring template version:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;