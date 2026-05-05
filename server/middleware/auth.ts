import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('DEBUG [AuthMiddleware]: Missing token');
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      console.log('DEBUG [AuthMiddleware]: Invalid token');
      return res.status(403).json({ error: 'Forbidden' });
    }
    req.user = user;
    console.log('DEBUG [AuthMiddleware]: Authenticated user', req.user?.id);
    next();
  });
};

export const requireRole = (role: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.sendStatus(401);
    
    try {
      const [rows]: any = await pool.query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      const user = rows[0];
      
      if (!user || user.role !== role) {
        return res.status(403).json({ error: `${role} access required` });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export const isAdmin = requireRole('admin');
