import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useTemplate, 
  useTemplateVersions, 
  useTemplateVersion, 
  useRestoreTemplateVersion 
} from "@/hooks/use-templates";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, RotateCcw, Eye } from "lucide-react";
import { Editor } from "@monaco-editor/react";

const TemplateVersionsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("code");
  
  const { data: template, isLoading: templateLoading } = useTemplate(id);
  const { data: versions, isLoading: versionsLoading } = useTemplateVersions(id);
  const { 
    data: versionDetails,
    isLoading: versionDetailsLoading
  } = useTemplateVersion(id, selectedVersion || undefined);
  
  const restoreVersionMutation = useRestoreTemplateVersion(id);
  
  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    
    try {
      await restoreVersionMutation.mutateAsync(selectedVersion);
      toast({
        title: "Version Restored",
        description: `Template has been restored to version ${selectedVersion}`,
      });
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to restore version: ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };
  
  const openVersionDialog = (versionNumber: number) => {
    setSelectedVersion(versionNumber);
    setDialogOpen(true);
  };
  
  const isLoading = templateLoading || versionsLoading;
  
  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/admin/templates")}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to templates
          </Button>
          <h1 className="text-3xl font-bold">
            Version History
          </h1>
        </div>
        <Button 
          variant="outline"
          onClick={() => navigate(`/admin/templates/${id}`)}
        >
          Edit Current Version
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : !template ? (
        <div className="text-center py-8 text-red-500">
          Template not found
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
              <CardDescription>
                Review and restore previous versions of this template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Category:</span>
                    <span className="ml-2">{template.category}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className="ml-2">
                      {template.isActive ? (
                        <Badge className="bg-green-500">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Created:</span>
                    <span className="ml-2">
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Last Updated:</span>
                    <span className="ml-2">
                      {new Date(template.updatedAt).toLocaleDateString()} at{" "}
                      {new Date(template.updatedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Version</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Changelog</TableHead>
                        <TableHead>Created By</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!versions || versions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center">
                            No version history found
                          </TableCell>
                        </TableRow>
                      ) : (
                        versions.map((version) => (
                          <TableRow key={version.id}>
                            <TableCell className="font-medium">
                              {version.versionNumber}{" "}
                              {version.versionNumber === versions[0].versionNumber && (
                                <Badge className="ml-1 bg-blue-500">Latest</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(version.createdAt).toLocaleDateString()} at{" "}
                              {new Date(version.createdAt).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              {version.changelog || "No changelog provided"}
                            </TableCell>
                            <TableCell>
                              {version.createdById ? `User ID: ${version.createdById}` : "System"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => openVersionDialog(version.versionNumber)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                                {version.versionNumber !== versions[0].versionNumber && (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => openVersionDialog(version.versionNumber)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Restore
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {selectedVersion !== null && (
                    <>
                      Version {selectedVersion}{" "}
                      {versions && versions[0]?.versionNumber === selectedVersion && (
                        <Badge className="ml-1 bg-blue-500">Latest</Badge>
                      )}
                    </>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {versionDetails?.changelog || "No changelog provided"}
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-grow min-h-[600px] overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="code">SVG Code</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="code" className="border rounded-md mt-4 h-[600px]">
                    {versionDetailsLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : (
                      <Editor
                        height="100%"
                        defaultLanguage="xml"
                        value={versionDetails?.svgContent}
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          wordWrap: "on",
                          scrollBeyondLastLine: false,
                        }}
                      />
                    )}
                  </TabsContent>
                  
                  <TabsContent value="preview" className="mt-4 border rounded-md h-[600px] overflow-auto p-4 bg-gray-50">
                    {versionDetailsLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                      </div>
                    ) : (
                      <div
                        className="flex justify-center h-full"
                        dangerouslySetInnerHTML={{ __html: versionDetails?.svgContent || "" }}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="flex items-center justify-between mt-4">
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                
                {selectedVersion !== null && 
                 versions && 
                 versions[0]?.versionNumber !== selectedVersion && (
                  <Button 
                    onClick={handleRestoreVersion}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={restoreVersionMutation.isPending}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    {restoreVersionMutation.isPending 
                      ? "Restoring..." 
                      : `Restore to Version ${selectedVersion}`}
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
};

export default TemplateVersionsPage;