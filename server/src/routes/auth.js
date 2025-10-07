import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';

const router = Router();

// Login schema
const LoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = LoginSchema.parse(req.body);
    
    // Get user from database
    const result = await query(
      'SELECT id, username, password_hash, name, person_id, role FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    const user = result.rows[0];
    
    // Simple password validation for small team - different password per user
    let expectedPassword;
    switch (user.person_id) {
      case 'P1': expectedPassword = 'CivilifyP1!'; break;
      case 'P2': expectedPassword = 'CivilifyP2!'; break;
      case 'P3': expectedPassword = 'CivilifyP3!'; break;
      case 'P4': expectedPassword = 'CivilifyP4!'; break;
      case 'P5': expectedPassword = 'Khemic0101!'; break;
      default: expectedPassword = 'CivilifyP1!'; // fallback
    }
    const isValidPassword = password === expectedPassword;
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid username or password' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        name: user.name, 
        personId: user.person_id,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        personId: user.person_id,
        role: user.role
      }
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    const result = await query(
      'SELECT id, username, name, person_id, role FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, error: 'User not found' });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (e) {
    console.error(e);
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
});


// Removed server-side quota and team-progress endpoints; client computes progress from plan

// Get all team members
router.get('/team-members', async (req, res) => {
  try {
    const result = await query(
      'SELECT id, username, name, person_id, role FROM users ORDER BY person_id',
      []
    );
    
    res.json({
      success: true,
      team_members: result.rows
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

// Update password endpoint
const UpdatePasswordSchema = z.object({
  username: z.string().min(1),
  newPassword: z.string().min(1),
});

router.post('/update-password', async (req, res) => {
  try {
    const { username, newPassword } = UpdatePasswordSchema.parse(req.body);
    
    // Update password in database
    await query(
      'UPDATE users SET password_hash = $1 WHERE username = $2',
      [newPassword, username]
    );
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (e) {
    console.error(e);
    res.status(400).json({ success: false, error: String(e.message || e) });
  }
});

export default router;
