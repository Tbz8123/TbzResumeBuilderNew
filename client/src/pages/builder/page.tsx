import { useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useTemplate } from "@/hooks/use-templates";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

const BuilderPage = () => {
  const [_, setLocation] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  
  // Extract the parameters from the URL
  const templateId = searchParams.get("template");
  const experienceLevel = searchParams.get("experience");
  const educationLevel = searchParams.get("education");
  
  // Fetch the selected template
  const { data: template, isLoading, error } = useTemplate(templateId ? parseInt(templateId) : undefined);
  
  // Handle back button
  const handleBack = () => {
    setLocation(`/templates?experience=${experienceLevel}${educationLevel ? `&education=${educationLevel}` : ''}`);
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-gray-600">Loading your template...</p>
      </div>
    );
  }
  
  if (error || !template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-4">Template Not Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find the template you're looking for. Please try selecting another template.</p>
          <Button onClick={handleBack}>
            Back to Templates
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header with logo */}
      <header className="py-4 border-b border-gray-100">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <Logo size="medium" />
          
          <Button variant="outline" onClick={handleBack}>
            Back to Templates
          </Button>
        </div>
      </header>
      
      {/* Resume builder (placeholder) */}
      <div className="flex-grow py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Building with {template.name}</h1>
            <p className="text-gray-600">Experience Level: {experienceLevel?.replace(/_/g, ' ')}</p>
            {educationLevel && (
              <p className="text-gray-600">Education: {educationLevel.replace(/_/g, ' ')}</p>
            )}
          </div>
          
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <h2 className="text-xl font-medium mb-4">Resume Builder Interface</h2>
            <p className="text-gray-600 mb-6">
              This is a placeholder for the resume builder interface. In a real implementation, this would be the interface
              where users can fill in their information and customize the template.
            </p>
            
            <div className="flex justify-center">
              <img 
                src={template.thumbnailUrl || "/placeholder-template.svg"} 
                alt={template.name}
                className="max-w-xs rounded-lg border border-gray-300"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-4 border-t border-gray-100 mt-auto">
        <div className="container mx-auto px-4">
          <div className="text-center text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BuilderPage;