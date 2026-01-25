// src/hooks/useChartPanels.js

import { useMemo, useState } from "react";
import { CHART_KEYS, SERIES_CATALOG } from "../config/seriesCatalog";

function createChartPanel() {
  return {
    id: globalThis.crypto?.randomUUID?.() ?? String(Date.now() + Math.random()),
    selectedSeries: [], // [{ key, color, tension, thickness }]
    pendingAddKey: CHART_KEYS[0] ?? "",

    // Track latest auto-computed Y range (reported from LineGraph)
    currentYMin: null,
    currentYMax: null,

    // Y-axis lock (captured snapshot)
    lockYAxis: false,
    lockedYMin: null,
    lockedYMax: null,
  };
}

function computeAddableKeys(panel) {
  const selected = new Set(panel.selectedSeries.map((s) => s.key));
  return CHART_KEYS.filter((k) => !selected.has(k));
}

/*
* Chart panels state machine:
* - multiple independent charts
* - each chart: add/remove series + per-series color/tension/thickness
* - per-chart: lock Y axis
*/
export default function useChartPanels({ startEmpty = true, insertAtTop = true } = {}) {
  const [charts, setCharts] = useState(() => (startEmpty ? [] : [createChartPanel()]));

  const actions = useMemo(() => {
    function addChart() {
      setCharts((prev) =>
        insertAtTop ? [createChartPanel(), ...prev] : [...prev, createChartPanel()]
      );
    }

    function removeChart(chartId) {
      setCharts((prev) => prev.filter((c) => c.id !== chartId));
    }

    function setPendingAddKey(chartId, key) {
      setCharts((prev) => prev.map((c) => (c.id === chartId ? { ...c, pendingAddKey: key } : c)));
    }

    function addSeriesToChart(chartId) {
      setCharts((prev) =>
        prev.map((c) => {
          if (c.id !== chartId) return c;

          const addableKeys = computeAddableKeys(c);
          const key = addableKeys.includes(c.pendingAddKey)
            ? c.pendingAddKey
            : (addableKeys[0] ?? "");

          if (!key) return { ...c, pendingAddKey: "" };
          if (c.selectedSeries.some((s) => s.key === key)) return c;

          const def = SERIES_CATALOG[key];
          if (!def) return c;

          const nextSelectedSeries = [
            ...c.selectedSeries,
            { key, color: def.defaultColor, tension: 0.05, thickness: 2 },
          ];

          const nextPanel = { ...c, selectedSeries: nextSelectedSeries };
          const nextAddable = computeAddableKeys(nextPanel);
          const nextPending = nextAddable[0] ?? "";

          return {
            ...c,
            selectedSeries: nextSelectedSeries,
            pendingAddKey: nextPending,
          };
        })
      );
    }

    function removeSeriesFromChart(chartId, key) {
      setCharts((prev) =>
        prev.map((c) => {
          if (c.id !== chartId) return c;

          const nextSelectedSeries = c.selectedSeries.filter((s) => s.key !== key);
          const nextPanel = { ...c, selectedSeries: nextSelectedSeries };
          const addableKeys = computeAddableKeys(nextPanel);

          const nextPending =
            addableKeys.includes(c.pendingAddKey) ? c.pendingAddKey : (addableKeys[0] ?? "");

          // If no series left, reset Y-axis lock + captured ranges
          if (nextSelectedSeries.length === 0) {
            return {
              ...c,
              selectedSeries: nextSelectedSeries,
              pendingAddKey: nextPending,

              // reset "current auto" range
              currentYMin: null,
              currentYMax: null,

              // reset lock
              lockYAxis: false,
              lockedYMin: null,
              lockedYMax: null,
            };
          }

          // normal case
          return {
            ...c,
            selectedSeries: nextSelectedSeries,
            pendingAddKey: nextPending,
          };
        })
      );
    }

    function setSeriesColor(chartId, key, color) {
      setCharts((prev) =>
        prev.map((c) =>
          c.id !== chartId
            ? c
            : {
                ...c,
                selectedSeries: c.selectedSeries.map((s) => (s.key === key ? { ...s, color } : s)),
              }
        )
      );
    }

    function setSeriesTension(chartId, key, tension) {
      setCharts((prev) =>
        prev.map((c) =>
          c.id !== chartId
            ? c
            : {
                ...c,
                selectedSeries: c.selectedSeries.map((s) =>
                  s.key === key ? { ...s, tension } : s
                ),
              }
        )
      );
    }

    function setSeriesThickness(chartId, key, thickness) {
      setCharts((prev) =>
        prev.map((c) =>
          c.id !== chartId
            ? c
            : {
                ...c,
                selectedSeries: c.selectedSeries.map((s) =>
                  s.key === key ? { ...s, thickness } : s
                ),
              }
        )
      );
    }

    // called by LineGraph via Dashboard to store latest auto y-range
    // returns prev if nothing changed (prevents infinite update loops)
    function setChartAutoYRange(chartId, yMin, yMax) {
      if (typeof yMin !== "number" || typeof yMax !== "number") return;

      setCharts((prev) => {
        let changed = false;

        const next = prev.map((c) => {
          if (c.id !== chartId) return c;

          if (c.currentYMin === yMin && c.currentYMax === yMax) return c;

          changed = true;
          return { ...c, currentYMin: yMin, currentYMax: yMax };
        });

        return changed ? next : prev;
      });
    }

    // Toggle Lock
    function toggleLockYAxis(chartId, yMinArg, yMaxArg) {
      setCharts((prev) =>
        prev.map((c) => {
          if (c.id !== chartId) return c;

          // Turn OFF
          if (c.lockYAxis) {
            return { ...c, lockYAxis: false, lockedYMin: null, lockedYMax: null };
          }

          // Turn ON
          const yMin = yMinArg ?? c.currentYMin;
          const yMax = yMaxArg ?? c.currentYMax;

          if (typeof yMin !== "number" || typeof yMax !== "number") return c;

          return { ...c, lockYAxis: true, lockedYMin: yMin, lockedYMax: yMax };
        })
      );
    }

    return {
      addChart,
      removeChart,
      setPendingAddKey,
      addSeriesToChart,
      removeSeriesFromChart,
      setSeriesColor,
      setSeriesTension,
      setSeriesThickness,
      setChartAutoYRange,
      toggleLockYAxis,
    };
  }, [insertAtTop]);

  // Helpers used by UI
  const selectors = useMemo(() => {
    function getAddableKeys(chart) {
      return computeAddableKeys(chart);
    }

    function buildChartSeries(chart) {
      return chart.selectedSeries
        .map((s) => {
          const def = SERIES_CATALOG[s.key];
          if (!def) return null;

          return {
            id: s.key, // stable dataset identity for Chart.js reconciliation // REPAIR??
            key: s.key,
            unit: def.unit,
            label: def.label,
            color: s.color,
            tension: s.tension ?? 0,
            thickness: s.thickness ?? 2,
            valueAccessor: def.valueAccessor,
          };
        })
        .filter(Boolean);
    }

    function getSafePending(chart) {
      const addableKeys = computeAddableKeys(chart);
      return addableKeys.includes(chart.pendingAddKey) ? chart.pendingAddKey : (addableKeys[0] ?? "");
    }

    return { getAddableKeys, buildChartSeries, getSafePending };
  }, []);

  return { charts, ...actions, ...selectors };
}