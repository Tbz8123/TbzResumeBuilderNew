import React, { useState } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';
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
      <div className="flex items-center gap-1 mb-3">
        <h3 className="text-gray-700 text-sm font-medium">Add additional information to your resume</h3>
        <span className="text-gray-500 text-xs">(optional)</span>
        <HelpCircle size={14} className="text-gray-400 ml-1" />
      </div>
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            size="sm"
            className={`rounded-3xl border px-3 py-1 h-auto text-sm flex items-center gap-1 ${
              option.active 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'border-gray-300 text-indigo-700'
            }`}
            onClick={() => handleOptionClick(option.id)}
          >
            {option.label}
            {option.active ? (
              <X 
                className="h-3.5 w-3.5 cursor-pointer ml-1" 
                onClick={(e) => handleRemove(option.id, e)}
              />
            ) : (
              <Plus className="h-3.5 w-3.5 ml-1" />
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
              className="w-full mb-4 border-gray-300"
            />
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="border-gray-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
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