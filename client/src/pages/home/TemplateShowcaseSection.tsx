import { Button } from "@/components/ui/button";
import { SectionContainer, SectionHeading, CardStyles } from "@/components/ui/CardStyles";
import { TemplatePreview } from "@/components/ui/ImageComponents";

const TemplateShowcaseSection = () => {
  const templates = [
    {
      type: "Modern",
      description: "Contemporary designs with creative layouts",
      image: "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=300&q=80"
    },
    {
      type: "Professional",
      description: "Traditional formats for corporate roles",
      image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=300&q=80"
    },
    {
      type: "Creative",
      description: "Unique designs for creative industries",
      image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=300&q=80"
    },
    {
      type: "Simple",
      description: "Clean, minimal designs for any role",
      image: "https://images.unsplash.com/photo-1616983363480-a1929eff4902?w=300&q=80"
    }
  ];

  return (
    <SectionContainer background="light">
      <SectionHeading
        title="Pick From Professionally Designed Templates"
        subtitle="Choose from hundreds of templates designed to highlight your skills and experience"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {templates.map((template, index) => (
          <CardStyles key={index} variant="template">
            <TemplatePreview 
              image={template.image}
              title={template.type}
              className="h-48"
            />
            <div className="p-4">
              <h3 className="font-bold">{template.type}</h3>
              <p className="text-sm text-gray-dark">{template.description}</p>
            </div>
          </CardStyles>
        ))}
      </div>
      
      <div className="text-center">
        <Button asChild>
          <a href="#start-resume">Start Resume</a>
        </Button>
      </div>
    </SectionContainer>
  );
};

export default TemplateShowcaseSection;
