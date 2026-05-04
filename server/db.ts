import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool using your .env credentials
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export const initDB = async () => {
  try {
    const connection = await pool.getConnection();

    // Users Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        bio TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tasks Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        due_date VARCHAR(100),
        status VARCHAR(50) DEFAULT 'todo',
        priority VARCHAR(50) DEFAULT 'medium',
        category VARCHAR(100) DEFAULT 'Personal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Habits Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS habits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'Health',
        streak INT DEFAULT 0,
        last_completed VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_habits_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Goals Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        target_date VARCHAR(100),
        progress INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_goals_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Milestones Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INT PRIMARY KEY AUTO_INCREMENT,
        goal_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        CONSTRAINT fk_milestones_goal FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      )
    `);

    // Notifications Table (including your SQLite migration logic converted to MySQL)[cite: 1]
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255),
        message TEXT NOT NULL,
        type ENUM('task', 'habit') NOT NULL DEFAULT 'task',
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    connection.release();
    console.log('MySQL Database initialized successfully[cite: 1]');
  } catch (error) {
    console.error('Error initializing MySQL database:', error);
    throw error;
  }
};

/**
 * Custom query wrapper to maintain compatibility with your previous code
 * while using the native MySQL promise pool.
 */
export const dbWrapper = {
  query: async (sql: string, params: any[] = []) => {
    try {
      // MySQL uses '?' as placeholders naturally, no need for manual replace[cite: 1]
      const [rows, fields] = await pool.query(sql, params);
      
      // Mimicking your previous SQLite return format[cite: 1]
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return [rows];
      } else {
        const result = rows as any;
        return [{ insertId: result.insertId, affectedRows: result.affectedRows }];
      }
    } catch (e) {
      console.error('Query error:', e, 'SQL:', sql);
      throw e;
    }
  },
  getConnection: async () => {
    const connection = await pool.getConnection();
    return {
      query: (sql: string, params: any[] = []) => connection.query(sql, params),
      release: () => connection.release()
    };
  }
};

export default dbWrapper;