// Execution date calculator for BSE MF orders
// SELL / TRIM: T (before 12:30 PM) or T+1 (after)
// BUY:         T+3 (before 12:30 PM) or T+4 (after)
// T+N means adding N *working* days (no weekends, no BSE holidays)

const CUTOFF_HOUR = 12;
const CUTOFF_MIN  = 30;

function isWeekend(date) {
  const d = date.getDay();
  return d === 0 || d === 6; // Sun or Sat
}

/**
 * Advance a date by `n` working days, skipping weekends and BSE holidays.
 * @param {Date}   start      – base date (time component ignored)
 * @param {number} n          – number of working days to add (0 = same day if it's a working day)
 * @param {Set}    holidaySet – Set of "YYYY-MM-DD" strings for the relevant years
 */
export function addWorkingDays(start, n, holidaySet) {
  const d = new Date(start);
  d.setHours(0, 0, 0, 0);

  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    const key = d.toISOString().slice(0, 10);
    if (!isWeekend(d) && !holidaySet.has(key)) {
      added++;
    }
  }
  return d;
}

/**
 * Find the next working day on-or-after a given date.
 */
export function nextWorkingDay(date, holidaySet) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const key = () => d.toISOString().slice(0, 10);
  while (isWeekend(d) || holidaySet.has(key())) {
    d.setDate(d.getDate() + 1);
  }
  return d;
}

/**
 * Calculate BSE execution date for an order.
 *
 * @param {string} action       – "BUY" | "SELL" | "TRIM"
 * @param {Date}   [now]        – submission timestamp (defaults to current time)
 * @param {Set}    holidaySet   – Set of "YYYY-MM-DD" holiday strings
 * @returns {{ execDate: Date, settlementLabel: string, cutoffMissed: boolean }}
 */
export function calcExecutionDate(action, now = new Date(), holidaySet = new Set()) {
  const isBuy = action === "BUY";

  const cutoff = new Date(now);
  cutoff.setHours(CUTOFF_HOUR, CUTOFF_MIN, 0, 0);
  const cutoffMissed = now >= cutoff;

  // Determine T — the base trading day (today if market open, else next working day)
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const T = nextWorkingDay(today, holidaySet);

  let settlementDays;
  if (isBuy) {
    settlementDays = cutoffMissed ? 4 : 3;
  } else {
    // SELL / TRIM
    settlementDays = cutoffMissed ? 1 : 0;
  }

  const execDate = addWorkingDays(T, settlementDays, holidaySet);

  const settlementLabel = isBuy
    ? (cutoffMissed ? "T+4" : "T+3")
    : (cutoffMissed ? "T+1" : "T");

  return { execDate, settlementLabel, cutoffMissed };
}

/**
 * Format a Date as "DD MMM YYYY" (e.g. "16 Apr 2026")
 */
export function formatExecDate(date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
