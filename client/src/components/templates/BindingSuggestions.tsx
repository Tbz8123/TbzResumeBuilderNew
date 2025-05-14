import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, Check, X, Lightbulb, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface Binding {
  id: number;
  templateId: number;
  placeholder: string;
  selector: string;
  isMapped?: boolean;
}

export interface BindingSuggestion {
  binding: Binding;
  suggestedField: string;
  confidence: number;
}

interface BindingSuggestionsProps {
  suggestions: BindingSuggestion[];
  onAccept: (binding: Binding) => void;
  onAcceptAll: () => void;
  onDismiss: (bindingId: number) => void;
  isLoading?: boolean;
}

export function BindingSuggestions({
  suggestions,
  onAccept,
  onAcceptAll,
  onDismiss,
  isLoading = false
}: BindingSuggestionsProps) {
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    if (suggestions.length > 0) {
      setProgress((acceptedCount / suggestions.length) * 100);
    } else {
      setProgress(0);
    }
  }, [acceptedCount, suggestions.length]);
  
  const handleAccept = (suggestion: BindingSuggestion) => {
    onAccept({
      ...suggestion.binding,
      selector: suggestion.suggestedField,
      isMapped: true
    });
    setAcceptedCount(prev => prev + 1);
  };
  
  const handleDismiss = (bindingId: number) => {
    onDismiss(bindingId);
  };
  
  const handleAcceptAll = () => {
    onAcceptAll();
    setAcceptedCount(suggestions.length);
  };
  
  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-lg font-medium text-muted-foreground">AI engine analyzing your template...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Processing template tokens and finding the best field matches
        </p>
      </div>
    );
  }
  
  if (suggestions.length === 0) {
    return (
      <div className="p-8 text-center">
        <Bot className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium">No suggestions available</p>
        <p className="text-sm text-muted-foreground mt-2">
          All fields are already mapped or our binding bot couldn't find confident matches
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium text-lg flex items-center">
            <Bot className="h-5 w-5 mr-2 text-primary" />
            AI Binding Suggestions
          </h3>
          <p className="text-sm text-muted-foreground">
            {suggestions.length} potential field matches found
          </p>
        </div>
        
        <Button 
          onClick={handleAcceptAll}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          Accept All
        </Button>
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <ScrollArea className="h-[320px] pr-4">
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <Card key={suggestion.binding.id} className="p-4 relative">
              <div className="grid grid-cols-[1fr,auto] gap-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className="font-mono text-xs"
                    >
                      {suggestion.binding.placeholder.substring(0, 30)}
                      {suggestion.binding.placeholder.length > 30 ? '...' : ''}
                    </Badge>
                    
                    <Badge 
                      className={
                        suggestion.confidence > 0.8 ? 'bg-green-100 text-green-800 border-green-200' :
                        suggestion.confidence > 0.6 ? 'bg-blue-100 text-blue-800 border-blue-200' :
                        'bg-amber-100 text-amber-800 border-amber-200'
                      }
                    >
                      {Math.round(suggestion.confidence * 100)}% match
                    </Badge>
                  </div>
                  
                  <div className="mt-2">
                    <div className="flex items-center text-sm font-medium">
                      <span>Suggested field:</span>
                      <Badge variant="secondary" className="ml-2 bg-blue-50 text-blue-700">
                        {suggestion.suggestedField}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="w-24"
                    onClick={() => handleAccept(suggestion)}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-24"
                    onClick={() => handleDismiss(suggestion.binding.id)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}