"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { useReducedMotion } from "framer-motion";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn, formatCompact, formatCurrency } from "@/lib/utils";
import { hasChartData } from "./chart-data";

export interface DashboardChartSeries {
  /** Key into each datum (e.g. "revenue"). */
  key: string;
  /** Human label shown in the legend + tooltip. */
  label: string;
  /** Optional explicit color; defaults to a rotating --chart-N CSS var. */
  color?: string;
}

export interface DashboardChartProps {
  type: "area" | "bar" | "line";
  /** Row-per-x-tick data. Each row holds the x value plus one value per series key. */
  data: Array<Record<string, string | number>>;
  /** Key into each datum for the x-axis category (e.g. "month"). */
  xKey: string;
  series: DashboardChartSeries[];
  title?: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
  /** Chart body height in px (excludes the card header). Defaults to 280. */
  height?: number;
  /** When true, the y-axis / tooltip render values as USD currency. */
  currency?: boolean;
}

/** Default palette wired to the themed chart CSS variables (see globals.css). */
const CHART_VARS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

function colorFor(series: DashboardChartSeries, index: number): string {
  return series.color ?? CHART_VARS[index % CHART_VARS.length];
}

function formatValue(value: number, currency: boolean): string {
  if (!Number.isFinite(value)) return "—";
  return currency ? formatCurrency(value) : formatCompact(value);
}

/** Dark-mode-friendly tooltip rendered into a bg-popover surface. */
function ChartTooltip({
  active,
  payload,
  label,
  currency,
  seriesLabels,
}: TooltipContentProps & {
  currency: boolean;
  seriesLabels: Record<string, string>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-36 rounded-lg border border-border bg-popover/95 px-3 py-2 text-xs shadow-xl ring-1 ring-foreground/5 backdrop-blur">
      <p className="mb-1.5 font-medium text-popover-foreground">{label}</p>
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const key = String(entry.dataKey ?? index);
          const numeric =
            typeof entry.value === "number"
              ? entry.value
              : Number(Array.isArray(entry.value) ? entry.value[0] : entry.value);
          return (
            <div
              key={key}
              className="flex items-center justify-between gap-4 text-muted-foreground"
            >
              <span className="flex items-center gap-1.5">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: entry.color }}
                  aria-hidden="true"
                />
                {seriesLabels[key] ?? entry.name ?? key}
              </span>
              <span className="font-medium tabular-nums text-popover-foreground">
                {formatValue(numeric, currency)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DashboardChart({
  type,
  data,
  xKey,
  series,
  title,
  description,
  className,
  height = 280,
  currency = false,
}: DashboardChartProps) {
  const gradientId = React.useId();
  // Honour prefers-reduced-motion: skip the chart entrance animation.
  const reduceMotion = useReducedMotion();

  const seriesLabels = React.useMemo(
    () => Object.fromEntries(series.map((s) => [s.key, s.label])),
    [series],
  );

  // Treat an all-zero dataset as empty: a brand-new account has 14 days of
  // {tasks: 0} (etc.), and a flat line hugging the axis reads as "broken" rather
  // than "nothing yet". Only render the chart once at least one real value exists.
  const hasData = hasChartData(data, series);

  const axisStyle = {
    fontSize: 11,
    fill: "var(--muted-foreground)",
  } as const;

  const renderChart = () => {
    const common = {
      data,
      margin: { top: 8, right: 8, left: -8, bottom: 0 },
    };

    const gridEl = (
      <CartesianGrid
        strokeDasharray="3 3"
        stroke="var(--border)"
        vertical={false}
      />
    );
    const xAxisEl = (
      <XAxis
        dataKey={xKey}
        tickLine={false}
        axisLine={false}
        tick={axisStyle}
        tickMargin={10}
        minTickGap={16}
      />
    );
    const yAxisEl = (
      <YAxis
        tickLine={false}
        axisLine={false}
        tick={axisStyle}
        tickMargin={8}
        width={48}
        tickFormatter={(value: number) => formatValue(Number(value), currency)}
      />
    );
    const tooltipEl = (
      <Tooltip
        cursor={{
          stroke: "var(--border)",
          strokeWidth: 1,
          fill: "var(--muted)",
          fillOpacity: 0.35,
        }}
        content={(props: TooltipContentProps) => (
          <ChartTooltip
            {...props}
            currency={currency}
            seriesLabels={seriesLabels}
          />
        )}
      />
    );

    if (type === "bar") {
      return (
        <BarChart {...common} barGap={4} barCategoryGap="22%">
          {gridEl}
          {xAxisEl}
          {yAxisEl}
          {tooltipEl}
          {series.map((s, index) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              fill={colorFor(s, index)}
              radius={[5, 5, 0, 0]}
              maxBarSize={48}
              isAnimationActive={!reduceMotion}
            />
          ))}
        </BarChart>
      );
    }

    if (type === "line") {
      return (
        <LineChart {...common}>
          {gridEl}
          {xAxisEl}
          {yAxisEl}
          {tooltipEl}
          {series.map((s, index) => {
            const color = colorFor(s, index);
            return (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduceMotion}
                activeDot={{
                  r: 4,
                  fill: color,
                  stroke: "var(--background)",
                  strokeWidth: 2,
                }}
              />
            );
          })}
        </LineChart>
      );
    }

    // area
    return (
      <AreaChart {...common}>
        <defs>
          {series.map((s, index) => {
            const color = colorFor(s, index);
            return (
              <linearGradient
                key={s.key}
                id={`${gradientId}-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            );
          })}
        </defs>
        {gridEl}
        {xAxisEl}
        {yAxisEl}
        {tooltipEl}
        {series.map((s, index) => {
          const color = colorFor(s, index);
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              fill={`url(#${gradientId}-${s.key})`}
              isAnimationActive={!reduceMotion}
              activeDot={{
                r: 4,
                fill: color,
                stroke: "var(--background)",
                strokeWidth: 2,
              }}
            />
          );
        })}
      </AreaChart>
    );
  };

  return (
    <Card className={cn("gap-0", className)}>
      {title || description ? (
        <CardHeader className="pb-4">
          {title ? <CardTitle>{title}</CardTitle> : null}
          {description ? <CardDescription>{description}</CardDescription> : null}
        </CardHeader>
      ) : null}

      <CardContent>
        {series.length > 1 ? (
          <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
            {series.map((s, index) => (
              <span
                key={s.key}
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: colorFor(s, index) }}
                  aria-hidden="true"
                />
                {s.label}
              </span>
            ))}
          </div>
        ) : null}

        {hasData ? (
          <div style={{ height }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
        ) : (
          <div
            style={{ height }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 text-center"
          >
            <LineChartIcon
              className="size-6 text-muted-foreground/60"
              aria-hidden="true"
            />
            <p className="text-sm text-muted-foreground">No data to display yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
