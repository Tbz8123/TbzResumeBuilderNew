import { ArrowRight, FileText, Edit, Download } from "lucide-react";
import { FullWidthSection, LargeHeading, Subheading } from "@/components/ui/AppleStyles";
import { AnimatedSection, AnimatedItem } from "@/components/AnimationComponents";
import { motion } from "framer-motion";

const HowItWorksSection = () => {
  const steps = [
    {
      number: 1,
      title: "Pick a template",
      description: "Choose from over 1000+ professionally designed templates",
      icon: <FileText className="w-16 h-16 text-primary" />,
      delay: 0.2,
    },
    {
      number: 2,
      title: "Enter your info",
      description: "Our AI-powered tools help you write the perfect content",
      icon: <Edit className="w-16 h-16 text-primary" />,
      delay: 0.4,
    },
    {
      number: 3,
      title: "Download or print",
      description: "Instantly download your resume in PDF, Word, or print it",
      icon: <Download className="w-16 h-16 text-primary" />,
      delay: 0.6,
    },
  ];

  return (
    <FullWidthSection
      className="py-24 md:py-32"
      backgroundColor="bg-gradient-to-b from-gray-50 via-white to-gray-50"
    >
      <AnimatedSection animation="fadeIn">
        <div className="text-center mb-16">
          <LargeHeading tag="h2" centered>
            How It Works
          </LargeHeading>
          <Subheading 
            tag="p" 
            centered 
            className="mt-4 max-w-3xl mx-auto text-gray-600"
          >
            Create a professional resume and cover letter in minutes with our easy three-step process
          </Subheading>
        </div>
      </AnimatedSection>

      <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
        {steps.map((step, index) => (
          <AnimatedSection
            key={index}
            animation="fadeInUp"
            delay={step.delay}
            className="relative"
          >
            <motion.div
              className="bg-white rounded-2xl shadow-xl p-8 text-center h-full flex flex-col items-center"
              whileHover={{ 
                y: -10,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)"
              }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Number indicator with 3D effect */}
              <motion.div 
                className="w-20 h-20 bg-gradient-to-br from-primary to-primary-light text-white rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg relative"
                whileHover={{ 
                  scale: 1.1,
                  rotate: [0, -5, 5, -5, 0],
                  transition: { duration: 0.5 }
                }}
              >
                <div className="absolute inset-0 rounded-full bg-primary opacity-30 blur-sm transform scale-110"></div>
                <span className="relative z-10">{step.number}</span>
              </motion.div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
              <p className="text-gray-600 mb-6 flex-grow">{step.description}</p>
              
              {/* Icon with 3D effect */}
              <motion.div 
                className="mt-4 relative"
                whileHover={{ 
                  scale: 1.1,
                  rotateY: 180,
                  transition: { duration: 0.6 }
                }}
              >
                <div className="absolute inset-0 bg-primary opacity-10 blur-md rounded-full transform scale-75"></div>
                {step.icon}
              </motion.div>
            </motion.div>
            
            {/* Connecting arrows */}
            {index < steps.length - 1 && (
              <div className="absolute top-1/2 -right-6 hidden md:block z-10">
                <motion.div
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: step.delay + 0.3, duration: 0.5 }}
                >
                  <ArrowRight className="w-12 h-12 text-primary" />
                </motion.div>
              </div>
            )}
          </AnimatedSection>
        ))}
      </div>
      
      {/* Apple-style sticky card at bottom */}
      <AnimatedSection animation="slideInBottom" delay={0.8}>
        <motion.div 
          className="mt-20 bg-black text-white p-8 rounded-2xl max-w-4xl mx-auto text-center shadow-2xl"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <h3 className="text-2xl font-bold mb-4">Ready to start your professional journey?</h3>
          <p className="text-gray-300 mb-6">Our intuitive process makes resume creation faster and easier than ever before</p>
          <motion.button 
            className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-8 rounded-full"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Get Started Now
          </motion.button>
        </motion.div>
      </AnimatedSection>
    </FullWidthSection>
  );
};

export default HowItWorksSection;
