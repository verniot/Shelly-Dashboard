// src/utils/time.js

export function getTimeUnit(ms) {
  if (ms <= 5 * 60 * 1000) return "second";
  if (ms <= 60 * 60 * 1000) return "minute";
  if (ms <= 12 * 60 * 60 * 1000) return "hour";
  return "day";
}
