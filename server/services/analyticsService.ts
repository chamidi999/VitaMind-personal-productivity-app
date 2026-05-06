import pool from '../db';

type DailyRow = { day: string; count: number };

type AnalyticsRangeSummary = {
  rangeDays: number;
  labels: string[];
  taskData: number[];
  habitData: number[];
  efficiencyRate: number;
  habitConsistency: number;
  completedTasks: number;
  totalTasks: number;
  successfulHabitStreaks: number;
  achievedGoals: number;
  aiInsight: string;
  raw: {
    startDate: string;
    endDate: string;
    dailyTaskCompletions: Array<{ date: string; completed: number }>;
    dailyHabitCompletionRate: Array<{ date: string; percentage: number }>;
  };
};

const formatLabel = (isoDate: string) => {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const isoDaysInRange = (rangeDays: number) => {
  return Array.from({ length: rangeDays }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (rangeDays - 1 - index));
    return date.toISOString().split('T')[0];
  });
};

const buildInsight = (current: AnalyticsRangeSummary, previousCompletedTasks: number) => {
  if (previousCompletedTasks === 0 && current.completedTasks === 0) {
    return 'No completed tasks recorded yet—try completing a few tasks this period to unlock trend insights.';
  }

  if (previousCompletedTasks === 0) {
    return `Great momentum: you completed ${current.completedTasks} tasks this period after a quiet previous period.`;
  }

  const change = ((current.completedTasks - previousCompletedTasks) / previousCompletedTasks) * 100;
  if (change >= 0) {
    return `You were ${Math.round(change)}% more productive this period than the previous one.`;
  }

  return `Productivity dipped by ${Math.abs(Math.round(change))}% compared with the previous period—consider a lighter, more focused plan.`;
};

