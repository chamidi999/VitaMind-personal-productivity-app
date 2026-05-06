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
    await pool.query(
      'INSERT OR IGNORE INTO habit_completions (habit_id, user_id, completed_on) VALUES (?, ?, ?)',
      [req.params.id, req.user?.id, today]
    );
    res.json({ ...habit, streak: newStreak, last_completed: today });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [habitRows]: any = await pool.query('SELECT COUNT(*) as total FROM habits WHERE user_id = ?', [req.user?.id]);
    const totalHabits = habitRows[0]?.total || 0;

    const [completionRows]: any = await pool.query(
      `SELECT completed_on, COUNT(DISTINCT habit_id) as completed
       FROM habit_completions
       WHERE user_id = ? AND DATE(completed_on) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
       GROUP BY completed_on`,
      [req.user?.id]
    );

    const completionMap = new Map<string, number>(
      completionRows.map((row: any) => [row.completed_on, row.completed])
    );

    const history = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const isoDay = date.toISOString().split('T')[0];
      const completed = completionMap.get(isoDay) || 0;
      const score = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
      return { date: isoDay, completed, total: totalHabits, score };
    });

    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
