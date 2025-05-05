import { Button } from "@/components/ui/button";

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
    <section className="bg-gray-light py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Pick From Professionally Designed Templates</h2>
          <p className="text-lg text-gray-dark max-w-2xl mx-auto">
            Choose from hundreds of templates designed to highlight your skills and experience
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
          {templates.map((template, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200 relative">
                <img 
                  src={template.image} 
                  alt={`${template.type} resume template`} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white font-bold">Preview</span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold">{template.type}</h3>
                <p className="text-sm text-gray-dark">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button asChild>
            <a href="#start-resume">Start Resume</a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TemplateShowcaseSection;
