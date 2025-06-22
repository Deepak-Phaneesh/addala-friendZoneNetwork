import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  bio: text("bio"),
  interests: text("interests").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post likes table
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post comments table
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  postId: integer("post_id").notNull().references(() => posts.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Friends table
export const friends = pgTable("friends", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  friendId: varchar("friend_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "accepted", "declined"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Groups table
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  memberCount: integer("member_count").default(1),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group members table
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { enum: ["admin", "member"] }).default("member"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Group posts table
export const groupPosts = pgTable("group_posts", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => groups.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  imageUrl: varchar("image_url"),
  likesCount: integer("likes_count").default(0),
  commentsCount: integer("comments_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["friend_request", "friend_accepted", "post_like", "post_comment", "group_invite"] }).notNull(),
  senderId: varchar("sender_id").references(() => users.id),
  postId: integer("post_id").references(() => posts.id),
  groupId: integer("group_id").references(() => groups.id),
  message: text("message"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  postLikes: many(postLikes),
  postComments: many(postComments),
  sentFriendRequests: many(friends, { relationName: "sentFriendRequests" }),
  receivedFriendRequests: many(friends, { relationName: "receivedFriendRequests" }),
  createdGroups: many(groups),
  groupMemberships: many(groupMembers),
  groupPosts: many(groupPosts),
  notifications: many(notifications),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  user: one(users, { fields: [posts.userId], references: [users.id] }),
  likes: many(postLikes),
  comments: many(postComments),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
}));

export const postCommentsRelations = relations(postComments, ({ one }) => ({
  user: one(users, { fields: [postComments.userId], references: [users.id] }),
  post: one(posts, { fields: [postComments.postId], references: [posts.id] }),
}));

export const friendsRelations = relations(friends, ({ one }) => ({
  user: one(users, { fields: [friends.userId], references: [users.id], relationName: "sentFriendRequests" }),
  friend: one(users, { fields: [friends.friendId], references: [users.id], relationName: "receivedFriendRequests" }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, { fields: [groups.createdBy], references: [users.id] }),
  members: many(groupMembers),
  posts: many(groupPosts),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));

export const groupPostsRelations = relations(groupPosts, ({ one }) => ({
  group: one(groups, { fields: [groupPosts.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupPosts.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  sender: one(users, { fields: [notifications.senderId], references: [users.id] }),
  post: one(posts, { fields: [notifications.postId], references: [posts.id] }),
  group: one(groups, { fields: [notifications.groupId], references: [groups.id] }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  likesCount: true,
  commentsCount: true,
  createdAt: true,
});

export const insertGroupSchema = createInsertSchema(groups).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertFriendRequestSchema = createInsertSchema(friends).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Post = typeof posts.$inferSelect & { user: User };
export type PostWithDetails = Post & { 
  likes: { user: User }[]; 
  comments: (typeof postComments.$inferSelect & { user: User })[];
  isLiked?: boolean;
};
export type Group = typeof groups.$inferSelect & { creator: User };
export type GroupWithMembers = Group & { members: (typeof groupMembers.$inferSelect & { user: User })[] };
export type FriendRequest = typeof friends.$inferSelect & { friend: User };
export type Notification = typeof notifications.$inferSelect & { sender?: User };
export type InsertPost = z.infer<typeof insertPostSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
