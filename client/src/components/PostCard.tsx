import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import PDFPreview from "./PDFPreview";
import ShareDialog from "./ShareDialog";
import CommentSection from "./CommentSection";
import { queryClient } from "@/lib/queryClient";
import type { PostWithAuthor } from "@/lib/types";
import { ThumbsUp, MessageSquare, Share } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostCardProps {
  post: PostWithAuthor;
}

const PostCard = ({ post }: PostCardProps) => {
  // Use local state for optimistic updates
  const [optimisticLiked, setOptimisticLiked] = useState(post.hasLiked || false);
  const [optimisticLikeCount, setOptimisticLikeCount] = useState(post.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  
  // When post data changes from server, update our optimistic state
  useEffect(() => {
    setOptimisticLiked(post.hasLiked || false);
    setOptimisticLikeCount(post.likes || 0);
  }, [post.hasLiked, post.likes]);
  
  const handleLike = async () => {
    // Optimistic update - immediately update UI
    const previousLiked = optimisticLiked;
    const previousCount = optimisticLikeCount;
    
    // Update local state immediately
    setOptimisticLiked(!previousLiked);
    setOptimisticLikeCount(previousLiked ? previousCount - 1 : previousCount + 1);
    
    try {
      // Make API request in the background
      await apiRequest("POST", `/api/posts/${post.id}/like`, {});
      
      // Quietly refresh data in the background
      queryClient.invalidateQueries({ 
        queryKey: ["/api/posts"],
        // Don't show loading state during refetch
        refetchType: "active"
      });
    } catch (error) {
      // If there's an error, revert the optimistic update
      setOptimisticLiked(previousLiked);
      setOptimisticLikeCount(previousCount);
      
      // Show error toast
      toast({
        title: "Error",
        description: "Failed to update like status. Please try again.",
        variant: "destructive",
      });
      
      console.error("Error liking post:", error);
    }
  };
  
  const handleComment = () => {
    // Toggle comments visibility
    setShowComments(!showComments);
  };
  
  // State for share dialog
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  
  const handleShare = () => {
    // Open the share dialog
    setShareDialogOpen(true);
  };

  return (
    <Card className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
      {/* Post Header with Author Info */}
      <CardHeader className="p-3 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-600 text-white font-medium">
                {post.author.avatar ? (
                  <img 
                    src={post.author.avatar} 
                    alt={`${post.author.fullName}'s profile`} 
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  post.author.fullName?.charAt(0).toUpperCase()
                )}
              </div>
            </div>
            <div className="ml-3">
              <div className="flex items-center">
                <p className="text-sm font-semibold text-gray-900 mr-2">{post.author.fullName}</p>
                <p className="text-xs text-gray-500">{post.timeAgo}</p>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      
      {/* Post Content */}
      <CardContent className="p-4">
        <h2 className="text-lg font-bold text-black mb-2">{post.title}</h2>
        {post.description && (
          <p className="text-base text-gray-700 mb-4">{post.description}</p>
        )}
        
        {/* PDF Preview Component - Only show if there's a fileName */}
        {post.fileName && <PDFPreview fileName={post.fileName} postId={post.id} />}
      </CardContent>
      
      {/* Post Actions */}
      <CardFooter className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-around">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${optimisticLiked ? "text-blue-600 font-semibold" : "text-gray-700"}`}
          onClick={handleLike}
        >
          <ThumbsUp className={`h-4 w-4 mr-2 ${optimisticLiked ? "fill-blue-600" : ""}`} />
          <span>{optimisticLikeCount}</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className={`${showComments ? "text-blue-600 font-semibold" : "text-gray-700"}`}
          onClick={handleComment}
        >
          <MessageSquare className={`h-4 w-4 mr-2 ${showComments ? "fill-blue-600" : ""}`} />
          <span>{post.comments || 0}</span>
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-gray-700"
          onClick={handleShare}
        >
          <Share className="h-4 w-4 mr-2" />
          <span>Share</span>
        </Button>
      </CardFooter>
      
      {/* Comments Section - Only show when expanded */}
      {showComments && (
        <div className="px-4 py-3 border-t border-gray-100">
          <CommentSection postId={post.id} />
        </div>
      )}
      
      {/* Share Dialog */}
      <ShareDialog 
        open={shareDialogOpen} 
        onOpenChange={setShareDialogOpen} 
        title={post.title}
        postId={post.id}
      />
    </Card>
  );
};

export default PostCard;