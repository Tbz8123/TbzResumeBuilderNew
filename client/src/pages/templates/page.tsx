import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useTemplates } from "@/hooks/use-templates";
import { ResumeTemplate } from "@shared/schema";
import { AnimatedSection } from "@/components/AnimationComponents";
import { FullWidthSection } from "@/components/ui/AppleStyles";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info, Search, Check } from "lucide-react";
import Logo from "@/components/Logo";

const TemplatesPage = () => {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  // Extract the parameters from the URL
  const experienceLevel = searchParams.get("experience");
  const educationLevel = searchParams.get("education");
  const selectionText = searchParams.get("selection") || "No Experience";
  
  // Template filtering and search
  const { data: templates, isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // For template highlighting when selected
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  // Filter templates based on the active filter and search query
  const filteredTemplates = templates && templates.length > 0 
    ? templates.filter((template: ResumeTemplate) => {
        // Filter by category
        if (activeFilter !== "all" && template.category !== activeFilter) {
          return false;
        }
        
        // Filter by search query
        if (searchQuery.trim() !== "" && 
            !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !template.description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        
        return true;
      })
    : [];

  // Navigate to the builder page with the selected template
  const handleUseTemplate = (templateId: number) => {
    console.log(`Selected template: ${templateId}`);
    setLocation(`/builder?template=${templateId}&experience=${experienceLevel}${educationLevel ? `&education=${educationLevel}` : ''}`);
  };

  // Allow the user to choose the template later
  const handleChooseLater = () => {
    console.log("User chose to select a template later");
    setLocation("/"); // Redirect to homepage
  };

  // Handle template selection to highlight it
  const handleTemplateSelect = (templateId: number) => {
    setSelectedTemplate(templateId === selectedTemplate ? null : templateId);
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with logo */}
      <header className="py-6 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <Logo size="large" />
        </div>
      </header>
      
      {/* Main content */}
      <FullWidthSection className="flex-grow py-12">
        <div className="container mx-auto px-4">
          <AnimatedSection animation="fadeIn">
            <div className="text-center mb-8">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Choose a Resume Template
              </motion.h1>
              
              <motion.p 
                className="text-gray-600 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Select a template that best showcases your skills and experience.
              </motion.p>
              
              <motion.p
                className="text-primary text-sm mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                100+ professional, ATS-friendly templates available
              </motion.p>
            </div>
          </AnimatedSection>
          
          {/* User selection notification */}
          <AnimatedSection animation="fadeIn" delay={0.4}>
            <div className="bg-blue-50 rounded-lg p-4 mb-8 flex items-start">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-blue-800">
                  You selected <span className="font-semibold text-blue-900">{decodeURIComponent(selectionText)}</span> experience level. Here are the best templates for your profile.
                </p>
              </div>
            </div>
          </AnimatedSection>
          
          {/* Search and filter */}
          <div className="mb-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search templates..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Tabs defaultValue="all" onValueChange={setActiveFilter}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="creative">Creative</TabsTrigger>
                <TabsTrigger value="simple">Simple</TabsTrigger>
                <TabsTrigger value="professional">Professional</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg h-96 animate-pulse"></div>
              ))
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              // Display templates
              filteredTemplates.map((template) => (
                <AnimatedSection 
                  key={template.id} 
                  animation="fadeInUp"
                  className="relative group"
                >
                  <motion.div 
                    className={`border rounded-lg overflow-hidden transition-all duration-300 h-full flex flex-col 
                      ${selectedTemplate === template.id ? 'border-primary border-2 shadow-lg' : 'border-gray-200 hover:border-primary hover:shadow-md'}`}
                    whileHover={{ y: -5 }}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    {/* Template label tag */}
                    {template.isPopular && (
                      <div className="absolute top-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full z-10">
                        Hot!
                      </div>
                    )}
                    
                    {/* Selection indicator */}
                    {selectedTemplate === template.id && (
                      <div className="absolute top-3 left-3 bg-primary text-white rounded-full p-1 z-10">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    
                    {/* Template preview */}
                    <div className="relative h-80 overflow-hidden bg-gray-50">
                      {template.thumbnailUrl ? (
                        <img 
                          src={template.thumbnailUrl} 
                          alt={`${template.name} template`}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No preview available
                        </div>
                      )}
                      
                      {/* Template name as overlay text */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-800 to-transparent p-4 text-white">
                        <h3 className="font-medium text-sm">{template.name}</h3>
                        <p className="text-xs text-gray-300 capitalize">{template.category}</p>
                      </div>
                      
                      {/* Category tag */}
                      <div className="absolute top-3 left-3 bg-white text-primary text-xs px-2 py-1 rounded-full capitalize shadow-sm">
                        {template.category}
                      </div>
                    </div>
                    
                    {/* "RECOMMENDED" tag for certain templates */}
                    {template.isPopular && (
                      <div className="absolute right-3 bottom-16 bg-pink-100 text-pink-500 text-xs rounded-md font-semibold tracking-wide px-2 py-1">
                        RECOMMENDED
                      </div>
                    )}
                  </motion.div>
                </AnimatedSection>
              ))
            ) : (
              // No templates found
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No templates match your search. Try different keywords or filters.</p>
              </div>
            )}
          </div>
          
          {/* Template actions */}
          {selectedTemplate !== null && (
            <AnimatedSection animation="fadeIn" className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
              <div className="container mx-auto flex justify-between items-center">
                <Button 
                  variant="outline"
                  onClick={handleChooseLater}
                  className="text-primary hover:text-primary-dark"
                >
                  Choose later
                </Button>
                
                <Button 
                  onClick={() => handleUseTemplate(selectedTemplate)}
                  className="bg-primary hover:bg-primary-dark text-white"
                >
                  Use this template
                </Button>
              </div>
            </AnimatedSection>
          )}
        </div>
      </FullWidthSection>
      
      {/* Footer */}
      <footer className="py-4 border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
            <a href="#" className="hover:text-primary">TERMS AND CONDITIONS</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">PRIVACY POLICY</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">ACCESSIBILITY</a>
            <span>|</span>
            <a href="#" className="hover:text-primary">CONTACT US</a>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TemplatesPage;