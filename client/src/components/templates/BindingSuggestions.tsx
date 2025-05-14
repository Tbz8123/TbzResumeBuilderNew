import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, X, Bot, AlertTriangle, ThumbsUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export interface SuggestionItem {
  fieldPath: string;
  fieldName?: string;
  confidence: number;
  reasoning?: string;
}

export interface BindingSuggestion {
  bindingId: number;
  token: string;
  suggestions: SuggestionItem[];
}

interface BindingSuggestionsProps {
  suggestions: BindingSuggestion[];
  onAccept: (bindingId: number, fieldPath: string) => void;
  onAcceptAll: (suggestions: BindingSuggestion[]) => void;
  onDismiss: () => void;
  isLoading?: boolean;
}

// Helper to format confidence score as percentage
const formatConfidence = (confidence: number) => {
  return `${Math.round(confidence * 100)}%`;
};

// Helper to get color based on confidence
const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
  if (confidence >= 0.5) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-red-600 bg-red-50 border-red-200';
};

// Helper to get icon based on confidence
const getConfidenceIcon = (confidence: number) => {
  if (confidence >= 0.8) return <ThumbsUp className="h-4 w-4 text-green-600" />;
  if (confidence >= 0.5) return <Check className="h-4 w-4 text-amber-600" />;
  return <AlertTriangle className="h-4 w-4 text-red-600" />;
};

export const BindingSuggestions: React.FC<BindingSuggestionsProps> = ({
  suggestions,
  onAccept,
  onAcceptAll,
  onDismiss,
  isLoading = false
}) => {
  // Filter high-confidence suggestions for "Accept All" functionality
  const highConfidenceSuggestions = suggestions.filter(
    suggestion => suggestion.suggestions.length > 0 && suggestion.suggestions[0].confidence >= 0.5
  );

  return (
    <div className="py-4">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h3 className="text-lg font-medium">Analyzing Template...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Our AI is examining your template structure and generating intelligent binding suggestions.
          </p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-10 w-10 text-amber-500 mb-4" />
          <h3 className="text-lg font-medium">No Suggestions Available</h3>
          <p className="text-sm text-muted-foreground mt-2">
            We couldn't generate any binding suggestions for your template. 
            Try modifying your template to include clear placeholder markers.
          </p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-medium">AI Binding Suggestions</h3>
              <p className="text-sm text-muted-foreground">
                {suggestions.length} token{suggestions.length !== 1 ? 's' : ''} analyzed
              </p>
            </div>
            <div className="space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={onDismiss}
              >
                <X className="h-4 w-4 mr-1.5" />
                Dismiss
              </Button>
              
              <Button 
                size="sm"
                onClick={() => onAcceptAll(suggestions)}
                disabled={highConfidenceSuggestions.length === 0}
              >
                <Check className="h-4 w-4 mr-1.5" />
                Accept All High Confidence
                {highConfidenceSuggestions.length > 0 && ` (${highConfidenceSuggestions.length})`}
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {suggestions.map((suggestion) => (
                <Card key={suggestion.bindingId} className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-medium flex items-center">
                        <Bot className="h-4 w-4 mr-1.5 text-primary" />
                        Template Token
                      </h4>
                      <code className="text-sm bg-muted px-1.5 py-0.5 rounded mt-1 font-mono">
                        {suggestion.token}
                      </code>
                    </div>
                    
                    {suggestion.suggestions.length > 0 && (
                      <Badge 
                        variant="outline" 
                        className={getConfidenceColor(suggestion.suggestions[0].confidence)}
                      >
                        <span className="mr-1.5">{formatConfidence(suggestion.suggestions[0].confidence)}</span>
                        {getConfidenceIcon(suggestion.suggestions[0].confidence)}
                      </Badge>
                    )}
                  </div>
                  
                  {suggestion.suggestions.length > 0 ? (
                    <Tabs defaultValue="top">
                      <TabsList className="mb-2">
                        <TabsTrigger value="top">Top Suggestions</TabsTrigger>
                        <TabsTrigger value="all">All Matches</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="top" className="space-y-2">
                        <div className="bg-blue-50 rounded-md p-3 border border-blue-100">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-blue-800">Recommended Binding</h5>
                              <code className="text-sm font-mono bg-blue-100 px-1.5 py-0.5 rounded text-blue-800 mt-1">
                                {suggestion.suggestions[0].fieldPath}
                              </code>
                              {suggestion.suggestions[0].reasoning && (
                                <p className="text-xs text-blue-700 mt-1">
                                  {suggestion.suggestions[0].reasoning}
                                </p>
                              )}
                            </div>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => onAccept(suggestion.bindingId, suggestion.suggestions[0].fieldPath)}
                            >
                              Apply
                            </Button>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="all">
                        <div className="space-y-2">
                          {suggestion.suggestions.map((item, index) => (
                            <div 
                              key={item.fieldPath}
                              className={`rounded-md p-3 border flex justify-between items-start ${
                                index === 0 
                                  ? 'bg-blue-50 border-blue-100' 
                                  : 'bg-gray-50 border-gray-100'
                              }`}
                            >
                              <div>
                                <h5 className={`font-medium ${
                                  index === 0 ? 'text-blue-800' : 'text-gray-800'
                                }`}>
                                  {index === 0 ? 'Best Match' : `Alternative ${index}`}
                                  <Badge 
                                    variant="outline" 
                                    className={`ml-2 ${getConfidenceColor(item.confidence)}`}
                                  >
                                    {formatConfidence(item.confidence)}
                                  </Badge>
                                </h5>
                                <code className={`text-sm font-mono px-1.5 py-0.5 rounded mt-1 ${
                                  index === 0 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.fieldPath}
                                </code>
                                {item.reasoning && (
                                  <p className={`text-xs mt-1 ${
                                    index === 0 ? 'text-blue-700' : 'text-gray-600'
                                  }`}>
                                    {item.reasoning}
                                  </p>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant={index === 0 ? "secondary" : "outline"}
                                onClick={() => onAccept(suggestion.bindingId, item.fieldPath)}
                              >
                                Apply
                              </Button>
                            </div>
                          ))}
                        </div>
                      </TabsContent>
                    </Tabs>
                  ) : (
                    <div className="bg-gray-50 rounded-md p-3 border border-gray-200">
                      <div className="flex items-center text-gray-700">
                        <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                        <p className="text-sm">No matching fields found for this token.</p>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </ScrollArea>
        </>
      )}
    </div>
  );
};