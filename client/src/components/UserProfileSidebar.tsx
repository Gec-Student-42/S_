import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CreateDocumentDialog from "@/components/CreateDocumentDialog";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "@/lib/types";
import { User } from "@shared/schema";

const UserProfileSidebar = () => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const { user } = useAuth();
  
  // Fetch recent activities
  const { data: activities } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  return (
    <aside className="w-64 border-l border-gray-200 bg-white p-4 h-full">
      {/* User Profile */}
      {user && (
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-600 text-white font-medium text-lg">
            {user.avatar ? (
              <img 
                src={user.avatar} 
                alt={`${user.fullName}'s avatar`} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              user.fullName?.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{user.fullName}</h3>
          </div>
        </div>
      )}
      
      {/* Quick Actions */}
      <div className="mb-6">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Quick Actions
        </h4>
        <div className="space-y-2">
          <Button 
            variant="default"
            size="sm"
            className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            <span>Create New Document</span>
          </Button>
        </div>
      </div>
      
      {/* Create Document Dialog */}
      <CreateDocumentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      
      <Separator className="my-4" />
      
      {/* Activity */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Activity
        </h4>
        <div className="space-y-3">
          {activities?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-blue-600 text-white font-medium text-sm">
                {activity.user.avatar ? (
                  <img 
                    src={activity.user.avatar} 
                    alt={`${activity.user.fullName}'s avatar`} 
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  activity.user.fullName?.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">
                    {activity.user.id === user?.id ? "You" : activity.user.fullName}
                  </span>
                  <span className="text-gray-500"> {activity.action} </span>
                  <span className="font-medium">{activity.target}</span>
                </p>
                <p className="text-xs text-gray-500">{activity.timeAgo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default UserProfileSidebar;
