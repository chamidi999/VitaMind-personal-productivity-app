import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  goalData: number;
  milestoneData: number;
}

interface AnalyticsSummary {
  taskEfficiency: number;
  habitConsistency: number;
  goalAchievementRate: number;
  milestoneCompletionRate: number;
  aiInsight: string;
  chartData: AnalyticsPoint[];
}

interface AnalyticsApiResponse {
  weekly?: AnalyticsSummaryPayload;
  monthly?: AnalyticsSummaryPayload;
}

interface AnalyticsSummaryPayload extends Partial<AnalyticsSummary> {
  labels?: string[];
  taskData?: number[];
  habitData?: number[];
  goalData?: number[];
  milestoneData?: number[];
  efficiencyRate?: number;
  achievedGoals?: number;
  milestoneCompletionRate?: number;
}


const COLOR_PROPERTIES = [
  'color',
  'backgroundColor',
  'borderTopColor',
  'borderRightColor',
  'borderBottomColor',
  'borderLeftColor',
  'outlineColor',
  'textDecorationColor',
  'fill',
  'stroke',
  'caretColor',
  'columnRuleColor'
];

const clampColorChannel = (value: number) => Math.min(255, Math.max(0, Math.round(value * 255)));

const parseOklchComponent = (component: string, isLightness = false) => {
  if (component === 'none') {
    return 0;
  }

  if (component.endsWith('%')) {
    const percentage = Number.parseFloat(component);
    return Number.isFinite(percentage) ? percentage / 100 : 0;
  }

  const parsedValue = Number.parseFloat(component);
  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return isLightness && parsedValue > 1 ? parsedValue / 100 : parsedValue;
};

const parseOklchHue = (hue: string) => {
  if (hue === 'none') {
    return 0;
  }

  const parsedHue = Number.parseFloat(hue);
  if (!Number.isFinite(parsedHue)) {
    return 0;
  }

  if (hue.endsWith('rad')) {
    return parsedHue * (180 / Math.PI);
  }

  if (hue.endsWith('turn')) {
    return parsedHue * 360;
  }

  return parsedHue;
};

const convertOklchToRgb = (oklchColor: string) => {
  const match = oklchColor.match(/oklch\(([^)]+)\)/i);
  if (!match) {
    return oklchColor;
  }

  const [colorComponents, alphaComponent] = match[1].split('/').map((part) => part.trim());
  const [lightness = '0', chroma = '0', hue = '0'] = colorComponents.split(/\s+/);
  const l = parseOklchComponent(lightness, true);
  const c = parseOklchComponent(chroma);
  const h = parseOklchHue(hue) * (Math.PI / 180);
  const alpha = alphaComponent ? parseOklchComponent(alphaComponent) : 1;

  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const long = l + 0.3963377774 * a + 0.2158037573 * b;
  const medium = l - 0.1055613458 * a - 0.0638541728 * b;
  const short = l - 0.0894841775 * a - 1.291485548 * b;

  const longCubed = long ** 3;
  const mediumCubed = medium ** 3;
  const shortCubed = short ** 3;

  const linearRed = 4.0767416621 * longCubed - 3.3077115913 * mediumCubed + 0.2309699292 * shortCubed;
  const linearGreen = -1.2684380046 * longCubed + 2.6097574011 * mediumCubed - 0.3413193965 * shortCubed;
  const linearBlue = -0.0041960863 * longCubed - 0.7034186147 * mediumCubed + 1.707614701 * shortCubed;

  const toSrgb = (channel: number) => (
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * (channel ** (1 / 2.4)) - 0.055
  );

  const red = clampColorChannel(toSrgb(linearRed));
  const green = clampColorChannel(toSrgb(linearGreen));
  const blue = clampColorChannel(toSrgb(linearBlue));

  if (alpha < 1) {
    return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
  }

  return `rgb(${red}, ${green}, ${blue})`;
};

const replaceOklchColors = (colorValue: string) => colorValue.replace(/oklch\([^)]+\)/gi, convertOklchToRgb);

const defaultSummary: AnalyticsSummary = {
  taskEfficiency: 0,
  habitConsistency: 0,
  goalAchievementRate: 0,
  milestoneCompletionRate: 0,
  aiInsight: 'No proactive insight available yet. Complete more actions to unlock trends.',
  chartData: []
};

