import React from 'react';
import { useLocation, Link } from 'wouter';
import { AnimatedSection } from '@/components/AnimationComponents';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const UploadResumePage = () => {
  const [, setLocation] = useLocation();
  
  const handleBack = () => {
    setLocation('/upload-options');
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1 container mx-auto px-4 py-12 max-w-5xl">
        <AnimatedSection animation="fadeIn" className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Resume
          </h1>
          <p className="text-gray-600">
            Upload your existing resume to get started
          </p>
        </AnimatedSection>
        
        <div className="p-8 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
          <p className="text-lg text-gray-700 mb-4">
            This is a placeholder for the resume upload functionality.
          </p>
          <p className="text-gray-500">
            In a complete implementation, this page would contain a file upload component
            with drag-and-drop functionality, supported file format information, and
            processing capabilities.
          </p>
        </div>
        
        {/* Navigation buttons */}
        <div className="flex justify-between mt-12">
          <Button 
            variant="outline" 
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="py-4 border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center text-xs text-gray-500 gap-4">
            <Link href="/terms" className="hover:text-primary">TERMS AND CONDITIONS</Link>
            <span>|</span>
            <Link href="/privacy" className="hover:text-primary">PRIVACY POLICY</Link>
            <span>|</span>
            <Link href="/accessibility" className="hover:text-primary">ACCESSIBILITY</Link>
            <span>|</span>
            <Link href="/contact" className="hover:text-primary">CONTACT US</Link>
          </div>
          <div className="text-center mt-2 text-xs text-gray-400">
            © 2025, TbzResume Limited. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UploadResumePage;