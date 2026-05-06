import { Router } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

export const getUserContextSummary = async (userId: number) => {
  try {
    const [todoRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ('todo', 'in-progress')",
      [userId]
    );
    const [pendingTaskRows]: any = await pool.query(
      "SELECT title, priority, due_date FROM tasks WHERE user_id = ? AND status IN ('todo', 'in-progress') ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END, CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC LIMIT 5",
      [userId]
    );
    const [completedRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = 'completed'",
      [userId]
    );
    const [habitRows]: any = await pool.query(
      'SELECT COALESCE(MAX(streak), 0) as streak FROM habits WHERE user_id = ?',
      [userId]
    );
    const [topHabitsRows]: any = await pool.query(
      "SELECT name, streak FROM habits WHERE user_id = ? ORDER BY streak DESC, id DESC LIMIT 3",
      [userId]
    );
    const [activeGoalsRows]: any = await pool.query(
      "SELECT title, progress FROM goals WHERE user_id = ? AND status = 'active' ORDER BY progress DESC, id DESC",
      [userId]
    );
    const [overdueRows]: any = await pool.query(
      "SELECT id, title, due_date, priority FROM tasks WHERE user_id = ? AND status != 'completed' AND due_date < CURDATE() ORDER BY due_date ASC",
      [userId]
    );
    const [highPriorityRows]: any = await pool.query(
      "SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ('todo', 'in-progress') AND priority = 'high'",
      [userId]
    );

    return {
      todoCount: Number(todoRows[0].count || 0),
      completedCount: Number(completedRows[0].count || 0),
      habitStreak: Number(habitRows[0].streak || 0),
      overdueTasks: overdueRows,
      highPriorityTodoCount: Number(highPriorityRows[0].count || 0),
      pendingTasks: pendingTaskRows,
      topHabits: topHabitsRows,
      activeGoals: activeGoalsRows
    };
  } catch (error) {
    console.error('Error building user context summary:', error);
    return {
      todoCount: 0,
      completedCount: 0,
      habitStreak: 0,
      overdueTasks: [],
      highPriorityTodoCount: 0,
      pendingTasks: [],
      topHabits: [],
      activeGoals: []
    };
  }
};

const taskCreateSchema = z.object({
  title: z.string().min(1).max(100),
  status: z.enum(['todo', 'in-progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [rows]: any = await pool.query(
      'SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user?.id]
    );
    console.log('DEBUG [TasksRoute]: list query result count', Array.isArray(rows) ? rows.length : 0);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  console.log('DEBUG [TasksRoute]: create req.body', req.body);
  const result = taskCreateSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.issues[0].message });

  const { title, status, priority, due_date } = result.data;
  const description = req.body.description || '';
  const category = req.body.category || 'Personal';

  try {
    const [dbResult]: any = await pool.query(
      'INSERT INTO tasks (user_id, title, description, due_date, priority, category, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user?.id, title, description, due_date, priority, category, status]
    );
    console.log('DEBUG [TasksRoute]: create db result', dbResult);
    res.json({ id: dbResult.insertId, title, description, due_date, priority, category, status });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
  console.log('DEBUG [TasksRoute]: patch req.body', req.body);
  const { status, priority, title, description, due_date, category } = req.body;
  const fields = [];
  const values = [];
  if (status) { fields.push('status = ?'); values.push(status); }
  if (priority) { fields.push('priority = ?'); values.push(priority); }
  if (title) { fields.push('title = ?'); values.push(title); }
  if (description !== undefined) { fields.push('description = ?'); values.push(description); }
  if (due_date) { fields.push('due_date = ?'); values.push(due_date); }
  if (category) { fields.push('category = ?'); values.push(category); }
  
  if (fields.length === 0) return res.json({ success: true });
  
  values.push(req.params.id, req.user?.id);
  try {
    const [dbResult]: any = await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
    console.log('DEBUG [TasksRoute]: patch db result', dbResult);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    await pool.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user?.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
