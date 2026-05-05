import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

import { initDB } from './server/db';
import authRoutes from './server/routes/auth';
import taskRoutes from './server/routes/tasks';
import habitRoutes from './server/routes/habits';
import goalRoutes from './server/routes/goals';
import milestoneRoutes from './server/routes/milestones';
import adminRoutes from './server/routes/admin';
import userRoutes from './server/routes/user';
import analyticsRoutes from './server/routes/analytics';
import { runNotificationChecks } from './server/services/notificationService';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const app = express();
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', userRoutes);

async function startServer() {
  let dbInitialized = false;
  try {
    await initDB();
    dbInitialized = true;
    await runNotificationChecks();
    setInterval(() => {
      runNotificationChecks().catch((error) => console.error('Notification check failed:', error));
    }, 5 * 60 * 1000);
  } catch (error) {
    console.error('Database initialization failed:', error);
  }

  app.get('/api/health', (req, res) => {
    res.json({ 
      status: dbInitialized ? 'ok' : 'db_error',
      database: dbInitialized ? 'connected' : 'disconnected'
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    if (!dbInitialized) {
      console.warn('WARNING: Server started without database connection.');
    }
  });
}

startServer();