const getPeriodSummary = async (userId: number, rangeDays: number): Promise<AnalyticsRangeSummary> => {
  const dates = isoDaysInRange(rangeDays);
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const [taskCompletionRows]: any = await pool.query(
    `SELECT date(COALESCE(completed_at, created_at)) as day, COUNT(*) as count
     FROM tasks
     WHERE user_id = ? AND status = 'completed' AND date(COALESCE(completed_at, created_at)) BETWEEN date(?) AND date(?)
     GROUP BY date(COALESCE(completed_at, created_at))`,
    [userId, startDate, endDate]
  );

  const [totalTaskRows]: any = await pool.query(
    `SELECT COUNT(*) as count FROM tasks
     WHERE user_id = ? AND date(created_at) BETWEEN date(?) AND date(?)`,
    [userId, startDate, endDate]
  );

  const [completedTaskRows]: any = await pool.query(
    `SELECT COUNT(*) as count FROM tasks
     WHERE user_id = ? AND status = 'completed' AND date(created_at) BETWEEN date(?) AND date(?)`,
    [userId, startDate, endDate]
  );

  const [habitCountRows]: any = await pool.query(
    'SELECT COUNT(*) as count FROM habits WHERE user_id = ?',
    [userId]
  );

  const [habitCompletionRows]: any = await pool.query(
    `SELECT completed_on as day, COUNT(DISTINCT habit_id) as count
     FROM habit_completions
     WHERE user_id = ? AND date(completed_on) BETWEEN date(?) AND date(?)
     GROUP BY completed_on`,
    [userId, startDate, endDate]
  );

  const [successfulStreakRows]: any = await pool.query(
    `SELECT COUNT(*) as count FROM habits
     WHERE user_id = ? AND streak > 0 AND date(last_completed) BETWEEN date(?) AND date(?)`,
    [userId, startDate, endDate]
  );

  const [goalCompletionRows]: any = await pool.query(
    `SELECT date(created_at) as day, COUNT(*) as count
     FROM goals
     WHERE user_id = ? AND status = 'completed' AND date(created_at) BETWEEN date(?) AND date(?)
     GROUP BY date(created_at)`,
    [userId, startDate, endDate]
  );

  const [milestoneCompletedRows]: any = await pool.query(
    `SELECT COUNT(*) as count
     FROM milestones m
     JOIN goals g ON g.id = m.goal_id
     WHERE g.user_id = ? AND m.is_completed = 1`,
    [userId]
  );

  const [totalMilestonesRows]: any = await pool.query(
    `SELECT COUNT(*) as count
     FROM milestones m
     JOIN goals g ON g.id = m.goal_id
     WHERE g.user_id = ?`,
    [userId]
  );

  const taskMap = new Map<string, number>((taskCompletionRows as DailyRow[]).map((row) => [row.day, Number(row.count)]));
  const habitMap = new Map<string, number>((habitCompletionRows as DailyRow[]).map((row) => [row.day, Number(row.count)]));
  const goalMap = new Map<string, number>((goalCompletionRows as DailyRow[]).map((row) => [row.day, Number(row.count)]));
  const totalHabits = Number(habitCountRows[0]?.count || 0);
  const totalMilestones = Number(totalMilestonesRows[0]?.count || 0);
  const completedMilestones = Number(milestoneCompletedRows[0]?.count || 0);
  const milestoneRate = totalMilestones > 0 ? Number(((completedMilestones / totalMilestones) * 100).toFixed(2)) : 0;

  const labels = dates.map(formatLabel);
  const taskData = dates.map((date) => taskMap.get(date) || 0);
  const habitData = dates.map((date) => {
    if (totalHabits === 0) return 0;
    return Math.round(((habitMap.get(date) || 0) / totalHabits) * 100);
  });
  const goalData = dates.map((date) => goalMap.get(date) || 0);
  const milestoneData = dates.map(() => milestoneRate);

  const completedTasks = Number(completedTaskRows[0]?.count || 0);
  const totalTasks = Number(totalTaskRows[0]?.count || 0);
  const efficiencyRate = totalTasks > 0 ? Number(((completedTasks / totalTasks) * 100).toFixed(2)) : 0;
  const habitConsistency = habitData.length > 0
    ? Number((habitData.reduce((sum, value) => sum + value, 0) / habitData.length).toFixed(2))
    : 0;

  return {
    rangeDays,
    labels,
    taskData,
    habitData,
    goalData,
    milestoneData,
    efficiencyRate,
    habitConsistency,
    completedTasks,
    totalTasks,
    successfulHabitStreaks: Number(successfulStreakRows[0]?.count || 0),
    achievedGoals: Number(achievedGoalRows[0]?.count || 0),
    milestoneCompletionRate: milestoneRate,
    completedMilestones,
    totalMilestones,
    aiInsight: '',
    raw: {
      startDate,
      endDate,
      dailyTaskCompletions: dates.map((date, idx) => ({ date, completed: taskData[idx] })),
      dailyHabitCompletionRate: dates.map((date, idx) => ({ date, percentage: habitData[idx] })),
      dailyGoalCompletions: dates.map((date, idx) => ({ date, completed: goalData[idx] })),
      milestoneCompletionRate: milestoneRate
    }
  };
};

export const getAnalyticsSummary = async (userId: number) => {
  const [weekly, monthly, previousWeekRows]: any = await Promise.all([
    getPeriodSummary(userId, 7),
    getPeriodSummary(userId, 30),
    pool.query(
      `SELECT COUNT(*) as count FROM tasks
       WHERE user_id = ? AND status = 'completed'
       AND DATE(created_at) BETWEEN DATE_SUB(CURDATE(), INTERVAL 13 DAY) AND DATE_SUB(CURDATE(), INTERVAL 7 DAY)`,
      [userId]
    )
  ]);

  const previousWeekCompleted = Number(previousWeekRows[0][0]?.count || 0);
  weekly.aiInsight = buildInsight(weekly, previousWeekCompleted);
  monthly.aiInsight = buildInsight(monthly, previousWeekCompleted);

  return {
    weekly,
    monthly,
    raw: {
      weekly: weekly.raw,
      monthly: monthly.raw
    }
  };
};
