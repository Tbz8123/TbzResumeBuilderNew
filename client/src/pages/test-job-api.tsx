import { useState, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

export default function TestJobApi() {
  const [jobTitleId, setJobTitleId] = useState<string>("28"); // Default to Manager ID
  const [descriptions, setDescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDescriptions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('GET', `/api/jobs/descriptions?jobTitleId=${jobTitleId}`);
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setDescriptions(data);
        setTotalCount(data.length);
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

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Job Descriptions API Test</h1>
      
      <div className="flex gap-4 mb-6">
        <Input
          type="text"
          value={jobTitleId}
          onChange={(e) => setJobTitleId(e.target.value)}
          placeholder="Enter job title ID"
          className="max-w-xs"
        />
        <Button onClick={fetchDescriptions} disabled={loading}>
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