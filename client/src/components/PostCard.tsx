import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, MessageCircle, Share, MoreHorizontal } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PostCardProps {
  post: any;
}

export default function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (post.isLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user"] });
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
        description: "Failed to update like. Please try again.",
        variant: "destructive",
      });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("POST", `/api/posts/${post.id}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/posts/${post.id}/comments`] });
      setNewComment("");
      toast({
        title: "Success",
        description: "Comment added successfully!",
      });
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
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    if (!likeMutation.isPending) {
      likeMutation.mutate();
    }
  };

  const handleComment = () => {
    if (newComment.trim()) {
      commentMutation.mutate(newComment.trim());
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'FriendZone Post',
        text: post.content,
        url: window.location.href,
      });
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Post link copied to clipboard!",
      });
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Post Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-3">
              <img 
                src={post.user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face"}
                alt={post.user.firstName || post.user.username || 'User'}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <h4 className="font-semibold text-gray-900">
                  {post.user.firstName && post.user.lastName 
                    ? `${post.user.firstName} ${post.user.lastName}`
                    : post.user.username || post.user.email?.split('@')[0] || 'User'
                  }
                </h4>
                <p className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
          
          {/* Post Content */}
          <p className="text-gray-800 mb-4">{post.content}</p>
        </div>
        
        {/* Post Image */}
        {post.imageUrl && (
          <img 
            src={post.imageUrl}
            alt="Post content"
            className="w-full h-64 object-cover"
          />
        )}
        
        {/* Post Actions */}
        <div className="p-6 pt-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
            <span>{post.likesCount || 0} likes</span>
            <span>{post.commentsCount || 0} comments</span>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-6 mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center space-x-2 ${
                post.isLiked 
                  ? "text-red-500 hover:text-red-600" 
                  : "text-gray-600 hover:text-red-500"
              } transition-colors duration-200`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? "fill-current" : ""}`} />
              <span>Like</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowComments(!showComments)}
              className="flex items-center space-x-2 text-gray-600 hover:text-brand-blue transition-colors duration-200"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Comment</span>
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-600 hover:text-brand-orange transition-colors duration-200"
            >
              <Share className="w-4 h-4" />
              <span>Share</span>
            </Button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="border-t border-gray-100 pt-4">
              {/* Add Comment */}
              <div className="flex space-x-3 mb-4">
                <Input
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleComment()}
                />
                <Button 
                  onClick={handleComment}
                  disabled={commentMutation.isPending || !newComment.trim()}
                  size="sm"
                  className="bg-brand-blue hover:bg-brand-blue text-white"
                >
                  Post
                </Button>
              </div>

              {/* Existing Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className="space-y-3">
                  {post.comments.slice(0, 3).map((comment: any) => (
                    <div key={comment.id} className="flex space-x-3">
                      <img 
                        src={comment.user.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=32&h=32&fit=crop&crop=face"}
                        alt={comment.user.firstName || comment.user.username || 'User'}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2">
                          <h5 className="font-medium text-sm text-gray-900">
                            {comment.user.firstName && comment.user.lastName 
                              ? `${comment.user.firstName} ${comment.user.lastName}`
                              : comment.user.username || comment.user.email?.split('@')[0] || 'User'
                            }
                          </h5>
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 px-3">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {post.comments.length > 3 && (
                    <Button variant="ghost" size="sm" className="text-brand-blue">
                      View all {post.comments.length} comments
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
