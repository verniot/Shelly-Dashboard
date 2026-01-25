// src/components/ChartPanel.jsx

import React, { useEffect, useMemo, useState } from "react";
import LineGraph from "./LineGraph.jsx";
import { getTimeUnit } from "../utils/time";
import { SERIES_CATALOG } from "../config/seriesCatalog";

function labelWithUnit(key) {
  const m = SERIES_CATALOG[key];
  if (!m) return key;
  return m.unit ? `${m.label} ${m.unit}` : m.label;
}

function formatValue(v, decimals) {
  if (v === null || v === undefined || Number.isNaN(v)) return "N/A";
  if (typeof v === "number" && Number.isFinite(decimals)) return v.toFixed(decimals);
  return String(v);
}

function getLatestSeriesValue(latestPoint, seriesKey) {
  const def = SERIES_CATALOG[seriesKey];
  if (!def?.valueAccessor) return null;
  try {
    return def.valueAccessor(latestPoint);
  } catch {
    return null;
  }
}

function ChartPanel({
  chart,
  selectedInterval,
  latestMs,
  filteredData,
  latestPoint,
  closeToken, // increments when user clicks outside panels
  actions,
  styles,
}) {
  const {
    removeChart,
    setPendingAddKey,
    addSeriesToChart,
    removeSeriesFromChart,
    setSeriesColor,
    setSeriesTension,
    setSeriesThickness,
    toggleLockYAxis,
    setChartAutoYRange,
    getAddableKeys,
    getSafePending,
    buildChartSeries,
  } = actions;

  // Guard to prevent hard crash (white screen) if styles isn't passed
  const safeStyles = styles ?? {};
  const iconButtonStyle = safeStyles.iconButtonStyle ?? {};
  const infoButtonStyle = safeStyles.infoButtonStyle ?? (() => ({}));
  const popupStyle = safeStyles.popupStyle ?? {};
  const colorInputStyle = safeStyles.colorInputStyle ?? {};
  const panelContainerStyle = safeStyles.chartPanelContainerStyle ?? {};
  const panelControlsStyle = safeStyles.chartPanelControlsStyle ?? {};

  // Local popups (per panel)
  const [tensionPopup, setTensionPopup] = useState(null); // { seriesKey } | null
  const [thicknessPopup, setThicknessPopup] = useState(null); // { seriesKey } | null
  const [infoOpen, setInfoOpen] = useState(false);

  // Close local popups on outside click signal
  useEffect(() => {
    setTensionPopup(null);
    setThicknessPopup(null);
    setInfoOpen(false);
  }, [closeToken]);

  const addableKeys = useMemo(() => getAddableKeys(chart), [getAddableKeys, chart]);
  const safePending = useMemo(() => getSafePending(chart), [getSafePending, chart]);
  const chartSeries = useMemo(() => buildChartSeries(chart), [buildChartSeries, chart]);

  const isTensionOpen = (seriesKey) => tensionPopup?.seriesKey === seriesKey;
  const isThicknessOpen = (seriesKey) => thicknessPopup?.seriesKey === seriesKey;

  const disableInfo = chart.selectedSeries.length === 0;

  return (
    <div style={panelContainerStyle} onClick={(e) => e.stopPropagation()}>
      {/* Per-chart controls */}
      <div style={panelControlsStyle}>
        <button onClick={() => removeChart(chart.id)} title="Remove this chart">
          ✕
        </button>

        <strong>Graphs:</strong>

        <select
          value={safePending}
          onChange={(e) => setPendingAddKey(chart.id, e.target.value)}
          disabled={!addableKeys.length}
        >
          {addableKeys.length ? (
            addableKeys.map((k) => (
              <option key={k} value={k}>
                {labelWithUnit(k)}
              </option>
            ))
          ) : (
            <option value="">(all added)</option>
          )}
        </select>

        <button onClick={() => addSeriesToChart(chart.id)} disabled={!addableKeys.length}>
          + Add
        </button>

        {/* Lock Y-axis + Info popover */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              opacity: chart.selectedSeries.length === 0 ? 0.4 : 0.85,
              cursor: chart.selectedSeries.length === 0 ? "not-allowed" : "pointer",
            }}
          >
            <input
              type="checkbox"
              disabled={chart.selectedSeries.length === 0}
              checked={!!chart.lockYAxis}
              onChange={() => {
                toggleLockYAxis(chart.id, chart.currentYMin, chart.currentYMax);
              }}
            />
            <span style={{ fontSize: "0.85rem" }}>Lock Y-axis</span>
          </label>

          {/* "i" icon */}
          <div style={{ position: "relative", display: "inline-flex" }} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              title="Info"
              style={infoButtonStyle(disableInfo)}
              disabled={disableInfo}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (disableInfo) return;
                setTensionPopup(null);
                setThicknessPopup(null);
                setInfoOpen((v) => !v);
              }}
            >
              i
            </button>

            {infoOpen && (
              <div style={{ ...popupStyle, minWidth: "280px" }} onClick={(e) => e.stopPropagation()}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.35rem",
                  }}
                >
                  <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>
                    Current values (latest sample)
                  </span>
                  <button
                    onClick={() => setInfoOpen(false)}
                    style={{ padding: "0.05rem 0.35rem" }}
                    title="Close"
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: "grid", gap: "0.35rem" }}>
                  {chart.selectedSeries.map((s) => {
                    const def = SERIES_CATALOG[s.key];
                    const val = latestPoint ? getLatestSeriesValue(latestPoint, s.key) : null;

                    return (
                      <div
                        key={s.key}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: "0.75rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <span style={{ opacity: 0.85, whiteSpace: "nowrap" }}>
                          {labelWithUnit(s.key)}
                        </span>
                        <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                          {formatValue(val, def?.decimals)} {def?.unit ?? ""}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: "0.6rem", fontSize: "0.8rem", opacity: 0.75 }}>
                  <div>
                    Auto range:{" "}
                    <b>{Number.isFinite(chart.currentYMin) ? chart.currentYMin.toFixed(2) : "—"}</b> to{" "}
                    <b>{Number.isFinite(chart.currentYMax) ? chart.currentYMax.toFixed(2) : "—"}</b>
                  </div>
                  <div>
                    Locked: <b>{chart.lockYAxis ? "Yes" : "No"}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected series chips */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          {chart.selectedSeries.map((s) => (
            <div
              key={s.key}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "relative",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.5rem",
                borderRadius: "999px",
                backgroundColor: "#00000022",
              }}
            >
              <span style={{ whiteSpace: "nowrap" }}>{labelWithUnit(s.key)}</span>

              {/* COLOR */}
              <input
                type="color"
                value={s.color}
                onChange={(e) => setSeriesColor(chart.id, s.key, e.target.value)}
                title="Change color"
                style={colorInputStyle}
                onClick={(e) => e.stopPropagation()}
              />

              {/* CURVATURE */}
              <button
                onClick={() => {
                  setInfoOpen(false);
                  setThicknessPopup(null);
                  setTensionPopup((prev) => (prev?.seriesKey === s.key ? null : { seriesKey: s.key }));
                }}
                title="Curvature"
                style={iconButtonStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                ∿
              </button>

              {isTensionOpen(s.key) && (
                <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>Curvature</span>
                    <button
                      onClick={() => setTensionPopup(null)}
                      style={{ padding: "0.05rem 0.35rem" }}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.05"
                    value={s.tension ?? 0}
                    onChange={(e) => setSeriesTension(chart.id, s.key, Number(e.target.value))}
                    style={{ width: "100%" }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      opacity: 0.75,
                      marginTop: "0.25rem",
                    }}
                  >
                    <span>Sharp</span>
                    <span>{((s.tension ?? 0) * 100).toFixed(0)}%</span>
                    <span>Smooth</span>
                  </div>
                </div>
              )}

              {/* THICKNESS */}
              <button
                onClick={() => {
                  setInfoOpen(false);
                  setTensionPopup(null);
                  setThicknessPopup((prev) => (prev?.seriesKey === s.key ? null : { seriesKey: s.key }));
                }}
                title="Thickness"
                style={iconButtonStyle}
                onMouseDown={(e) => e.preventDefault()}
              >
                ≡
              </button>

              {isThicknessOpen(s.key) && (
                <div style={popupStyle} onClick={(e) => e.stopPropagation()}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.35rem",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>Thickness</span>
                    <button
                      onClick={() => setThicknessPopup(null)}
                      style={{ padding: "0.05rem 0.35rem" }}
                      title="Close"
                    >
                      ✕
                    </button>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="4"
                    step="1"
                    value={s.thickness ?? 2}
                    onChange={(e) => setSeriesThickness(chart.id, s.key, Number(e.target.value))}
                    style={{ width: "100%" }}
                  />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.75rem",
                      opacity: 0.75,
                      marginTop: "0.25rem",
                    }}
                  >
                    <span>Thin</span>
                    <span>{s.thickness ?? 2}px</span>
                    <span>Thick</span>
                  </div>
                </div>
              )}

              {/* Remove series */}
              <button
                onClick={() => removeSeriesFromChart(chart.id, s.key)}
                title="Remove"
                style={{ padding: "0.1rem 0.45rem" }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: "350px" }}>
        <LineGraph
          dataPoints={filteredData}
          series={chartSeries}
          timeUnit={getTimeUnit(selectedInterval)}
          intervalMs={selectedInterval}
          nowMs={latestMs}
          yAxis={{
            locked: !!chart.lockYAxis,
            min: chart.lockedYMin,
            max: chart.lockedYMax,
          }}
          onAutoYRange={(min, max) => {
            if (typeof setChartAutoYRange === "function") {
              setChartAutoYRange(chart.id, min, max);
            }
          }}
        />
      </div>
    </div>
  );
}

export default ChartPanel;