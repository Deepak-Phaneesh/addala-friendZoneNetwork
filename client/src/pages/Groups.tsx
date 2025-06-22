import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import GroupCard from "@/components/GroupCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Users, Plus } from "lucide-react";

export default function Groups() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
  });

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

  const { data: userGroups, error: groupsError } = useQuery({
    queryKey: ["/api/groups/user"],
    enabled: isAuthenticated,
  });

  // Handle errors
  useEffect(() => {
    if (groupsError && isUnauthorizedError(groupsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [groupsError, toast]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("GET", `/api/groups/search?q=${encodeURIComponent(query)}`);
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
        description: "Failed to search groups. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      await apiRequest("POST", "/api/groups", groupData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Group created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
      setIsCreateDialogOpen(false);
      setNewGroup({ name: "", description: "" });
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
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Joined group successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/groups/user"] });
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
        description: "Failed to join group. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMutation.mutate(searchQuery.trim());
    }
  };

  const handleCreateGroup = () => {
    if (newGroup.name.trim()) {
      createGroupMutation.mutate(newGroup);
    }
  };

  const handleJoinGroup = (groupId: number) => {
    joinGroupMutation.mutate(groupId);
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
        {/* Header with Create Group Button */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-brand-green hover:bg-brand-green text-white">
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Name
                  </label>
                  <Input
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                    placeholder="Enter group name..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <Textarea
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                    placeholder="Describe your group..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending || !newGroup.name.trim()}
                    className="bg-brand-green hover:bg-brand-green text-white"
                  >
                    Create Group
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Search className="w-5 h-5" />
              Discover Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Search groups by name..."
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
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((group: any) => (
                    <div key={group.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-brand-blue to-brand-green rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
                            <p className="text-sm text-gray-500">{group.memberCount} members</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={joinGroupMutation.isPending}
                          size="sm"
                          className="bg-brand-green hover:bg-brand-green text-white"
                        >
                          Join
                        </Button>
                      </div>
                      {group.description && (
                        <p className="text-sm text-gray-600">{group.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Your Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Users className="w-5 h-5" />
              Your Groups ({userGroups?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {userGroups && userGroups.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userGroups.map((group: any) => (
                  <GroupCard key={group.id} group={group} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No groups yet</h3>
                <p className="text-gray-500 mb-6">
                  Join or create groups to connect with people who share your interests!
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="bg-brand-green hover:bg-brand-green text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Group
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Popular Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 bg-brand-blue rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-2xl">📷</span>
                </div>
                <h4 className="font-medium text-gray-900">Photography</h4>
                <p className="text-sm text-gray-500">24 groups</p>
              </div>
              <div className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-2xl">🥾</span>
                </div>
                <h4 className="font-medium text-gray-900">Hiking</h4>
                <p className="text-sm text-gray-500">18 groups</p>
              </div>
              <div className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-2xl">☕</span>
                </div>
                <h4 className="font-medium text-gray-900">Coffee</h4>
                <p className="text-sm text-gray-500">12 groups</p>
              </div>
              <div className="p-4 text-center border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                  <span className="text-white text-2xl">📚</span>
                </div>
                <h4 className="font-medium text-gray-900">Book Clubs</h4>
                <p className="text-sm text-gray-500">9 groups</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
