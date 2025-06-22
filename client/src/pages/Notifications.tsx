import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Layout from "@/components/Layout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, UserPlus, Heart, MessageCircle, Users, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function Notifications() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: notifications, error: notificationsError, isLoading: notificationsLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: isAuthenticated,
  });

  const { data: unreadCount } = useQuery({
    queryKey: ["/api/notifications/unread-count"],
    enabled: isAuthenticated,
  });

  // Handle errors
  useEffect(() => {
    if (notificationsError && isUnauthorizedError(notificationsError)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [notificationsError, toast]);

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      await apiRequest("POST", `/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
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
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    },
  });

  const acceptFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", "/api/friends/accept", { friendId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request accepted!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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
        description: "Failed to accept friend request.",
        variant: "destructive",
      });
    },
  });

  const declineFriendMutation = useMutation({
    mutationFn: async (friendId: string) => {
      await apiRequest("POST", "/api/friends/decline", { friendId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request declined.",
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
        description: "Failed to decline friend request.",
        variant: "destructive",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "friend_request":
        return <UserPlus className="w-5 h-5 text-brand-blue" />;
      case "friend_accepted":
        return <UserPlus className="w-5 h-5 text-brand-green" />;
      case "post_like":
        return <Heart className="w-5 h-5 text-red-500" />;
      case "post_comment":
        return <MessageCircle className="w-5 h-5 text-brand-blue" />;
      case "group_invite":
        return <Users className="w-5 h-5 text-brand-orange" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: any) => {
    const senderName = notification.sender
      ? `${notification.sender.firstName || notification.sender.username || 'Someone'}`
      : 'Someone';

    switch (notification.type) {
      case "friend_request":
        return `${senderName} sent you a friend request`;
      case "friend_accepted":
        return `${senderName} accepted your friend request`;
      case "post_like":
        return `${senderName} liked your post`;
      case "post_comment":
        return `${senderName} commented on your post`;
      case "group_invite":
        return `${senderName} invited you to join a group`;
      default:
        return notification.message || "You have a new notification";
    }
  };

  const handleMarkAsRead = (notificationId: number) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleAcceptFriend = (senderId: string) => {
    acceptFriendMutation.mutate(senderId);
  };

  const handleDeclineFriend = (senderId: string) => {
    declineFriendMutation.mutate(senderId);
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-brand-blue" />
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            {unreadCount && unreadCount.count > 0 && (
              <Badge variant="secondary" className="bg-brand-orange text-white">
                {unreadCount.count} new
              </Badge>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {notificationsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 p-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-4">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors ${
                      notification.read 
                        ? "bg-white border-gray-200" 
                        : "bg-blue-50 border-brand-blue-light"
                    }`}
                  >
                    {/* Notification Icon */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Notification Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-medium">
                        {getNotificationMessage(notification)}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>

                      {/* Friend Request Actions */}
                      {notification.type === "friend_request" && notification.senderId && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptFriend(notification.senderId)}
                            disabled={acceptFriendMutation.isPending}
                            className="bg-brand-green hover:bg-brand-green text-white"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineFriend(notification.senderId)}
                            disabled={declineFriendMutation.isPending}
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Mark as Read Button */}
                    {!notification.read && (
                      <div className="flex-shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="text-brand-blue hover:text-brand-blue"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No notifications yet</h3>
                <p className="text-gray-500">
                  When people interact with your posts or send friend requests, you'll see them here.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
