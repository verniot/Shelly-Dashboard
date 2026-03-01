# Description

A web-based real-time monitoring and diagnostics dashboard built with React and Vite for electrical analysis of ventilation systems using Shelly Pro 3EM energy meters and Shelly Pro 4PM relay controllers. The application provides high-resolution live readouts, historical charting, and dynamic multi-graph visualization of currents, voltages, power, energy, and temperatures. It enables fast identification of startup-related and operational issues such as current spikes, voltage sags, phase imbalance, abnormal power consumption, and load irregularities, making it a practical diagnostic tool for commissioning, maintenance, and long-term system stability analysis.

# Documentation

Comprehensive technical documentation is available in the /documentation folder.
The documentation includes:

- File-by-file module reference
- Detailed React hook explanations (state, effects, dependency arrays)
- Data flow architecture (Device → API → Parser → State → UI)
- Chart subsystem architecture (multi-panel state management, series registry, downsampling, and Y-axis locking)
- Function signatures with parameters and return values
- Component interaction and responsibility breakdown

This project is intentionally documented in a detailed, reference-style format to support learning and architectural understanding. Students and developers are encouraged to explore the data flow, experiment with the chart subsystem, and propose improvements. Collaboration, feedback, and technical discussion are always welcome.

## SHELLY DASHBOARD (React + Vite + Chart.js) — ASCII UML (Component + Data Flow)
```text
+--------------------+          +-------------------------+
|   Vite Dev Server  |          |  Shelly Device (IP)     |
|  (proxy /rpc -> )  |          |  /rpc/Shelly.GetStatus  |
+---------+----------+          +-----------+-------------+
          |                                ^
          | fetch("/rpc/Shelly.GetStatus") |
          v                                |
+------------------------+                 |
| api/shellyClient       |-----------------+
| + fetchShellyStatus(): |
|   Promise<rawJson>     |
+------------------------+
          |
          v
+------------------------+
| domain/parseShellyData |
| + parseShellyData(raw) |
|   -> ParsedDataPoint   |
+-----------+------------+
            |
            v
+------------------------------+
| hooks/useShellyStatus        |
| + useShellyStatus(           |
|     intervalMs=3000,         |
|     maxPoints=2500)          |
| - polls -> parse -> history  |
|   returns: ParsedDataPoint[] |
+---------------+--------------+
                |
                v
+------------------------------------------------+
| components/ShellyDashboard                     |
|  - selectedInterval (UI)                       |
|  - closeToken (outside click)                  |
|  - dataHistory = useShellyStatus()             |
|  - actions = useChartPanels()                  |
|  - latestPoint, latestMs, filteredData         |
|                                                |
|  renders: LiveReadout(latestPoint)             |
|           MinMaxReadout(dataHistory, interval) |
|           [ChartPanel]* for each chart         |
+-----------+----------------------+-------------+
            |                      |
            |                      |
            v                      v
+-----------------------+   +--------------------------+
| components/LiveReadout|   | components/MinMaxReadout |
|  uses SERIES_CATALOG  |   |  uses SERIES_CATALOG     |
|  + grouped metrics    |   |  + calculate min/max     |
|  shows current values |   |  overall + interval      |
+----------+------------+   +-----------+--------------+
           ^                           ^
           |                           |
           | uses catalog              | uses catalog
           |                           |
+----------+---------------------------+------------------+
| config/seriesCatalog                                    |
|  SERIES_CATALOG: { key -> {label, unit, group,          |
|    chartable, decimals, defaultColor, valueAccessor} }  |
|  ALL_METRIC_KEYS                                        |
|  CHART_KEYS                                             |
|  getGroupedMetricKeys(keys)                             |
+---------------------------------------------------------+

Charts subsystem (multi-panels + per-series settings)
-----------------------------------------------------

+--------------------------------------------------------+
| hooks/useChartPanels                                   |
|  state: charts[]                                       |
|   ChartPanelState:                                     |
|    - id                                                |
|    - selectedSeries[] (key, color, tension, thickness) |
|    - pendingAddKey                                     |
|    - currentYMin/currentYMax (auto)                    |
|    - lockYAxis + lockedYMin/Max                        |
|  actions: add/remove chart, add/remove series,         |
|   set color/tension/thickness, toggleLockYAxis,        |
|   setChartAutoYRange                                   |
+--------------------------------------------------------+
            |
            v
+------------------------------+
| components/ChartPanel        |
|  UI: dropdown + chips        |
|  calls actions.*             |
|  builds chartSeries          |
|  passes yAxis locked/min/max |
|  renders LineGraph           |
+------------+-----------------+
             |
             v
+--------------------------------------------------------------+
| components/LineGraph                                         |
|  Chart.js (react-chartjs-2)                                  |
|  downsampling: preserveExtremesEpochBuckets                  |
|  computes auto Y range                                       |
|  calls onAutoYRange(min,max) -> ChartPanel -> useChartPanels |
|  x-axis time formatting (24h)                                |
+--------------------------------------------------------------+

Shared styling / utilities
--------------------------
+------------------+       +----------------+
| styles/uiStyles  |       | utils/time     |
|  cardStyle       |       | getTimeUnit(ms)|
|  panel tokens    |       +----------------+
+------------------+
```
## Running the Application

Prerequisites
-------------

Make sure the following are installed on your system:

- Node.js (LTS version recommended, ≥ 18.x)
- npm (included with Node.js)

Verify installation:

    node -v
    npm -v


Clone the Repository
--------------------

    git clone https://github.com/verniot/Shelly-Dashboard.git
    cd Shelly-Dashboard


Install Dependencies
--------------------

Inside the project root folder, run:

    npm install

This will install React, Vite, Chart.js, and all required project dependencies.


Configure Device Access (Important)
-----------------------------------

The dashboard fetches real-time data from a local device
(Shelly Pro 3EM or IMP Pump).

Open:

    vite.config.js

Ensure the proxy is configured correctly:

    server: {
      proxy: {
        "/rpc": {
          target: "http://192.168.1.100",  // Replace with your device IP
          changeOrigin: true
        }
      }
    }

Replace the IP address with your actual device IP.


Using Node-RED for Simulation (Optional)
----------------------------------------

If you do not have a physical device available,
you can simulate it using Node-RED.

1.Install Node-RED:

    npm install -g --unsafe-perm node-red

2.Start Node-RED:

    node-red

Open in browser:

    http://localhost:1880

3.Import the simulation flow:

   - Open the Node-RED editor
   - Click Menu → Import
   - Import the flow file from the repository's Node-RED folder
   - Click Deploy

4.Update the proxy target in vite.config.js:

    target: "http://localhost:1880"

Restart the development server after making changes.

Note:
The simulated values are randomly generated and may appear unusual.
This is expected behavior.


Start the Development Server
----------------------------

    npm run dev

Vite will start a local development server.

You should see a message similar to:

    Local: http://localhost:5173/

Open that URL in your browser.

## License

This project is licensed under the PolyForm Noncommercial License 1.0.0.

Commercial use is not permitted without the author's permission.
