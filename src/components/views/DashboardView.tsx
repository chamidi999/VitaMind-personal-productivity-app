import React, { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Plus,
  Calendar,
  CheckSquare,
  Target,
  Activity,
  ChevronRight,
  Flame,
  Clock,
  BrainCircuit,
  Sparkles,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardStats, Task, Habit, View, ContextSummary } from "../../types";

interface DashboardProps {
  stats: DashboardStats | null;
  tasks: Task[];
  habits: Habit[];
  contextSummary: ContextSummary | null;
  onViewChange: (view: View) => void;
  onAddTask: () => void;
  onEditTask: (task: Task) => void;
}

export default function DashboardView({
  stats,
  tasks,
  habits,
  contextSummary,
  onViewChange,
  onAddTask,
  onEditTask,
}: DashboardProps) {
  const [dailyInsight, setDailyInsight] = useState("Calibrating Oracle...");
  const [chartData, setChartData] = useState([
    { name: "Mon", completion: 0 },
    { name: "Tue", completion: 0 },
    { name: "Wed", completion: 0 },
    { name: "Thu", completion: 0 },
    { name: "Fri", completion: 0 },
    { name: "Sat", completion: 0 },
    { name: "Sun", completion: 0 },
  ]);

  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeHabits = Array.isArray(habits) ? habits : [];
  const safeStats = stats ?? {
    tasks: { total: 0, completed: 0 },
    habits: { active: 0 },
    goals: { total: 0 },
  };

  const activeTasks = safeTasks.filter((t) => t.status !== "completed");
  const habitCount = safeHabits.length;
  const goalCount = safeStats.goals.total;
  const normalizeCompletionDate = (value: string | Date | null) => {
    if (!value) return null;
    if (value instanceof Date && !isNaN(value.valueOf())) {
      return value.toISOString().slice(0, 10);
    }
    return String(value).split('T')[0].split(' ')[0];
  };

  const executedTodayCount = safeHabits.filter((habit) => {
    const completedDate = normalizeCompletionDate(habit.last_completed);
    return completedDate === new Date().toISOString().slice(0, 10);
  }).length;

  const highestStreak = useMemo(
    () => Math.max(0, ...safeHabits.map((h) => h.streak)),
    [safeHabits],
  );

  useEffect(() => {
    const loadInsight = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch("/api/oracle-daily-insight", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        const topHabit = contextSummary?.topHabits?.[0] ?? null;
        const daysToRecord = topHabit ? 7 - (topHabit.streak % 7 || 7) : null;
        const enhancedInsight =
          daysToRecord && daysToRecord <= 3 && topHabit?.name
            ? `You're ${daysToRecord} day(s) away from a Habit record on "${topHabit.name}". Keep it up.`
            : data.insight;
        setDailyInsight(
          enhancedInsight || "Complete one priority objective before noon.",
        );
      } catch (error) {
        setDailyInsight("Complete one priority objective before noon.");
      }
    };
    loadInsight();
  }, [contextSummary]);

  useEffect(() => {
    let isCancelled = false;

    const loadPerformance = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const response = await fetch("/api/habits/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;

        const history: Array<{ date: string; score: number }> =
          await response.json();
        const formatted = history.map((day) => ({
          name: new Date(`${day.date}T00:00:00`).toLocaleDateString("en-US", {
            weekday: "short",
          }),
          completion: day.score ?? 0,
        }));

        if (!isCancelled && formatted.length === 7) {
          setChartData(formatted);
        }
      } catch (error) {}
    };

    loadPerformance();
    return () => {
      isCancelled = true;
    };
  }, []);

  const priorityTone = (priority: string) => {
    const tone = priority.toLowerCase();
    if (tone === "high")
      return "bg-red-400 shadow-[0_0_14px_rgba(248,113,113,0.95)]";
    if (tone === "medium")
      return "bg-yellow-300 shadow-[0_0_14px_rgba(253,224,71,0.95)]";
    return "bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.9)]";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 max-w-full overflow-x-hidden"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="page-title mb-2">Welcome back, Strategist.</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            Your systems are performing at
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              92% efficiency
            </span>
            today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onViewChange("tasks")}
            className="h-11 bg-card text-royal hover:bg-royal/10 px-4 rounded-lg font-semibold text-sm sm:text-base transition-all border border-border flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Clock size={18} /> Focus Mode
          </button>
          <button
            onClick={onAddTask}
            className="btn-primary hover:bg-[#3559c7] text-sm sm:text-base"
          >
            <Plus size={18} /> New Objective
          </button>
        </div>
      </div>

      <div className="bg-card backdrop-blur-md border border-border rounded-3xl p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-card border border-border text-royal flex items-center justify-center">
            <BrainCircuit size={18} />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
              Oracle&apos;s Daily Insight
            </p>
            <p className="text-sm md:text-base text-foreground font-medium">
              {dailyInsight}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            id: "tasks",
            label: "Active Tasks",
            value: activeTasks.length,
            sub: `${stats?.tasks.completed || 0} completed`,
            icon: <CheckSquare className="text-royal" />,
            color: "from-royal/25 via-indigo-500/15",
          },
          {
            id: "habits",
            label: "Total Habits",
            value: habitCount,
            sub: executedTodayCount
              ? `${executedTodayCount} executed today`
              : "No habits executed today",
            icon: <Flame className="text-orange-500" />,
            color: "from-orange-500/25 via-amber-500/20",
          },
          {
            id: "goals",
            label: "Vision Goals",
            value: goalCount,
            sub: goalCount ? "Long-term tracks" : "No goals added yet",
            icon: <Target className="text-emerald-500" />,
            color: "from-emerald-500/25 via-cyan-500/15",
          },
          {
            id: "ai",
            label: "Mind State",
            value: "Flow",
            sub: "Optimal performance",
            icon: <BrainCircuit className="text-purple-500" />,
            color: "from-purple-500/25 via-fuchsia-500/20",
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6, scale: 1.015 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            onClick={() => onViewChange(stat.id as View)}
            className="stat-card"
          >
            <div
              className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${stat.color} to-transparent opacity-40 -mr-8 -mt-8 rounded-full blur-2xl group-hover:opacity-60 transition-opacity`}
            ></div>
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-foreground group-hover:text-royal transition-colors">
                  {stat.value}
                </h3>
              </div>
              <div className="bg-white/65 backdrop-blur-md p-3 rounded-2xl border border-white/50 group-hover:bg-white/80 transition-colors">
                {stat.icon}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 transition-colors">
              <Activity size={12} className="text-royal" /> {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card backdrop-blur-xl p-8 rounded-3xl border border-border shadow-[0_10px_35px_-20px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-foreground">
              System Performance
            </h3>
            <select className="bg-card border border-border rounded-lg text-xs px-3 py-1 outline-none text-muted-foreground">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div style={{ width: "100%", height: 300, minHeight: 300 }}>
            <ResponsiveContainer width="99%" height="100%" debounce={100}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="performanceGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.62} />
                    <stop offset="42%" stopColor="#6366f1" stopOpacity={0.45} />
                    <stop offset="72%" stopColor="#a855f7" stopOpacity={0.24} />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                  <filter
                    id="lineGlow"
                    x="-50%"
                    y="-50%"
                    width="200%"
                    height="200%"
                  >
                    <feGaussianBlur stdDeviation="3.2" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: "12px",
                    color: "#e5e7eb",
                    boxShadow: "0 10px 30px rgba(17, 24, 39, 0.45)",
                  }}
                  labelStyle={{ color: "#9ca3af", fontWeight: 600 }}
                  itemStyle={{ color: "#bfdbfe", fontSize: 12 }}
                  cursor={{ stroke: "#5b7dff", strokeOpacity: 0.28 }}
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#86a8ff"
                  strokeWidth={7}
                  fill="none"
                  filter="url(#lineGlow)"
                  dot={false}
                  isAnimationActive={false}
                />
                <Area
                  type="monotone"
                  dataKey="completion"
                  stroke="#5b7dff"
                  strokeWidth={3.4}
                  fillOpacity={1}
                  fill="url(#performanceGradient)"
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card backdrop-blur-xl p-8 rounded-3xl border border-border shadow-[0_10px_35px_-20px_rgba(15,23,42,0.6)]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">
              Priority Objectives
            </h3>
            <button
              onClick={() => onViewChange("tasks")}
              className="text-royal text-xs font-bold hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {activeTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                onClick={() => onEditTask(task)}
                className="flex items-center gap-4 group cursor-pointer rounded-2xl border border-transparent hover:border-white/40 hover:bg-white/40 transition-all px-2 py-1"
              >
                <div className="relative h-10 w-10 bg-royal/10 rounded-xl flex items-center justify-center text-royal group-hover:bg-royal/20 transition-colors">
                  <span
                    className={`absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full ${priorityTone(task.priority)}`}
                  />
                  <Calendar size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="font-semibold text-sm text-foreground truncate group-hover:text-royal transition-colors">
                    {task.title}
                  </h4>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                    {task.priority} Priority
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                />
              </div>
            ))}
            {activeTasks.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card py-8 px-4 text-center">
                <Sparkles className="mx-auto text-royal/70 mb-2" size={18} />
                <p className="text-sm text-foreground font-medium">
                  No active objectives
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  A quiet board means your execution engine is in sync.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
