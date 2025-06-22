import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Home, 
  UsersRound, 
  Bell, 
  Search, 
  Menu, 
  X,
  LogOut,
  User
} from "lucide-react";

export default function Navigation() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
  });

  const isActive = (path: string) => location === path;

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search functionality - could navigate to search results page
      console.log("Search:", searchQuery);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-brand-blue to-brand-green rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">FriendZone</span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/">
                <a className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/") 
                    ? "text-brand-blue font-medium border-b-2 border-brand-blue" 
                    : "text-gray-600 hover:text-brand-blue"
                }`}>
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </a>
              </Link>
              <Link href="/friends">
                <a className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/friends") 
                    ? "text-brand-blue font-medium border-b-2 border-brand-blue" 
                    : "text-gray-600 hover:text-brand-blue"
                }`}>
                  <UsersRound className="w-4 h-4 mr-2" />
                  Friends
                </a>
              </Link>
              <Link href="/groups">
                <a className={`flex items-center px-3 py-2 rounded-md transition-colors ${
                  isActive("/groups") 
                    ? "text-brand-blue font-medium border-b-2 border-brand-blue" 
                    : "text-gray-600 hover:text-brand-blue"
                }`}>
                  <Users className="w-4 h-4 mr-2" />
                  Groups
                </a>
              </Link>
              <Link href="/notifications">
                <a className={`flex items-center px-3 py-2 rounded-md transition-colors relative ${
                  isActive("/notifications") 
                    ? "text-brand-blue font-medium border-b-2 border-brand-blue" 
                    : "text-gray-600 hover:text-brand-blue"
                }`}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
                      {unreadCount.count}
                    </Badge>
                  )}
                </a>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <Input
                  type="text"
                  placeholder="Search friends, groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>
            </div>

            {/* Profile & Mobile Menu */}
            <div className="flex items-center space-x-4">
              {/* Profile Dropdown */}
              <div className="relative hidden md:block">
                <Link href="/profile">
                  <a className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors">
                    <img 
                      src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face"}
                      alt="Profile" 
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.firstName || user?.username || 'Profile'}
                    </span>
                  </a>
                </Link>
              </div>

              {/* Logout Button */}
              <Button
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="hidden md:flex items-center text-gray-600 hover:text-gray-800"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>

              {/* Mobile menu button */}
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant="ghost"
                size="sm"
                className="md:hidden p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 text-gray-600" />
                ) : (
                  <Menu className="w-5 h-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100">
            <div className="px-4 py-3 space-y-3">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="Search friends, groups..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </form>

              {/* Mobile Menu Items */}
              <Link href="/">
                <a className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive("/") ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                  <Home className="w-5 h-5 mr-3" />
                  Home
                </a>
              </Link>
              <Link href="/friends">
                <a className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive("/friends") ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                  <UsersRound className="w-5 h-5 mr-3" />
                  Friends
                </a>
              </Link>
              <Link href="/groups">
                <a className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive("/groups") ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                  <Users className="w-5 h-5 mr-3" />
                  Groups
                </a>
              </Link>
              <Link href="/notifications">
                <a className={`flex items-center p-3 rounded-lg transition-colors relative ${
                  isActive("/notifications") ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                  <Bell className="w-5 h-5 mr-3" />
                  Notifications
                  {unreadCount && unreadCount.count > 0 && (
                    <Badge className="ml-auto bg-brand-orange text-white">
                      {unreadCount.count}
                    </Badge>
                  )}
                </a>
              </Link>
              <Link href="/profile">
                <a className={`flex items-center p-3 rounded-lg transition-colors ${
                  isActive("/profile") ? "bg-brand-blue text-white" : "text-gray-600 hover:bg-gray-100"
                }`}>
                  <User className="w-5 h-5 mr-3" />
                  Profile
                </a>
              </Link>
              <Button
                onClick={handleLogout}
                variant="ghost"
                className="flex items-center w-full justify-start p-3 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
        <div className="flex justify-around items-center py-2">
          <Link href="/">
            <a className={`flex flex-col items-center p-2 ${
              isActive("/") ? "text-brand-blue" : "text-gray-600"
            }`}>
              <Home className="w-5 h-5" />
              <span className="text-xs mt-1">Home</span>
            </a>
          </Link>
          <Link href="/friends">
            <a className={`flex flex-col items-center p-2 ${
              isActive("/friends") ? "text-brand-blue" : "text-gray-600"
            }`}>
              <UsersRound className="w-5 h-5" />
              <span className="text-xs mt-1">Friends</span>
            </a>
          </Link>
          <Link href="/groups">
            <a className={`flex flex-col items-center p-2 ${
              isActive("/groups") ? "text-brand-blue" : "text-gray-600"
            }`}>
              <Users className="w-5 h-5" />
              <span className="text-xs mt-1">Groups</span>
            </a>
          </Link>
          <Link href="/notifications">
            <a className={`flex flex-col items-center p-2 relative ${
              isActive("/notifications") ? "text-brand-blue" : "text-gray-600"
            }`}>
              <Bell className="w-5 h-5" />
              <span className="text-xs mt-1">Alerts</span>
              {unreadCount && unreadCount.count > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-brand-orange text-white text-xs min-w-[16px] h-4 flex items-center justify-center rounded-full">
                  {unreadCount.count}
                </Badge>
              )}
            </a>
          </Link>
          <Link href="/profile">
            <a className={`flex flex-col items-center p-2 ${
              isActive("/profile") ? "text-brand-blue" : "text-gray-600"
            }`}>
              <img 
                src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=24&h=24&fit=crop&crop=face"}
                alt="Profile" 
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs mt-1">Profile</span>
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}
