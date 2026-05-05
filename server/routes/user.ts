import { Router } from 'express';
import pool from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getUserContextSummary } from './tasks';

const router = Router();

const buildOracleTip = (summary: {
  todoCount: number;
  completedCount: number;
  habitStreak: number;
  overdueTasks: Array<{ id: number; title: string; due_date: string; priority: string }>;
  highPriorityTodoCount: number;
  pendingTasks: Array<{ title: string; priority: string; due_date: string | null }>;
  topHabits: Array<{ name: string; streak: number }>;
  activeGoals: Array<{ title: string; progress: number }>;
}) => {
  if ((summary.overdueTasks ?? []).length > 0) {
    const highest = (summary.overdueTasks ?? []).find(t => t.priority === 'high') || (summary.overdueTasks ?? [])[0];
    return `Strategist, you have ${summary.overdueTasks.length} overdue objective(s). Start with "${highest.title}" to rapidly stabilize your momentum.`;
  }
  if (summary.highPriorityTodoCount > 0) {
    return `Strategist, you have ${summary.highPriorityTodoCount} high-priority objective(s) pending. Focus on the shortest one first to build momentum.`;
  }
  if (summary.todoCount > 0) {
    return `Strategist, you have ${summary.todoCount} active objective(s) and ${summary.completedCount} completed. Tackle your shortest high-priority task first to build momentum.`;
  }
  if (summary.habitStreak > 0) {
    const nearestHabitRecord = (summary.topHabits ?? [])[0]
      ? 7 - ((summary.topHabits ?? [])[0].streak % 7 || 7)
      : null;
    if (nearestHabitRecord && nearestHabitRecord <= 3) {
      return `You're ${nearestHabitRecord} day(s) away from a habit record on "${(summary.topHabits ?? [])[0].name}". Keep the streak alive today.`;
    }
    return `Strong cadence: ${summary.habitStreak}-day streak. Keep your streak alive with one fast win today.`;
  }
  return 'Fresh board detected. Set one clear objective and complete it early to define your day.';
};

router.get('/user-stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    console.log('DEBUG [UserRoute]: /user-stats userId', userId);
    const [totalTasks]: any = await pool.query('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId]);
    console.log('DEBUG [UserRoute]: user-stats totalTasks', totalTasks);
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
    console.log('DEBUG [UserRoute]: /notifications userId', req.user?.id);
    const [notes] = await pool.query(
      'SELECT id, user_id, title, message, type, is_read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user?.id]
    );
    res.json(notes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/context-summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    console.log('DEBUG [UserRoute]: /user-stats userId', userId);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const summary = await getUserContextSummary(userId);
    console.log('DEBUG [UserRoute]: oracle summary', summary);
    console.log('DEBUG [UserRoute]: context summary', summary);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/oracle-daily-insight', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    console.log('DEBUG [UserRoute]: /user-stats userId', userId);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const summary = await getUserContextSummary(userId);
    console.log('DEBUG [UserRoute]: context summary', summary);
    const contextPrompt = [
      `Tasks To Do: ${summary.todoCount}`,
      `Tasks Completed: ${summary.completedCount}`,
      `Habit Streak: ${summary.habitStreak}`,
      `Overdue Tasks: ${summary.overdueTasks.length}`,
      `High Priority Pending: ${summary.highPriorityTodoCount}`,
      `Overdue Task Titles: ${summary.overdueTasks.map(task => task.title).join(', ') || 'None'}`,
      `Top Pending Tasks: ${(summary.pendingTasks ?? []).map(task => `${task.title} (${task.priority}, due ${task.due_date || 'no due date'})`).join('; ') || 'None'}`,
      `Top Habits: ${(summary.topHabits ?? []).map(habit => `${habit.name} (${habit.streak}-day streak)`).join('; ') || 'None'}`,
      `Active Vision Goals: ${(summary.activeGoals ?? []).map(goal => `${goal.title} (${goal.progress}% complete)`).join('; ') || 'None'}`
    ].join(' | ');

    res.json({
      insight: buildOracleTip(summary),
      contextPrompt
    });
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
