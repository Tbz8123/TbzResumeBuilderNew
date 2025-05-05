// Brand Information
export const BRAND = {
  name: "TbzResumeBuilder",
  fullName: "TbzResumeBuilder",
  description: "Professional resume and cover letter builder to help you land your dream job.",
  logo: {
    symbol: "", // The logo is now completely text-based with gradient
    bgColor: "", // No background color needed
    textColor: "", // Text color is handled with gradients in the component
  },
  social: {
    facebook: "#",
    twitter: "#",
    instagram: "#",
    linkedin: "#",
  }
};

// Navigation Items
export const NAV_ITEMS = [
  { 
    name: "Tools", 
    href: "#tools",
    dropdownItems: [
      { name: "Resume Checker", href: "#resume-checker" },
      { name: "Cover Letter Generator", href: "#cover-letter-generator" },
      { name: "Job Description Analyzer", href: "#job-description-analyzer" },
      { name: "Skills Matcher", href: "#skills-matcher" }
    ]
  },
  { 
    name: "Resume", 
    href: "#resume",
    dropdownItems: [
      { name: "Resume Builder", href: "#resume-builder" },
      { name: "Resume Templates", href: "#resume-templates" },
      { name: "Resume Examples", href: "#resume-examples" },
      { name: "Resume Format", href: "#resume-format" }
    ]
  },
  { 
    name: "CV", 
    href: "#cv",
    dropdownItems: [
      { name: "CV Builder", href: "#cv-builder" },
      { name: "CV Templates", href: "#cv-templates" },
      { name: "CV Examples", href: "#cv-examples" }
    ]
  },
  { 
    name: "Cover Letter", 
    href: "#cover-letter",
    dropdownItems: [
      { name: "Cover Letter Builder", href: "#cover-letter-builder" },
      { name: "Cover Letter Templates", href: "#cover-letter-templates" },
      { name: "Cover Letter Examples", href: "#cover-letter-examples" }
    ]
  },
  { 
    name: "Career Blog", 
    href: "#career-blog",
    dropdownItems: [
      { name: "Resume Tips", href: "#resume-tips" },
      { name: "Job Search", href: "#job-search" },
      { name: "Interview Prep", href: "#interview-prep" },
      { name: "Career Advice", href: "#career-advice" }
    ]
  },
  { 
    name: "About", 
    href: "#about",
    dropdownItems: [
      { name: "Our Story", href: "#our-story" },
      { name: "Testimonials", href: "#testimonials" },
      { name: "Contact Us", href: "#contact-us" }
    ]
  }
];

// Stats Information
export const STATS = [
  { value: "41M+", label: "Resumes Created" },
  { value: "1000+", label: "Resume Templates" },
  { value: "400K+", label: "Cover Letters Built" },
  { value: "110+", label: "Job Categories" },
];

// Theme Colors - for reference
export const THEME_COLORS = {
  primary: "#5E17EB",
  primaryLight: "#7E3FFF",
  primaryDark: "#4A11C0",
  secondary: "#FFCC00",
  grayLight: "#F8F9FA",
  grayMedium: "#E9ECEF",
  grayDark: "#6C757D",
  textDark: "#212529",
};