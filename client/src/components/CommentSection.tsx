import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { CommentWithAuthor } from "@/lib/types";
import { apiRequest } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CommentSectionProps {
  postId: number;
}

const CommentSection = ({ postId }: CommentSectionProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const queryClient = useQueryClient();

  // Fetch comments for the post
  const { 
    data: comments, 
    isLoading: isLoadingComments,
    error 
  } = useQuery({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}/comments`);
      if (!res.ok) {
        throw new Error("Failed to fetch comments");
      }
      return res.json() as Promise<CommentWithAuthor[]>;
    },
    refetchOnWindowFocus: false
  });

  // Comment creation mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
      return res.json();
    },
    onSuccess: () => {
      // Reset form and refetch comments
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to post comment",
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to post a comment",
        variant: "destructive"
      });
      return;
    }
    
    if (newComment.trim() === "") {
      toast({
        title: "Error",
        description: "Comment cannot be empty",
        variant: "destructive"
      });
      return;
    }
    
    addCommentMutation.mutate(newComment);
  };

  return (
    <div className="mt-6 space-y-4">
      <h3 className="font-medium text-lg">Comments</h3>
      
      {/* Comment form */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Input
          placeholder={user ? "Add a comment..." : "Login to comment"}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!user || addCommentMutation.isPending}
          className="flex-grow"
        />
        <Button 
          type="submit" 
          disabled={!user || addCommentMutation.isPending}
        >
          {addCommentMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Post"
          )}
        </Button>
      </form>
      
      {/* Comments list */}
      <div className="space-y-4">
        {isLoadingComments ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-4 text-destructive">
            Failed to load comments. Please try again.
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-900">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author.avatar || undefined} />
                <AvatarFallback>
                  {comment.author.fullName.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <p className="font-medium text-sm">
                    {comment.author.fullName}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {comment.timeAgo}
                  </span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            No comments yet. Be the first to comment!
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentSection;