import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Copy, Check, Mail, MessageSquare } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { useToast } from "@/hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  postId: number;
}

const ShareDialog = ({ open, onOpenChange, title, postId }: ShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate a shareable link for the post
  const shareUrl = `${window.location.origin}/post/${postId}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      
      toast({
        title: "Link copied to clipboard",
        description: "You can now paste and share it anywhere",
      });
      
      // Reset copy status after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again or copy manually",
        variant: "destructive",
      });
    }
  };
  
  const handleShare = (platform: string) => {
    let shareLink = "";
    const shareMessage = `Check out this document: ${title} ${shareUrl}`;
    
    switch (platform) {
      case "whatsapp":
        shareLink = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
        break;
      case "sms":
        shareLink = `sms:?body=${encodeURIComponent(shareMessage)}`;
        break;
      case "email":
        shareLink = `mailto:?subject=${encodeURIComponent(`Sharing: ${title}`)}&body=${encodeURIComponent(`I thought you might be interested in this document: ${shareUrl}`)}`;
        break;
      default:
        return;
    }
    
    // Open share link in a new window
    window.open(shareLink, "_blank", "noopener,noreferrer");
    
    // Close the dialog
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Share "{title}" with others via link, messaging or email
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center space-x-2 pt-4">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="link" className="sr-only">Link</Label>
            <Input
              id="link"
              readOnly
              value={shareUrl}
              className="h-9"
            />
          </div>
          <Button size="sm" className="px-3" onClick={handleCopy}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
          <Button
            variant="outline"
            className="flex gap-2 items-center"
            onClick={() => handleShare("email")}
          >
            <Mail className="h-4 w-4" />
            <span>Email</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex gap-2 items-center text-[#25D366]"
            onClick={() => handleShare("whatsapp")}
          >
            <FaWhatsapp className="h-4 w-4" />
            <span>WhatsApp</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex gap-2 items-center text-[#007AFF]"
            onClick={() => handleShare("sms")}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Text Message</span>
          </Button>
        </div>
        
        <DialogFooter className="flex items-center border-t pt-4">
          <Button 
            variant="secondary" 
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;