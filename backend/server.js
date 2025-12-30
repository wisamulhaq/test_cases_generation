import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();
import { generateTestCaseFlow, addHumanReview, enhanceQuery } from './main/main.js';
import { verifyGoogleToken, generateJWT, verifyJWT } from './auth/googleAuth.js';
import { connectDB } from './database/mongodb.js';
import { createOrUpdateUser, recordViolation, checkUserBlockStatus, getUserByGoogleId } from './database/userManager.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB on startup
connectDB().catch(console.error);

// CORS Configuration - Allow frontend domain
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// API Routes

// Authentication Routes
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }
    
    // Verify Google token
    const userInfo = await verifyGoogleToken(idToken);
    
    // Create or update user in database
    const user = await createOrUpdateUser(userInfo);
    
    // Check if user is blocked
    const blockStatus = await checkUserBlockStatus(user.googleId);
    if (blockStatus.isBlocked) {
      return res.status(403).json({
        error: 'Account Blocked',
        details: `Your account is temporarily blocked due to community guideline violations. Block expires in ${Math.ceil(blockStatus.remainingTime / (1000 * 60 * 60))} hours.`,
        type: 'USER_BLOCKED',
        blockInfo: blockStatus
      });
    }
    
    // Generate JWT token
    const token = generateJWT(user);
    
    res.json({
      success: true,
      token: token,
      user: {
        googleId: user.googleId,
        email: user.email,
        name: user.name,
        picture: user.picture,
        violationCount: user.violations?.length || 0
      }
    });
    
  } catch (error) {
    console.error('Google authentication error:', error);
    res.status(401).json({ 
      error: 'Authentication failed',
      details: error.message 
    });
  }
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = verifyJWT(token);
    const user = await getUserByGoogleId(decoded.googleId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Check if user is blocked
    const blockStatus = await checkUserBlockStatus(user.googleId);
    if (blockStatus.isBlocked) {
      return res.status(403).json({
        error: 'Account Blocked',
        details: `Your account is temporarily blocked. Block expires in ${Math.ceil(blockStatus.remainingTime / (1000 * 60 * 60))} hours.`,
        type: 'USER_BLOCKED',
        blockInfo: blockStatus
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running', timestamp: new Date().toISOString() });
});

// Generate test cases without images
app.post('/api/generate-test-cases', authenticateToken, async (req, res) => {
  try {
    const { description, requirements, customInstructions } = req.body;
    
    if (!description || !requirements) {
      return res.status(400).json({ 
        error: 'Description and requirements are required' 
      });
    }

    console.log('Generating test cases without images...');
    // Pass parameters separately as designed
    const result = await generateTestCaseFlow(
      description, 
      requirements, 
      [], // no images
      customInstructions || '' // pass as separate parameter
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Test cases generated successfully'
    });

  } catch (error) {
    console.error('Error generating test cases:', error);
    
    // Handle specific error types for better user feedback
    if (error.message.includes('not in English')) {
      return res.status(400).json({ 
        error: 'Language Not Supported',
        details: 'The provided content is not in English. Please provide your input in English.',
        type: 'LANGUAGE_ERROR'
      });
    }
    
    if (error.message.includes('flagged as harmful or inappropriate')) {
      // Record violation for user
      await recordViolation(req.user.googleId, 'HARMFUL_CONTENT', `${req.body.description} ${req.body.requirements}`);
      
      return res.status(400).json({ 
        error: 'Content Safety Violation',
        details: 'The provided content has been flagged as harmful or inappropriate. Please revise your input and try again.',
        type: 'HARMFUL_CONTENT'
      });
    }
    
    if (error.message.includes('do not align with the application context')) {
      // No violation recorded for invalid intent - just return error
      return res.status(400).json({ 
        error: 'Invalid Request Scope',
        details: 'Your request does not appear to be related to software test case generation. Please ensure your background describes a software application, requirements mention software features, and additional information relates to testing.',
        type: 'INVALID_INTENT'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate test cases',
      details: error.message,
      type: 'GENERATION_ERROR'
    });
  }
});

// Generate test cases with images
app.post('/api/generate-test-cases-with-images', authenticateToken, upload.array('images', 10), async (req, res) => {
  try {
    const { description, requirements, customInstructions, overallMockInstructions } = req.body;
    
    if (!description || !requirements) {
      return res.status(400).json({ 
        error: 'Description and requirements are required' 
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        error: 'At least one image is required for this endpoint' 
      });
    }

    // Get uploaded image paths
    const imagePaths = req.files.map(file => path.resolve(file.path));
    
    // Combine additional instructions for consistency
    let combinedAdditionalInfo = '';
    if (customInstructions) {
      combinedAdditionalInfo += customInstructions;
    }
    if (overallMockInstructions) {
      if (combinedAdditionalInfo) combinedAdditionalInfo += ' ';
      combinedAdditionalInfo += `Mock Instructions: ${overallMockInstructions}`;
    }
    
    console.log('Generating test cases with images...');
    // Pass parameters separately for consistency with non-image endpoint
    const result = await generateTestCaseFlow(
      description, 
      requirements, 
      imagePaths,
      combinedAdditionalInfo || '' // pass combined additional info
    );
    
    // Clean up uploaded files after processing
    setTimeout(() => {
      imagePaths.forEach(imagePath => {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }, 5000); // Clean up after 5 seconds

    res.json({
      success: true,
      data: result,
      message: 'Test cases generated successfully with images'
    });

  } catch (error) {
    console.error('Error generating test cases with images:', error);
    
    // Handle specific error types for better user feedback
    if (error.message.includes('not in English')) {
      return res.status(400).json({ 
        error: 'Language Not Supported',
        details: 'The provided content is not in English. Please provide your input in English.',
        type: 'LANGUAGE_ERROR'
      });
    }
    
    if (error.message.includes('flagged as harmful or inappropriate')) {
      // Record violation for user
      await recordViolation(req.user.googleId, 'HARMFUL_CONTENT', `${req.body.description} ${req.body.requirements}`);
      
      return res.status(400).json({ 
        error: 'Content Safety Violation',
        details: 'The provided content has been flagged as harmful or inappropriate. Please revise your input and try again.',
        type: 'HARMFUL_CONTENT'
      });
    }
    
    if (error.message.includes('do not align with the application context')) {
      // No violation recorded for invalid intent - just return error
      return res.status(400).json({ 
        error: 'Invalid Request Scope',
        details: 'Your request does not appear to be related to software test case generation. Please ensure your background describes a software application, requirements mention software features, and additional information relates to testing.',
        type: 'INVALID_INTENT'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to generate test cases with images',
      details: error.message,
      type: 'GENERATION_ERROR'
    });
  }
});

// Query Optimizer endpoint
app.post('/api/optimize-query', authenticateToken, async (req, res) => {
  try {
    const { background, requirements, additionalInformation } = req.body;
    
    if (!background || !requirements) {
      return res.status(400).json({ 
        error: 'Background and requirements are required' 
      });
    }

    console.log('Optimizing query...');
    const result = await enhanceQuery(background, requirements, additionalInformation || '');
    
    res.json({
      success: true,
      data: result,
      message: 'Query optimized successfully'
    });

  } catch (error) {
    console.error('Error optimizing query:', error);
    
    // Handle specific error types for better user feedback
    if (error.message.includes('not in English')) {
      return res.status(400).json({ 
        error: 'Language Not Supported',
        details: 'The provided content is not in English. Please provide your input in English for optimization.',
        type: 'LANGUAGE_ERROR'
      });
    }
    
    if (error.message.includes('flagged as harmful or inappropriate')) {
      // Record violation for user
      await recordViolation(req.user.googleId, 'HARMFUL_CONTENT', `${req.body.background} ${req.body.requirements}`);
      
      return res.status(400).json({ 
        error: 'Content Safety Violation',
        details: 'The provided content has been flagged as harmful or inappropriate. Please revise your input and try again.',
        type: 'HARMFUL_CONTENT'
      });
    }
    
    if (error.message.includes('do not align with the application context')) {
      // No violation recorded for invalid intent - just return error
      return res.status(400).json({ 
        error: 'Invalid Request Scope',
        details: 'Your request does not appear to be related to software test case generation. Please ensure your background describes a software application, requirements mention software features, and additional information relates to testing.',
        type: 'INVALID_INTENT'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to optimize query',
      details: error.message,
      type: 'OPTIMIZATION_ERROR'
    });
  }
});

// Apply human feedback to test cases
app.post('/api/apply-human-feedback', authenticateToken, async (req, res) => {
  try {
    const { testCases, feedbackPoints } = req.body;
    
    if (!testCases || !feedbackPoints) {
      return res.status(400).json({ 
        error: 'Test cases and feedback points are required' 
      });
    }

    console.log('Applying human feedback to test cases...');
    const result = await addHumanReview(testCases, feedbackPoints);
    
    res.json({
      success: true,
      data: result,
      message: 'Test cases updated based on human feedback'
    });

  } catch (error) {
    console.error('Error applying human feedback:', error);
    
    // Handle specific error types for better user feedback
    if (error.message.includes('flagged as harmful or inappropriate')) {
      // Record violation for user
      await recordViolation(req.user.googleId, 'HARMFUL_CONTENT', `Feedback: ${req.body.feedbackPoints}`);
      
      return res.status(400).json({ 
        error: 'Content Safety Violation',
        details: 'The provided feedback has been flagged as harmful or inappropriate. Please revise your feedback and try again.',
        type: 'HARMFUL_CONTENT'
      });
    }
    
    if (error.message.includes('do not align with the application context')) {
      // No violation recorded for invalid intent - just return error
      return res.status(400).json({ 
        error: 'Invalid Feedback Scope',
        details: 'Your feedback does not appear to be related to software test case improvement. Please provide feedback that focuses on test case quality, clarity, coverage, or accuracy.',
        type: 'INVALID_INTENT'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to apply human feedback',
      details: error.message,
      type: 'GENERATION_ERROR'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Test Cases Generation API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File size too large. Maximum size is 10MB.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 10 files.' });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Test Cases Generation API Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 Generate test cases: http://localhost:${PORT}/api/generate-test-cases`);
  console.log(`🖼️  Generate with images: http://localhost:${PORT}/api/generate-test-cases-with-images`);
  console.log(`💭 Apply feedback: http://localhost:${PORT}/api/apply-human-feedback`);
});

export default app;
