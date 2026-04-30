import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(`
      SELECT m.id FROM milestones m 
      JOIN goals g ON m.goal_id = g.id 
      WHERE m.id = ? AND g.user_id = ?
    `, [req.params.id, req.user?.id]);
    
    if (rows.length === 0) return res.sendStatus(403);
    
    await pool.query('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { is_completed } = req.body;
  try {
    await pool.query('UPDATE milestones SET is_completed = ? WHERE id = ?', [is_completed ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
