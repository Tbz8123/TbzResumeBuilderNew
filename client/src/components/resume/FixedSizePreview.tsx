import React from 'react';
import HybridResumePreview from '@/components/resume/HybridResumePreview';
import { ResumeData } from '@/contexts/ResumeContext';
import { ResumeTemplate } from '@shared/schema';

// This component wraps the preview in a fixed-size container to prevent size flickering
interface FixedSizePreviewProps {
  width: number;
  height: number;
  resumeData: ResumeData;
  selectedTemplateId: number | null;
  setSelectedTemplateId: (id: number | null) => void;
  templates: ResumeTemplate[];
  isPreview?: boolean;
  hideSkills?: boolean;
}

const FixedSizePreview: React.FC<FixedSizePreviewProps> = ({
  width,
  height,
  resumeData,
  selectedTemplateId,
  setSelectedTemplateId,
  templates,
  isPreview = false,
  hideSkills = false
}) => {
  // Create a unique key to prevent re-renders that might cause flickering
  const stableKey = React.useMemo(() => {
    return `fixed-preview-${selectedTemplateId}-${width}-${height}`;
  }, [selectedTemplateId, width, height]);

  return (
    <div 
      style={{ 
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'white',
        transition: 'none'
      }}
    >
      {/* Global styles to prevent flickering */}
      <style>
        {`
          /* Critical: Disable all transitions and animations in preview */
          .fixed-size-preview-container * {
            transition: none !important;
            animation: none !important;
            transform: none !important;
          }
          
          /* Force static dimensions on key elements */
          .fixed-size-preview-container .resume-container,
          .fixed-size-preview-container .resume-page {
            width: 100% !important;
            height: auto !important;
            position: static !important;
            transition: none !important;
          }
          
          /* Fix layout of two-column templates */
          .fixed-size-preview-container .left,
          .fixed-size-preview-container .right {
            position: static !important;
            min-height: 100% !important;
            height: auto !important;
            transition: none !important;
          }
        `}
      </style>
      
      {/* Wrapper with stable key that won't change with data updates */}
      <div className="fixed-size-preview-container">
        <HybridResumePreview
          key={stableKey}
          width={width}
          height={height}
          resumeData={resumeData}
          selectedTemplateId={selectedTemplateId}
          setSelectedTemplateId={setSelectedTemplateId}
          templates={templates}
          isPreview={isPreview}
          hideSkills={hideSkills}
          scaleContent={true}
        />
      </div>
    </div>
  );
};

export default FixedSizePreview;