import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, FileCode, FileHtml, FileJson, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePlaceholderDetection } from "@/hooks/use-template-bindings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface TemplatePlaceholdersProps {
  templateId: string;
  onSelectPlaceholder: (placeholder: string) => void;
  selectedPlaceholder?: string;
}

export function TemplatePlaceholders({
  templateId,
  onSelectPlaceholder,
  selectedPlaceholder,
}: TemplatePlaceholdersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  const {
    data: placeholdersData,
    isLoading,
    isError,
    error,
  } = usePlaceholderDetection(templateId);
  
  // Filter placeholders based on search query
  const getFilteredPlaceholders = () => {
    if (!placeholdersData) return [];
    
    let placeholders = placeholdersData.placeholders;
    
    // Filter by tab
    if (activeTab === "svg") {
      // This is a simplification as we don't have exact source info for each placeholder
      // In a real implementation, you'd track which file each placeholder came from
      placeholders = placeholders.filter(p => 
        p.startsWith("{{") && 
        !p.includes("data-field") && 
        !p.includes(".css") && 
        !p.includes(".js")
      );
    } else if (activeTab === "html") {
      placeholders = placeholders.filter(p => 
        p.includes("data-field") || p.toLowerCase().includes("html")
      );
    } else if (activeTab === "css") {
      placeholders = placeholders.filter(p => 
        p.toLowerCase().includes("css") || p.includes("--")
      );
    } else if (activeTab === "js") {
      placeholders = placeholders.filter(p => 
        p.toLowerCase().includes("js") || p.includes("${")
      );
    }
    
    // Filter by search
    if (searchQuery) {
      return placeholders.filter(placeholder =>
        placeholder.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return placeholders;
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 border border-destructive/50 bg-destructive/10 rounded-md text-sm text-destructive">
        Error loading placeholders: {error?.message || "Unknown error"}
      </div>
    );
  }

  if (!placeholdersData || placeholdersData.placeholders.length === 0) {
    return (
      <div className="p-4 border border-muted bg-muted/10 rounded-md text-sm text-muted-foreground">
        No placeholders detected in this template. Make sure your template includes placeholders like {{name}}, [[CUSTOM_SECTION]], or data-field="email" attributes.
      </div>
    );
  }
  
  const filteredPlaceholders = getFilteredPlaceholders();
  
  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search placeholders..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="all">
            All 
            <Badge variant="outline" className="ml-2">
              {placeholdersData.counts.total}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="svg">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <FileCode className="h-3.5 w-3.5" />
                    <Badge variant="outline">
                      {placeholdersData.counts.svg}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>SVG Placeholders</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsTrigger>
          <TabsTrigger value="html">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <FileHtml className="h-3.5 w-3.5" />
                    <Badge variant="outline">
                      {placeholdersData.counts.html}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>HTML Placeholders</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsTrigger>
          <TabsTrigger value="css">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" />
                    <Badge variant="outline">
                      {placeholdersData.counts.css}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>CSS Placeholders</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsTrigger>
          <TabsTrigger value="js">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <FileJson className="h-3.5 w-3.5" />
                    <Badge variant="outline">
                      {placeholdersData.counts.js}
                    </Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>JavaScript Placeholders</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <div className="space-y-2 mt-2">
            {filteredPlaceholders.length === 0 ? (
              <div className="p-4 border border-muted bg-muted/10 rounded-md text-sm text-muted-foreground">
                No matching placeholders found.
              </div>
            ) : (
              filteredPlaceholders.map((placeholder) => (
                <div
                  key={placeholder}
                  className={`p-3 border rounded-md cursor-pointer ${
                    selectedPlaceholder === placeholder
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => onSelectPlaceholder(placeholder)}
                >
                  <div className="font-mono text-xs">{placeholder}</div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}