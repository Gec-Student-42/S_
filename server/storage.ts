import { users, type User, type InsertUser, posts, type Post, type InsertPost, postLikes, type PostLike, type InsertPostLike, comments, type Comment, type InsertComment } from "@shared/schema";
import type { PostWithAuthor, CommentWithAuthor } from "@/lib/types";
import type { Activity } from "@/lib/types";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";

// Storage interface with all CRUD methods needed
export interface IStorage {
  // User methods
  getUserById(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Post methods
  getAllPosts(): Promise<PostWithAuthor[]>;
  getPost(id: number): Promise<PostWithAuthor | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  likePost(id: number, userId: number): Promise<Post | undefined>;
  hasUserLikedPost(postId: number, userId: number): Promise<boolean>;
  
  // Comment methods
  getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  
  // Activity methods
  getRecentActivities(): Promise<Activity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private posts: Map<number, Post>;
  private activities: Map<number, Activity>;
  private comments: Map<number, Comment>;
  private userCurrentId: number;
  private postCurrentId: number;
  private activityCurrentId: number;
  private commentCurrentId: number;

  constructor() {
    this.users = new Map();
    this.posts = new Map();
    this.activities = new Map();
    this.comments = new Map();
    this.userCurrentId = 1;
    this.postCurrentId = 1;
    this.activityCurrentId = 1;
    this.commentCurrentId = 1;
    
    // Initialize with demo data
    this.initDemoData();
  }

  private initDemoData() {
    // Create users
    const user1 = this.createUserInternal({
      username: "alex.johnson",
      password: "password123",
      fullName: "Alex Johnson",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
      role: "Product Manager"
    });
    
    const user2 = this.createUserInternal({
      username: "emma.thompson",
      password: "password123",
      fullName: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956",
      role: "Marketing Manager"
    });
    
    const user3 = this.createUserInternal({
      username: "marcus.wilson",
      password: "password123",
      fullName: "Marcus Wilson",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
      role: "Product Lead"
    });

    // Create posts
    this.createPostInternal({
      title: "Q2 2023 Marketing Strategy Document",
      description: "This comprehensive document outlines our marketing strategy for Q2 2023, including target audiences, campaign timelines, budget allocation, and KPIs. Please review and provide feedback by Friday.",
      fileName: "Q2_Marketing_Strategy.pdf",
      userId: user2.id,
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      likes: 24,
      comments: 8
    });

    this.createPostInternal({
      title: "Product Roadmap 2023-2024",
      description: "Here's our updated product roadmap for the next 18 months. I've highlighted the key milestones and dependencies between different product teams.",
      fileName: "Product_Roadmap_2023_2024.pdf",
      userId: user3.id,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      likes: 42,
      comments: 16
    });

    // Create activities
    this.createActivityInternal({
      user: user2,
      action: "commented on",
      target: "Q2 Marketing Strategy",
      timeAgo: "10 minutes ago"
    });

    this.createActivityInternal({
      user: user3,
      action: "uploaded",
      target: "Design Assets.zip",
      timeAgo: "45 minutes ago"
    });

    this.createActivityInternal({
      user: user1,
      action: "created",
      target: "Team Meeting Notes",
      timeAgo: "2 hours ago"
    });
  }

  private createUserInternal(userData: InsertUser): User {
    const id = this.userCurrentId++;
    // Ensure null values for nullable fields
    const user: User = { 
      ...userData, 
      id,
      avatar: userData.avatar || null,
      role: userData.role || null
    };
    this.users.set(id, user);
    return user;
  }

  private createPostInternal(postData: Omit<Post, "id">): Post {
    const id = this.postCurrentId++;
    const post: Post = { ...postData, id };
    this.posts.set(id, post);
    return post;
  }

  private createActivityInternal(activityData: Omit<Activity, "id">): Activity {
    const id = this.activityCurrentId++;
    const activity: Activity = { ...activityData, id };
    this.activities.set(id, activity);
    return activity;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(userData: InsertUser): Promise<User> {
    return this.createUserInternal(userData);
  }
  
  // Post methods
  async getAllPosts(): Promise<PostWithAuthor[]> {
    return Array.from(this.posts.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(post => {
        const author = this.users.get(post.userId);
        if (!author) {
          throw new Error(`User with ID ${post.userId} not found`);
        }
        
        return {
          ...post,
          author,
          timeAgo: this.getTimeAgo(post.createdAt),
        };
      });
  }

  async getPost(id: number): Promise<PostWithAuthor | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const author = this.users.get(post.userId);
    if (!author) {
      throw new Error(`User with ID ${post.userId} not found`);
    }
    
    return {
      ...post,
      author,
      timeAgo: this.getTimeAgo(post.createdAt),
    };
  }

  async createPost(postData: InsertPost): Promise<Post> {
    return this.createPostInternal({
      ...postData,
      fileName: postData.fileName || null,
      createdAt: new Date(),
      likes: 0,
      comments: 0
    });
  }

  // We'll use a Map to track post likes for the in-memory storage
  private postLikesMap: Map<string, boolean> = new Map();
  
  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const key = `${postId}-${userId}`;
    return this.postLikesMap.has(key);
  }
  
  async likePost(id: number, userId: number): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const key = `${id}-${userId}`;
    
    // Check if user already liked this post
    if (this.postLikesMap.has(key)) {
      // User already liked this post, so remove the like (toggle)
      this.postLikesMap.delete(key);
      
      const currentLikes = post.likes || 0;
      const updatedPost = { ...post, likes: Math.max(0, currentLikes - 1) };
      this.posts.set(id, updatedPost);
      return updatedPost;
    } else {
      // User hasn't liked this post yet, so add a like
      this.postLikesMap.set(key, true);
      
      const currentLikes = post.likes || 0;
      const updatedPost = { ...post, likes: currentLikes + 1 };
      this.posts.set(id, updatedPost);
      return updatedPost;
    }
  }
  
