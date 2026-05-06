import { Router } from 'express';
import pool from '../db';
import { authenticateToken, isAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// --- Admin ---
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, email, name, role, is_active, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/users/:id/status', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const targetUserId = Number(req.params.id);
    const { is_active } = req.body;

    if (!Number.isFinite(targetUserId) || typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    if (targetUserId === req.user?.id && is_active === false) {
      return res.status(400).json({ error: 'You cannot deactivate your own admin account' });
    }

    const [targetRows]: any = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
    const targetUser = targetRows[0];
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin' && is_active === false) {
      const [adminRows]: any = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ? AND is_active = TRUE', ['admin']);
      if ((adminRows[0]?.count || 0) <= 1) {
        return res.status(400).json({ error: 'Cannot deactivate the last active admin' });
      }
    }

    await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, targetUserId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [userRows]: any = await pool.query('SELECT COUNT(*) as count FROM users');
    const [taskRows]: any = await pool.query('SELECT COUNT(*) as count FROM tasks');
    res.json({ users: userRows[0].count, tasks: taskRows[0].count });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', authenticateToken, isAdmin, async (req: AuthRequest, res) => {
  try {
    const targetUserId = Number(req.params.id);
    if (!Number.isFinite(targetUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (targetUserId === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own admin account' });
    }

    const [targetRows]: any = await pool.query('SELECT id, role FROM users WHERE id = ?', [targetUserId]);
    const targetUser = targetRows[0];
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.role === 'admin') {
      const [adminRows]: any = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = ?', ['admin']);
      if ((adminRows[0]?.count || 0) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account' });
      }
    }

    await pool.query('DELETE FROM users WHERE id = ?', [targetUserId]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
