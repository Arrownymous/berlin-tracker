"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from "chart.js";
import { fmtPace, nf0, nf1 } from "@/lib/dates";
import { GOAL_PACE } from "@/lib/goal";

Chart.register(BarController, BarElement, CategoryScale, Filler, LinearScale, LineController, LineElement, PointElement, Tooltip);

type Colors = Record<"ink" | "ink3" | "line" | "accent" | "plan" | "loss" | "gain" | "surface", string>;

function readColors(): Colors {
  const cs = getComputedStyle(document.documentElement);
  const v = (n: string) => cs.getPropertyValue(n).trim();
  Chart.defaults.font.family = getComputedStyle(document.body).fontFamily;
  Chart.defaults.font.size = 11;
  return { ink: v("--ink"), ink3: v("--ink-3"), line: v("--line"), accent: v("--accent"), plan: v("--plan"), loss: v("--loss"), gain: v("--gain"), surface: v("--surface") };
}

/** Leest de kleuren uit de CSS-variabelen zodra het font geladen is. */
function useColors() {
  const [c, setC] = useState<Colors | null>(null);
  useEffect(() => {
    let live = true;
    setC(readColors());
    document.fonts?.ready.then(() => live && setC(readColors()));
    return () => { live = false; };
  }, []);
  return c;
}

function useChart(cfg: ChartConfiguration | null) {
  const ref = useRef<HTMLCanvasElement>(null);
  const chart = useRef<Chart | null>(null);
  useEffect(() => {
    if (!ref.current || !cfg) return;
    if (chart.current) {
      chart.current.data = cfg.data;
      chart.current.options = cfg.options ?? {};
      chart.current.update();
    } else {
      chart.current = new Chart(ref.current, cfg);
    }
  }, [cfg]);
  useEffect(() => () => chart.current?.destroy(), []);
  return ref;
}

const tooltip = (c: Colors) => ({
  backgroundColor: c.ink,
  titleColor: c.surface,
  bodyColor: c.surface,
  padding: 12,
  cornerRadius: 2,
  displayColors: false,
  titleFont: { weight: 700 as const },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: (ctx: any) =>
      `${ctx.dataset.label}: ${ctx.parsed.y == null ? "–" : nf1.format(ctx.parsed.y) + (ctx.dataset.yAxisID === "y2" ? "" : " km")}`,
  },
});

/** Index van de laatste waarde, voor een eindpunt op de lijn. */
const lastIdx = (a: (number | null)[]) => a.reduce<number>((acc, v, i) => (v == null ? acc : i), -1);

export function CumulativeChart({ labels, plan, actual }: { labels: string[]; plan: number[]; actual: (number | null)[] }) {
  const c = useColors();
  const last = lastIdx(actual);
  const cfg: ChartConfiguration | null = c
    ? {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Gelopen", data: actual, borderColor: c.accent, backgroundColor: c.accent + "14", fill: "origin", borderWidth: 2, tension: 0.25,
              pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === last ? 4 : 0), pointBackgroundColor: c.accent, pointBorderWidth: 0,
            },
            { label: "Plan", data: plan, borderColor: c.ink3, borderDash: [4, 4], borderWidth: 1.25, pointRadius: 0, tension: 0.25, fill: false },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 500 },
          plugins: { legend: { display: false }, tooltip: tooltip(c) },
          scales: {
            x: { grid: { display: false }, border: { color: c.ink }, ticks: { maxTicksLimit: 6, maxRotation: 0, color: c.ink3 } },
            y: { position: "right", grid: { color: c.line }, border: { display: false }, ticks: { color: c.ink3, padding: 8, callback: (v) => nf0.format(Number(v)) + " km" } },
          },
        },
      }
    : null;
  const ref = useChart(cfg);
  return <canvas ref={ref} aria-label="Cumulatieve kilometers, plan tegenover werkelijk" />;
}

export function WeeklyChart({ labels, plan, actual }: { labels: string[]; plan: number[]; actual: (number | null)[] }) {
  const c = useColors();
  const cfg: ChartConfiguration | null = c
    ? {
        type: "bar",
        data: {
          labels,
          datasets: [
            { type: "bar", label: "Plan", data: plan, backgroundColor: c.plan + "99", borderRadius: 0, grouped: false, order: 3, barPercentage: 0.8 },
            { type: "bar", label: "Gelopen", data: actual, backgroundColor: c.accent, borderRadius: 0, grouped: false, order: 2, barPercentage: 0.45 },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 400 },
          plugins: { legend: { display: false }, tooltip: tooltip(c) },
          scales: {
            x: { grid: { display: false }, border: { color: c.ink }, ticks: { maxTicksLimit: 8, maxRotation: 0, color: c.ink3 } },
            y: { grid: { color: c.line }, border: { display: false }, ticks: { color: c.ink3, maxTicksLimit: 6, callback: (v) => v + " km" } },
          },
        },
      }
    : null;
  const ref = useChart(cfg);
  return <canvas ref={ref} aria-label="Weekvolume per week: gepland tegenover gelopen" />;
}

export function PaceChart({ labels, pace, ef }: { labels: string[]; pace: (number | null)[]; ef?: (number | null)[] }) {
  const c = useColors();
  const hasEf = !!ef && ef.some((v) => v != null);
  const cfg: ChartConfiguration | null = c
    ? {
        type: "line",
        data: {
          labels,
          datasets: [
            {
              label: "Doel", data: labels.map(() => GOAL_PACE), borderColor: c.loss, borderDash: [5, 4], borderWidth: 1.25,
              pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0,
            },
            { label: "Tempo", data: pace, borderColor: c.ink, backgroundColor: c.ink, fill: false, borderWidth: 1.75, pointRadius: 2.5, spanGaps: true, tension: 0.25 },
            ...(hasEf
              ? [
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  { label: "Efficiëntie", data: ef, yAxisID: "y2", borderColor: c.accent, backgroundColor: c.accent, borderWidth: 1.75, pointRadius: 2.5, spanGaps: true, tension: 0.25 } as any,
                ]
              : []),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 400 },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: c.ink,
              titleColor: c.surface,
              bodyColor: c.surface,
              padding: 12,
              cornerRadius: 2,
              displayColors: false,
              callbacks: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                label: (ctx: any) =>
                  ctx.parsed.y == null
                    ? "–"
                    : ctx.dataset.yAxisID === "y2"
                    ? `Efficiëntie: ${nf1.format(ctx.parsed.y)} (rustige lopen)`
                    : ctx.dataset.label === "Doel"
                    ? `Doeltempo: ${fmtPace(ctx.parsed.y)} /km`
                    : `Tempo: ${fmtPace(ctx.parsed.y)} /km`,
              },
            },
          },
          scales: {
            x: { grid: { display: false }, border: { color: c.ink }, ticks: { maxTicksLimit: 8, maxRotation: 0, color: c.ink3 } },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            y: { reverse: true, grid: { color: c.line }, border: { display: false }, ticks: { color: c.ink3, callback: (v: any) => fmtPace(Number(v)) } },
            ...(hasEf
              ? {
                  y2: {
                    position: "right",
                    grid: { display: false },
                    border: { display: false },
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ticks: { color: c.ink3, callback: (v: any) => nf1.format(Number(v)) },
                  },
                }
              : {}),
          },
        },
      }
    : null;
  const ref = useChart(cfg);
  return <canvas ref={ref} aria-label="Tempo per week, en efficiëntie op rustige lopen als hartslagdata beschikbaar is" />;
}
