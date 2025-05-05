import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";

const FreshLooksSection = () => {
  // Array of 5 template placeholders
  const freshTemplates = Array(5).fill(null);

  return (
    <SectionContainer background="white">
      <SectionHeading
        title="Showcase Fresh Looks"
        subtitle="Check out our newest template designs"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {freshTemplates.map((_, index) => (
          <CardStyles 
            key={index} 
            variant="template"
            className={`h-60 relative 
              ${index === 4 ? 'hidden lg:block' : ''}
            `}
          >
            <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
              New
            </div>
          </CardStyles>
        ))}
      </div>
    </SectionContainer>
  );
};

export default FreshLooksSection;
