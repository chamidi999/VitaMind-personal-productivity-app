import pool from '../db';

export const runNotificationChecks = async () => {
  const [taskDeadlines]: any = await pool.query(
    `SELECT t.id, t.user_id, t.title, t.due_date,
            DATEDIFF(DATE(STR_TO_DATE(t.due_date, '%Y-%m-%d %H:%i:%s')), CURDATE()) AS days_left
     FROM tasks t
     WHERE t.status != 'completed'
       AND t.due_date IS NOT NULL
       AND DATEDIFF(DATE(STR_TO_DATE(t.due_date, '%Y-%m-%d %H:%i:%s')), CURDATE()) IN (0, 1, 2)`
  );

  for (const task of taskDeadlines) {
    const reminderMessage =
      task.days_left === 2
        ? `Task due in 2 days: ${task.title}`
        : task.days_left === 1
          ? `Task due tomorrow: ${task.title}`
          : `Task due today: ${task.title}`;

    const [existing]: any = await pool.query(
      `SELECT id FROM notifications
       WHERE user_id = ? AND type = 'task' AND message = ?
         AND DATE(created_at) = CURDATE()
       LIMIT 1`,
      [task.user_id, reminderMessage]
    );

    if (!existing.length) {
      await pool.query(
        `INSERT INTO notifications (user_id, title, message, type, is_read)
         VALUES (?, ?, ?, 'task', 0)`,
        [task.user_id, 'Task Reminder', reminderMessage]
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
