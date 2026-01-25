// src/domain/parseShellyData.js

/*
* Domain parser (Separation of Concerns + Pure Function)
* Unixtime Internal version --> debug --> sort data after
*/
export function parseShellyData(raw) {
  if (!raw) return null;

  // Unixtime (seconds) if available, else fallback
  const timestampUnix = raw?.sys?.unixtime ?? Math.floor(Date.now() / 1000);
  const timestamp = new Date(timestampUnix * 1000); // JS Date

  // Temperatures
  const temperatureMain = raw["temperature:0"]?.tC ?? null;
  const temperatureSwitch100 = raw["switch:100"]?.temperature?.tC ?? null;

  // Electrical measurements
  const em = raw["em:0"] || {};
  const emData = raw["emdata:0"] || {};

  return {
    timestamp,  // JS Date object based on Shelly unixtime

    temperatures: {
      main: temperatureMain,
      switch100: temperatureSwitch100,
    },

    currents: {
      a: em.a_current ?? null,
      b: em.b_current ?? null,
      c: em.c_current ?? null,
      n: em.n_current ?? null,
      total: em.total_current ?? null,
    },

    voltages: {
      a: em.a_voltage ?? null,
      b: em.b_voltage ?? null,
      c: em.c_voltage ?? null,
    },

    powers: {
      active: em.total_act_power ?? null,
      apparent: em.total_aprt_power ?? null,
    },

    energy: {
      a_total_act: emData.a_total_act_energy ?? null,
      b_total_act: emData.b_total_act_energy ?? null,
      c_total_act: emData.c_total_act_energy ?? null,
      total_act: emData.total_act ?? null,
      total_act_ret: emData.total_act_ret ?? null,
    },

    //raw data for debugging / future expansion
    //raw, //--> raw added to Data --> mem leak!!
  };
}