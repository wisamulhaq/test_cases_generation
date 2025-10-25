import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
dotenv.config();

// MongoDB configuration from environment variables
const MONGODB_URI = process.env.MONGODB_URL || 'mongodb://localhost:27017/testcases_db';
const DB_NAME = 'test_cases_generator';

let db = null;
let client = null;

/**
 * Connect to MongoDB Atlas
 */
export async function connectDB() {
  try {
    if (db) return db;    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db(DB_NAME);
    
    console.log('✅ Connected to MongoDB Atlas');
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Get database instance
 */
export function getDB() {
  if (!db) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return db;
}

/**
 * Close database connection
 */
export async function closeDB() {
  if (client) {
    await client.close();
    db = null;
    client = null;
    console.log('📴 Disconnected from MongoDB Atlas');
  }
}
