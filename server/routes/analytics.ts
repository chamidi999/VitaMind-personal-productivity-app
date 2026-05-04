import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getAnalyticsSummary } from '../services/analyticsService';

const router = Router();

router.get('/summary', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const summary = await getAnalyticsSummary(userId);
    return res.json(summary);
  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
