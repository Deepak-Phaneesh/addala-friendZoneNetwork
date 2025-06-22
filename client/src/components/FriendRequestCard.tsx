import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";

interface FriendRequestCardProps {
  request: any;
}

export default function FriendRequestCard({ request }: FriendRequestCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const acceptMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/friends/accept", { friendId: request.userId });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Friend request accepted!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
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
        description: "Failed to accept friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/friends/decline", { friendId: request.userId });
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
        description: "Failed to decline friend request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleAccept = () => {
    acceptMutation.mutate();
  };

  const handleDecline = () => {
    declineMutation.mutate();
  };

  return (
    <div className="flex items-center space-x-3">
      <img 
        src={request.friend.profileImageUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&w=48&h=48&fit=crop&crop=face"}
        alt={request.friend.firstName || request.friend.username || 'User'}
        className="w-12 h-12 rounded-full object-cover"
      />
      <div className="flex-1">
        <h5 className="font-medium text-gray-900">
          {request.friend.firstName && request.friend.lastName 
            ? `${request.friend.firstName} ${request.friend.lastName}`
            : request.friend.username || request.friend.email?.split('@')[0] || 'User'
          }
        </h5>
        <p className="text-xs text-gray-500">
          {request.friend.bio || request.friend.email}
        </p>
        <div className="flex space-x-2 mt-2">
          <Button 
            size="sm"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className="bg-brand-blue hover:bg-brand-blue text-white font-medium transition-colors duration-200"
          >
            Accept
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={handleDecline}
            disabled={declineMutation.isPending}
            className="hover:bg-gray-100 transition-colors duration-200"
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