  // Comment methods
  async getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]> {
    // Filter comments by postId and transform to CommentWithAuthor
    const postComments = Array.from(this.comments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map(comment => {
        const author = this.users.get(comment.userId);
        if (!author) {
          throw new Error(`User with ID ${comment.userId} not found`);
        }
        
        return {
          ...comment,
          author,
          timeAgo: this.getTimeAgo(comment.createdAt),
        };
      });
    
    return postComments;
  }
  
  async createComment(commentData: InsertComment): Promise<Comment> {
    const id = this.commentCurrentId++;
    const comment: Comment = { 
      ...commentData, 
      id, 
      createdAt: new Date() 
    };
    
    this.comments.set(id, comment);
    
    // Update the comment count on the post
    const post = this.posts.get(commentData.postId);
    if (post) {
      const currentComments = post.comments || 0;
      const updatedPost = { ...post, comments: currentComments + 1 };
      this.posts.set(commentData.postId, updatedPost);
    }
    
    return comment;
  }
  
  // Activity methods
  async getRecentActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ${diffInMonths === 1 ? 'month' : 'months'} ago`;
  }

  // User methods
  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const result = await db.insert(users).values(userData).returning();
    return result[0];
  }
  
  // Post methods
  async getAllPosts(): Promise<PostWithAuthor[]> {
    const allPosts = await db.select().from(posts).orderBy(posts.createdAt);
    
    const postsWithAuthors = await Promise.all(
      allPosts.map(async (post) => {
        const author = await this.getUserById(post.userId);
        if (!author) {
          throw new Error(`User with ID ${post.userId} not found`);
        }
        
        return {
          ...post,
          author,
          timeAgo: this.getTimeAgo(post.createdAt),
        };
      })
    );
    
    return postsWithAuthors.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPost(id: number): Promise<PostWithAuthor | undefined> {
    const result = await db.select().from(posts).where(eq(posts.id, id));
    const post = result[0];
    if (!post) return undefined;
    
    const author = await this.getUserById(post.userId);
    if (!author) {
      throw new Error(`User with ID ${post.userId} not found`);
    }
    
    return {
      ...post,
      author,
      timeAgo: this.getTimeAgo(post.createdAt),
    };
  }

  async createPost(postData: InsertPost): Promise<Post> {
    const newPost = {
      ...postData,
      fileName: postData.fileName || null,
      createdAt: new Date(),
      likes: 0,
      comments: 0
    };
    
    const result = await db.insert(posts).values(newPost).returning();
    return result[0];
  }

  async hasUserLikedPost(postId: number, userId: number): Promise<boolean> {
    const result = await db.select()
      .from(postLikes)
      .where(and(
        eq(postLikes.postId, postId),
        eq(postLikes.userId, userId)
      ));
    
    return result.length > 0;
  }
  
  async likePost(id: number, userId: number): Promise<Post | undefined> {
    const postResult = await db.select().from(posts).where(eq(posts.id, id));
    const post = postResult[0];
    if (!post) return undefined;
    
    // Check if user already liked this post
    const hasLiked = await this.hasUserLikedPost(id, userId);
    
    if (hasLiked) {
      // User already liked this post, so remove the like
      await db.delete(postLikes)
        .where(and(
          eq(postLikes.postId, id),
          eq(postLikes.userId, userId)
        ));
      
      // Decrement the likes count
      const currentLikes = post.likes || 0;
      const result = await db
        .update(posts)
        .set({ likes: Math.max(0, currentLikes - 1) })
        .where(eq(posts.id, id))
        .returning();
      
      return result[0];
    } else {
      // User hasn't liked this post yet, so add a like
      await db.insert(postLikes).values({
        postId: id,
        userId: userId,
        createdAt: new Date()
      });
      
      // Increment the likes count
      const currentLikes = post.likes || 0;
      const result = await db
        .update(posts)
        .set({ likes: currentLikes + 1 })
        .where(eq(posts.id, id))
        .returning();
      
      return result[0];
    }
  }
  
  // Comment methods
  async getCommentsByPostId(postId: number): Promise<CommentWithAuthor[]> {
    const result = await db.select()
      .from(comments)
      .where(eq(comments.postId, postId))
      .orderBy(comments.createdAt);
    
    // Get author for each comment
    const commentsWithAuthors = await Promise.all(
      result.map(async (comment) => {
        const author = await this.getUserById(comment.userId);
        if (!author) {
          throw new Error(`User with ID ${comment.userId} not found`);
        }
        
        return {
          ...comment,
          author,
          timeAgo: this.getTimeAgo(comment.createdAt),
        };
      })
    );
    
    // Return sorted by most recent first
    return commentsWithAuthors.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async createComment(commentData: InsertComment): Promise<Comment> {
    // Begin a transaction
    const comment = await db.transaction(async (tx) => {
      // Insert the comment
      const [newComment] = await tx
        .insert(comments)
        .values({
          ...commentData,
          createdAt: new Date()
        })
        .returning();
      
      // Update the comment count on the post
      await tx
        .update(posts)
        .set({ 
          comments: sql`${posts.comments} + 1` 
        })
        .where(eq(posts.id, commentData.postId));
      
      return newComment;
    });
    
    return comment;
  }
  
  // Activity methods
  async getRecentActivities(): Promise<Activity[]> {
    // Since we don't have an activities table yet, we'll return an empty array for now
    // This would need to be implemented later with a proper activities table
    return [];
  }
}

// Initialize and seed database with demo data
async function initDatabase() {
  // Check if we already have users
  const existingUsers = await db.select().from(users);
  
  if (existingUsers.length === 0) {
    // Add sample users with explicitly defined avatar and role to avoid type issues
    const user1 = await db.insert(users).values({
      username: "alex.johnson",
      password: "password123",
      fullName: "Alex Johnson",
      avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36",
      role: "Product Manager"
    } as typeof users.$inferInsert).returning();
    
    const user2 = await db.insert(users).values({
      username: "emma.thompson",
      password: "password123",
      fullName: "Emma Thompson",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956",
      role: "Marketing Manager"
    } as typeof users.$inferInsert).returning();
    
    const user3 = await db.insert(users).values({
      username: "marcus.wilson",
      password: "password123",
      fullName: "Marcus Wilson",
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
      role: "Product Lead"
    } as typeof users.$inferInsert).returning();

    // Add sample posts
    await db.insert(posts).values({
      title: "Q2 2023 Marketing Strategy Document",
      description: "This comprehensive document outlines our marketing strategy for Q2 2023, including target audiences, campaign timelines, budget allocation, and KPIs. Please review and provide feedback by Friday.",
      fileName: "Q2_Marketing_Strategy.pdf",
      userId: user2[0].id,
      createdAt: new Date(Date.now() - 7200000), // 2 hours ago
      likes: 24,
      comments: 8
    });

    await db.insert(posts).values({
      title: "Product Roadmap 2023-2024",
      description: "Here's our updated product roadmap for the next 18 months. I've highlighted the key milestones and dependencies between different product teams.",
      fileName: "Product_Roadmap_2023_2024.pdf",
      userId: user3[0].id,
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      likes: 42,
      comments: 16
    });
    
    console.log("Database initialized with sample data");
  } else {
    console.log("Database already contains data, skipping initialization");
  }
}

// Initialize the database when this module is first loaded
initDatabase().catch(console.error);

// Export the DatabaseStorage instance
export const storage = new DatabaseStorage();
