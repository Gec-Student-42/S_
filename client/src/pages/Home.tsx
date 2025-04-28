import { useQuery } from "@tanstack/react-query";
import { useState, memo, useCallback } from "react";
import SearchBar from "@/components/SearchBar";
import PostCard from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import CreateDocumentDialog from "@/components/CreateDocumentDialog";
import type { PostWithAuthor } from "@/lib/types";

// Loading skeleton as a separate component to memoize it
const PostLoadingSkeleton = memo(() => (
  <div className="space-y-5">
    {[...Array(2)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex items-center mb-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="ml-3 space-y-1.5">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-2.5 w-14" />
          </div>
        </div>
        <Skeleton className="h-5 w-2/3 mb-2" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-48 w-full" />
      </div>
    ))}
  </div>
));

PostLoadingSkeleton.displayName = "PostLoadingSkeleton";

// Empty state component
const EmptyState = memo(() => (
  <div className="text-center py-8">
    <p className="text-gray-500">No documents found.</p>
  </div>
));

EmptyState.displayName = "EmptyState";

const Home = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { data: posts, isLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
    staleTime: 30000, // Reduce refetching frequency (30 seconds)
  });

  const toggleCreateDialog = useCallback(() => {
    setShowCreateDialog(prev => !prev);
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-3 pt-2">
      <div className="mb-3">
        <SearchBar />
      </div>
        
      <div className="pt-1">
        {isLoading ? (
          <PostLoadingSkeleton />
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
      
      {/* Floating Create New Document Button (Mobile Only) */}
      <div className="md:hidden fixed bottom-4 right-4 z-30">
        <Button 
          className="h-12 w-12 rounded-full shadow-md flex items-center justify-center bg-blue-600 hover:bg-blue-700 border border-white" 
          size="icon"
          onClick={toggleCreateDialog}
          aria-label="Create New Document"
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>
      
      {/* Create Document Dialog */}
      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  );
};

export default Home;
