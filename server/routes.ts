import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertPostSchema, insertGroupSchema, insertFriendRequestSchema, insertPostCommentSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // User routes
  app.get('/api/users/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      const userId = req.user.claims.sub;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const users = await storage.searchUsers(q, userId);
      res.json(users);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Failed to search users" });
    }
  });

  app.get('/api/users/suggested', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const users = await storage.getSuggestedFriends(userId, 5);
      res.json(users);
    } catch (error) {
      console.error("Error fetching suggested users:", error);
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  app.put('/api/users/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updateData = req.body;
      
      const user = await storage.updateUserProfile(userId, updateData);
      res.json(user);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Post routes
  app.post('/api/posts', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const postData = insertPostSchema.parse({ ...req.body, userId });
      
      const post = await storage.createPost(postData);
      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  app.get('/api/posts/feed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 20, offset = 0 } = req.query;
      
      const posts = await storage.getFeedPosts(userId, parseInt(limit), parseInt(offset));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching feed:", error);
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get('/api/posts/user/:userId', isAuthenticated, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const posts = await storage.getUserPosts(userId, parseInt(limit), parseInt(offset));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.post('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.likePost(userId, parseInt(postId));
      
      // Create notification for post author
      const post = await storage.getPost(parseInt(postId));
      if (post && post.user.id !== userId) {
        await storage.createNotification(post.user.id, "post_like", userId, parseInt(postId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.delete('/api/posts/:postId/like', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      
      await storage.unlikePost(userId, parseInt(postId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error unliking post:", error);
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  app.post('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { postId } = req.params;
      const commentData = insertPostCommentSchema.parse({
        ...req.body,
        userId,
        postId: parseInt(postId),
      });
      
      await storage.addComment(commentData);
      
      // Create notification for post author
      const post = await storage.getPost(parseInt(postId));
      if (post && post.user.id !== userId) {
        await storage.createNotification(post.user.id, "post_comment", userId, parseInt(postId));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  app.get('/api/posts/:postId/comments', isAuthenticated, async (req: any, res) => {
    try {
      const { postId } = req.params;
      const comments = await storage.getPostComments(parseInt(postId));
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Friend routes
  app.post('/api/friends/request', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestData = insertFriendRequestSchema.parse({ ...req.body, userId });
      
      await storage.sendFriendRequest(requestData);
      res.json({ success: true });
    } catch (error) {
      console.error("Error sending friend request:", error);
      res.status(500).json({ message: "Failed to send friend request" });
    }
  });

  app.get('/api/friends/requests', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requests = await storage.getFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
      res.status(500).json({ message: "Failed to fetch friend requests" });
    }
  });

  app.post('/api/friends/accept', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      
      await storage.acceptFriendRequest(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting friend request:", error);
      res.status(500).json({ message: "Failed to accept friend request" });
    }
  });

  app.post('/api/friends/decline', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { friendId } = req.body;
      
      await storage.declineFriendRequest(userId, friendId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining friend request:", error);
      res.status(500).json({ message: "Failed to decline friend request" });
    }
  });

  app.get('/api/friends', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const friends = await storage.getFriends(userId);
      res.json(friends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).json({ message: "Failed to fetch friends" });
    }
  });

  // Group routes
  app.post('/api/groups', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groupData = insertGroupSchema.parse({ ...req.body, createdBy: userId });
      
      const group = await storage.createGroup(groupData);
      res.json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });

  app.get('/api/groups/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const groups = await storage.getUserGroups(userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ message: "Failed to fetch user groups" });
    }
  });

  app.get('/api/groups/search', isAuthenticated, async (req: any, res) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Query parameter 'q' is required" });
      }

      const groups = await storage.searchGroups(q);
      res.json(groups);
    } catch (error) {
      console.error("Error searching groups:", error);
      res.status(500).json({ message: "Failed to search groups" });
    }
  });

  app.post('/api/groups/:groupId/join', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      await storage.joinGroup(userId, parseInt(groupId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ message: "Failed to join group" });
    }
  });

  app.post('/api/groups/:groupId/leave', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { groupId } = req.params;
      
      await storage.leaveGroup(userId, parseInt(groupId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ message: "Failed to leave group" });
    }
  });

  app.get('/api/groups/:groupId', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      const group = await storage.getGroup(parseInt(groupId));
      
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      res.json(group);
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });

  app.get('/api/groups/:groupId/posts', isAuthenticated, async (req: any, res) => {
    try {
      const { groupId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const posts = await storage.getGroupPosts(parseInt(groupId), parseInt(limit), parseInt(offset));
      res.json(posts);
    } catch (error) {
      console.error("Error fetching group posts:", error);
      res.status(500).json({ message: "Failed to fetch group posts" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { limit = 20 } = req.query;
      
      const notifications = await storage.getNotifications(userId, parseInt(limit));
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get('/api/notifications/unread-count', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  app.post('/api/notifications/:notificationId/read', isAuthenticated, async (req: any, res) => {
    try {
      const { notificationId } = req.params;
      await storage.markNotificationRead(parseInt(notificationId));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ message: "Failed to mark notification read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
