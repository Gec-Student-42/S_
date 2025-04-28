import { useState, useCallback, memo } from "react";
import Sidebar from "@/components/Sidebar";
import UserProfileSidebar from "@/components/UserProfileSidebar";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface MainLayoutProps {
  children: React.ReactNode;
}

// Memoized backdrop component for better performance
const MobileBackdrop = memo(({ onClick }: { onClick: () => void }) => (
  <div
    className="fixed inset-0 bg-gray-800 bg-opacity-50 z-40"
    onClick={onClick}
  />
));

MobileBackdrop.displayName = "MobileBackdrop";

// Memoized mobile header for better performance
const MobileHeader = memo(({ 
  onMenuClick,
  onReloadClick,
  user
}: { 
  onMenuClick: () => void,
  onReloadClick: () => void,
  user: any | null
}) => (
  <header className="md:hidden flex items-center justify-between p-2 border-b border-gray-200 bg-white sticky top-0 z-10">
    <button
      onClick={onMenuClick}
      className="p-2 rounded-md text-gray-600 hover:bg-gray-100"
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </button>
    <button 
      className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-base"
      onClick={onReloadClick}
      aria-label="Reload page"
    >
      D
    </button>
    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center bg-blue-600 text-white font-medium">
      {user?.avatar ? (
        <img 
          src={user.avatar} 
          alt={`${user.fullName}'s avatar`} 
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        user?.fullName?.charAt(0).toUpperCase() || 'U'
      )}
    </div>
  </header>
));

MobileHeader.displayName = "MobileHeader";

const MainLayout = ({ children }: MainLayoutProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { user } = useAuth();
  
  const handleMenuOpen = useCallback(() => {
    setMobileMenuOpen(true);
  }, []);
  
  const handleMenuClose = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);
  
  const handleReload = useCallback(() => {
    window.location.reload();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 max-h-screen">
      {/* Left Sidebar */}
      <Sidebar
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Mobile sidebar backdrop */}
      {mobileMenuOpen && !isDesktop && <MobileBackdrop onClick={handleMenuClose} />}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader onMenuClick={handleMenuOpen} onReloadClick={handleReload} user={user} />

        {/* Content Wrapper */}
        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <main id="main-content" className="flex-1 overflow-y-auto bg-white md:bg-gray-50 pb-16">
            {children}
          </main>

          {/* Right Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block h-full">
            <UserProfileSidebar />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
