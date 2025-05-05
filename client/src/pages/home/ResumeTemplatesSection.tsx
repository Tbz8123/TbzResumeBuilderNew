import { useState } from "react";
import { motion } from "framer-motion";
import { FullWidthSection, LargeHeading, Subheading, AppleButton } from "@/components/ui/AppleStyles";
import { AnimatedSection, AnimatedImage } from "@/components/AnimationComponents";

type TemplateType = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  popular: boolean;
  colors: string[];
};

const ResumeTemplatesSection = () => {
  const [activeFilter, setActiveFilter] = useState("all");
  
  const templates: TemplateType[] = [
    {
      id: "modern-professional",
      name: "Modern Professional",
      description: "Clean and modern design with a focus on skills and accomplishments.",
      imageUrl: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=500&q=80",
      category: "professional",
      popular: true,
      colors: ["bg-blue-500", "bg-blue-700"]
    },
    {
      id: "executive-premium",
      name: "Executive Premium",
      description: "Sophisticated design for senior professionals and executives.",
      imageUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&q=80",
      category: "executive",
      popular: true,
      colors: ["bg-gray-700", "bg-gray-900"]
    },
    {
      id: "creative-bold",
      name: "Creative Bold",
      description: "Stand out with this bold, creative design for artistic professionals.",
      imageUrl: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=500&q=80",
      category: "creative",
      popular: false,
      colors: ["bg-purple-500", "bg-indigo-700"]
    },
    {
      id: "tech-innovator",
      name: "Tech Innovator",
      description: "Modern design highlighting technical skills and achievements.",
      imageUrl: "https://images.unsplash.com/photo-1516383740770-fbcc5ccbece0?w=500&q=80",
      category: "tech",
      popular: true,
      colors: ["bg-cyan-500", "bg-blue-700"]
    },
    {
      id: "minimal-elegant",
      name: "Minimal Elegant",
      description: "Clean, minimalist design with elegant typography and layout.",
      imageUrl: "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&q=80",
      category: "minimal",
      popular: false,
      colors: ["bg-gray-200", "bg-gray-400"]
    },
    {
      id: "corporate-classic",
      name: "Corporate Classic",
      description: "Traditional format preferred by corporate recruiters and ATS systems.",
      imageUrl: "https://images.unsplash.com/photo-1586282023708-7163cafee0c5?w=500&q=80",
      category: "professional",
      popular: true,
      colors: ["bg-slate-600", "bg-slate-800"]
    },
    {
      id: "startup-dynamic",
      name: "Startup Dynamic",
      description: "Bold, dynamic layout for startup and tech industry professionals.",
      imageUrl: "https://images.unsplash.com/photo-1586473219010-2ffc57b0d282?w=500&q=80",
      category: "tech",
      popular: false,
      colors: ["bg-emerald-500", "bg-teal-700"]
    },
    {
      id: "graduate-fresh",
      name: "Graduate Fresh",
      description: "Perfect for recent graduates and entry-level positions.",
      imageUrl: "https://images.unsplash.com/photo-1586282391160-9a2cd84bd74e?w=500&q=80",
      category: "entry",
      popular: true,
      colors: ["bg-amber-500", "bg-orange-700"]
    },
    {
      id: "consultant-expert",
      name: "Consultant Expert",
      description: "Showcase your expertise with this consultant-focused template.",
      imageUrl: "https://images.unsplash.com/photo-1587613864521-9ef8dfe617cc?w=500&q=80",
      category: "executive",
      popular: false,
      colors: ["bg-indigo-600", "bg-indigo-800"]
    },
    {
      id: "futuristic-tech",
      name: "Futuristic Tech",
      description: "Ultra-modern design for cutting-edge tech professionals.",
      imageUrl: "https://images.unsplash.com/photo-1587613865763-4b8b0d19e8ab?w=500&q=80",
      category: "creative",
      popular: true,
      colors: ["bg-primary", "bg-primary-dark"]
    },
  ];

  const categories = [
    { id: "all", label: "All Templates" },
    { id: "professional", label: "Professional" },
    { id: "creative", label: "Creative" },
    { id: "tech", label: "Tech" },
    { id: "executive", label: "Executive" },
    { id: "minimal", label: "Minimal" },
    { id: "entry", label: "Entry Level" },
  ];

  const filteredTemplates = activeFilter === "all" 
    ? templates 
    : templates.filter(template => template.category === activeFilter);

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

        {/* Filter Tabs */}
        <AnimatedSection animation="fadeIn" className="mb-12">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {categories.map((category) => (
              <motion.button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                className={`px-4 py-2 rounded-full text-sm md:text-base font-medium transition-all ${
                  activeFilter === category.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
              >
                {category.label}
              </motion.button>
            ))}
          </div>
        </AnimatedSection>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredTemplates.map((template, index) => (
            <AnimatedSection 
              key={template.id} 
              animation="fadeInUp"
              delay={0.1 * index}
            >
              <motion.div 
                className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-gray-100"
                whileHover={{ y: -8 }}
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${template.colors[0]} to-${template.colors[1]} opacity-10`}></div>
                  <img 
                    src={template.imageUrl} 
                    alt={template.name} 
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                  {template.popular && (
                    <div className="absolute top-4 right-4 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full">
                      POPULAR
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                  <p className="text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {template.colors.map((color, i) => (
                        <div key={i} className={`w-6 h-6 rounded-full ${color}`}></div>
                      ))}
                    </div>
                    
                    <AppleButton
                      variant="text"
                      href={`/templates/${template.id}`}
                      className="text-primary font-medium"
                    >
                      Use Template
                    </AppleButton>
                  </div>
                </div>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

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