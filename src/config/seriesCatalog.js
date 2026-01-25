// src/config/seriesCatalog.js

/*
* Shelly metric registry (single source of truth)
* Used by:
* - Charts (dropdown + graph series)
* - LiveReadout (table)
* - MinMaxReadout (overall + interval)
*
* parseShellyData() fields:
* - temperatures: main, switch100
* - currents: a, b, c, n, total
* - voltages: a, b, c
* - powers: active, apparent
* - energy: a_total_act, b_total_act, c_total_act, total_act, total_act_ret
*/

export const SERIES_CATALOG = {
  // === Temperature ===
  temp_main: {
    label: "Temp (Main)",
    unit: "°C",
    group: "Temperature",
    defaultColor: "#ff4d4d",
    decimals: 1,
    chartable: true,
    valueAccessor: (dp) => dp.temperatures.main,
  },
  temp_switch100: {
    label: "Temp (Relay)",
    unit: "°C",
    group: "Temperature",
    defaultColor: "#ffa94d",
    decimals: 1,
    chartable: true,
    valueAccessor: (dp) => dp.temperatures.switch100,
  },

  // === Current ===
  cur_a: {
    label: "Current (R)",
    unit: "A",
    group: "Current",
    defaultColor: "#4d88ff",
    decimals: 3,
    chartable: false,
    valueAccessor: (dp) => dp.currents.a,
  },
  cur_b: {
    label: "Current (S)",
    unit: "A",
    group: "Current",
    defaultColor: "#3b82f6",
    decimals: 3,
    chartable: false,
    valueAccessor: (dp) => dp.currents.b,
  },
  cur_c: {
    label: "Current (T)",
    unit: "A",
    group: "Current",
    defaultColor: "#60a5fa",
    decimals: 3,
    chartable: false,
    valueAccessor: (dp) => dp.currents.c,
  },
  current_total: {
    label: "Current (∑)",
    unit: "A",
    group: "Current",
    defaultColor: "#4d88ff",
    decimals: 3,
    chartable: true,
    valueAccessor: (dp) => dp.currents.total,
  },
    cur_n: {
    label: "Current (N)",
    unit: "A",
    group: "Current",
    defaultColor: "#7402e6",
    decimals: 3,
    chartable: true,
    valueAccessor: (dp) => dp.currents.n,
  },

  // === Voltage ===
  voltage_a: {
    label: "Voltage (R)",
    unit: "V",
    group: "Voltage",
    defaultColor: "#7c5cff",
    decimals: 1,
    chartable: true,
    valueAccessor: (dp) => dp.voltages.a,
  },
  voltage_b: {
    label: "Voltage (S)",
    unit: "V",
    group: "Voltage",
    defaultColor: "#2fd3c6",
    decimals: 1,
    chartable: true,
    valueAccessor: (dp) => dp.voltages.b,
  },
  voltage_c: {
    label: "Voltage (T)",
    unit: "V",
    group: "Voltage",
    defaultColor: "#8bdc65",
    decimals: 1,
    chartable: true,
    valueAccessor: (dp) => dp.voltages.c,
  },

  // === Power ===
  p_active: {
    label: "Active Power (Total)",
    unit: "W",
    group: "Power",
    defaultColor: "#ffa94d",
    decimals: 0,
    chartable: true,
    valueAccessor: (dp) => dp.powers.active,
  },
  p_apparent: {
    label: "Apparent Power (Total)",
    unit: "VA",
    group: "Power",
    defaultColor: "#f59f00",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.powers.apparent,
  },

  // === Energy ===
  e_a: {
    label: "Energy (R) Active",
    unit: "Wh",
    group: "Energy",
    defaultColor: "#8bdc65",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.energy.a_total_act,
  },
  e_b: {
    label: "Energy (S) Active",
    unit: "Wh",
    group: "Energy",
    defaultColor: "#51cf66",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.energy.b_total_act,
  },
  e_c: {
    label: "Energy (T) Active",
    unit: "Wh",
    group: "Energy",
    defaultColor: "#2f9e44",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.energy.c_total_act,
  },
  e_total: {
    label: "Energy Active",
    unit: "Wh",
    group: "Energy",
    defaultColor: "#8bdc65",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.energy.total_act,
  },
  e_total_ret: {
    label: "Energy Returned",
    unit: "Wh",
    group: "Energy",
    defaultColor: "#20c997",
    decimals: 0,
    chartable: false,
    valueAccessor: (dp) => dp.energy.total_act_ret,
  },
};

/*
* All metric keys (everything in the catalog)
*/
export const ALL_METRIC_KEYS = Object.keys(SERIES_CATALOG);

/*
* Only metrics that are allowed to appear in chart dropdown
*/
export const CHART_KEYS = ALL_METRIC_KEYS.filter(
  (k) => SERIES_CATALOG[k].chartable !== false
);

/*
* Compatibility IMP Pump:
* used ALL_SERIES_KEYS - chart dropdowns --> Old Version
*/
export const ALL_SERIES_KEYS = CHART_KEYS;

/*
* Used by LiveReadout / MinMaxReadout --> Grouping
* Returns: [ [groupName, keys[]], ... ]
*/
export function getGroupedMetricKeys(keys = ALL_METRIC_KEYS) {
  const groups = new Map();

  for (const k of keys) {
    const m = SERIES_CATALOG[k];
    if (!m) continue;

    const g = m.group ?? "Other";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g).push(k);
  }

  return Array.from(groups.entries());
}