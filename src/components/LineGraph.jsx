// src/components/LineGraph.jsx

import React, { useMemo, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Line } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TimeScale);

function preserveExtremesEpochBuckets(points, bucketMs) {
  if (!points.length) return [];

  const sorted = [...points].sort((a, b) => a.timestamp - b.timestamp);
  const out = [];
  let i = 0;

  while (i < sorted.length) {
    const t0 = sorted[i].timestamp;
    const bucketIndex = Math.floor(t0 / bucketMs);
    const bucketEnd = (bucketIndex + 1) * bucketMs;

    const bucket = [];
    while (i < sorted.length && sorted[i].timestamp < bucketEnd) {
      bucket.push(sorted[i]);
      i++;
    }
    if (!bucket.length) continue;

    const first = bucket[0];
    const last = bucket[bucket.length - 1];

    let minP = bucket[0];
    let maxP = bucket[0];

    for (const p of bucket) {
      if (p.value < minP.value) minP = p;
      if (p.value > maxP.value) maxP = p;
    }

    const candidates = [first, minP, maxP, last]
      .sort((a, b) => a.timestamp - b.timestamp)
      .filter(
        (p, idx, arr) =>
          arr.findIndex((q) => q.timestamp === p.timestamp && q.value === p.value) === idx
      );

    out.push(...candidates);
  }

  return out;
}

export default function LineGraph({
  dataPoints,
  series = [],
  timeUnit,
  intervalMs,
  chartWidthPx = 900,
  desiredPxPerPoint = 10,
  nowMs,
  yAxis,
  onAutoYRange,
}) {
  const chartRef = useRef(null);

  useEffect(() => {
    return () => {
      try {
        chartRef.current?.destroy?.();
      } catch {
        // ignore
      }
    };
  }, []);

  const now = Number.isFinite(nowMs) ? nowMs : Date.now();
  const windowStart = now - intervalMs;

  const computed = useMemo(() => {
    // Horizontal padding: 1px
    const timePerPixel = intervalMs / chartWidthPx; // ms per pixel
    const horizontalPaddingMs = 1 * timePerPixel; // 1px -> ms

    const xMin = windowStart - horizontalPaddingMs;
    const xMax = now + horizontalPaddingMs;

    if (!series.length) {
      return { datasets: [], computedYMin: 0, computedYMax: 1, xMin, xMax, yTitle: "" };
    }

    const maxPoints = Math.max(10, Math.floor(chartWidthPx / desiredPxPerPoint));
    const bucketMs = Math.max(Math.floor(intervalMs / maxPoints), 1);

    const built = series.map((s) => {
      const raw = dataPoints
        .map((dp) => {
          const t = dp?.timestamp?.getTime?.() ?? 0;
          if (t < windowStart || t > now) return null;

          const v = s.valueAccessor(dp);
          if (v == null || Number.isNaN(v)) return null;

          return { timestamp: t, value: v };
        })
        .filter(Boolean);

      return { ...s, points: preserveExtremesEpochBuckets(raw, bucketMs) };
    });

    const allValues = built.flatMap((b) => b.points.map((p) => p.value));
    const rawMin = allValues.length ? Math.min(...allValues) : 0;
    const rawMax = allValues.length ? Math.max(...allValues) : 1;
    const range = rawMax - rawMin || 1;

    const computedYMin = Math.max(rawMin - range * 0.5, 0);
    const computedYMax = rawMax + range * 0.5;

    const datasets = built.map((b) => ({
      id: b.id ?? b.key ?? b.label,
      label: b.unit ? `${b.label} ${b.unit}` : b.label,
      data: b.points.map((p) => ({ x: p.timestamp, y: p.value })),
      borderColor: b.color,
      backgroundColor: `${b.color}33`,
      tension: b.tension ?? 0,
      cubicInterpolationMode: (b.tension ?? 0) > 0 ? "monotone" : "default",
      pointRadius: 0,
      borderWidth: b.thickness ?? 2,
      fill: false,
    }));

    const yTitle = built.map((s) => (s.unit ? `${s.label} ${s.unit}` : s.label)).join(", ");

    return { datasets, computedYMin, computedYMax, xMin, xMax, yTitle };
  }, [dataPoints, series, intervalMs, chartWidthPx, desiredPxPerPoint, windowStart, now]);

  const effectiveYMin =
    yAxis?.locked && Number.isFinite(yAxis?.min) ? yAxis.min : computed.computedYMin;
  const effectiveYMax =
    yAxis?.locked && Number.isFinite(yAxis?.max) ? yAxis.max : computed.computedYMax;

  useEffect(() => {
    if (typeof onAutoYRange !== "function") return;
    if (!Number.isFinite(computed.computedYMin) || !Number.isFinite(computed.computedYMax)) return;

    onAutoYRange(computed.computedYMin, computed.computedYMax);
  }, [computed.computedYMin, computed.computedYMax, onAutoYRange]);

  const chartData = useMemo(() => ({ datasets: computed.datasets }), [computed.datasets]);

  const options = useMemo(() => {
    const showSeconds = intervalMs < 3600_000; // show seconds if interval < 1 hour

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      parsing: false,
      normalized: true,
      plugins: {
        legend: { position: "top" },
        tooltip: { mode: "nearest", intersect: false },
      },
      scales: {
        x: {
          type: "time",
          offset: true,
          min: computed.xMin,
          max: computed.xMax,
          time: {
            unit: timeUnit,
            displayFormats: {
              second: showSeconds ? "HH:mm:ss" : "HH:mm",
              minute: showSeconds ? "HH:mm:ss" : "HH:mm",
              hour: "HH:mm",
              day: "HH:mm",
            },
            tooltipFormat: showSeconds ? "HH:mm:ss" : "HH:mm",
          },
          ticks: {
            maxTicksLimit: 6,
            callback: (value) =>
              new Date(value).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                second: showSeconds ? "2-digit" : undefined,
                hour12: false,
              }),
          },
          title: { display: true, text: "Time" },
        },
        y: {
          min: effectiveYMin,
          max: effectiveYMax,
          title: { display: !!computed.yTitle, text: computed.yTitle },
        },
      },
    };
  }, [computed.xMin, computed.xMax, computed.yTitle, effectiveYMin, effectiveYMax, timeUnit, intervalMs]);

  if (!series.length) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "grid",
          placeItems: "center",
          opacity: 0.7,
        }}
      >
        No graphs selected. Click + to add one.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Line ref={chartRef} data={chartData} options={options} datasetIdKey="id" />
    </div>
  );
}