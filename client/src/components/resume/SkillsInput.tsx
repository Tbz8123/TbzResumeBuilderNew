import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skill, useResume } from '@/contexts/ResumeContext';
import { Plus, X } from 'lucide-react';

const SkillsInput: React.FC = () => {
  const { resumeData, updateResumeData } = useResume();
  const [newSkill, setNewSkill] = useState('');

  // Add a new skill
  const handleAddSkill = () => {
    if (newSkill.trim() === '') return;
    
    const updatedSkills = [
      ...(resumeData.skills || []),
      { name: newSkill.trim(), level: 3 } // Default level is 3 (out of 5)
    ];
    
    updateResumeData({ skills: updatedSkills });
    setNewSkill('');
  };

  // Remove a skill by index
  const handleRemoveSkill = (indexToRemove: number) => {
    if (!resumeData.skills) return;
    
    const updatedSkills = resumeData.skills.filter((_, index) => index !== indexToRemove);
    updateResumeData({ skills: updatedSkills });
  };

  // Update a skill's level
  const handleSkillLevelChange = (index: number, newLevel: number) => {
    if (!resumeData.skills) return;
    
    const updatedSkills = [...resumeData.skills];
    updatedSkills[index] = { ...updatedSkills[index], level: newLevel };
    
    updateResumeData({ skills: updatedSkills });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Add a skill (e.g. Project Management)"
          value={newSkill}
          onChange={(e) => setNewSkill(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleAddSkill();
            }
          }}
          className="flex-1 border-gray-300 h-10 rounded"
        />
        <Button 
          type="button" 
          onClick={handleAddSkill}
          className="flex-shrink-0 h-10 w-10 p-0 bg-indigo-600 hover:bg-indigo-700 rounded"
          disabled={newSkill.trim() === ''}
        >
          <Plus size={16} />
        </Button>
      </div>
      
      <div className="space-y-2">
        {resumeData.skills && resumeData.skills.length > 0 ? (
          <ul className="space-y-2">
            {resumeData.skills.map((skill, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm font-medium">{skill.name}</span>
                
                <div className="flex items-center gap-2">
                  {/* Skill level indicator */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleSkillLevelChange(index, level)}
                        className={`w-2 h-4 rounded-sm transition-colors ${
                          level <= skill.level ? 'bg-indigo-600' : 'bg-gray-300'
                        }`}
                        title={`Level ${level}`}
                      />
                    ))}
                  </div>
                  
                  {/* Remove button */}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleRemoveSkill(index)}
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-500 hover:bg-transparent"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500 italic p-2">
            Add your key skills above. They'll appear in the sidebar of your resume.
          </p>
        )}
      </div>
    </div>
  );
};

export default SkillsInput;