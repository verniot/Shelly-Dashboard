// src/components/MinMaxReadout.jsx

import React, { useMemo } from "react";
import { SERIES_CATALOG, ALL_METRIC_KEYS, getGroupedMetricKeys } from "../config/seriesCatalog";
import { cardStyle } from "../styles/uiStyles";

function calculateMinMax(data, valueAccessor) {
  let min = Infinity;
  let max = -Infinity;
  let found = false;

  for (const dp of data) {
    const v = valueAccessor(dp);
    if (v === null || v === undefined || Number.isNaN(v)) continue;
    found = true;
    if (v < min) min = v;
    if (v > max) max = v;
  }

  return found ? { min, max } : { min: null, max: null };
}

function formatValue(v, decimals) {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  if (typeof v === "number" && Number.isFinite(decimals)) return v.toFixed(decimals);
  return String(v);
}

export default function MinMaxReadout({ dataHistory, selectedInterval, nowMs }) {
  // Hooks always run
  const grouped = useMemo(() => getGroupedMetricKeys(ALL_METRIC_KEYS), []);

  const anchorMs = Number.isFinite(nowMs) ? nowMs : Date.now();
  const cutoff = useMemo(() => anchorMs - selectedInterval, [anchorMs, selectedInterval]);

  const filteredData = useMemo(() => {
    return dataHistory.filter((dp) => dp.timestamp.getTime() >= cutoff);
  }, [dataHistory, cutoff]);

  const stats = useMemo(() => {
    const out = {};
    for (const key of ALL_METRIC_KEYS) {
      const m = SERIES_CATALOG[key];
      if (!m?.valueAccessor) continue;

      out[key] = {
        overall: calculateMinMax(dataHistory, m.valueAccessor),
        interval: calculateMinMax(filteredData, m.valueAccessor),
      };
    }
    return out;
  }, [dataHistory, filteredData]);

  // AFTER hooks → loading guard
  if (!dataHistory || dataHistory.length === 0) {
    return <div>Awaiting Calculations...</div>;
  }

  return (
    <div style={cardStyle}>
      <h3>Min/Max Indicator Data</h3>

      <table
        style={{
          margin: "0 auto",
          borderCollapse: "separate",
          borderSpacing: "8px 0",
          tableLayout: "auto",
          marginLeft: "-8px",
          width: "auto",
        }}
      >
        <thead>
          <tr>
            <th style={{ textAlign: "left" }}>Parameter</th>
            <th style={{ textAlign: "right", fontWeight: "normal" }}>Overall</th>
            <th style={{ textAlign: "right", fontWeight: "normal" }}>Min/Max</th>
            <th style={{ textAlign: "right", fontWeight: "normal" }}>Interval</th>
            <th style={{ textAlign: "right", fontWeight: "normal" }}>Min/Max</th>
            <th style={{ textAlign: "left", fontWeight: "normal" }}>Unit</th>
          </tr>
        </thead>

        <tbody>
          {grouped.map(([groupName, keys], groupIdx) => (
            <React.Fragment key={groupName}>
              {keys.map((key) => {
                const m = SERIES_CATALOG[key];
                if (!m?.valueAccessor) return null;

                const s =
                  stats[key] ?? {
                    overall: { min: null, max: null },
                    interval: { min: null, max: null },
                  };

                return (
                  <tr key={key}>
                    <td>{m.label}:</td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {formatValue(s.overall.min, m.decimals)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {formatValue(s.overall.max, m.decimals)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {formatValue(s.interval.min, m.decimals)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: "bold" }}>
                      {formatValue(s.interval.max, m.decimals)}
                    </td>
                    <td style={{ textAlign: "left" }}>{m.unit ?? ""}</td>
                  </tr>
                );
              })}

              {groupIdx < grouped.length - 1 ? <tr style={{ height: "12px" }} /> : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}