import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Wrench, LineChart, Book, Heart, ShoppingBag, Headphones, Code, Utensils, Users } from "lucide-react";
import { FullWidthSection, LargeHeading, Subheading } from "@/components/ui/AppleStyles";
import { AnimatedSection } from "@/components/AnimationComponents";

type TemplateCategory = {
  id: string;
  name: string;
  icon: JSX.Element;
};

const IndustryTemplatesSection = () => {
  const categories: TemplateCategory[] = [
    { id: "accounting", name: "Accounting", icon: <Briefcase className="h-10 w-10 text-primary" /> },
    { id: "engineering", name: "Engineering", icon: <Wrench className="h-10 w-10 text-primary" /> },
    { id: "marketing", name: "Marketing", icon: <LineChart className="h-10 w-10 text-primary" /> },
    { id: "education", name: "Education", icon: <Book className="h-10 w-10 text-primary" /> },
    { id: "healthcare", name: "Healthcare", icon: <Heart className="h-10 w-10 text-primary" /> },
    { id: "sales", name: "Sales", icon: <ShoppingBag className="h-10 w-10 text-primary" /> },
    { id: "customer-service", name: "Customer Service", icon: <Headphones className="h-10 w-10 text-primary" /> },
    { id: "it-software", name: "IT & Software", icon: <Code className="h-10 w-10 text-primary" /> },
    { id: "food-service", name: "Food Service", icon: <Utensils className="h-10 w-10 text-primary" /> },
    { id: "management", name: "Management", icon: <Users className="h-10 w-10 text-primary" /> },
  ];

  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <FullWidthSection
      className="py-20"
      id="templates"
      backgroundColor="bg-gray-50"
    >
      <div className="container mx-auto px-4">
        <AnimatedSection animation="fadeInUp" className="text-center mb-16">
          <LargeHeading centered>
            Industry-Specific Resume Templates
          </LargeHeading>
          <Subheading centered className="max-w-3xl mx-auto">
            Select the perfect template for your industry. Our AI will customize it with optimal keywords and industry-specific formatting.
          </Subheading>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <AnimatedSection 
              key={category.id} 
              animation="fadeIn" 
              delay={0.1 * index}
            >
              <motion.div
                className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 flex flex-col items-center transition-all cursor-pointer hover:shadow-md hover:border-primary/20"
                whileHover={{ 
                  y: -5, 
                  boxShadow: "0 10px 25px -5px rgba(94, 23, 235, 0.1)",
                  borderColor: "rgba(94, 23, 235, 0.4)"
                }}
                onMouseEnter={() => setHoveredCategory(category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <div className="mb-4">
                  {category.icon}
                </div>
                <span className="font-medium text-gray-900">{category.name}</span>
              </motion.div>
            </AnimatedSection>
          ))}
        </div>

        {/* Template Preview Section */}
        <AnimatedSection animation="fadeIn" delay={0.5} className="mt-20">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Professional Templates</h3>
                <p className="text-gray-600 mb-6">
                  Our professionally designed templates are optimized for ATS systems and tailored to specific industries. Each template includes:
                </p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </span>
                    <span className="text-gray-700">Industry-specific keywords and phrases</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </span>
                    <span className="text-gray-700">Optimal formatting for your experience level</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </span>
                    <span className="text-gray-700">ATS-friendly design to pass automated screenings</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2 mt-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    </span>
                    <span className="text-gray-700">Real-time preview as you build your resume</span>
                  </li>
                </ul>
                
                <motion.button
                  className="bg-primary text-white py-3 px-8 rounded-full font-medium flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Browse All Templates</span>
                  <svg className="ml-2 w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </motion.button>
              </div>
              
              <div className="relative">
                <div className="relative h-[500px] overflow-hidden rounded-lg shadow-xl border border-gray-200">
                  {/* This would be the template preview */}
                  <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col">
                    <div className="bg-primary h-24 flex items-center px-8">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-2xl font-bold text-primary">
                        JD
                      </div>
                      <div className="ml-4 text-white">
                        <h3 className="text-xl font-bold">John Doe</h3>
                        <p className="text-primary-light">Software Engineer</p>
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-white p-8">
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-primary mb-2">Professional Summary</h4>
                        <div className="w-full h-24 rounded-md bg-gray-100"></div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-primary mb-2">Work Experience</h4>
                        <div className="w-full h-32 rounded-md bg-gray-100"></div>
                      </div>
                      
                      <div className="mb-6">
                        <h4 className="text-lg font-bold text-primary mb-2">Education</h4>
                        <div className="w-full h-20 rounded-md bg-gray-100"></div>
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-bold text-primary mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {['JavaScript', 'React', 'Node.js', 'TypeScript', 'UI/UX', 'Git'].map((skill) => (
                            <span key={skill} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating UI elements */}
                <motion.div 
                  className="absolute -left-8 top-1/4 bg-white p-4 rounded-lg shadow-lg"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <span className="font-bold text-primary">100% ATS Compatible</span>
                </motion.div>
                
                <motion.div 
                  className="absolute -right-6 bottom-1/4 bg-white p-4 rounded-lg shadow-lg"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <span className="font-bold text-primary">Recruiter Approved</span>
                </motion.div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </FullWidthSection>
  );
};

export default IndustryTemplatesSection;