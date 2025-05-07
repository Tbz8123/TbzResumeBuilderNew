import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useTemplates } from "@/hooks/use-templates";
import { ResumeTemplate } from "@shared/schema";
import { AnimatedSection } from "@/components/AnimationComponents";
import { useToast } from "@/hooks/use-toast";
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
  const { toast } = useToast();
  
  // Extract the parameters from the URL
  const experienceLevel = searchParams.get("experience");
  const educationLevel = searchParams.get("education");
  const selectionText = searchParams.get("selection") || "No Experience";
  
  // Template filtering and search
  const { data: templates, isLoading } = useTemplates();
  const templatesArray = templates as ResumeTemplate[] || [];
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  
  // For template highlighting when selected
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  
  // For managing recommended templates
  const [recommendedTemplates, setRecommendedTemplates] = useState<number[]>([]);
  
  // Filter templates based on the active filter and search query
  const filteredTemplates = templatesArray.length > 0 
    ? templatesArray.filter((template: ResumeTemplate) => {
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
  
  // Handle right-click to toggle recommendation
  const handleRightClick = (e: React.MouseEvent, templateId: number) => {
    e.preventDefault(); // Prevent the default context menu
    
    // Find the template name for the toast
    const template = filteredTemplates.find((t: ResumeTemplate) => t.id === templateId);
    const templateName = template?.name || "Template";
    
    // Determine if we're adding or removing
    const isAlreadyRecommended = recommendedTemplates.includes(templateId);
    
    setRecommendedTemplates(prev => {
      // Check if template is already in the recommended list
      if (isAlreadyRecommended) {
        // Remove it from recommendations
        return prev.filter(id => id !== templateId);
      } else {
        // Add it to recommendations
        return [...prev, templateId];
      }
    });
    
    // Show toast notification
    toast({
      title: isAlreadyRecommended ? "Removed from recommendations" : "Added to recommendations",
      description: isAlreadyRecommended 
        ? `${templateName} has been removed from your recommendations.` 
        : `${templateName} has been added to your recommendations!`,
      variant: isAlreadyRecommended ? "default" : "default",
    });
    
    return false; // Prevent the browser's context menu
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
                <p className="text-blue-800 mb-1">
                  You selected <span className="font-semibold text-blue-900">{decodeURIComponent(selectionText)}</span> experience level. Here are the best templates for your profile.
                </p>
                <p className="text-blue-600 text-xs italic">
                  <span className="font-medium">Pro tip:</span> Right-click on a template to mark it as recommended for future reference.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center mb-12">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 8 }).map((_, index) => (
                <div 
                  key={index} 
                  className="bg-gray-100 rounded-lg animate-pulse"
                  style={{ width: '280px', height: '362.13px' }}
                >
                  <div className="h-[280px] bg-gray-200"></div>
                  <div className="p-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : filteredTemplates && filteredTemplates.length > 0 ? (
              // Display templates
              filteredTemplates.map((template: ResumeTemplate) => (
                <AnimatedSection 
                  key={template.id} 
                  animation="fadeInUp"
                  className="relative group flex items-center justify-center"
                >
                  <motion.div 
                    className={`border rounded-lg overflow-hidden transition-all duration-300 flex flex-col
                      ${selectedTemplate === template.id ? 'border-primary border-2 shadow-lg' : 'border-gray-200 hover:border-primary hover:shadow-xl'}`}
                    style={{ width: '280px', height: '362.13px' }}
                    whileHover={{ y: -5, scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    onClick={() => handleTemplateSelect(template.id)}
                    onContextMenu={(e) => handleRightClick(e, template.id)}
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
                    <div className="relative h-[280px] overflow-hidden bg-white flex items-center justify-center">
                      {template.thumbnailUrl ? (
                        <div className="relative h-full w-full flex items-center justify-center">
                          <div className="w-[190px] h-full flex items-center justify-center overflow-hidden">
                            <img 
                              src={template.thumbnailUrl} 
                              alt={`${template.name} template`}
                              className="h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              style={{ 
                                maxWidth: '100%', 
                                maxHeight: '100%',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '1px solid #f0f0f0'
                              }}
                            />
                          </div>
                          
                          {/* Status tags like in Zety - Popular, Selected, etc. */}
                          {template.isPopular && (
                            <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full z-10 font-semibold">
                              Popular
                            </div>
                          )}
                          
                          {/* Overlay hover button */}
                          <div className="absolute inset-0 bg-black/0 opacity-0 flex items-center justify-center transition-all duration-300 group-hover:bg-black/20 group-hover:opacity-100">
                            <button 
                              className="bg-primary hover:bg-primary-dark text-white text-sm py-2 px-3 rounded-md shadow-lg transform translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUseTemplate(template.id);
                              }}
                            >
                              Use this template
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No preview available
                        </div>
                      )}
                      
                      {/* Category tag - displayed as top pill */}
                      <div className="absolute top-3 left-3 bg-white text-primary text-xs px-2 py-1 rounded-full capitalize shadow-sm">
                        {template.category}
                      </div>
                    </div>
                    
                    {/* Template name and category - bottom info section */}
                    <div className="p-3 border-t border-gray-100 bg-white">
                      <h3 className="font-semibold text-base text-gray-800">{template.name}</h3>
                      <div className="flex items-center mt-1">
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                          template.category === 'professional' ? 'bg-blue-500' : 
                          template.category === 'creative' ? 'bg-green-500' : 
                          template.category === 'simple' ? 'bg-gray-400' : 'bg-purple-500'
                        }`}></div>
                        <p className="text-xs text-gray-500 capitalize">{template.category}</p>
                      </div>
                      
                      {/* Status tags */}
                      {selectedTemplate === template.id && (
                        <div className="absolute bottom-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          Selected
                        </div>
                      )}
                      
                      {/* "RECOMMENDED" tag for certain templates */}
                      {(template.isPopular || recommendedTemplates.includes(template.id)) && selectedTemplate !== template.id && (
                        <div className="absolute bottom-3 right-3 bg-green-500 text-white text-xs rounded-full font-semibold tracking-wide px-3 py-1">
                          Recommended
                        </div>
                      )}

                      {/* "NEW" tag in Zety style for newer templates - assuming last 3 templates are new */}
                      {template.id >= (templatesArray.length - 2) && selectedTemplate !== template.id && !template.isPopular && !recommendedTemplates.includes(template.id) && (
                        <div className="absolute bottom-3 right-3 bg-orange-500 text-white text-xs rounded-full font-semibold tracking-wide px-3 py-1">
                          New
                        </div>
                      )}
                    </div>
                  </motion.div>
                </AnimatedSection>
              ))
            ) : (
              // No templates found
              <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 text-center py-12">
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