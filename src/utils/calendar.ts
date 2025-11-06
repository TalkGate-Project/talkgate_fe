export type CalendarCell = { date: Date; inCurrent: boolean };

/**
 * Generate a 5-week (35) or 6-week (42) calendar grid for the month of `current`.
 * Includes leading/trailing days from adjacent months and flags whether a day is in the current month.
 */
export function generateMonthCells(current: Date): CalendarCell[] {
  const y = current.getFullYear();
  const m = current.getMonth();
  const first = new Date(y, m, 1);
  const startDow = first.getDay(); // 0=Sun
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const daysInPrev = new Date(y, m, 0).getDate();
  const totalCells = startDow + daysInMonth <= 35 ? 35 : 42; // 5 weeks or 6 weeks

  const result: CalendarCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    if (i < startDow) {
      const d = daysInPrev - startDow + 1 + i;
      result.push({ date: new Date(y, m - 1, d), inCurrent: false });
    } else if (i < startDow + daysInMonth) {
      const d = i - startDow + 1;
      result.push({ date: new Date(y, m, d), inCurrent: true });
    } else {
      const d = i - (startDow + daysInMonth) + 1;
      result.push({ date: new Date(y, m + 1, d), inCurrent: false });
    }
  }
  return result;
}


