import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage as dbStorage } from "./storage";
import { z } from "zod";
import { insertPostSchema, insertCommentSchema } from "@shared/schema";
import { setupAuth } from "./auth";

// Ensure uploads directory exists
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure optimized multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Create more efficient unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    const ext = path.extname(cleanFileName);
    const fileName = `${timestamp}-${randomString}${ext}`;
    cb(null, fileName);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only PDF files with proper validation
  if (file.mimetype === 'application/pdf') {
    // Check file extension as secondary validation
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf') {
      return cb(new Error('Only PDF files are allowed!'));
    }
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
};

const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 3 * 1024 * 1024, // 3MB in bytes
    files: 1 // Allow only 1 file per request
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
  // API Routes with improved error handling and caching headers
  
  // Get all posts
  app.get("/api/posts", async (req, res) => {
    try {
      const posts = await dbStorage.getAllPosts();
      
      // If user is authenticated, check which posts they've liked
      let postsWithLikeStatus = [...posts];
      
      if (req.isAuthenticated() && req.user) {
        const userId = req.user.id;
        
        // Add hasLiked property to each post
        postsWithLikeStatus = await Promise.all(
          posts.map(async (post) => {
            const hasLiked = await dbStorage.hasUserLikedPost(post.id, userId);
            return { ...post, hasLiked };
          })
        );
      } else {
        // For unauthenticated users, set hasLiked to false for all posts
        postsWithLikeStatus = posts.map(post => ({ ...post, hasLiked: false }));
      }
      
      // Add cache headers to improve performance
      res.setHeader('Cache-Control', 'public, max-age=10');
      res.json(postsWithLikeStatus);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // Get a specific post by ID
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const post = await dbStorage.getPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Add user liked status if authenticated
      let hasLiked = false;
      if (req.isAuthenticated() && req.user) {
        hasLiked = await dbStorage.hasUserLikedPost(postId, req.user.id);
      }
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=60');
      res.json({
        ...post,
        hasLiked
      });
    } catch (error) {
      console.error("Error fetching post:", error);
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  // Like or unlike a post
  app.post("/api/posts/:id/like", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      // Check if the user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
      // Check if the user has already liked this post
      const hasLiked = await dbStorage.hasUserLikedPost(postId, userId);
      
      // Toggle like status
      const post = await dbStorage.likePost(postId, userId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Return the updated post with the new like status
      res.json({
        post,
        hasLiked: !hasLiked // Toggle the previous state
      });
    } catch (error) {
      console.error("Error liking post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  // Get current user
  app.get("/api/currentUser", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.json(req.user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get recent activities
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await dbStorage.getRecentActivities();
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });
  
  // Create a new document (with optional file upload)
  app.post("/api/posts", upload.single('file'), async (req, res) => {
    try {
      // Validate request
      const { title, description } = req.body;
      
      if (!title || typeof title !== 'string') {
        return res.status(400).json({ message: "Title is required and must be a string" });
      }
      
      // Check if the user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const user = req.user;
      
      // Process file if uploaded
      let fileName = null;
      if (req.file) {
        fileName = req.file.originalname;
        
        // File validation already handled by multer, but we can add additional checks if needed
        console.log(`File uploaded: ${fileName}, Size: ${req.file.size} bytes`);
      }
      
      // Create the post with validated data
      const postData = {
        title: title.trim(),
        description: description ? description.trim() : "",
        fileName,
        userId: user.id
      };
      
      const post = await dbStorage.createPost(postData);
      
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Failed to create post" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      const comments = await dbStorage.getCommentsByPostId(postId);
      
      // Add cache headers
      res.setHeader('Cache-Control', 'public, max-age=10');
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });
  
  // Create a comment for a post
  app.post("/api/posts/:id/comments", async (req, res) => {
    try {
      const postId = Number(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }
      
      // Check if the user is authenticated
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "User not authenticated" });
      }
      
      const userId = req.user.id;
      
      // Validate the comment data
      const { content } = req.body;
      
      if (!content || typeof content !== 'string' || content.trim() === '') {
        return res.status(400).json({ message: "Comment content is required" });
      }
      
      // Create the comment
      const commentData = {
        content: content.trim(),
        postId,
        userId
      };
      
      const comment = await dbStorage.createComment(commentData);
      
      // Get the full comment with author details
      const comments = await dbStorage.getCommentsByPostId(postId);
      const commentWithAuthor = comments.find(c => c.id === comment.id);
      
      if (!commentWithAuthor) {
        return res.status(500).json({ message: "Failed to retrieve created comment" });
      }
      
      res.status(201).json(commentWithAuthor);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
