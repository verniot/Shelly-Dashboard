// src/components/LiveReadout.jsx

import React, { useEffect, useMemo, useState } from "react";
import { SERIES_CATALOG, ALL_METRIC_KEYS, getGroupedMetricKeys } from "../config/seriesCatalog";
import { cardStyle } from "../styles/uiStyles";

function formatAge(ms) {
  if (!Number.isFinite(ms) || ms < 0) return "—";

  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  if (s < 60) return `${Math.round(s)}s`;

  const m = Math.floor(s / 60);
  const remS = Math.round(s - m * 60);
  if (m < 60) return `${m}m ${String(remS).padStart(2, "0")}s`;

  const h = Math.floor(m / 60);
  const remM = m - h * 60;
  return `${h}h ${String(remM).padStart(2, "0")}m`;
}

function getAgeStatus(ageMs) {
  if (!Number.isFinite(ageMs)) return { label: "", color: "#999" };
  if (ageMs > 15000) return { label: "STALE", color: "#ff6b6b" };
  if (ageMs > 10000) return { label: "WARN", color: "#ffd43b" };
  return { label: "", color: "#ffffffaa" };
}

function formatValue(v, decimals) {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  if (typeof v === "number" && Number.isFinite(decimals)) return v.toFixed(decimals);
  return String(v);
}

function formatClock(ts) {
  return ts.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function LiveReadout({ data }) {
  const [, forceTick] = useState(0);

  // Re-render periodically so "age" updates even if data doesn't change
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 200);
    return () => clearInterval(id);
  }, []);

  // IMPORTANT: hooks must run every render (even when data is null)
  const grouped = useMemo(() => getGroupedMetricKeys(ALL_METRIC_KEYS), []);

  const lastMs = data?.timestamp?.getTime?.();
  const ageMs = Number.isFinite(lastMs) ? Date.now() - lastMs : NaN;

  const ageText = useMemo(() => formatAge(ageMs), [ageMs]);
  const ageStatus = useMemo(() => getAgeStatus(ageMs), [ageMs]);

  if (!data) return <div>Loading Device data...</div>;

  return (
    <div style={cardStyle}>
      <h3>Live Parameter Data</h3>

      <table
        style={{
          margin: "0 auto",
          borderCollapse: "collapse",
          tableLayout: "auto",
          width: "auto",
        }}
      >
        <tbody>
          {grouped.map(([groupName, keys], groupIndex) => (
            <React.Fragment key={groupName}>
              {keys.map((key) => {
                const m = SERIES_CATALOG[key];
                if (!m?.valueAccessor) return null;

                const value = m.valueAccessor(data);

                return (
                  <tr key={key}>
                    <td style={{ paddingRight: "2px" }}>{m.label}:</td>
                    <td
                      style={{
                        minWidth: "7ch",               // minimum width = 9 characters --> table column width
                        textAlign: "right",
                        fontWeight: "bold",
                        fontVariantNumeric: "tabular-nums",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatValue(value, m.decimals)}
                    </td>
                    <td style={{ textAlign: "left", paddingLeft: "8px" }}>{m.unit ?? ""}</td>
                  </tr>
                );
              })}

              {groupIndex < grouped.length - 1 ? <tr style={{ height: "12px" }} /> : null}
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <p style={{ fontSize: "0.8rem", opacity: 0.6 }}>
        Last update:{" "}

        {/* Show clock only when status is normal */}
        {!ageStatus.label && (
          <span
            style={{
              fontWeight: 600,
              fontVariantNumeric: "tabular-nums",
              minWidth: "8ch",
              display: "inline-block",
              textAlign: "right",
            }}
          >
            {data.timestamp ? formatClock(data.timestamp) : "N/A"}
          </span>
        )}{" "}

        {/* Always show age + state */}
        <span
          style={{
            color: ageStatus.color,
            fontWeight: ageStatus.label ? 700 : 600,
            fontVariantNumeric: "tabular-nums",
            minWidth: "10ch",
            display: "inline-block",
          }}
        >
          ({ageText} ago{ageStatus.label ? ` • ${ageStatus.label}` : ""})
        </span>
      </p>
    </div>
  );
}