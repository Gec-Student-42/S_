import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPostSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Extend the insert schema with validation rules
const formSchema = insertPostSchema.extend({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  file: z.instanceof(File).optional(),
  // Make the file optional
}).pick({
  title: true,
  description: true,
  file: true
});

type FormValues = z.infer<typeof formSchema>;

const CreateDocumentDialog = ({ open, onOpenChange }: CreateDocumentDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });
  
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      
      if (data.file) {
        formData.append("file", data.file);
      }
      
      // Send the request
      await fetch("/api/posts", {
        method: "POST",
        body: formData,
        // Don't set Content-Type header, it will be set automatically with boundaries
      });
      
      // Show success message
      toast({
        title: "Document created",
        description: "Your document has been published successfully.",
      });
      
      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
      
      // Invalidate queries to refresh the posts list
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    } catch (error) {
      console.error("Error creating document:", error);
      toast({
        variant: "destructive",
        title: "Failed to create document",
        description: "Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 3MB)
      if (file.size > 3 * 1024 * 1024) {
        form.setError("file", {
          type: "manual",
          message: "File must be less than 3MB"
        });
        return;
      }
      
      // Check file type (only PDF)
      if (file.type !== "application/pdf") {
        form.setError("file", {
          type: "manual",
          message: "Only PDF files are accepted"
        });
        return;
      }
      
      form.setValue("file", file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create New Document</DialogTitle>
          <DialogDescription>
            Add a new document to share with your team. You can attach a PDF file (max 3MB).
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter document title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a description for your document" 
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel>Attachment (Optional)</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </FormControl>
              <FormDescription>
                Upload a PDF file (max 3MB)
              </FormDescription>
              {form.formState.errors.file && (
                <FormMessage>
                  {form.formState.errors.file.message}
                </FormMessage>
              )}
            </FormItem>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Publishing..." : "Publish Document"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDocumentDialog;