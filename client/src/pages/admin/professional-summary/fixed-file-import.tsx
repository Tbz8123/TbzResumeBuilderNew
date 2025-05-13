// This is a proper implementation of the handleFileImport function with correct try-catch structure
const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files || event.target.files.length === 0) {
    return;
  }

  const file = event.target.files[0];
  const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
  
  // Validate file format
  if (!['csv', 'xlsx', 'xls', 'json'].includes(fileExt)) {
    toast({
      title: "Invalid File Format",
      description: "Please upload a CSV, Excel, or JSON file",
      variant: "destructive",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    return;
  }
  
  setIsImporting(true);
  setUploadStatus({
    processed: 0,
    created: 0,
    updated: 0,
    deleted: 0,
    errors: [],
    isComplete: false,
    syncMode
  });

  // Define interval at this scope so it's available in all handlers
  let statusCheckInterval: NodeJS.Timeout | null = null;
  
  // Function to check import status via polling
  const checkImportStatus = async () => {
    try {
      // Use the debug endpoint for now to verify if polling works
      console.log("Checking import status...");
      const statusResponse = await fetch('/api/professional-summary/debug-import-status', {
        credentials: 'include'
      });
      
      if (!statusResponse.ok) {
        console.error("Status check failed with status:", statusResponse.status);
        throw new Error('Failed to get import status');
      }
      
      const data = await statusResponse.json();
      console.log("Received status update:", data);
      
      // Update status with the latest information
      setUploadStatus({
        processed: data.processed || 0,
        created: data.created || 0,
        updated: data.updated || 0,
        deleted: data.deleted || 0,
        errors: data.errors || [],
        isComplete: data.isComplete || false,
        syncMode: data.syncMode
      });
      
      // If import is complete, stop polling and clean up
      if (data.isComplete) {
        console.log("Import complete, cleaning up");
        if (statusCheckInterval) {
          clearInterval(statusCheckInterval);
          statusCheckInterval = null;
        }
        
        setIsImporting(false);
        
        if (data.errors && data.errors.length > 0) {
          // Show detailed error information for the first few errors
          const errorDetails = data.errors.slice(0, 3).map((err: any) => 
            `Row ${err.row}: ${err.message}`
          ).join('\n');
          
          const moreErrorsText = data.errors.length > 3 
            ? `\n...and ${data.errors.length - 3} more errors.` 
            : '';
            
          toast({
            title: "Import Completed with Errors",
            description: `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Errors: ${data.errors.length}\n\n${errorDetails}${moreErrorsText}`,
            variant: "destructive",
          });
          
          console.log("Import errors:", data.errors);
        } else {
          // Success message
          toast({
            title: "Import Successful",
            description: syncMode === 'full-sync'
              ? `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}, Deleted: ${data.deleted}`
              : `Processed: ${data.processed}, Created: ${data.created}, Updated: ${data.updated}`,
          });
        }
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/titles'] });
        queryClient.invalidateQueries({ queryKey: ['/api/professional-summary/categories'] });
        
        // Clean up
        setUploadStatus(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (error) {
      console.error("Status check error:", error);
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
      }
      
      setIsImporting(false);
      
      toast({
        title: "Import Status Check Failed",
        description: error instanceof Error ? error.message : "Failed to check import status",
        variant: "destructive",
      });
      
      setUploadStatus(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Use our new unified import endpoint
    const endpoint = '/api/professional-summary/import';
    
    console.log(`Sending file to ${endpoint}?mode=${syncMode}`);
    
    // Upload the file
    const response = await fetch(`${endpoint}?mode=${syncMode}`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });
    
    console.log("Upload response status:", response.status);
    
    // Handle failure
    if (!response.ok) {
      console.error("Upload failed with status:", response.status);
      let errorMessage = "Failed to import data";
      
      try {
        const errorText = await response.text();
        console.log("Error response text:", errorText);
        
        if (errorText && errorText.trim().startsWith('{')) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        }
      } catch (e) {
        console.error("Error parsing response:", e);
      }
      
      setIsImporting(false);
      setUploadStatus(null);
      
      toast({
        title: "Import Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      return;
    }
    
    // Handle success
    console.log("Upload successful, starting status polling");
    
    // Start polling for import status
    // Check immediately, then every second
    await checkImportStatus(); 
    statusCheckInterval = setInterval(checkImportStatus, 1000);
    
    // Safety cleanup after 5 minutes in case something goes wrong
    setTimeout(() => {
      if (statusCheckInterval) {
        console.log("Safety timeout triggered");
        clearInterval(statusCheckInterval);
        statusCheckInterval = null;
        setIsImporting(false);
        setUploadStatus(null);
      }
    }, 5 * 60 * 1000);
  } catch (error: any) {
    console.error("Error during import:", error);
    
    setIsImporting(false);
    setUploadStatus(null);
    
    toast({
      title: "Import Failed",
      description: error.message || "An unexpected error occurred",
      variant: "destructive",
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }
};