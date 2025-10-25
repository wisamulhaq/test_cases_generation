import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';


// Load environment variables
dotenv.config();
// Google OAuth credentials from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);

/**
 * Verify Google ID token and extract user information
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} User information
 */
export async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    
    return {
      googleId: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
      emailVerified: payload.email_verified
    };
  } catch (error) {
    throw new Error('Invalid Google token');
  }
}

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User information
 * @returns {string} JWT token
 */
export function generateJWT(user) {
  // TODO: Implement JWT generation
  // You can use jsonwebtoken library
  // const jwt = require('jsonwebtoken');
  // return jwt.sign(user, 'YOUR_JWT_SECRET', { expiresIn: '24h' });
  
  // Placeholder for now
  return `jwt_token_for_${user.googleId}`;
}

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Object} Decoded user information
 */
export function verifyJWT(token) {
  // TODO: Implement JWT verification
  // const jwt = require('jsonwebtoken');
  // return jwt.verify(token, 'YOUR_JWT_SECRET');
  
  // Placeholder for now
  if (token.startsWith('jwt_token_for_')) {
    return { googleId: token.replace('jwt_token_for_', '') };
  }
  throw new Error('Invalid token');
}
