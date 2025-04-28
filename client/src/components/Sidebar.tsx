import { Link, useLocation } from "wouter";
import { Home, LogOut, MessageSquare, Mail, Sun, Moon } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

const Sidebar = ({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Function to scroll the main content area to the top
  const scrollToTop = () => {
    // Get the main content element by ID
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      // Scroll the main content to the top
      mainContent.scrollTop = 0;
    }
  };

  // Handle logout
  const handleLogout = () => {
    if (!user) return;
    
    logoutMutation.mutate();
  };

  const navItems = [
    { 
      icon: <Home className="h-5 w-5" />, 
      label: "Home", 
      action: scrollToTop 
    }
  ];

  // No longer need isActive since we're using action handlers

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center justify-center h-20 border-b-2 border-gray-200 bg-white dark:bg-background dark:border-gray-800">
        <button 
          className="w-10 h-10 bg-primary rounded-md flex items-center justify-center text-white font-bold text-xl"
          onClick={() => window.location.reload()}
        >
          D
        </button>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex flex-col items-center pt-8 gap-8">
        {navItems.map((item, index) => (
          <div
            key={index}
            className="w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer
              text-gray-700 hover:bg-gray-100 hover:text-primary dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-primary"
            title={item.label}
            onClick={item.action}
          >
            {item.icon}
          </div>
        ))}
      </nav>
      
      {/* Spacer to push footer buttons to bottom */}
      <div className="flex-grow"></div>
      
      {/* Footer buttons */}
      <div className="flex flex-col items-center gap-4 mb-8">
        {/* Theme Toggle Button */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer
            text-orange-500 hover:bg-orange-50 dark:text-yellow-300 dark:hover:bg-yellow-900/20"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          onClick={() => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
            toast({
              title: theme === 'dark' ? 'Light Mode Activated' : 'Dark Mode Activated',
              description: theme === 'dark' 
                ? 'Switched to light theme for better visibility in bright environments.' 
                : 'Switched to dark theme for reduced eye strain in low-light environments.',
            });
          }}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </div>
        
        {/* Feedback Button */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer
            text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
          title="Feedback"
          onClick={() => {
            toast({
              title: "Feedback",
              description: "Thanks for your interest! Feedback feature coming soon.",
            });
          }}
        >
          <MessageSquare className="h-5 w-5" />
        </div>
        
        {/* Contact Me Button */}
        <div
          className="w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer
            text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          title="Contact Me"
          onClick={() => {
            toast({
              title: "Contact",
              description: "Email us at contact@docushare.com",
            });
          }}
        >
          <Mail className="h-5 w-5" />
        </div>
        
        {/* Logout Button - Only show when user is logged in */}
        {user && (
          <div
            className="w-10 h-10 flex items-center justify-center rounded-md transition-colors cursor-pointer
              text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Logout"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col bg-white dark:bg-background border-r border-gray-200 dark:border-gray-800 w-16 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 z-50 bg-white dark:bg-background w-16 transform transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </div>
    </>
  );
};

export default Sidebar;
