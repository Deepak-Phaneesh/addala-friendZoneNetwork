import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Image, MapPin } from "lucide-react";

export default function CreatePost() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");

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

  const handleImageUpload = () => {
    toast({
      title: "Coming Soon",
      description: "Image upload feature will be available soon!",
    });
  };

  const handleLocationAdd = () => {
    toast({
      title: "Coming Soon", 
      description: "Location feature will be available soon!",
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <img 
            src={user?.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face"}
            alt="Your Profile" 
            className="w-12 h-12 rounded-full object-cover"
          />
          <div className="flex-1">
            <Textarea
              placeholder={`What's on your mind, ${user?.firstName || user?.username || 'there'}?`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 min-h-[100px]"
              rows={3}
            />
            <div className="flex justify-between items-center mt-4">
              <div className="flex space-x-4">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleImageUpload}
                  className="flex items-center text-gray-600 hover:text-brand-green transition-colors duration-200"
                >
                  <Image className="w-4 h-4 mr-2" />
                  Photo
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
                className="bg-brand-blue hover:bg-brand-blue text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
