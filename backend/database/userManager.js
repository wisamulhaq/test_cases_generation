import { getDB } from './mongodb.js';

/**
 * Create or update user in database
 * @param {Object} userInfo - User information from Google auth
 * @returns {Object} User document
 */
export async function createOrUpdateUser(userInfo) {
  const db = getDB();
  const users = db.collection('users');
  
  const existingUser = await users.findOne({ googleId: userInfo.googleId });
  
  if (existingUser) {
    // Update existing user
    await users.updateOne(
      { googleId: userInfo.googleId },
      { 
        $set: { 
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          lastLogin: new Date()
        }
      }
    );
    return await users.findOne({ googleId: userInfo.googleId });
  } else {
    // Create new user
    const newUser = {
      googleId: userInfo.googleId,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
      createdAt: new Date(),
      lastLogin: new Date(),
      violations: [],
      isBlocked: false,
      blockExpiresAt: null
    };
    
    await users.insertOne(newUser);
    return newUser;
  }
}

/**
 * Get user by Google ID
 * @param {string} googleId - Google ID
 * @returns {Object} User document
 */
export async function getUserByGoogleId(googleId) {
  const db = getDB();
  const users = db.collection('users');
  return await users.findOne({ googleId });
}

/**
 * Record a violation for user
 * @param {string} googleId - Google ID
 * @param {string} violationType - Type of violation ('HARMFUL_CONTENT' or 'INVALID_INTENT')
 * @param {string} content - The content that caused violation
 * @returns {Object} Updated user document
 */
export async function recordViolation(googleId, violationType, content) {
  const db = getDB();
  const users = db.collection('users');
  
  const violation = {
    type: violationType,
    content: content.substring(0, 500), // Store first 500 chars
    timestamp: new Date()
  };
  
  const user = await users.findOne({ googleId });
  if (!user) {
    throw new Error('User not found');
  }
  
  const violations = [...(user.violations || []), violation];
  
  // Check if user should be blocked (2 violations)
  let updateData = {
    $push: { violations: violation }
  };
  
  if (violations.length >= 2) {
    // Block user for 2 days
    const blockExpiresAt = new Date();
    blockExpiresAt.setDate(blockExpiresAt.getDate() + 2);
    
    updateData.$set = {
      isBlocked: true,
      blockExpiresAt: blockExpiresAt
    };
  }
  
  await users.updateOne({ googleId }, updateData);
  
  return await users.findOne({ googleId });
}

/**
 * Check if user is currently blocked
 * @param {string} googleId - Google ID
 * @returns {Object} Block status and remaining time
 */
export async function checkUserBlockStatus(googleId) {
  const db = getDB();
  const users = db.collection('users');
  
  const user = await users.findOne({ googleId });
  if (!user) {
    return { isBlocked: false, remainingTime: 0 };
  }
  
  if (!user.isBlocked || !user.blockExpiresAt) {
    return { isBlocked: false, remainingTime: 0 };
  }
  
  const now = new Date();
  const blockExpiresAt = new Date(user.blockExpiresAt);
  
  if (now >= blockExpiresAt) {
    // Block has expired, unblock user
    await users.updateOne(
      { googleId },
      { 
        $set: { 
          isBlocked: false,
          blockExpiresAt: null
        }
      }
    );
    return { isBlocked: false, remainingTime: 0 };
  }
  
  const remainingTime = blockExpiresAt.getTime() - now.getTime();
  return { 
    isBlocked: true, 
    remainingTime: remainingTime,
    blockExpiresAt: blockExpiresAt,
    violationCount: user.violations?.length || 0
  };
}

/**
 * Get user violation count
 * @param {string} googleId - Google ID
 * @returns {number} Number of violations
 */
export async function getUserViolationCount(googleId) {
  const db = getDB();
  const users = db.collection('users');
  
  const user = await users.findOne({ googleId });
  return user?.violations?.length || 0;
}