export default function ReportsView() {
  const [summary, setSummary] = useState<AnalyticsSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

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

        const data: AnalyticsSummaryPayload | AnalyticsApiResponse = await response.json();
        const normalizedData = 'weekly' in data
          ? data.weekly || defaultSummary
          : data;

        if (!isCancelled) {
          setSummary({
            ...defaultSummary,
            ...normalizedData,
            taskEfficiency: Number(normalizedData?.taskEfficiency ?? normalizedData?.efficiencyRate) || 0,
            goalAchievementRate: Number(normalizedData?.goalAchievementRate ?? normalizedData?.achievedGoals) || 0,
            milestoneCompletionRate: Number(normalizedData?.milestoneCompletionRate) || 0,
            chartData:
              normalizedData?.chartData ||
              normalizedData?.labels?.map((label, index) => ({
                label,
                taskData: Number(normalizedData?.taskData?.[index]) || 0,
                habitData: Number(normalizedData?.habitData?.[index]) || 0,
                goalData: Number(normalizedData?.goalData?.[index]) || 0,
                milestoneData: Number(normalizedData?.milestoneData?.[index]) || 0
              })) ||
              []
          });
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
        habitData: Number(point.habitData) || 0,
        goalData: Number(point.goalData) || 0,
        milestoneData: Number(point.milestoneData) || 0
      })),
    [summary.chartData]
  );

  const handleDownloadPDF = async () => {
    const reportsContent = reportRef.current;
    if (!reportsContent) {
      console.error('Reports content is not available for PDF export');
      return;
    }

    try {
      setIsDownloadingPdf(true);
      const canvas = await html2canvas(reportsContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element: { classList: { contains: (arg0: string) => any; }; }) => element.classList.contains('no-pdf'),
        onclone: (clonedDocument: Document) => {
          const clonedReportsContent = clonedDocument.getElementById('reports-content');
          if (!clonedReportsContent) {
            return;
          }

          const clonedWindow = clonedDocument.defaultView;
          if (!clonedWindow) {
            return;
          }

          const clonedElements = [clonedReportsContent, ...Array.from(clonedReportsContent.querySelectorAll('*'))] as HTMLElement[];

          clonedElements.forEach((element) => {
            const computedStyle = clonedWindow.getComputedStyle(element);

            COLOR_PROPERTIES.forEach((property) => {
              const propertyValue = computedStyle[property as any];
              if (typeof propertyValue === 'string' && propertyValue.includes('oklch(')) {
                element.style[property as any] = replaceOklchColors(propertyValue);
              }
            });
          });
        }
      });

      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const scaledImageWidth = printableWidth;
      const scaledImageHeight = (canvas.height * scaledImageWidth) / canvas.width;
      const offsetX = (pageWidth - scaledImageWidth) / 2;

      let heightLeft = scaledImageHeight;
      let offsetY = margin;

      pdf.addImage(imageData, 'PNG', offsetX, offsetY, scaledImageWidth, scaledImageHeight);
      heightLeft -= printableHeight;

      while (heightLeft > 0) {
        pdf.addPage();
        offsetY = margin - (scaledImageHeight - heightLeft);
        pdf.addImage(imageData, 'PNG', offsetX, offsetY, scaledImageWidth, scaledImageHeight);
        heightLeft -= printableHeight;
      }

      pdf.save('VitaMind-Performance-Report.pdf');
    } catch (error) {
      console.error('Failed to generate PDF report', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const statCards = [
    { label: 'Task Efficiency', value: `${summary.taskEfficiency}%`, iconColor: '#4169e1', Icon: TrendingUp },
    { label: 'Habit Consistency', value: `${summary.habitConsistency}%`, iconColor: '#f97316', Icon: Flame },
    { label: 'Goal Achievement Rate', value: `${summary.goalAchievementRate}%`, iconColor: '#10b981', Icon: Target },
    { label: 'Milestone Progress', value: `${summary.milestoneCompletionRate}%`, iconColor: '#8b5cf6', Icon: Target }
  ];

  return (
    <motion.div
      ref={reportRef}
      id="reports-content"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-300 ml-0"
    >

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports &amp; Insights</h2>
          <p className="text-sm text-muted-foreground">Track your weekly performance and behavior trends.</p>
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
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 text-sm font-medium text-muted-foreground">Loading...</div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card backdrop-blur-xl border border-border rounded-2xl p-5"

          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              <card.Icon size={18} className={card.iconColor === '#4169e1' ? 'text-royal' : card.iconColor === '#f97316' ? 'text-orange-500' : 'text-emerald-500'} />
            </div>
            <p className="text-3xl font-bold text-foreground">{isLoading ? '--' : card.value}</p>
          </div>
        ))}
      </div>

      <div
        className="bg-card backdrop-blur-xl border border-border rounded-2xl p-5"
      >
        <h3 className="text-base font-bold text-foreground mb-4">Performance Overview</h3>
        <div style={{ width: '100%', height: 320, minHeight: 300 }}>
          <ResponsiveContainer width='100%' height='100%' minHeight={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#6b7280', fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const displayValue = value ?? '';
                  if (name.includes('%')) {
                    return [`${displayValue}%`, name];
                  }

                  return [displayValue, name];
                }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                  backgroundColor: '#ffffff'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="taskData" name="Completed Tasks" fill="#4169e1" radius={[8, 8, 0, 0]} />
              <Bar yAxisId="left" dataKey="goalData" name="Completed Goals" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="habitData" name="Habit Completion %" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="milestoneData" name="Milestone Progress %" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div
        className="rounded-2xl border border-royal/20 bg-royal/5 px-5 py-4"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-royal font-semibold mb-2">
          Proactive Insight
        </p>
        <p className="text-sm md:text-base text-foreground font-medium">{summary.aiInsight}</p>
      </div>
    </motion.div>
  );
}
