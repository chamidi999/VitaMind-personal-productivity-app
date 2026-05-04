import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Download, TrendingUp, Flame, Target } from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface AnalyticsPoint {
  label: string;
  taskData: number;
  habitData: number;
}

interface AnalyticsSummary {
  taskEfficiency: number;
  habitConsistency: number;
  goalAchievementRate: number;
  aiInsight: string;
  chartData: AnalyticsPoint[];
}

const defaultSummary: AnalyticsSummary = {
  taskEfficiency: 0,
  habitConsistency: 0,
  goalAchievementRate: 0,
  aiInsight: 'No proactive insight available yet. Complete more actions to unlock trends.',
  chartData: []
};

export default function ReportsView() {
  const [summary, setSummary] = useState<AnalyticsSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    const loadSummary = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch('/api/analytics/summary', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
          return;
        }

        const data: AnalyticsSummary = await response.json();
        if (!isCancelled) {
          setSummary({ ...defaultSummary, ...data, chartData: data.chartData || [] });
        }
      } catch (error) {
        console.error('Failed to load analytics summary', error);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadSummary();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleDownloadPdf = () => {
    console.log('Generating PDF...');
  };

  const statCards = [
    { label: 'Task Efficiency', value: `${summary.taskEfficiency}%`, icon: <TrendingUp className="text-royal" size={18} /> },
    { label: 'Habit Consistency', value: `${summary.habitConsistency}%`, icon: <Flame className="text-orange-500" size={18} /> },
    { label: 'Goal Achievement Rate', value: `${summary.goalAchievementRate}%`, icon: <Target className="text-emerald-500" size={18} /> }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1200px] ml-0"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191970]">Reports &amp; Insights</h2>
          <p className="text-sm text-gray-600">Track your weekly performance and behavior trends.</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-royal text-white font-semibold hover:bg-[#3559c7] transition-colors"
        >
          <Download size={16} /> Download PDF Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">{card.label}</p>
              {card.icon}
            </div>
            <p className="text-3xl font-bold text-[#191970]">{isLoading ? '--' : card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-5">
        <h3 className="text-base font-bold text-[#191970] mb-4">Performance Overview</h3>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={summary.chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  backgroundColor: '#ffffff'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="taskData" name="Completed Tasks" fill="#4169e1" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="habitData" name="Habit Completion %" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-royal/20 bg-royal/5 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-royal font-semibold mb-2">Proactive Insight</p>
        <p className="text-sm md:text-base text-[#191970] font-medium">{summary.aiInsight}</p>
      </div>
    </motion.div>
  );
}
