import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post('/register', async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });
  
  const { email, password, name } = result.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  try {
    const [result]: any = await pool.query(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?)',
      [email, hashedPassword, name]
    );
    const userId = result.insertId;
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email, name, role: 'user' } });
  } catch (e: any) {
    console.error('Registration error:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'User already exists' });
    }
    res.status(500).json({ error: 'Internal server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { email, password } = result.data;
  try {
    const [rows]: any = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login' });
  }
});

router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT id, email, name, role, bio, avatar_url FROM users WHERE id = ?',
      [req.user?.id]
    );
    res.json(rows[0]);
  } catch (error) {
    console.error('Auth/me error:', error);
    res.status(500).json({ error: 'Internal server error fetching user data' });
  }
});

router.patch('/profile', authenticateToken, async (req: AuthRequest, res) => {
  const { name, bio } = req.body;
  try {
    await pool.query('UPDATE users SET name = ?, bio = ? WHERE id = ?', [name, bio, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error updating profile' });
  }
});

export default router;
