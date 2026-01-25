// src/api/shellyClient.js

/*
* API Client
* HTTP comms with Shelly device
*/

export async function fetchShellyStatus() {
  const response = await fetch("/rpc/Shelly.GetStatus"); // <-- relative URL --> IP in vite.config --> CORS ERROR BYPASS
  if (!response.ok) throw new Error("Shelly unreachable");
  return await response.json();
}
