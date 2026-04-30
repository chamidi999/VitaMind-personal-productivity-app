import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM habits WHERE user_id = ?', [req.user?.id]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { name, category } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO habits (user_id, name, category) VALUES (?, ?, ?)',
      [req.user?.id, name, category || 'Health']
    );
    res.json({ id: result.insertId, name, category: category || 'Health', streak: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { name, category } = req.body;
  try {
    await pool.query('UPDATE habits SET name = ?, category = ? WHERE id = ? AND user_id = ?', 
      [name, category, req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query('SELECT * FROM habits WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    const habit = rows[0];
    if (!habit) return res.sendStatus(404);

    const today = new Date().toISOString().split('T')[0];
    if (habit.last_completed && habit.last_completed.toISOString().split('T')[0] === today) {
        return res.json(habit);
    }

    const newStreak = habit.streak + 1;
    await pool.query('UPDATE habits SET streak = ?, last_completed = ? WHERE id = ?', [newStreak, today, req.params.id]);
    res.json({ ...habit, streak: newStreak, last_completed: today });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
