import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Download, TrendingUp, Flame, Target } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isPdfCaptureMode, setIsPdfCaptureMode] = useState(false);

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

  const chartData = useMemo(
    () =>
      summary.chartData.map((point) => ({
        label: point.label,
        taskData: Number(point.taskData) || 0,
        habitData: Number(point.habitData) || 0
      })),
    [summary.chartData]
  );

  const handleDownloadPDF = async () => {
    const reportsContent = document.getElementById('reports-content');
    if (!reportsContent) {
      return;
    }

    try {
      setIsDownloadingPdf(true);
      setIsPdfCaptureMode(true);
      await new Promise((resolve) => window.requestAnimationFrame(() => resolve(null)));
      await new Promise((resolve) => window.setTimeout(resolve, 500));

      const canvas = await html2canvas(reportsContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imageWidth = pageWidth;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      let heightLeft = imageHeight;
      let position = 0;

      pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imageHeight;
        pdf.addPage();
        pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('VitaMind-Performance-Report.pdf');
    } catch (error) {
      console.error('Failed to generate PDF report', error);
    } finally {
      setIsPdfCaptureMode(false);
      setIsDownloadingPdf(false);
    }
  };

  const statCards = [
    { label: 'Task Efficiency', value: `${summary.taskEfficiency}%`, iconColor: '#4169e1', Icon: TrendingUp },
    { label: 'Habit Consistency', value: `${summary.habitConsistency}%`, iconColor: '#f97316', Icon: Flame },
    { label: 'Goal Achievement Rate', value: `${summary.goalAchievementRate}%`, iconColor: '#10b981', Icon: Target }
  ];

  return (
    <motion.div
      id="reports-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-[1200px] ml-0"
      style={isPdfCaptureMode ? { backgroundColor: '#FFFFFF', color: '#0F172A' } : undefined}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#191970]">Reports &amp; Insights</h2>
          <p className="text-sm text-gray-600">Track your weekly performance and behavior trends.</p>
        </div>
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPdf}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-royal text-white font-semibold hover:bg-[#3559c7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} /> {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF Report'}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-6 text-sm font-medium text-gray-600">Loading...</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-5"
            style={isPdfCaptureMode ? { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0', backdropFilter: 'none', color: '#0F172A' } : undefined}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500" style={isPdfCaptureMode ? { color: '#475569' } : undefined}>{card.label}</p>
              <card.Icon size={18} style={isPdfCaptureMode ? { color: card.iconColor } : undefined} className={isPdfCaptureMode ? undefined : card.iconColor === '#4169e1' ? 'text-royal' : card.iconColor === '#f97316' ? 'text-orange-500' : 'text-emerald-500'} />
            </div>
            <p className="text-3xl font-bold text-[#191970]" style={isPdfCaptureMode ? { color: '#0F172A' } : undefined}>{isLoading ? '--' : card.value}</p>
          </div>
        ))}
      </div>

      <div
        className="bg-white/40 backdrop-blur-xl border border-white/50 rounded-2xl p-5"
        style={isPdfCaptureMode ? { backgroundColor: '#f8fafc', borderColor: '#e5e7eb', backdropFilter: 'none' } : undefined}
      >
        <h3 className="text-base font-bold text-[#191970] mb-4">Performance Overview</h3>
        <div style={{ width: '100%', height: isPdfCaptureMode ? 350 : 320, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height={isPdfCaptureMode ? 350 : '100%'} minHeight={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'Habit Completion %') {
                    return [`${value}%`, name];
                  }

                  return [value, name];
                }}
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

      <div
        className="rounded-2xl border border-royal/20 bg-royal/5 px-5 py-4"
        style={isPdfCaptureMode ? { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1', color: '#0F172A' } : undefined}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-royal font-semibold mb-2" style={isPdfCaptureMode ? { color: '#1E3A8A' } : undefined}>
          Proactive Insight
        </p>
        <p className="text-sm md:text-base text-[#191970] font-medium" style={isPdfCaptureMode ? { color: '#0F172A' } : undefined}>{summary.aiInsight}</p>
      </div>
    </motion.div>
  );
}
