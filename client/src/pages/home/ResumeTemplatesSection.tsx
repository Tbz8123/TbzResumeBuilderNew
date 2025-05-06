import { useState } from "react";
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

// Enhanced template preview component using iframe
const TemplatePreview = ({ templateId }: { templateId: number }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retries, setRetries] = useState(0);
  
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
    }
  };

  // Create the URL to the template with a cache-busting parameter that changes on retry
  const templateUrl = `/api/templates/${templateId}/svg?_t=${Date.now()}_${retries}`;
  
  return (
    <div className="w-full h-full relative overflow-hidden rounded">
      <iframe
        src={templateUrl}
        title={`Template Preview ${templateId}`}
        className="w-full h-full border-0 absolute inset-0 z-10 bg-white scale-[0.63] origin-top-left"
        style={{ 
          transform: 'scale(0.63)',
          transformOrigin: 'top left',
          width: '159%', 
          height: '159%'
        }}
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-same-origin"
        loading="lazy"
      />
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 bg-opacity-90 z-20">
          <div className="text-center p-4">
            <p className="font-medium text-red-500">Failed to load preview</p>
          </div>
        </div>
      )}
    </div>
  );
};

const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  return (
    <div
      className="group rounded-xl overflow-hidden bg-white shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center p-4 scale-90 group-hover:scale-95 transition-all duration-300">
            <div className="w-full h-full overflow-hidden relative border border-gray-100 rounded">
              <TemplatePreview templateId={template.id} />
            </div>
          </div>
        </div>
        {template.isPopular && (
          <span className="absolute top-2 right-2 bg-primary text-white text-xs font-bold px-2 py-1 rounded">
            Popular
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900">{template.name}</h3>
        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
        <div 
          className="w-full h-1 mt-3 rounded-full"
          style={{ 
            background: `linear-gradient(to right, ${template.primaryColor}, ${template.secondaryColor})` 
          }}
        />
      </div>
    </div>
  );
};

const TemplateCardSkeleton = () => {
  return (
    <div className="rounded-xl overflow-hidden bg-white shadow-md">
      <div className="aspect-[4/5] overflow-hidden bg-gray-100">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-1 w-full mt-3 rounded-full" />
      </div>
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

  // Filter templates based on active filter
  const filteredTemplates = templatesData && Array.isArray(templatesData) 
    ? (activeFilter === "all" 
        ? templatesData 
        : templatesData.filter(template => template.category === activeFilter))
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