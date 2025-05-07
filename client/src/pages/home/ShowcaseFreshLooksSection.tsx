import { useState, useEffect, useRef } from "react";
import { useTemplates } from "@/hooks/use-templates";
import { AnimatedSection } from "@/components/AnimatedSection";
import { FullWidthSection } from "@/components/ui/AppleStyles";
import { Skeleton } from "@/components/ui/skeleton";
import { ResumeTemplate } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { useLocation } from "wouter";

// Component to preview a template
const TemplatePreview = ({
  templateId,
  onError
}: {
  templateId: number;
  onError?: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setTemplate(data);
      } catch (e) {
        console.error("Template preview fetch error:", e);
        setError(true);
        if (onError) onError();
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplate();
  }, [templateId, onError]);

  useEffect(() => {
    if (!template || !iframeRef.current) return;

    try {
      const doc = iframeRef.current.contentDocument;
      if (!doc) return;

      // Set content
      doc.open();
      doc.write(template.htmlContent || '');
      doc.close();

      // Apply a zoom to fit the template in the iframe
      const html = doc.documentElement;
      if (html) {
        html.style.transformOrigin = 'top left';
        html.style.transform = 'scale(1)';
        html.style.width = '100%';
        html.style.height = '100%';
        html.style.overflow = 'hidden';
      }
    } catch (e) {
      console.error("Error rendering template:", e);
      setError(true);
      if (onError) onError();
    }
  }, [template, onError]);

  return (
    <div className="w-full h-full absolute inset-0 bg-white overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-30">
          <div className="text-center p-4">
            <p className="font-medium text-red-500">Preview failed</p>
          </div>
        </div>
      )}
      {!error && !isLoading && template?.htmlContent && (
      <iframe
        ref={iframeRef}
        sandbox="allow-same-origin"
        className="w-full h-full border-0 pointer-events-none"
        style={{ backgroundColor: 'white' }}
      />
      )}
    </div>
  );
};

// TemplateCard component
type TemplateCardProps = {
  template: ResumeTemplate;
  onClick: () => void;
};

const TemplateCard = ({ template, onClick }: TemplateCardProps) => {
  const [previewError, setPreviewError] = useState(false);
  
  // Create styles for the fresh looks template card
  const cardStyle = {
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: '12px',
    backgroundColor: 'white',
    aspectRatio: '3/4', // Taller card as shown in the screenshot
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  };
  
  return (
    <div 
      style={cardStyle}
      className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
      onClick={onClick}
    >
      <div className="w-full h-full">
        {previewError ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 text-sm">Preview unavailable</p>
          </div>
        ) : (
          <TemplatePreview 
            templateId={template.id} 
            onError={() => setPreviewError(true)}
          />
        )}
      </div>
      
      {/* Hover overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 z-20">
        <button className="bg-white hover:bg-gray-100 text-primary font-medium py-2 px-6 rounded-full transition-colors">
          Use Template
        </button>
      </div>
    </div>
  );
};

// Loading skeleton
const TemplateCardSkeleton = () => {
  return (
    <div style={{ 
      aspectRatio: '3/4', 
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    }}>
      <Skeleton className="w-full h-full rounded-none" />
    </div>
  );
};

// Main section component
const ShowcaseFreshLooksSection = () => {
  const [, navigate] = useLocation();
  const { data: templatesData, isLoading, error } = useTemplates();
  
  // Get only active and popular templates, limited to 5
  const freshTemplates = templatesData && Array.isArray(templatesData) 
    ? templatesData
        .filter(template => template.isActive)
        .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1)) // Sort by most recent
        .slice(0, 5) // Take only the first 5
    : [];

  const handleTemplateClick = (template: ResumeTemplate) => {
    // Navigate to template detail or resume builder
    navigate("/experience-level");
  };

  return (
    <FullWidthSection 
      className="py-20" 
      id="fresh-looks"
      backgroundColor="bg-black"
    >
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fadeInUp" className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-4">Showcase Fresh Looks</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Check out our newest template designs created by award-winning designers
          </p>
        </AnimatedSection>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {[...Array(5)].map((_, index) => (
              <TemplateCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-10">
            <p className="text-red-400">Failed to load templates. Please try again later.</p>
          </div>
        ) : freshTemplates.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-400">New templates coming soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
            {freshTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onClick={() => handleTemplateClick(template)}
              />
            ))}
          </div>
        )}
      </div>
    </FullWidthSection>
  );
};

export default ShowcaseFreshLooksSection;