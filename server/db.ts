import Database from 'better-sqlite3';

const db = new Database('zenith.db');
db.pragma('journal_mode = WAL');

export const initDB = async () => {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        bio TEXT,
        avatar_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date TEXT,
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        category TEXT DEFAULT 'Personal',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Health',
        streak INTEGER DEFAULT 0,
        last_completed TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT,
        target_date TEXT,
        progress INTEGER DEFAULT 0,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        goal_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT,
        message TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('task', 'habit')),
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('SQLite Database (better-sqlite3) initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const pool = {
  query: (sql: string, params: any[] = []) => {
    try {
      const stmt = db.prepare(sql.replace(/\?/g, (val, i) => `?`));
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        return Promise.resolve([stmt.all(...params)]);
      } else {
        const result = stmt.run(...params);
        return Promise.resolve([{ insertId: result.lastInsertRowid, affectedRows: result.changes }]);
      }
    } catch (e) {
      console.error('Query error:', e, 'SQL:', sql);
      return Promise.reject(e);
    }
  },
  getConnection: () => Promise.resolve({
    query: (sql: string, params: any[] = []) => pool.query(sql, params),
    release: () => {}
  })
};

export default pool;
