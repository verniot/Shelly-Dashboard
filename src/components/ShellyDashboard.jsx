// src/components/ShellyDashboard.jsx

/*
Shelly Dashboard
Copyright (c) 2026 TheCat/Verniot

Licensed under the PolyForm Noncommercial License 1.0.0
https://polyformproject.org/licenses/noncommercial/1.0.0/
*/

import React, { useMemo, useState } from "react";
import useShellyStatus from "../hooks/useShellyStatus";
import LiveReadout from "./LiveReadout.jsx";
import MinMaxReadout from "./MinMaxReadout.jsx";
import useChartPanels from "../hooks/useChartPanels";
import ChartPanel from "./ChartPanel.jsx";

import { chartPanelStyles } from "../styles/uiStyles";

export default function ShellyDashboard() {
  const intervals = [
    { label: "1 Minute", value: 1 * 60 * 1000 },
    { label: "3 Minutes", value: 3 * 60 * 1000 },
    { label: "5 Minutes", value: 5 * 60 * 1000 },
    { label: "15 Minutes", value: 15 * 60 * 1000 },
    { label: "30 Minutes", value: 30 * 60 * 1000 },
    { label: "45 Minutes", value: 45 * 60 * 1000 },
    { label: "1 Hour", value: 60 * 60 * 1000 },
    //{ label: "12 Hours", value: 12 * 60 * 60 * 1000 },
    //{ label: "24 Hours", value: 24 * 60 * 60 * 1000 },
  ];

  const [selectedInterval, setSelectedInterval] = useState(intervals[1].value);

  // outside-click close signal for panels
  const [closeToken, setCloseToken] = useState(0);
  function closeAllPopups() {
    setCloseToken((v) => v + 1);
  }

  const dataHistory = useShellyStatus();

  const actions = useChartPanels({ startEmpty: true, insertAtTop: true });

  const latestPoint = useMemo(() => {
    return dataHistory.length ? dataHistory[dataHistory.length - 1] : null;
  }, [dataHistory]);

  const latestMs = useMemo(() => {
    if (!latestPoint) return Date.now();
    return latestPoint?.timestamp?.getTime?.() ?? Date.now();
  }, [latestPoint]);

  const filteredData = useMemo(() => {
    return dataHistory.filter((dp) => dp.timestamp.getTime() >= latestMs - selectedInterval);
  }, [dataHistory, latestMs, selectedInterval]);

  return (
    <div
      style={{ padding: "1rem", width: "100vw", boxSizing: "border-box" }}
      onClick={closeAllPopups}
    >
      <h2>Ventilation System Control</h2>
      <p style={{ opacity: 0.6 }}>Parameters Readout / Graph Creator</p>

      {/* Interval Selector */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Time Interval:&nbsp;
          <select
            value={selectedInterval}
            onChange={(e) => setSelectedInterval(Number(e.target.value))}
          >
            {intervals.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Live + MinMax */}
      {/* Live + MinMax (no stacking, horizontal scroll when needed) */}
      <div
        style={{
          display: "flex",
          flexWrap: "nowrap",        // --> no stacking
          justifyContent: "flex-start",
          alignItems: "stretch",
          gap: "1rem",
          marginBottom: "1rem",
          overflowX: "auto",         // --> slider/scrollbar
          maxWidth: "100%",
        }}
      >
        <div style={{ flex: "0 0 auto", display: "flex" }}>
          <LiveReadout data={latestPoint} />
        </div>
        <div style={{ flex: "0 0 auto", display: "flex" }}>
          <MinMaxReadout
            dataHistory={dataHistory}
            selectedInterval={selectedInterval}
            nowMs={latestMs}
          />
        </div>
      </div>

      {/* Add chart button */}
      <div style={{ marginBottom: "1rem" }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            actions.addChart();
          }}
        >
          Add Chart
        </button>
      </div>

      {/* Empty state */}
      {actions.charts.length === 0 && (
        <div style={{ opacity: 0.7, marginTop: "0.5rem" }}>
          Parameter Analysis Area. Click <b>Add Chart</b> to add one.
        </div>
      )}

      {/* Chart panels */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginTop: "1rem" }}>
        {actions.charts.map((chart) => (
          <ChartPanel
            key={chart.id}
            chart={chart}
            selectedInterval={selectedInterval}
            latestMs={latestMs}
            filteredData={filteredData}
            latestPoint={latestPoint}
            closeToken={closeToken}
            actions={actions}
            styles={chartPanelStyles}
          />
        ))}
      </div>
    </div>
  );
}