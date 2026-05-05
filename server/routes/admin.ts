import { Router } from 'express';
import pool from '../db';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, role, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [userRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    const [taskRows]: any = await pool.query('SELECT COUNT(*) as count FROM tasks');
    res.json({ users: userRows[0].count, tasks: taskRows[0].count });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
