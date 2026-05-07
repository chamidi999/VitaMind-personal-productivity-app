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

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      `SELECT m.id, m.goal_id FROM milestones m
       JOIN goals g ON m.goal_id = g.id
       WHERE m.id = ? AND g.user_id = ?`,
      [req.params.id, req.user?.id]
    );

    if (rows.length === 0) return res.sendStatus(403);

    const goalId = Number(rows[0].goal_id);
    await pool.query('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    await syncGoalProgressFromMilestones(goalId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  const { is_completed } = req.body;
  try {
    const [rows]: any = await pool.query(
      `SELECT m.id, m.goal_id FROM milestones m
       JOIN goals g ON m.goal_id = g.id
       WHERE m.id = ? AND g.user_id = ?`,
      [req.params.id, req.user?.id]
    );

    if (rows.length === 0) return res.sendStatus(403);

    const goalId = Number(rows[0].goal_id);
    await pool.query('UPDATE milestones SET is_completed = ? WHERE id = ?', [is_completed ? 1 : 0, req.params.id]);
    await syncGoalProgressFromMilestones(goalId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
