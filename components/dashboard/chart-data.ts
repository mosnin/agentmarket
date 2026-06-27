/**
 * True when a chart dataset has at least one real (non-zero, finite numeric)
 * value across its series. A brand-new account has rows of all-zero metrics
 * (e.g. 14 days of `{ tasks: 0 }`); treating that as "no data" lets
 * `DashboardChart` show an explicit empty state instead of a flat line hugging
 * the axis. Pure — no Recharts — so it's unit-testable on its own.
 */
export function hasChartData(
  data: Array<Record<string, string | number>>,
  series: { key: string }[],
): boolean {
  return (
    data.length > 0 &&
    series.length > 0 &&
    data.some((row) =>
      series.some((s) => {
        const value = row[s.key];
        return typeof value === "number" && Number.isFinite(value) && value !== 0;
      }),
    )
  );
}
