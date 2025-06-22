import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/Layout";
import CreatePost from "@/components/CreatePost";
import PostCard from "@/components/PostCard";
import FriendRequestCard from "@/components/FriendRequestCard";
import GroupCard from "@/components/GroupCard";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, TrendingUp } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: feedPosts, error: feedError } = useQuery({
    queryKey: ["/api/posts/feed"],
    enabled: isAuthenticated,
  });

  const { data: friendRequests, error: friendRequestsError } = useQuery({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });

  const { data: userGroups, error: groupsError } = useQuery({
    queryKey: ["/api/groups/user"],
    enabled: isAuthenticated,
  });

  const { data: suggestedFriends, error: suggestedError } = useQuery({
    queryKey: ["/api/users/suggested"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
  });

  // Handle errors
  useEffect(() => {
    const errors = [feedError, friendRequestsError, groupsError, suggestedError];
    errors.forEach(error => {
      if (error && isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    });
  }, [feedError, friendRequestsError, groupsError, suggestedError, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar - User Profile & Quick Actions */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* User Profile Card */}
            <Card className="elegant-card">
              <CardContent className="p-8">
                <div className="text-center">
                  <img 
                    src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=100&h=100&fit=crop&crop=face"}
                    alt="Profile" 
                    className="w-24 h-24 rounded-full mx-auto mb-6 border-4 border-brand-primary object-cover shadow-md"
                  />
                  <h3 className="text-xl font-bold elegant-text mb-2">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || user?.email?.split('@')[0] || 'User'
                    }
                  </h3>
                  <p className="elegant-text-soft text-sm mb-6">
                    {user?.bio || "Welcome to FriendZone!"}
                  </p>
                  <div className="flex justify-center space-x-8 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-primary-dark">0</div>
                      <div className="elegant-text-soft">Friends</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-primary-dark">{userGroups?.length || 0}</div>
                      <div className="elegant-text-soft">Groups</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <div className="w-8 h-8 bg-brand-blue-light rounded-lg flex items-center justify-center mr-3">
                    <MessageSquare className="w-4 h-4 text-white" />
                  </div>
                  <span>Create Post</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <div className="w-8 h-8 bg-brand-green-light rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Find Friends</span>
                </Button>
                <Button variant="ghost" className="w-full justify-start" size="sm">
                  <div className="w-8 h-8 bg-brand-orange-light rounded-lg flex items-center justify-center mr-3">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span>Join Groups</span>
                </Button>
              </CardContent>
            </Card>

            {/* Interest Tags */}
            {user?.interests && user.interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="bg-brand-blue text-white">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content - Activity Feed */}
        <div className="lg:col-span-2">
          <div className="space-y-6">
            {/* Create Post */}
            <CreatePost />

            {/* Activity Feed */}
            <div className="space-y-6">
              {feedPosts && feedPosts.length > 0 ? (
                feedPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No posts yet</h3>
                    <p className="text-gray-500">
                      Connect with friends to see their posts in your feed!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Friend Requests & Groups */}
        <div className="lg:col-span-1">
          <div className="space-y-6">
            {/* Friend Requests */}
            {friendRequests && friendRequests.length > 0 && (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg">Friend Requests</CardTitle>
                  <Badge variant="secondary" className="bg-brand-orange text-white">
                    {friendRequests.length}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {friendRequests.slice(0, 3).map((request: any) => (
                    <FriendRequestCard key={request.id} request={request} />
                  ))}
                  {friendRequests.length > 3 && (
                    <Button variant="ghost" className="w-full text-brand-blue" size="sm">
                      View all requests
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Suggested Friends */}
            {suggestedFriends && suggestedFriends.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">People You May Know</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {suggestedFriends.map((user: any) => (
                    <div key={user.id} className="flex items-center space-x-3">
                      <img 
                        src={user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=40&h=40&fit=crop&crop=face"}
                        alt={user.firstName || user.username || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-gray-900 text-sm">
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName}`
                            : user.username || user.email?.split('@')[0] || 'User'
                          }
                        </h5>
                        <p className="text-xs text-gray-500">
                          {user.interests?.[0] || 'New user'}
                        </p>
                      </div>
                      <Button size="sm" className="bg-brand-green hover:bg-brand-green text-white">
                        Add
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Active Groups */}
            {userGroups && userGroups.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Groups</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {userGroups.slice(0, 3).map((group: any) => (
                    <GroupCard key={group.id} group={group} />
                  ))}
                  {userGroups.length > 3 && (
                    <Button variant="ghost" className="w-full text-brand-blue" size="sm">
                      Explore more groups
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Trending Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">#Photography</h5>
                    <p className="text-xs text-gray-500">127 posts</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">#Travel</h5>
                    <p className="text-xs text-gray-500">89 posts</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium text-gray-900 text-sm">#BookClub</h5>
                    <p className="text-xs text-gray-500">56 posts</p>
                  </div>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
