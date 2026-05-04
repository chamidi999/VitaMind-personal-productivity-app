import pool from '../db';

const DEADLINE_WINDOW_HOURS = 24;

export const runNotificationChecks = async () => {
  try {
    const [taskDeadlines]: any = await pool.query(
      `SELECT t.id, t.user_id, t.title, t.due_date
       FROM tasks t
       WHERE t.status != 'completed'
         AND t.due_date IS NOT NULL
         AND datetime(t.due_date) >= datetime('now')
         AND datetime(t.due_date) <= datetime('now', '+${DEADLINE_WINDOW_HOURS} hours')`
    );

    for (const task of taskDeadlines) {
      const [existing]: any = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = ? AND type = 'task' AND message = ?
           AND datetime(created_at) >= datetime('now', '-24 hours')
         LIMIT 1`,
        [task.user_id, `Task deadline approaching: ${task.title}`]
      );

      if (!existing.length) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, is_read)
           VALUES (?, ?, ?, 'task', 0)`,
          [task.user_id, 'Task Reminder', `Task deadline approaching: ${task.title}`]
        );
      }
    }

    const [habitLapses]: any = await pool.query(
      `SELECT h.id, h.user_id, h.name, h.last_completed
       FROM habits h
       WHERE h.last_completed IS NULL
          OR date(h.last_completed) < date('now')`
    );

    for (const habit of habitLapses) {
      const [existing]: any = await pool.query(
        `SELECT id FROM notifications
         WHERE user_id = ? AND type = 'habit' AND message = ? AND date(created_at) = date('now')
         LIMIT 1`,
        [habit.user_id, `Habit missed today: ${habit.name}`]
      );

      if (!existing.length) {
        await pool.query(
          `INSERT INTO notifications (user_id, title, message, type, is_read)
           VALUES (?, ?, ?, 'habit', 0)`,
          [habit.user_id, 'Habit Reminder', `Habit missed today: ${habit.name}`]
        );
      }
    }

    return [];
  } catch (error) {
    console.error('Error running notification checks:', error);
    return [{ error: 'Failed to run notification checks' }];
  }
};
