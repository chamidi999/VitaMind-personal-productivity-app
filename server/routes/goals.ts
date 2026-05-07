import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const syncGoalProgressFromMilestones = async (goalId: number) => {
  const [milestoneStats]: any = await pool.query(
    `SELECT COUNT(*) as total, SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed
     FROM milestones
     WHERE goal_id = ?`,
    [goalId]
  );

  const total = Number(milestoneStats?.[0]?.total || 0);
  const completed = Number(milestoneStats?.[0]?.completed || 0);
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
  const status = total > 0 && progress >= 100 ? 'completed' : 'active';

  await pool.query(
    `UPDATE goals
     SET progress = ?,
         status = ?,
         completed_at = CASE
           WHEN ? = 'completed' THEN COALESCE(completed_at, NOW())
           ELSE NULL
         END
     WHERE id = ?`,
    [progress, status, status, goalId]
  );
};

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [goals]: any = await pool.query('SELECT * FROM goals WHERE user_id = ?', [req.user?.id]);
    const goalsWithMilestones = await Promise.all(goals.map(async (goal: any) => {
      const [milestones]: any = await pool.query('SELECT * FROM milestones WHERE goal_id = ?', [goal.id]);
      return { ...goal, milestones };
    }));
    res.json(goalsWithMilestones);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  const { title, description, category, target_date } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO goals (user_id, title, description, category, target_date) VALUES (?, ?, ?, ?, ?)',
      [req.user?.id, title, description, category, target_date]
    );
    res.json({ id: result.insertId, title, description, category, target_date, progress: 0, status: 'active' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { title, description, category, target_date, status, progress } = req.body;
  const fields = [];
  const values = [];
  if (title !== undefined) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (category !== undefined) { fields.push('category = ?'); values.push(category); }
  if (target_date !== undefined) { fields.push('target_date = ?'); values.push(target_date); }
  if (status !== undefined) { fields.push('status = ?'); values.push(status); }
  if (progress !== undefined) { fields.push('progress = ?'); values.push(progress); }

  if (fields.length === 0) return res.json({ success: true });

  values.push(req.params.id, req.user?.id);
  try {
    await pool.query(`UPDATE goals SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/milestones', authenticateToken, async (req: AuthRequest, res) => {
  const { title } = req.body;
  try {
    const [result]: any = await pool.query(
      'INSERT INTO milestones (goal_id, title) VALUES (?, ?)',
      [req.params.id, title]
    );
    await syncGoalProgressFromMilestones(Number(req.params.id));
    res.json({ id: result.insertId, title, is_completed: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
