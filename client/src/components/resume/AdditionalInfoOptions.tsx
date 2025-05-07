import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useResume } from '@/contexts/ResumeContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AdditionalInfoOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  active: boolean;
}

const AdditionalInfoOptions: React.FC = () => {
  const { resumeData, updateAdditionalInfo, removeAdditionalInfo } = useResume();
  const [open, setOpen] = useState(false);
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');

  // Default options
  const options: AdditionalInfoOption[] = [
    { id: 'linkedin', label: 'LinkedIn', active: !!resumeData.additionalInfo.linkedin },
    { id: 'website', label: 'Website', active: !!resumeData.additionalInfo.website },
    { id: 'drivingLicense', label: 'Driving licence', active: !!resumeData.additionalInfo.drivingLicense }
  ];

  const handleOptionClick = (optionId: string) => {
    setActiveOption(optionId);
    
    // If option already has a value, pre-fill the input
    const currentValue = resumeData.additionalInfo[optionId];
    setInputValue(currentValue || '');
    
    setOpen(true);
  };

  const handleSave = () => {
    if (activeOption && inputValue.trim()) {
      updateAdditionalInfo(activeOption, inputValue.trim());
      setOpen(false);
      setInputValue('');
    }
  };

  const handleRemove = (optionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeAdditionalInfo(optionId);
  };

  return (
    <div>
      <h3 className="text-gray-800 font-medium mb-2 flex items-center gap-2">
        Add additional information to your resume <span className="text-gray-500 text-sm">(optional)</span>
        <div className="inline-flex items-center justify-center w-5 h-5 bg-blue-50 text-blue-600 rounded-full border border-blue-200 text-xs ml-1">
          i
        </div>
      </h3>
      
      <div className="flex flex-wrap gap-3 mt-3">
        {options.map((option) => (
          <Button
            key={option.id}
            variant={option.active ? "default" : "outline"}
            className={`flex items-center gap-2 ${option.active ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' : 'text-blue-700 border-blue-300'}`}
            onClick={() => handleOptionClick(option.id)}
          >
            {option.label}
            {option.active ? (
              <X 
                className="h-4 w-4 cursor-pointer" 
                onClick={(e) => handleRemove(option.id, e)}
              />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {activeOption && options.find(o => o.id === activeOption)?.label}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Enter your ${activeOption} information`}
              className="w-full mb-4"
            />
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdditionalInfoOptions;