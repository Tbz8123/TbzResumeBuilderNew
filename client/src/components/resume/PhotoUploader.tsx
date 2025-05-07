import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Upload, X } from 'lucide-react';
import { useResume } from '@/contexts/ResumeContext';

const PhotoUploader: React.FC = () => {
  const { resumeData, updateResumeData } = useResume();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Please select an image file');
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        updateResumeData({ photo: e.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const removePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateResumeData({ photo: null });
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2">
        <div
          className={`w-32 h-32 border-2 rounded-full overflow-hidden flex items-center justify-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : resumeData.photo 
                ? 'border-transparent' 
                : 'border-gray-300 border-dashed hover:bg-gray-50'
          }`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {resumeData.photo ? (
            <div className="relative w-full h-full group">
              <img
                src={resumeData.photo}
                alt="User profile"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button 
                  onClick={removePhoto}
                  className="bg-red-500 text-white rounded-full p-1.5"
                  aria-label="Remove photo"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-500">
              <Image className="w-8 h-8" />
              <span className="text-xs mt-1">Add photo</span>
            </div>
          )}
          
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        
        <div className="ml-4">
          <h3 className="text-sm font-medium text-gray-700">Profile Photo</h3>
          <p className="text-xs text-gray-500 mt-1">
            For best results, use a professional-looking headshot
          </p>
          <div className="text-xs text-gray-400 mt-2">
            <div className="flex items-center gap-1">
              <Upload className="w-3 h-3" />
              <span>Drag & drop or click to upload</span>
            </div>
            <div className="mt-1">Max size: 5MB</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploader;