import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/user-stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const [totalTasks]: any = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]);
    const [completedTasks]: any = await pool.query("SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'", [userId]);
    const [activeHabits]: any = await pool.query('SELECT COUNT(*) as count FROM habits WHERE user_id = ?', [userId]);
    const [totalGoals]: any = await pool.query('SELECT COUNT(*) as count FROM goals WHERE user_id = ?', [userId]);

    res.json({
      tasks: { total: totalTasks[0].count, completed: completedTasks[0].count },
      habits: { active: activeHabits[0].count },
      goals: { total: totalGoals[0].count }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/notifications', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [notes] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user?.id]
    );
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/notifications/:id/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', 
      [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
