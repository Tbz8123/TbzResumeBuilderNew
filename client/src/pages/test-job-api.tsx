import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TestJobApi() {
  const [jobTitleId, setJobTitleId] = useState<string>("28"); // Default to Manager ID
  const [jobTitleName, setJobTitleName] = useState<string>(""); 
  const [searchMethod, setSearchMethod] = useState<"id" | "name">("id");
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchResults, setSearchResults] = useState<string>("");

  const fetchDescriptionsById = async () => {
    setLoading(true);
    setError(null);
    setSearchResults("");
    try {
      // Convert to number to ensure proper API handling
      const idNumber = parseInt(jobTitleId);
      
      if (isNaN(idNumber)) {
        setError('Please enter a valid numeric ID');
        setDescriptions([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      
      const response = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${idNumber}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDescriptions(data);
        setTotalCount(data.length);
        setSearchResults(`Found ${data.length} descriptions for job title ID: ${idNumber}`);
      } else {
        setError('Invalid response format');
        setDescriptions([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError('Error fetching descriptions: ' + (err instanceof Error ? err.message : String(err)));
      setDescriptions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };
  
  const searchJobTitlesByName = async () => {
    setLoading(true);
    setError(null);
    setSearchResults("");
    try {
      if (!jobTitleName.trim()) {
        setError('Please enter a job title to search');
        setJobTitles([]);
        setDescriptions([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }
      
      // First search for the job title
      const titlesResponse = await apiRequest('GET', `/api/jobs/titles?search=${encodeURIComponent(jobTitleName)}`);
      const titlesData = await titlesResponse.json();
      
      if (titlesData.data && titlesData.data.length > 0) {
        setJobTitles(titlesData.data);
        
        // Use the first matching job title ID to fetch descriptions
        const matchingJobTitleId = titlesData.data[0].id;
        const exactMatch = titlesData.data.find((item: any) => 
          item.title.toLowerCase() === jobTitleName.toLowerCase()
        );
        
        // If we found an exact match, use that instead
        const idToUse = exactMatch ? exactMatch.id : matchingJobTitleId;
        
        setSearchResults(`Found job title "${exactMatch ? exactMatch.title : titlesData.data[0].title}" with ID: ${idToUse}`);
        
        // Fetch descriptions for this job title
        const descResponse = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${idToUse}`);
        const descData = await descResponse.json();
        
        if (Array.isArray(descData)) {
          setDescriptions(descData);
          setTotalCount(descData.length);
          setSearchResults(prev => `${prev}\nFound ${descData.length} descriptions`);
        } else {
          setError('Invalid descriptions response format');
          setDescriptions([]);
          setTotalCount(0);
        }
      } else {
        setError(`No job titles found matching "${jobTitleName}"`);
        setJobTitles([]);
        setDescriptions([]);
        setTotalCount(0);
      }
    } catch (err) {
      setError('Error searching job titles: ' + (err instanceof Error ? err.message : String(err)));
      setJobTitles([]);
      setDescriptions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Job Descriptions API Test</h1>
      
      <Tabs defaultValue="name" onValueChange={(value) => setSearchMethod(value as "id" | "name")}>
        <TabsList className="mb-4">
          <TabsTrigger value="id">Search by ID</TabsTrigger>
          <TabsTrigger value="name">Search by Name</TabsTrigger>
        </TabsList>
        
        <TabsContent value="id">
          <div className="flex gap-4 mb-6">
            <Input
              type="text"
              value={jobTitleId}
              onChange={(e) => setJobTitleId(e.target.value)}
              placeholder="Enter job title ID (e.g., 28 for Manager)"
              className="max-w-xs"
            />
            <Button onClick={fetchDescriptionsById} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                'Fetch Descriptions'
              )}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="name">
          <div className="flex gap-4 mb-6">
            <Input
              type="text"
              value={jobTitleName}
              onChange={(e) => setJobTitleName(e.target.value)}
              placeholder="Enter job title name (e.g., Manager, Developer)"
              className="max-w-xs"
            />
            <Button onClick={searchJobTitlesByName} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Search Job Titles
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
      
      {searchResults && (
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-6 whitespace-pre-line">
          {searchResults}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between">
            <span>Job Descriptions</span>
            <span className="text-sm font-normal text-gray-500">
              Total: {totalCount} descriptions
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
            </div>
          ) : descriptions.length > 0 ? (
            <div className="space-y-4">
              {descriptions.slice(0, 10).map((desc) => (
                <div key={desc.id} className="border-b pb-3">
                  <div className="flex justify-between">
                    <span className="font-medium">ID: {desc.id}</span>
                    <span className="text-sm text-gray-500">
                      Job Title ID: {desc.jobTitleId}
                      {desc.isRecommended && ' • Recommended'}
                    </span>
                  </div>
                  <p className="mt-1">{desc.content}</p>
                </div>
              ))}
              
              {descriptions.length > 10 && (
                <div className="text-center pt-2">
                  <p className="text-sm text-gray-500">
                    Showing 10 of {descriptions.length} descriptions
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 py-4 text-center">No descriptions found.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}