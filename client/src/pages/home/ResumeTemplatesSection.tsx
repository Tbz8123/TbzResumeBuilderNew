import { useState, useRef, useCallback, useEffect } from "react";
import { useTemplates } from "@/hooks/use-templates";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useLocation } from "wouter";
import { LargeHeading, Subheading, FullWidthSection, AppleButton } from "@/components/ui/AppleStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeTemplate } from "@shared/schema";
import { Loader2 } from "lucide-react";

type TemplateFilterProps = {
  categories: { id: string; label: string }[];
  activeFilter: string;
  onFilterChange: (filter: string) => void;
};

const TemplateFilter = ({ categories, activeFilter, onFilterChange }: TemplateFilterProps) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-10">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
            activeFilter === category.id
              ? "bg-primary text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          {category.label}
        </button>
      ))}
    </div>
  );
};

type TemplateCardProps = {
  template: ResumeTemplate;
  onClick: () => void;
};

// Enhanced template preview that supports both SVG and PDF rendering
const TemplatePreview = ({ 
  templateId, 
  onError 
}: { 
  templateId: number,
  onError?: () => void 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [templateData, setTemplateData] = useState<ResumeTemplate | null>(null);
  
  const handleLoad = () => {
    setIsLoading(false);
  };
  
  const handleError = () => {
    // If we haven't retried, try once more
    if (retries < 2) {
      setTimeout(() => {
        setRetries(retries + 1);
      }, 1000);
    } else {
      setError(true);
      setIsLoading(false);
      if (onError) {
        onError();
      }
    }
  };

  // Fetch full template data to get displayScale
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
          const data = await response.json();
          setTemplateData(data);
        }
      } catch (err) {
        console.error("Error fetching template data:", err);
      }
    };
    
    fetchTemplateData();
  }, [templateId]);

  // Check if there's a PDF version available
  useEffect(() => {
    const checkPdf = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}/pdf?_t=${Date.now()}`);
        if (response.ok) {
          const data = await response.text();
          setPdfContent(data);
          setHasPdf(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.log("No PDF version available, using SVG");
      }
    };
    
    checkPdf();
  }, [templateId]);

  // Create the URL to the template with a cache-busting parameter
  const templateUrl = `/api/templates/${templateId}/svg?_t=${Date.now()}_${retries}`;
  
  // Calculate custom scale if available from template data
  // Increased the default scale to ensure templates fill the container better
  const scale = templateData?.displayScale ? parseFloat(templateData.displayScale) : 0.28;
  
  // Calculate dimensions if available from template data
  const width = templateData?.width || 800;
  const height = templateData?.height || 1100;
  const aspectRatio = templateData?.aspectRatio || '0.73';
  
  // Create custom style with scaling and dimensions
  const customStyle = {
    transform: `scale(${scale})`,
    transformOrigin: "top center", // Use top center for better alignment
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: '100%',
    maxHeight: '100%',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
  
  return (
    <>
      {hasPdf && pdfContent ? (
        <div className="resume-content" style={customStyle}>
          <iframe
            src={`data:application/pdf;base64,${pdfContent}`}
            title={`PDF Template Preview ${templateId}`}
            style={{width: '100%', height: '100%', border: 'none'}}
            onLoad={handleLoad}
            onError={handleError}
          />
        </div>
      ) : (
        <div className="resume-content" style={customStyle}>
          <iframe
            src={templateUrl}
            title={`Template Preview ${templateId}`}
            style={{width: '100%', height: '100%', border: 'none'}}
            onLoad={handleLoad}
            onError={handleError}
            sandbox="allow-same-origin"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
          <div className="text-center p-4">
            <p className="font-medium text-red-500">Failed to load preview</p>
          </div>
        </div>
      )}
    </>
  );
};

const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  const [previewError, setPreviewError] = useState(false);
  
  // Log template data for debugging
  useEffect(() => {
    const hasHtmlContent = typeof template.htmlContent === 'string' && template.htmlContent.length > 0;
    const hasSvgContent = typeof template.svgContent === 'string' && template.svgContent.length > 0;
    
    console.log(`Template card for ID ${template.id}:`, {
      name: template.name,
      htmlContent: hasHtmlContent,
      svgContent: hasSvgContent,
      dimensions: {
        width: template.width,
        height: template.height,
        aspectRatio: template.aspectRatio
      }
    });
  }, [template]);
  
  // Calculate aspect ratio for the container
  const aspectRatio = template.aspectRatio || "0.73"; // Default A4 ratio if not specified
  
  // Create styles for the template preview container
  const templateContainerStyle = {
    position: 'relative' as const,
    backgroundColor: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    cursor: 'pointer',
    width: '100%',
    aspectRatio: aspectRatio,
    // Removed padding to allow template to fill the entire card
  };
  
  // Style for the document inside the container
  const documentStyle = {
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    overflow: 'hidden',
  };
  
  return (
    <div 
      className="flex flex-col group hover:shadow-xl transition-shadow duration-300 rounded-lg bg-white"
      onClick={onClick}
    >
      <div style={templateContainerStyle} className="template-preview-container group-hover:shadow-lg">
        <div style={documentStyle} className="resume-document">
          {previewError ? (
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500 text-sm">
                Preview unavailable
              </p>
            </div>
          ) : (
            <TemplatePreview 
              templateId={template.id} 
              onError={() => setPreviewError(true)}
            />
          )}
        </div>
        
        {template.isPopular && (
          <div className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded-full z-10">
            Popular
          </div>
        )}
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/20 z-20">
          <button className="bg-primary hover:bg-primary-dark text-white font-medium py-2 px-4 rounded-md transition-colors">
            Use This Template
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-bold text-lg text-gray-800">{template.name}</h3>
        <p className="text-gray-600 text-sm mt-1">{template.description}</p>
      </div>
      
      <div className="h-1 w-full bg-primary mt-auto"></div>
    </div>
  );
};

const TemplateCardSkeleton = () => {
  // Calculate aspect ratio for the container (using A4 default)
  const aspectRatio = "0.73";
  
  // Create styles for the template preview container
  const templateContainerStyle = {
    position: 'relative' as const,
    backgroundColor: 'white',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    borderRadius: '0.5rem',
    overflow: 'hidden',
    width: '100%',
    aspectRatio: aspectRatio,
    // Removed padding to allow template to fill the entire card
  };
  
  return (
    <div className="flex flex-col rounded-lg bg-white">
      <div style={templateContainerStyle} className="mb-4">
        <Skeleton className="w-full h-full rounded" />
      </div>
      <div className="p-4">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full mt-2" />
      </div>
      <div className="h-1 w-full bg-gray-200 mt-auto"></div>
    </div>
  );
};

const ResumeTemplatesSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  const [, navigate] = useLocation();
  
  // Fetch templates from the API
  const { data: templatesData, isLoading, error } = useTemplates();
  
  const categories = [
    { id: "all", label: "All Templates" },
    { id: "professional", label: "Professional" },
    { id: "creative", label: "Creative" },
    { id: "simple", label: "Simple" },
    { id: "modern", label: "Modern" },
    { id: "executive", label: "Executive" },
    { id: "tech", label: "Tech" },
  ];

  // A4 size in pixels (at 96 DPI) is approximately 794 × 1123
  const A4_WIDTH = 794;
  const A4_HEIGHT = 1123;
  // Allow some tolerance for A4 sizes (±5%)
  const WIDTH_TOLERANCE = 40;
  const HEIGHT_TOLERANCE = 56;
  
  // Helper to check if a template is A4 sized
  const isA4Size = (template: ResumeTemplate): boolean => {
    // If no dimensions are set, assume it's valid (for backward compatibility)
    if (!template.width || !template.height) return true;
    
    // Check if dimensions are within tolerance of A4 size
    return (
      Math.abs(template.width - A4_WIDTH) <= WIDTH_TOLERANCE &&
      Math.abs(template.height - A4_HEIGHT) <= HEIGHT_TOLERANCE
    );
  };
  
  // For debugging
  console.log("Available templates:", templatesData);
  
  // Filter templates based on active filter and A4 size
  // For now, we're disabling the A4 size filter to allow all templates to be displayed
  const filteredTemplates = templatesData && Array.isArray(templatesData) 
    ? (templatesData
        // Filter by category if not "all"
        .filter(template => activeFilter === "all" || template.category === activeFilter))
    : [];

  const handleTemplateClick = (template: ResumeTemplate) => {
    // Navigate to the template detail page or start the resume builder
    navigate("/experience-level");
  };

  return (
    <FullWidthSection
      className="py-20"
      id="resume-templates"
    >
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fadeInUp" className="text-center mb-16">
          <LargeHeading centered>
            Stand Out With Our Premium Templates
          </LargeHeading>
          <Subheading centered className="max-w-3xl mx-auto">
            Choose from our collection of professionally designed and ATS-optimized resume templates to make your application shine.
          </Subheading>
        </AnimatedSection>

        <TemplateFilter 
          categories={categories} 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter} 
        />

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {[...Array(8)].map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-500">Failed to load templates. Please try again later.</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-10">
            <p>No templates available in this category yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {filteredTemplates.map((template) => (
              <TemplateCard 
                key={template.id} 
                template={template} 
                onClick={() => handleTemplateClick(template)} 
              />
            ))}
          </div>
        )}

        {/* CTA Button */}
        <div className="text-center">
          <AppleButton
            variant="primary"
            size="large"
            href="/experience-level"
            className="bg-primary hover:bg-primary-dark text-white"
          >
            Create Your Resume Now
          </AppleButton>
        </div>
      </div>
    </FullWidthSection>
  );
};

export default ResumeTemplatesSection;