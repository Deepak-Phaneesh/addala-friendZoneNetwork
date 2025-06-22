import {
  users,
  posts,
  postLikes,
  postComments,
  friends,
  groups,
  groupMembers,
  groupPosts,
  notifications,
  type User,
  type UpsertUser,
  type Post,
  type PostWithDetails,
  type Group,
  type GroupWithMembers,
  type FriendRequest,
  type Notification,
  type InsertPost,
  type InsertGroup,
  type InsertFriendRequest,
  type InsertPostComment,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ne, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfile(id: string, data: Partial<User>): Promise<User>;
  searchUsers(query: string, currentUserId: string): Promise<User[]>;

  // Post operations
  createPost(post: InsertPost): Promise<Post>;
  getFeedPosts(userId: string, limit?: number, offset?: number): Promise<PostWithDetails[]>;
  getUserPosts(userId: string, limit?: number, offset?: number): Promise<PostWithDetails[]>;
  getPost(id: number): Promise<PostWithDetails | undefined>;
  likePost(userId: string, postId: number): Promise<void>;
  unlikePost(userId: string, postId: number): Promise<void>;
  addComment(comment: InsertPostComment): Promise<void>;
  getPostComments(postId: number): Promise<(typeof postComments.$inferSelect & { user: User })[]>;

  // Friend operations
  sendFriendRequest(request: InsertFriendRequest): Promise<void>;
  acceptFriendRequest(userId: string, friendId: string): Promise<void>;
  declineFriendRequest(userId: string, friendId: string): Promise<void>;
  getFriendRequests(userId: string): Promise<FriendRequest[]>;
  getFriends(userId: string): Promise<User[]>;
  getSuggestedFriends(userId: string, limit?: number): Promise<User[]>;
  areFriends(userId: string, friendId: string): Promise<boolean>;

  // Group operations
  createGroup(group: InsertGroup): Promise<Group>;
  joinGroup(userId: string, groupId: number): Promise<void>;
  leaveGroup(userId: string, groupId: number): Promise<void>;
  getUserGroups(userId: string): Promise<GroupWithMembers[]>;
  getGroup(id: number): Promise<GroupWithMembers | undefined>;
  searchGroups(query: string): Promise<Group[]>;
  getGroupPosts(groupId: number, limit?: number, offset?: number): Promise<PostWithDetails[]>;

  // Notification operations
  createNotification(userId: string, type: string, senderId?: string, postId?: number, groupId?: number, message?: string): Promise<void>;
  getNotifications(userId: string, limit?: number): Promise<Notification[]>;
  markNotificationRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfile(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(
        and(
          ne(users.id, currentUserId),
          or(
            sql`${users.username} ILIKE ${`%${query}%`}`,
            sql`${users.firstName} ILIKE ${`%${query}%`}`,
            sql`${users.lastName} ILIKE ${`%${query}%`}`
          )
        )
      )
      .limit(10);
  }

  // Post operations
  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    const user = await this.getUser(post.userId);
    return { ...newPost, user: user! };
  }

  async getFeedPosts(userId: string, limit = 20, offset = 0): Promise<PostWithDetails[]> {
    // Get friend IDs
    const friendIds = await db
      .select({ friendId: friends.friendId })
      .from(friends)
      .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));

    const friendUserIds = friendIds.map(f => f.friendId);
    friendUserIds.push(userId); // Include user's own posts

    const feedPosts = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(inArray(posts.userId, friendUserIds))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    // Get likes and comments for each post
    const postsWithDetails: PostWithDetails[] = [];
    for (const { post, user } of feedPosts) {
      const likes = await db
        .select({ user: users })
        .from(postLikes)
        .innerJoin(users, eq(postLikes.userId, users.id))
        .where(eq(postLikes.postId, post.id));

      const comments = await db
        .select({
          id: postComments.id,
          userId: postComments.userId,
          postId: postComments.postId,
          content: postComments.content,
          createdAt: postComments.createdAt,
          user: users,
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, post.id))
        .orderBy(desc(postComments.createdAt));

      const isLiked = await db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)))
        .then(result => result.length > 0);

      postsWithDetails.push({
        ...post,
        user,
        likes,
        comments,
        isLiked,
      });
    }

    return postsWithDetails;
  }

  async getUserPosts(userId: string, limit = 20, offset = 0): Promise<PostWithDetails[]> {
    const userPosts = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);

    const postsWithDetails: PostWithDetails[] = [];
    for (const { post, user } of userPosts) {
      const likes = await db
        .select({ user: users })
        .from(postLikes)
        .innerJoin(users, eq(postLikes.userId, users.id))
        .where(eq(postLikes.postId, post.id));

      const comments = await db
        .select({
          id: postComments.id,
          userId: postComments.userId,
          postId: postComments.postId,
          content: postComments.content,
          createdAt: postComments.createdAt,
          user: users,
        })
        .from(postComments)
        .innerJoin(users, eq(postComments.userId, users.id))
        .where(eq(postComments.postId, post.id))
        .orderBy(desc(postComments.createdAt));

      postsWithDetails.push({
        ...post,
        user,
        likes,
        comments,
      });
    }

    return postsWithDetails;
  }

  async getPost(id: number): Promise<PostWithDetails | undefined> {
    const [result] = await db
      .select({
        post: posts,
        user: users,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, id));

    if (!result) return undefined;

    const likes = await db
      .select({ user: users })
      .from(postLikes)
      .innerJoin(users, eq(postLikes.userId, users.id))
      .where(eq(postLikes.postId, id));

    const comments = await db
      .select({
        id: postComments.id,
        userId: postComments.userId,
        postId: postComments.postId,
        content: postComments.content,
        createdAt: postComments.createdAt,
        user: users,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, id))
      .orderBy(desc(postComments.createdAt));

    return {
      ...result.post,
      user: result.user,
      likes,
      comments,
    };
  }

  async likePost(userId: string, postId: number): Promise<void> {
    await db.insert(postLikes).values({ userId, postId });
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} + 1` })
      .where(eq(posts.id, postId));
  }

  async unlikePost(userId: string, postId: number): Promise<void> {
    await db.delete(postLikes).where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)));
    await db
      .update(posts)
      .set({ likesCount: sql`${posts.likesCount} - 1` })
      .where(eq(posts.id, postId));
  }

  async addComment(comment: InsertPostComment): Promise<void> {
    await db.insert(postComments).values(comment);
    await db
      .update(posts)
      .set({ commentsCount: sql`${posts.commentsCount} + 1` })
      .where(eq(posts.id, comment.postId));
  }

  async getPostComments(postId: number): Promise<(typeof postComments.$inferSelect & { user: User })[]> {
    return await db
      .select({
        id: postComments.id,
        userId: postComments.userId,
        postId: postComments.postId,
        content: postComments.content,
        createdAt: postComments.createdAt,
        user: users,
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));
  }

  // Friend operations
  async sendFriendRequest(request: InsertFriendRequest): Promise<void> {
    await db.insert(friends).values(request);
    await this.createNotification(request.friendId, "friend_request", request.userId);
  }

  async acceptFriendRequest(userId: string, friendId: string): Promise<void> {
    await db
      .update(friends)
      .set({ status: "accepted" })
      .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)));

    // Create reciprocal friendship
    await db.insert(friends).values({
      userId,
      friendId,
      status: "accepted",
    });

    await this.createNotification(friendId, "friend_accepted", userId);
  }

  async declineFriendRequest(userId: string, friendId: string): Promise<void> {
    await db
      .update(friends)
      .set({ status: "declined" })
      .where(and(eq(friends.userId, friendId), eq(friends.friendId, userId)));
  }

  async getFriendRequests(userId: string): Promise<FriendRequest[]> {
    return await db
      .select({
        id: friends.id,
        userId: friends.userId,
        friendId: friends.friendId,
        status: friends.status,
        createdAt: friends.createdAt,
        friend: users,
      })
      .from(friends)
      .innerJoin(users, eq(friends.userId, users.id))
      .where(and(eq(friends.friendId, userId), eq(friends.status, "pending")));
  }

  async getFriends(userId: string): Promise<User[]> {
    return await db
      .select({ user: users })
      .from(friends)
      .innerJoin(users, eq(friends.friendId, users.id))
      .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")))
      .then(results => results.map(r => r.user));
  }

  async getSuggestedFriends(userId: string, limit = 5): Promise<User[]> {
    // Get users who are not already friends
    const existingFriends = await db
      .select({ friendId: friends.friendId })
      .from(friends)
      .where(and(eq(friends.userId, userId), eq(friends.status, "accepted")));

    const friendIds = existingFriends.map(f => f.friendId);
    friendIds.push(userId); // Exclude self

    return await db
      .select()
      .from(users)
      .where(ne(users.id, userId))
      .limit(limit);
  }

  async areFriends(userId: string, friendId: string): Promise<boolean> {
    const result = await db
      .select()
      .from(friends)
      .where(
        and(
          eq(friends.userId, userId),
          eq(friends.friendId, friendId),
          eq(friends.status, "accepted")
        )
      );
    return result.length > 0;
  }

  // Group operations
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db.insert(groups).values(group).returning();
    
    // Add creator as admin member
    await db.insert(groupMembers).values({
      groupId: newGroup.id,
      userId: group.createdBy,
      role: "admin",
    });

    const creator = await this.getUser(group.createdBy);
    return { ...newGroup, creator: creator! };
  }

  async joinGroup(userId: string, groupId: number): Promise<void> {
    await db.insert(groupMembers).values({
      groupId,
      userId,
      role: "member",
    });

    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} + 1` })
      .where(eq(groups.id, groupId));
  }

  async leaveGroup(userId: string, groupId: number): Promise<void> {
    await db
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));

    await db
      .update(groups)
      .set({ memberCount: sql`${groups.memberCount} - 1` })
      .where(eq(groups.id, groupId));
  }

  async getUserGroups(userId: string): Promise<GroupWithMembers[]> {
    const userGroups = await db
      .select({
        group: groups,
        creator: users,
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groupMembers.groupId, groups.id))
      .innerJoin(users, eq(groups.createdBy, users.id))
      .where(eq(groupMembers.userId, userId));

    const groupsWithMembers: GroupWithMembers[] = [];
    for (const { group, creator } of userGroups) {
      const members = await db
        .select({
          id: groupMembers.id,
          groupId: groupMembers.groupId,
          userId: groupMembers.userId,
          role: groupMembers.role,
          createdAt: groupMembers.createdAt,
          user: users,
        })
        .from(groupMembers)
        .innerJoin(users, eq(groupMembers.userId, users.id))
        .where(eq(groupMembers.groupId, group.id));

      groupsWithMembers.push({
        ...group,
        creator,
        members,
      });
    }

    return groupsWithMembers;
  }

  async getGroup(id: number): Promise<GroupWithMembers | undefined> {
    const [result] = await db
      .select({
        group: groups,
        creator: users,
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdBy, users.id))
      .where(eq(groups.id, id));

    if (!result) return undefined;

    const members = await db
      .select({
        id: groupMembers.id,
        groupId: groupMembers.groupId,
        userId: groupMembers.userId,
        role: groupMembers.role,
        createdAt: groupMembers.createdAt,
        user: users,
      })
      .from(groupMembers)
      .innerJoin(users, eq(groupMembers.userId, users.id))
      .where(eq(groupMembers.groupId, id));

    return {
      ...result.group,
      creator: result.creator,
      members,
    };
  }

  async searchGroups(query: string): Promise<Group[]> {
    const results = await db
      .select({
        group: groups,
        creator: users,
      })
      .from(groups)
      .innerJoin(users, eq(groups.createdBy, users.id))
      .where(sql`${groups.name} ILIKE ${`%${query}%`}`)
      .limit(10);

    return results.map(({ group, creator }) => ({ ...group, creator }));
  }

  async getGroupPosts(groupId: number, limit = 20, offset = 0): Promise<PostWithDetails[]> {
    const posts = await db
      .select({
        post: groupPosts,
        user: users,
      })
      .from(groupPosts)
      .innerJoin(users, eq(groupPosts.userId, users.id))
      .where(eq(groupPosts.groupId, groupId))
      .orderBy(desc(groupPosts.createdAt))
      .limit(limit)
      .offset(offset);

    return posts.map(({ post, user }) => ({
      ...post,
      user,
      likes: [] as any,
      comments: [] as any,
    }));
  }

  // Notification operations
  async createNotification(userId: string, type: string, senderId?: string, postId?: number, groupId?: number, message?: string): Promise<void> {
    await db.insert(notifications).values({
      userId,
      type: type as any,
      senderId,
      postId,
      groupId,
      message,
    });
  }

  async getNotifications(userId: string, limit = 20): Promise<Notification[]> {
    return await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        senderId: notifications.senderId,
        postId: notifications.postId,
        groupId: notifications.groupId,
        message: notifications.message,
        read: notifications.read,
        createdAt: notifications.createdAt,
        sender: users,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.senderId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async markNotificationRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    
    return result?.count || 0;
  }
}

export const storage = new DatabaseStorage();
