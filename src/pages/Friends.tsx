import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import FriendRequestCard from "@/components/FriendRequestCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Users, UserPlus } from "lucide-react";

export default function Friends() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

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

  const { data: friendRequests, error: requestsError } = useQuery({
    queryKey: ["/api/friends/requests"],
    enabled: isAuthenticated,
  });

  const { data: friends, error: friendsError } = useQuery({
    queryKey: ["/api/friends"],
    enabled: isAuthenticated,
  });

  const { data: suggestedFriends, error: suggestedError } = useQuery({
    queryKey: ["/api/users/suggested"],
    enabled: isAuthenticated,
  });

  // Handle errors
  useEffect(() => {
    const errors = [requestsError, friendsError, suggestedError];
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
  }, [requestsError, friendsError, suggestedError, toast]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/users/search?q=${encodeURIComponent(query)}`);
      return await response.json();
    },
    onSuccess: (data) => {
      setSearchResults(data);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
    },
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", "/api/friends/request", { friendId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request sent!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to send friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  const handleSendRequest = (friendId: string) => {
    sendFriendRequestMutation.mutate(friendId);
  };

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
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5" />
              Find Friends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Search by username or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button 
                onClick={handleSearch}
                disabled={searchMutation.isPending}
                className="bg-brand-blue hover:bg-brand-blue text-white"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Search Results</h3>
                <div className="grid gap-4">
                  {searchResults.map((searchUser: any) => (
                    <div key={searchUser.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={searchUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=50&h=50&fit=crop&crop=face"}
                          alt={searchUser.firstName || searchUser.username || 'User'}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {searchUser.firstName && searchUser.lastName 
                              ? `${searchUser.firstName} ${searchUser.lastName}`
                              : searchUser.username || searchUser.email?.split('@')[0] || 'User'
                            }
                          </h4>
                          <p className="text-sm text-gray-500">
                            {searchUser.bio || searchUser.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleSendRequest(searchUser.id)}
                        disabled={sendFriendRequestMutation.isPending}
                        size="sm"
                        className="bg-brand-green hover:bg-brand-green text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Add Friend
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Friend Requests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl">Friend Requests</CardTitle>
              {friendRequests && friendRequests.length > 0 && (
                <Badge variant="secondary" className="bg-brand-orange text-white">
                  {friendRequests.length}
                </Badge>
              )}
            </CardHeader>
            <CardContent>
              {friendRequests && friendRequests.length > 0 ? (
                <div className="space-y-4">
                  {friendRequests.map((request: any) => (
                    <FriendRequestCard key={request.id} request={request} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No friend requests</h3>
                  <p className="text-gray-500">
                    You don't have any pending friend requests.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Current Friends */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Friends ({friends?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {friends && friends.length > 0 ? (
                <div className="space-y-4">
                  {friends.map((friend: any) => (
                    <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <img 
                        src={friend.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=50&h=50&fit=crop&crop=face"}
                        alt={friend.firstName || friend.username || 'User'}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {friend.firstName && friend.lastName 
                            ? `${friend.firstName} ${friend.lastName}`
                            : friend.username || friend.email?.split('@')[0] || 'User'
                          }
                        </h4>
                        <p className="text-sm text-gray-500">
                          {friend.bio || friend.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No friends yet</h3>
                  <p className="text-gray-500">
                    Start connecting with people to build your network!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Suggested Friends */}
        {suggestedFriends && suggestedFriends.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">People You May Know</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedFriends.map((suggestedUser: any) => (
                  <div key={suggestedUser.id} className="p-4 border border-gray-200 rounded-lg text-center">
                    <img 
                      src={suggestedUser.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=80&h=80&fit=crop&crop=face"}
                      alt={suggestedUser.firstName || suggestedUser.username || 'User'}
                      className="w-16 h-16 rounded-full mx-auto mb-3 object-cover"
                    />
                    <h4 className="font-semibold text-gray-900 mb-1">
                      {suggestedUser.firstName && suggestedUser.lastName 
                        ? `${suggestedUser.firstName} ${suggestedUser.lastName}`
                        : suggestedUser.username || suggestedUser.email?.split('@')[0] || 'User'
                      }
                    </h4>
                    <p className="text-sm text-gray-500 mb-3">
                      {suggestedUser.interests?.[0] || 'New user'}
                    </p>
                    <Button
                      onClick={() => handleSendRequest(suggestedUser.id)}
                      disabled={sendFriendRequestMutation.isPending}
                      size="sm"
                      className="bg-brand-green hover:bg-brand-green text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
