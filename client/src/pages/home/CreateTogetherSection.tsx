import { Check, ChevronRight } from "lucide-react";
import { FullWidthSection, LargeHeading, Subheading, AppleButton } from "@/components/ui/AppleStyles";
import { AnimatedSection, AnimatedItem, AnimatedText } from "@/components/AnimationComponents";
import { motion } from "framer-motion";

const CreateTogetherSection = () => {
  const benefits = [
    {
      text: "Consistent branding across all application documents",
      delay: 0.2
    },
    {
      text: "Save time with pre-filled information between documents",
      delay: 0.3
    },
    {
      text: "AI-powered writing assistance for both documents",
      delay: 0.4
    },
    {
      text: "66% higher interview rate with matching documents",
      delay: 0.5
    },
  ];

  return (
    <FullWidthSection
      className="py-24 md:py-32 overflow-hidden"
      backgroundColor="bg-gradient-to-br from-white to-gray-50"
    >
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <AnimatedSection animation="fadeInLeft">
          <LargeHeading tag="h2" className="mb-6">
            Create Resume & Cover Letter <span className="text-primary">Together</span>
          </LargeHeading>
          
          <Subheading 
            tag="p" 
            className="text-gray-600 mb-8"
          >
            Boost your chances of getting hired by creating matching resume and cover letter that impress employers.
          </Subheading>
          
          <ul className="space-y-6 mb-10">
            {benefits.map((benefit, index) => (
              <AnimatedItem 
                key={index} 
                animation="fadeInLeft" 
                delay={benefit.delay}
                className="flex items-start"
              >
                <motion.div
                  className="flex items-start"
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <div className="flex-shrink-0 mr-3">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        repeat: Infinity, 
                        repeatType: "reverse", 
                        duration: 2, 
                        delay: index * 0.2 
                      }}
                      className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center"
                    >
                      <Check className="h-4 w-4 text-primary" />
                    </motion.div>
                  </div>
                  <span className="text-lg">{benefit.text}</span>
                </motion.div>
              </AnimatedItem>
            ))}
          </ul>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <AppleButton 
              variant="primary" 
              size="large"
              href="#start-now"
              className="bg-primary hover:bg-primary-dark text-white group flex items-center"
              icon={
                <motion.div
                  animate={{ x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <ChevronRight className="ml-2 h-5 w-5 transition-all group-hover:translate-x-1" />
                </motion.div>
              }
            >
              Start Creating Now
            </AppleButton>
          </motion.div>
        </AnimatedSection>
        
        <AnimatedSection animation="fadeInRight" delay={0.4}>
          <div className="relative h-[400px]">
            {/* 3D Document group */}
            <div className="w-full h-full relative flex justify-center items-center">
              {/* Resume Preview with 3D effect */}
              <motion.div 
                className="absolute bg-white rounded-xl shadow-2xl p-5 w-72 z-10 transform -rotate-6"
                initial={{ x: -40, y: 0, opacity: 0.5 }}
                animate={{ x: -60, y: 20, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                  delay: 0.8
                }}
                whileHover={{ 
                  rotate: -2,
                  scale: 1.05,
                  transition: { duration: 0.5 }
                }}
              >
                <div className="h-20 bg-gradient-to-r from-primary to-primary-light rounded-t-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded-full w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-5/6"></div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="h-3 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-full"></div>
                  <div className="h-3 bg-gray-200 rounded-full w-4/5"></div>
                </div>
                
                {/* Animated accent */}
                <motion.div 
                  className="absolute -bottom-2 -left-2 w-10 h-10 bg-primary rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3
                  }}
                />
              </motion.div>
              
              {/* Cover Letter Preview with 3D effect */}
              <motion.div 
                className="absolute bg-white rounded-xl shadow-2xl p-5 w-72 z-20"
                initial={{ x: 40, y: 0, opacity: 0.5 }}
                animate={{ x: 60, y: -20, opacity: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 100,
                  damping: 10,
                  delay: 1
                }}
                whileHover={{ 
                  rotate: 2,
                  scale: 1.05,
                  transition: { duration: 0.5 }
                }}
              >
                <div className="h-10 bg-gradient-to-r from-primary to-primary-light rounded-t-lg mb-4"></div>
                <div className="space-y-3">
                  <div className="h-5 bg-gray-200 rounded-full w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded-full w-2/3"></div>
                </div>
                <div className="mt-6 space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                  <div className="h-2 bg-gray-200 rounded-full w-4/5"></div>
                  <div className="h-2 bg-gray-200 rounded-full"></div>
                </div>
                
                {/* Animated accent */}
                <motion.div 
                  className="absolute -top-2 -right-2 w-10 h-10 bg-primary rounded-full"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    repeat: Infinity,
                    duration: 3,
                    delay: 1
                  }}
                />
              </motion.div>
              
              {/* Connecting elements */}
              <motion.div 
                className="absolute w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 blur-xl z-5"
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{ 
                  repeat: Infinity,
                  duration: 4
                }}
              />
            </div>
            
            {/* Apple-style badge */}
            <motion.div 
              className="absolute bottom-5 right-5 bg-gradient-to-r from-yellow-400 to-amber-300 px-6 py-3 rounded-full shadow-lg z-30"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-base font-bold">Perfect Match!</span>
            </motion.div>
          </div>
        </AnimatedSection>
      </div>
    </FullWidthSection>
  );
};

export default CreateTogetherSection;
