import { Router } from "express";

const router = Router();

/**
 * GET /api/resume/schema
 * Returns the schema for the resume data
 */
router.get("/resume/schema", (req, res) => {
  try {
    // Create a schema that matches the ResumeData interface
    const resumeSchema = {
      firstName: { type: "string", description: "First name" },
      surname: { type: "string", description: "Last name" },
      profession: { type: "string", description: "Professional title" },
      city: { type: "string", description: "City" },
      country: { type: "string", description: "Country" },
      postalCode: { type: "string", description: "Postal code" },
      phone: { type: "string", description: "Phone number" },
      email: { type: "string", description: "Email address" },
      photo: { type: "string", description: "Profile photo URL", nullable: true },
      summary: { type: "string", description: "Brief professional summary" },
      professionalSummary: { type: "string", description: "Detailed professional summary" },
      skills: {
        type: "array",
        items: { type: "string" },
        description: "List of professional skills"
      },
      workExperience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique identifier" },
            jobTitle: { type: "string", description: "Job title" },
            employer: { type: "string", description: "Employer name" },
            location: { type: "string", description: "Job location" },
            isRemote: { type: "boolean", description: "Remote work status" },
            startMonth: { type: "string", description: "Start month" },
            startYear: { type: "string", description: "Start year" },
            endMonth: { type: "string", description: "End month" },
            endYear: { type: "string", description: "End year" },
            isCurrentJob: { type: "boolean", description: "Current job status" },
            responsibilities: { type: "string", description: "Job responsibilities and achievements" }
          }
        },
        description: "Work experience history"
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique identifier" },
            schoolName: { type: "string", description: "Institution name" },
            schoolLocation: { type: "string", description: "School location" },
            degree: { type: "string", description: "Degree obtained" },
            fieldOfStudy: { type: "string", description: "Field of study" },
            graduationMonth: { type: "string", description: "Graduation month" },
            graduationYear: { type: "string", description: "Graduation year" },
            description: { type: "string", description: "Education description" },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique identifier" },
                  type: { type: "string", description: "Achievement type" },
                  title: { type: "string", description: "Achievement title" },
                  description: { type: "string", description: "Achievement description" }
                }
              },
              description: "Educational achievements"
            }
          }
        },
        description: "Education history"
      },
      certifications: {
        type: "array",
        items: { type: "object" },
        description: "Professional certifications"
      },
      languages: {
        type: "array",
        items: { type: "object" },
        description: "Language proficiencies"
      },
      selectedTemplateId: {
        type: "number",
        description: "Selected resume template ID"
      }
    };

    return res.status(200).json(resumeSchema);
  } catch (error) {
    console.error("Error fetching resume schema:", error);
    return res.status(500).json({ error: "Failed to fetch resume schema" });
  }
});

/**
 * GET /api/templates/:id/schema
 * Returns the schema for the resume data for a specific template
 */
router.get("/templates/:id/schema", (req, res) => {
  // This can be enhanced to return template-specific schema if needed
  // For now, we'll just return the same general schema
  try {
    // Create a schema that matches the ResumeData interface
    const resumeSchema = {
      firstName: { type: "string", description: "First name" },
      surname: { type: "string", description: "Last name" },
      profession: { type: "string", description: "Professional title" },
      city: { type: "string", description: "City" },
      country: { type: "string", description: "Country" },
      postalCode: { type: "string", description: "Postal code" },
      phone: { type: "string", description: "Phone number" },
      email: { type: "string", description: "Email address" },
      photo: { type: "string", description: "Profile photo URL", nullable: true },
      summary: { type: "string", description: "Brief professional summary" },
      professionalSummary: { type: "string", description: "Detailed professional summary" },
      skills: {
        type: "array",
        items: { type: "string" },
        description: "List of professional skills"
      },
      workExperience: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique identifier" },
            jobTitle: { type: "string", description: "Job title" },
            employer: { type: "string", description: "Employer name" },
            location: { type: "string", description: "Job location" },
            isRemote: { type: "boolean", description: "Remote work status" },
            startMonth: { type: "string", description: "Start month" },
            startYear: { type: "string", description: "Start year" },
            endMonth: { type: "string", description: "End month" },
            endYear: { type: "string", description: "End year" },
            isCurrentJob: { type: "boolean", description: "Current job status" },
            responsibilities: { type: "string", description: "Job responsibilities and achievements" }
          }
        },
        description: "Work experience history"
      },
      education: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Unique identifier" },
            schoolName: { type: "string", description: "Institution name" },
            schoolLocation: { type: "string", description: "School location" },
            degree: { type: "string", description: "Degree obtained" },
            fieldOfStudy: { type: "string", description: "Field of study" },
            graduationMonth: { type: "string", description: "Graduation month" },
            graduationYear: { type: "string", description: "Graduation year" },
            description: { type: "string", description: "Education description" },
            achievements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique identifier" },
                  type: { type: "string", description: "Achievement type" },
                  title: { type: "string", description: "Achievement title" },
                  description: { type: "string", description: "Achievement description" }
                }
              },
              description: "Educational achievements"
            }
          }
        },
        description: "Education history"
      },
      certifications: {
        type: "array",
        items: { type: "object" },
        description: "Professional certifications"
      },
      languages: {
        type: "array",
        items: { type: "object" },
        description: "Language proficiencies"
      },
      selectedTemplateId: {
        type: "number",
        description: "Selected resume template ID"
      }
    };

    return res.status(200).json(resumeSchema);
  } catch (error) {
    console.error("Error fetching resume schema:", error);
    return res.status(500).json({ error: "Failed to fetch resume schema" });
  }
});

export default router;