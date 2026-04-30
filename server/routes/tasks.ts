import { Router } from 'express';
import { z } from 'zod';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

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
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', authenticateToken, async (req: AuthRequest, res) => {
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
    res.json({ id: dbResult.insertId, title, description, due_date, priority, category, status });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', authenticateToken, async (req: AuthRequest, res) => {
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
    await pool.query(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`, values);
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
