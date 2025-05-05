import { Sparkles } from "lucide-react";
import { FullWidthSection, LargeHeading, Subheading } from "@/components/ui/AppleStyles";
import { AnimatedSection } from "@/components/AnimationComponents";
import { motion } from "framer-motion";

const FreshLooksSection = () => {
  // Template data with actual images
  const freshTemplates = [
    {
      id: 1,
      name: "Modern Professional",
      image: "https://images.unsplash.com/photo-1586281380117-5a60ae2050cc?w=500&q=80",
      color: "from-blue-400 to-indigo-600",
      delay: 0.2
    },
    {
      id: 2,
      name: "Creative Minimal",
      image: "https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=500&q=80",
      color: "from-amber-400 to-orange-600",
      delay: 0.3
    },
    {
      id: 3,
      name: "Executive Bold",
      image: "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=500&q=80", 
      color: "from-emerald-400 to-green-600",
      delay: 0.4
    },
    {
      id: 4,
      name: "Clean Infographic",
      image: "https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=500&q=80",
      color: "from-purple-400 to-pink-600",
      delay: 0.5
    },
    {
      id: 5,
      name: "Tech Innovator",
      image: "https://images.unsplash.com/photo-1591522810850-58128c5fb089?w=500&q=80",
      color: "from-cyan-400 to-blue-600", 
      delay: 0.6
    },
  ];

  return (
    <FullWidthSection
      className="py-24 md:py-32 overflow-hidden"
      backgroundColor="bg-black"
      dark
    >
      <AnimatedSection animation="fadeIn">
        <div className="text-center mb-16">
          <div className="inline-block mb-2">
            <motion.div
              className="inline-flex items-center bg-white/10 backdrop-blur-sm px-4 py-1 rounded-full"
              animate={{ scale: [0.95, 1, 0.95], opacity: [0.8, 1, 0.8] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <Sparkles className="h-4 w-4 text-yellow-400 mr-2" />
              <span className="text-sm font-medium text-white">Newly Released</span>
            </motion.div>
          </div>
          
          <LargeHeading tag="h2" centered className="text-white">
            Showcase Fresh Looks
          </LargeHeading>
          
          <Subheading 
            tag="p" 
            centered 
            className="mt-4 max-w-3xl mx-auto text-gray-300"
          >
            Check out our newest template designs created by award-winning designers
          </Subheading>
        </div>
      </AnimatedSection>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
        {freshTemplates.map((template, index) => (
          <AnimatedSection
            key={template.id}
            animation="revealFromBottom"
            delay={template.delay}
            className={`${index === 4 ? 'hidden lg:block' : ''}`}
          >
            <motion.div 
              className="relative group h-80 md:h-96 overflow-hidden rounded-2xl cursor-pointer"
              whileHover={{ 
                y: -10,
                transition: { duration: 0.3 }
              }}
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-b ${template.color} opacity-40 mix-blend-overlay`}></div>
              
              {/* Template Preview Image */}
              <motion.div
                className="absolute inset-0 w-full h-full"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.6 }}
              >
                <img 
                  src={template.image} 
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              </motion.div>
              
              {/* Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
                <div className="transform translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                  <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded text-xs text-white font-medium">
                      New
                    </div>
                    <motion.div
                      whileHover={{ 
                        scale: 1.1, 
                        backgroundColor: "rgba(255,255,255,0.3)" 
                      }}
                      className="bg-white/10 backdrop-blur-sm px-3 py-1 rounded text-xs text-white font-medium"
                    >
                      Preview
                    </motion.div>
                  </div>
                </div>
              </div>
              
              {/* Shine effect on hover */}
              <motion.div 
                className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/30 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
                initial={{ x: "-100%", opacity: 0 }}
                whileHover={{ 
                  x: "100%", 
                  opacity: 0.3,
                  transition: { duration: 0.8 } 
                }}
              />
            </motion.div>
          </AnimatedSection>
        ))}
      </div>
      
      {/* Apple-style call to action */}
      <AnimatedSection animation="fadeInUp" delay={0.8}>
        <motion.div
          className="mt-16 text-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.button
            className="inline-flex items-center text-white px-8 py-3 rounded-full bg-primary hover:bg-primary-dark transition-colors duration-300"
            whileHover={{ 
              boxShadow: "0 0 20px rgba(139, 92, 246, 0.5)" 
            }}
          >
            <span className="font-medium">Browse All Templates</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </motion.button>
        </motion.div>
      </AnimatedSection>
    </FullWidthSection>
  );
};

export default FreshLooksSection;
