import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import { Download, TrendingUp, Flame, Target } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

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

interface AnalyticsSummaryPayload extends Partial<AnalyticsSummary> {
  labels?: string[];
  taskData?: number[];
  habitData?: number[];
  goalData?: number[];
  milestoneData?: number[];
  efficiencyRate?: number;
  achievedGoals?: number;
}

interface AnalyticsApiResponse {
  weekly?: AnalyticsSummaryPayload;
  monthly?: AnalyticsSummaryPayload;
}

const isAnalyticsApiResponse = (
  data: AnalyticsSummaryPayload | AnalyticsApiResponse,
): data is AnalyticsApiResponse => {
  return (
    typeof data === "object" &&
    data !== null &&
    ("weekly" in data || "monthly" in data)
  );
};

const COLOR_PROPERTIES = [
  "color",
  "backgroundColor",
  "borderTopColor",
  "borderRightColor",
  "borderBottomColor",
  "borderLeftColor",
  "outlineColor",
  "textDecorationColor",
  "fill",
  "stroke",
  "caretColor",
  "columnRuleColor",
];

const clampColorChannel = (value: number) =>
  Math.min(255, Math.max(0, Math.round(value * 255)));

const parseOklchComponent = (component: string, isLightness = false) => {
  if (component === "none") return 0;

  if (component.endsWith("%")) {
    const percentage = Number.parseFloat(component);
    return Number.isFinite(percentage) ? percentage / 100 : 0;
  }

  const parsedValue = Number.parseFloat(component);
  if (!Number.isFinite(parsedValue)) return 0;

  return isLightness && parsedValue > 1 ? parsedValue / 100 : parsedValue;
};

const parseOklchHue = (hue: string) => {
  if (hue === "none") return 0;

  const parsedHue = Number.parseFloat(hue);
  if (!Number.isFinite(parsedHue)) return 0;

  if (hue.endsWith("rad")) return parsedHue * (180 / Math.PI);
  if (hue.endsWith("turn")) return parsedHue * 360;

  return parsedHue;
};

const convertOklchToRgb = (oklchColor: string) => {
  const match = oklchColor.match(/oklch\(([^)]+)\)/i);
  if (!match) return oklchColor;

  const [colorComponents, alphaComponent] = match[1]
    .split("/")
    .map((part) => part.trim());
  const [lightness = "0", chroma = "0", hue = "0"] =
    colorComponents.split(/\s+/);

  const l = parseOklchComponent(lightness, true);
  const c = parseOklchComponent(chroma);
  const h = parseOklchHue(hue) * (Math.PI / 180);
  const alpha = alphaComponent ? parseOklchComponent(alphaComponent) : 1;

  const a = c * Math.cos(h);
  const b = c * Math.sin(h);

  const long = l + 0.3963377774 * a + 0.2158037573 * b;
  const medium = l - 0.1055613458 * a - 0.0638541728 * b;
  const short = l - 0.0894841775 * a - 1.291485548 * b;

  const linearRed =
    4.0767416621 * long ** 3 -
    3.3077115913 * medium ** 3 +
    0.2309699292 * short ** 3;
  const linearGreen =
    -1.2684380046 * long ** 3 +
    2.6097574011 * medium ** 3 -
    0.3413193965 * short ** 3;
  const linearBlue =
    -0.0041960863 * long ** 3 -
    0.7034186147 * medium ** 3 +
    1.707614701 * short ** 3;

  const toSrgb = (channel: number) =>
    channel <= 0.0031308
      ? 12.92 * channel
      : 1.055 * channel ** (1 / 2.4) - 0.055;

  const red = clampColorChannel(toSrgb(linearRed));
  const green = clampColorChannel(toSrgb(linearGreen));
  const blue = clampColorChannel(toSrgb(linearBlue));

  return alpha < 1
    ? `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`
    : `rgb(${red}, ${green}, ${blue})`;
};

const replaceOklchColors = (colorValue: string) =>
  colorValue.replace(/oklch\([^)]+\)/gi, convertOklchToRgb);

const defaultSummary: AnalyticsSummary = {
  taskEfficiency: 0,
  habitConsistency: 0,
  goalAchievementRate: 0,
  milestoneCompletionRate: 0,
  aiInsight:
    "No proactive insight available yet. Complete more actions to unlock trends.",
  chartData: [],
};

