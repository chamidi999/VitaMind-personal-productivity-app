import pool from '../db';

const DEADLINE_WINDOW_HOURS = 24;

export const runNotificationChecks = async () => {
  const [taskDeadlines]: any = await pool.query(
    `SELECT t.id, t.user_id, t.title, t.due_date
     FROM tasks t
     WHERE t.status != 'completed'
       AND t.due_date IS NOT NULL
       AND STR_TO_DATE(t.due_date, '%Y-%m-%d %H:%i:%s') >= NOW()
       AND STR_TO_DATE(t.due_date, '%Y-%m-%d %H:%i:%s') <= DATE_ADD(NOW(), INTERVAL ${DEADLINE_WINDOW_HOURS} HOUR)`
  );

  for (const task of taskDeadlines) {
    const [existing]: any = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = ? AND type = 'task' AND message = ?
         AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
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
        OR DATE(h.last_completed) < CURDATE()`
  );

  for (const habit of habitLapses) {
    const [existing]: any = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = ? AND type = 'habit' AND message = ? AND DATE(created_at) = CURDATE()
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
};
