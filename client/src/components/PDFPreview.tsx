import { memo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PDFPreviewProps {
  fileName: string | null;
  fileUrl?: string;
  postId?: number;
}

const PDFPreview = memo(({ fileName, fileUrl, postId }: PDFPreviewProps) => {
  const [actualFileUrl, setActualFileUrl] = useState<string | undefined>(fileUrl);
  const { toast } = useToast();

  // If fileUrl is not provided, construct it based on fileName
  useEffect(() => {
    if (!fileUrl && fileName) {
      // In our server implementation, files are served directly from /uploads directory
      setActualFileUrl(`/uploads/${fileName}`);
    } else if (fileUrl) {
      setActualFileUrl(fileUrl);
    }
  }, [fileUrl, fileName]);

  const handleDownload = () => {
    if (!actualFileUrl || !fileName) {
      toast({
        title: "Download failed",
        description: "File not available for download",
        variant: "destructive"
      });
      return;
    }

    console.log("Downloading:", fileName);
    
    // Create an anchor element and trigger download
    const link = document.createElement('a');
    link.href = actualFileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenFile = () => {
    if (!actualFileUrl) {
      toast({
        title: "Cannot open file",
        description: "File not available for viewing",
        variant: "destructive"
      });
      return;
    }

    console.log("Opening:", fileName);
    window.open(actualFileUrl, "_blank");
  };

  // Don't render if there's no fileName
  if (!fileName) {
    return null;
  }
  
  return (
    <Card className="border border-gray-200 shadow-sm rounded-lg overflow-hidden">
      {/* PDF Header */}
      <CardHeader className="bg-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <FileText className="h-5 w-5 text-red-600 mr-2" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{fileName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-gray-200" onClick={handleDownload}>
            <Download className="h-4 w-4 text-gray-700" />
            <span className="sr-only">Download</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 rounded-full hover:bg-gray-200" onClick={handleOpenFile}>
            <ExternalLink className="h-4 w-4 text-gray-700" />
            <span className="sr-only">Open</span>
          </Button>
        </div>
      </CardHeader>
      
      {/* PDF Preview Content - Optimized with fewer DOM elements */}
      <CardContent className="bg-white p-4 h-52 overflow-hidden relative">
        <div className="w-full h-full flex flex-col space-y-3">
          <div className="w-full bg-gray-200 h-8 rounded-md"></div>
          <div className="w-3/4 bg-gray-200 h-6 rounded-md"></div>
          <div className="w-full flex space-x-3">
            <div className="w-1/2 bg-gray-200 h-20 rounded-md"></div>
            <div className="w-1/2 bg-gray-200 h-20 rounded-md"></div>
          </div>
          <div className="w-full bg-gray-200 h-4 rounded-md"></div>
          <div className="w-2/3 bg-gray-200 h-4 rounded-md"></div>
        </div>
        
        {/* Fading effect at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent"></div>
      </CardContent>
    </Card>
  );
});

PDFPreview.displayName = "PDFPreview";
export default PDFPreview;