export default function ReportsView() {
  const [summary, setSummary] = useState<AnalyticsSummary>(defaultSummary);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const pdfReportRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let isCancelled = false;

    const loadSummary = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/analytics/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) return;

        const data: AnalyticsSummaryPayload | AnalyticsApiResponse =
          await response.json();

        const normalizedData: AnalyticsSummaryPayload = isAnalyticsApiResponse(
          data,
        )
          ? (data.weekly ?? data.monthly ?? {})
          : data;

        const labels = normalizedData.labels ?? [];

        if (!isCancelled) {
          setSummary({
            ...defaultSummary,
            ...normalizedData,

            taskEfficiency:
              Number(
                normalizedData.taskEfficiency ?? normalizedData.efficiencyRate,
              ) || 0,

            goalAchievementRate:
              Number(
                normalizedData.goalAchievementRate ??
                  normalizedData.achievedGoals,
              ) || 0,

            milestoneCompletionRate:
              Number(normalizedData.milestoneCompletionRate) || 0,

            chartData:
              normalizedData.chartData ??
              labels.map((label, index) => ({
                label,
                taskData: Number(normalizedData.taskData?.[index]) || 0,
                habitData: Number(normalizedData.habitData?.[index]) || 0,
                goalData: Number(normalizedData.goalData?.[index]) || 0,
                milestoneData:
                  Number(normalizedData.milestoneData?.[index]) || 0,
              })),
          });
        }
      } catch (error) {
        console.error("Failed to load analytics summary", error);
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
        milestoneData: Number(point.milestoneData) || 0,
      })),
    [summary.chartData],
  );

  const handleDownloadPDF = async () => {
    const pdfContent = pdfReportRef.current;
    if (!pdfContent) return;

    try {
      setIsDownloadingPdf(true);

      await new Promise((resolve) => setTimeout(resolve, 800));

      const sanitizeColor = (value: string) =>
        value
          .replace(/oklch\([^)]+\)/gi, "#111827")
          .replace(/oklab\([^)]+\)/gi, "#111827");

      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        scrollX: 0,
        scrollY: 0,

        onclone: (clonedDocument: Document) => {
          const clonedWindow = clonedDocument.defaultView;
          const clonedPdfContent = clonedDocument.getElementById(
            "pdf-report-template",
          );

          if (!clonedWindow || !clonedPdfContent) return;

          const style = clonedDocument.createElement("style");
          style.innerHTML = `
          html, body {
            background: #ffffff !important;
            color: #111827 !important;
          }

          * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            color-scheme: light !important;
          }

          #pdf-report-template {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 1100px !important;
            min-height: auto !important;
            background: #ffffff !important;
            color: #111827 !important;
          }

          .recharts-wrapper,
          .recharts-responsive-container,
          .recharts-surface {
            min-height: 360px !important;
            overflow: visible !important;
          }
        `;
          clonedDocument.head.appendChild(style);

          const allElements = [
            clonedDocument.documentElement,
            clonedDocument.body,
            clonedPdfContent,
            ...Array.from(clonedPdfContent.querySelectorAll("*")),
          ] as HTMLElement[];

          allElements.forEach((element: HTMLElement) => {
            const computedStyle = clonedWindow.getComputedStyle(element);

            for (let i = 0; i < computedStyle.length; i++) {
              const propertyName = computedStyle[i];
              const propertyValue =
                computedStyle.getPropertyValue(propertyName);

              if (
                propertyValue &&
                (propertyValue.includes("oklch(") ||
                  propertyValue.includes("oklab("))
              ) {
                element.style.setProperty(
                  propertyName,
                  sanitizeColor(propertyValue),
                  "important",
                );
              }
            }
          });
        },
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = margin;

      pdf.addImage(imageData, "PNG", margin, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - margin * 2;

      while (heightLeft > 0) {
        pdf.addPage();
        position = heightLeft - imgHeight + margin;
        pdf.addImage(imageData, "PNG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - margin * 2;
      }

      pdf.save("VitaMind-Performance-Report.pdf");
    } catch (error) {
      console.error("Failed to generate PDF report", error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const statCards = [
    {
      label: "Task Efficiency",
      value: `${summary.taskEfficiency}%`,
      iconColor: "#4169e1",
      Icon: TrendingUp,
    },
    {
      label: "Habit Consistency",
      value: `${summary.habitConsistency}%`,
      iconColor: "#f97316",
      Icon: Flame,
    },
    {
      label: "Goal Achievement Rate",
      value: `${summary.goalAchievementRate}%`,
      iconColor: "#10b981",
      Icon: Target,
    },
    {
      label: "Milestone Progress",
      value: `${summary.milestoneCompletionRate}%`,
      iconColor: "#8b5cf6",
      Icon: Target,
    },
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
          <h2 className="text-2xl font-bold text-foreground">
            Reports &amp; Insights
          </h2>
          <p className="text-sm text-muted-foreground">
            Track your weekly performance and behavior trends.
          </p>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={isDownloadingPdf}
          className="no-pdf inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-royal text-white font-semibold hover:bg-[#3559c7] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Download size={16} />
          {isDownloadingPdf ? "Generating PDF..." : "Download PDF Report"}
        </button>
      </div>
      <div className="pdf-only hidden">
        <h1>VitaMind Weekly Performance Report</h1>

        <p>
          This report summarizes your weekly performance and behavior trends
          based on completed tasks, habit consistency, goal achievement, and
          milestone progress.
        </p>

        <div>
          <p>
            <strong>Task Efficiency:</strong> {summary.taskEfficiency}%
          </p>
          <p>
            <strong>Habit Consistency:</strong> {summary.habitConsistency}%
          </p>
          <p>
            <strong>Goal Achievement Rate:</strong>{" "}
            {summary.goalAchievementRate}%
          </p>
          <p>
            <strong>Milestone Progress:</strong>{" "}
            {summary.milestoneCompletionRate}%
          </p>
        </div>

        <p>
          <strong>Summary Insight:</strong> {summary.aiInsight}
        </p>
      </div>
      {isLoading ? (
        <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 text-sm font-medium text-muted-foreground">
          Loading...
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-card backdrop-blur-xl border border-border rounded-2xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </p>
              <card.Icon
                size={18}
                className={
                  card.iconColor === "#4169e1"
                    ? "text-royal"
                    : card.iconColor === "#f97316"
                      ? "text-orange-500"
                      : "text-emerald-500"
                }
              />
            </div>
            <p className="text-3xl font-bold text-foreground">
              {isLoading ? "--" : card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-5">
        <h3 className="text-base font-bold text-foreground mb-4">
          Performance Overview
        </h3>

        <div style={{ width: "100%", height: 320, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%" minHeight={300}>
            <ComposedChart
              data={chartData}
              margin={{ top: 10, right: 12, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis yAxisId="left" tick={{ fill: "#6b7280", fontSize: 12 }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                domain={[0, 100]}
              />
              <Tooltip
                formatter={(value: any, name: any) => {
                  const displayValue = value ?? "";
                  return name.includes("%")
                    ? [`${displayValue}%`, name]
                    : [displayValue, name];
                }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  backgroundColor: "#ffffff",
                }}
              />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="taskData"
                name="Completed Tasks"
                fill="#4169e1"
                radius={[8, 8, 0, 0]}
              />
              <Bar
                yAxisId="left"
                dataKey="goalData"
                name="Completed Goals"
                fill="#10b981"
                radius={[8, 8, 0, 0]}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="habitData"
                name="Habit Completion %"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 3 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="milestoneData"
                name="Milestone Progress %"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 3 }}
                strokeDasharray="5 5"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-royal/20 bg-royal/5 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.2em] text-royal font-semibold mb-2">
          Proactive Insight
        </p>
        <p className="text-sm md:text-base text-foreground font-medium">
          {summary.aiInsight}
        </p>
      </div>
      <div
        ref={pdfReportRef}
        id="pdf-report-template"
        className="fixed -left-[9999px] top-0 w-[1100px] bg-white text-[#111827] p-10"
      >
        <div className="border-b border-gray-200 pb-6 mb-6">
          <h1 className="text-3xl font-bold text-[#15167a]">
            VitaMind - Performance Report
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Track your weekly performance and behavior trends.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-[#15167a] mb-4">
            Performance Summary
          </h2>

          <table className="w-full border-collapse text-sm">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold">Task Efficiency</td>
                <td className="py-3 text-right">{summary.taskEfficiency}%</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold">Habit Consistency</td>
                <td className="py-3 text-right">{summary.habitConsistency}%</td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold">Goal Achievement Rate</td>
                <td className="py-3 text-right">
                  {summary.goalAchievementRate}%
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-3 font-semibold">Milestone Progress</td>
                <td className="py-3 text-right">
                  {summary.milestoneCompletionRate}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-gray-200 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-[#15167a] mb-4">
            Performance Overview
          </h2>

          <div style={{ width: "100%", height: 360 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#6b7280", fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="taskData"
                  name="Completed Tasks"
                  fill="#4169e1"
                />
                <Bar
                  yAxisId="left"
                  dataKey="goalData"
                  name="Completed Goals"
                  fill="#10b981"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="habitData"
                  name="Habit Completion %"
                  stroke="#f97316"
                  strokeWidth={3}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="milestoneData"
                  name="Milestone Progress %"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="text-xl font-bold text-[#15167a] mb-3">AI Insights</h2>
          <p className="text-sm leading-7 text-gray-700">{summary.aiInsight}</p>
        </div>
      </div>
    </motion.div>
  );
}
