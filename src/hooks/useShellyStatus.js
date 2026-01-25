// src/hooks/useShellyStatus.js

import { useState, useEffect, useRef } from "react";
import { fetchShellyStatus } from "../api/shellyClient";
import { parseShellyData } from "../domain/parseShellyData";

/*
* Custom hook: keeps historical data for charting
* intervalMs: polling interval in ms
* maxPoints: maximum number of points to keep
*/

/*
* Custom hook (Encapsulation + SRP)
* Handles:
* - Polling Shelly device
* - Parsing data
* - Providing live state to UI
* 
* Returns the latest normalized data object.
*/

/*
*  Poll interval	Points (1h)
*   1 s	        3600
*   2 s	        1800
*   3 s	        1200
*   5 s	        720
*  10 s	        360
*/

export default function useShellyStatus(intervalMs = 2000, maxPoints = 2000) {
  const [dataHistory, setDataHistory] = useState([]); // array of parsed data points
  const timerRef = useRef(null);

  useEffect(() => {
    async function update() {
      try {
        const raw = await fetchShellyStatus();
        const parsed = parseShellyData(raw);
        setDataHistory(prev => {
          const next = [...prev, parsed];
          if (next.length > maxPoints) next.shift(); // maintain maxPoints
          return next;
        });
      } catch (err) {
        console.error("Shelly fetch error:", err);
      }
    }

    update();
    timerRef.current = setInterval(update, intervalMs);

    return () => clearInterval(timerRef.current);
  }, [intervalMs, maxPoints]);

  return dataHistory;
}