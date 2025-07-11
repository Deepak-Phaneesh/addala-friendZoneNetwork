import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, MapPin, Camera, X } from "lucide-react";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const createPostMutation = useMutation({
    mutationFn: async (postData: { content: string; imageUrl?: string }) => {
      await apiRequest("POST", "/api/posts", postData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Post created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user"] });
      setContent("");
      setImageUrl("");
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
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePost = () => {
    if (content.trim()) {
      createPostMutation.mutate({ 
        content: content.trim(),
        imageUrl: imageUrl.trim() || undefined
      });
    }
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
        setImageUrl(base64String);
        setIsUploadingImage(false);
        toast({
          title: "Image uploaded",
          description: "Image added to your post!",
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

  const handleLocationAdd = () => {
    toast({
      title: "Coming Soon", 
      description: "Location feature will be available soon!",
    });
  };

  return (
    <Card className="elegant-card">
      <CardContent className="p-8">
        <div className="flex items-start space-x-5">
          <img 
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face"}
            alt="Your Profile" 
            className="w-14 h-14 rounded-full object-cover border-2 border-brand-primary shadow-sm"
          />
          <div className="flex-1">
            <Textarea
              placeholder={`What's on your mind, ${user?.firstName || user?.username || 'there'}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="elegant-input w-full p-5 rounded-xl resize-none min-h-[120px] text-lg placeholder:elegant-text-soft"
              rows={4}
            />
            
            {/* Image Preview */}
            {imageUrl && (
              <div className="mt-4 relative">
                <img 
                  src={imageUrl} 
                  alt="Upload preview" 
                  className="w-full h-64 object-cover rounded-lg border border-gray-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setImageUrl("")}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={triggerImageUpload}
                  disabled={isUploadingImage}
                  className="flex items-center elegant-text-soft hover:text-brand-accent transition-colors duration-300 px-4 py-2"
                >
                  {isUploadingImage ? (
                    <>
                      <div className="w-5 h-5 mr-3 animate-spin rounded-full border-2 border-brand-primary border-r-transparent" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Camera className="w-5 h-5 mr-3" />
                      Add Photo
                    </>
                  )}
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLocationAdd}
                  className="flex items-center text-gray-600 hover:text-brand-orange transition-colors duration-200"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Location
                </Button>
              </div>
              <Button 
                onClick={handlePost}
                disabled={createPostMutation.isPending || !content.trim()}
                className="elegant-button px-8 py-3 text-lg rounded-xl font-bold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                {createPostMutation.isPending ? "Sharing..." : "Share"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
