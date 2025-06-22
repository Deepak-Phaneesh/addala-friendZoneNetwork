import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import PostCard from "@/components/PostCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Edit, Save, X, Plus, Camera, Upload } from "lucide-react";

export default function Profile() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: "",
    bio: "",
    interests: [] as string[],
    profileImageUrl: "",
  });
  const [newInterest, setNewInterest] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

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

  // Initialize edit data when user data loads
  useEffect(() => {
    if (user) {
      setEditData({
        username: user.username || "",
        bio: user.bio || "",
        interests: user.interests || [],
        profileImageUrl: user.profileImageUrl || "",
      });
    }
  }, [user]);

  const { data: userPosts, error: postsError } = useQuery({
    queryKey: ["/api/posts/user/" + user?.id],
    enabled: isAuthenticated && !!user?.id,
  });

  // Handle errors
  useEffect(() => {
    if (postsError && isUnauthorizedError(postsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [postsError, toast]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("PUT", "/api/users/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setIsEditing(false);
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
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateProfileMutation.mutate(editData);
  };

  const handleCancel = () => {
    if (user) {
      setEditData({
        username: user.username || "",
        bio: user.bio || "",
        interests: user.interests || [],
        profileImageUrl: user.profileImageUrl || "",
      });
    }
    setIsEditing(false);
  };

  const addInterest = () => {
    if (newInterest.trim() && !editData.interests.includes(newInterest.trim())) {
      setEditData({
        ...editData,
        interests: [...editData.interests, newInterest.trim()],
      });
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    setEditData({
      ...editData,
      interests: editData.interests.filter(i => i !== interest),
    });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, GIF, etc.)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);

    try {
      // Convert to base64 for storage (in a real app, you'd upload to a CDN)
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setEditData({
          ...editData,
          profileImageUrl: base64String,
        });
        setIsUploadingImage(false);
        toast({
          title: "Image uploaded",
          description: "Your profile picture has been updated!",
        });
      };
      reader.onerror = () => {
        setIsUploadingImage(false);
        toast({
          title: "Upload failed",
          description: "Failed to upload image. Please try again.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploadingImage(false);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const triggerImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    input.onchange = handleImageUpload;
    input.click();
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
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl">Your Profile</CardTitle>
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <Button
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    size="sm"
                    className="bg-brand-green hover:bg-brand-green text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={handleCancel}
                    variant="outline"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="sm"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0">
                <div className="relative">
                  <img 
                    src={isEditing ? editData.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face" : user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=150&h=150&fit=crop&crop=face"}
                    alt="Profile" 
                    className="w-32 h-32 rounded-full object-cover border-4 border-brand-blue"
                  />
                  {isEditing && (
                    <div className="mt-4 space-y-3">
                      {/* Upload from device */}
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={triggerImageUpload}
                          disabled={isUploadingImage}
                          className="flex-1 bg-brand-blue hover:bg-brand-blue text-white"
                          size="sm"
                        >
                          {isUploadingImage ? (
                            <>
                              <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-r-transparent" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className="w-4 h-4 mr-2" />
                              Choose from Gallery
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {/* URL input */}
                      <div>
                        <Input
                          value={editData.profileImageUrl}
                          onChange={(e) => setEditData({ ...editData, profileImageUrl: e.target.value })}
                          placeholder="Or paste an image URL"
                          className="text-sm"
                        />
                      </div>
                      
                      {/* Quick select options */}
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                        <div className="flex gap-1">
                          {[
                            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
                            "https://images.unsplash.com/photo-1494790108755-2616b612b913?w=150&h=150&fit=crop&crop=face",
                            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
                          ].map((url, index) => (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setEditData({ ...editData, profileImageUrl: url })}
                              className="w-8 h-8 rounded-full border border-gray-300 overflow-hidden hover:border-brand-blue transition-colors"
                            >
                              <img src={url} alt={`Option ${index + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profile Info */}
              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}`
                      : user?.username || user?.email?.split('@')[0] || 'User'
                    }
                  </h2>
                  <p className="text-gray-500">{user?.email}</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  {isEditing ? (
                    <Input
                      value={editData.username}
                      onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                      placeholder="Enter your username"
                    />
                  ) : (
                    <p className="text-gray-900">{user?.username || "Not set"}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  {isEditing ? (
                    <Textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      rows={3}
                    />
                  ) : (
                    <p className="text-gray-900">{user?.bio || "No bio yet"}</p>
                  )}
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {editData.interests.map((interest, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="bg-brand-blue text-white relative group"
                      >
                        {interest}
                        {isEditing && (
                          <button
                            onClick={() => removeInterest(interest)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                  {isEditing && (
                    <div className="flex gap-2">
                      <Input
                        value={newInterest}
                        onChange={(e) => setNewInterest(e.target.value)}
                        placeholder="Add an interest..."
                        onKeyPress={(e) => e.key === 'Enter' && addInterest()}
                      />
                      <Button 
                        onClick={addInterest}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Posts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {userPosts && userPosts.length > 0 ? (
                userPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Edit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No posts yet</h3>
                  <p className="text-gray-500">
                    Share your first post to get started!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
