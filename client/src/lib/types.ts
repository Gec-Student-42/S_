import type { User, Post, Comment } from "@shared/schema";

export interface PostWithAuthor extends Omit<Post, "userId"> {
  author: User;
  timeAgo: string;
  hasLiked?: boolean;
}

export interface CommentWithAuthor extends Omit<Comment, "userId"> {
  author: User;
  timeAgo: string;
}

export interface Activity {
  id: number;
  user: User;
  action: string;
  target: string;
  timeAgo: string;
}
