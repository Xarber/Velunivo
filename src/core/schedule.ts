/** Local calendar dates stay in the device timezone; relative durations use elapsed time. */
export function localDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
export function parseSchedule(text: string, now = new Date()): Date {
  const input = text.trim().toLowerCase();
  if (!input || input === 'now') return new Date(now);
  const absolute = /^(\d{4})-(\d{2})-(\d{2})[ t](\d{2}):(\d{2})$/.exec(input);
  if (absolute) {
    const [, y, m, d, h, min] = absolute.map(Number);
    const date = new Date(y, m - 1, d, h, min);
    if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d && date.getHours() === h && date.getMinutes() === min) return date;
    throw new Error('Choose a valid local date and time.');
  }
  const calendar = /^(today|tomorrow)\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/.exec(input);
  if (calendar) {
    let hour = Number(calendar[2]); const minute = Number(calendar[3] || 0), meridiem = calendar[4];
    if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) throw new Error('Choose a valid time.');
    if (meridiem) hour = hour % 12 + (meridiem === 'pm' ? 12 : 0);
    const date = new Date(now); date.setDate(date.getDate() + (calendar[1] === 'tomorrow' ? 1 : 0)); date.setHours(hour, minute, 0, 0);
    if (date.getHours() !== hour || date.getMinutes() !== minute) throw new Error('That local time does not exist because the clocks change.');
    return date;
  }
  if (input.startsWith('in ')) {
    const duration = input.slice(3).replace(/\s+and\s+/g, ' ').trim();
    const units = /(\d+)\s*(days?|d|hours?|hrs?|h|minutes?|mins?|m)\b/g;
    let total = 0, end = 0, count = 0;
    for (const match of duration.matchAll(units)) {
      if (duration.slice(end, match.index).trim()) throw new Error('Use a duration such as “in 3 hours and 35 minutes”.');
      const unit = match[2]; total += Number(match[1]) * (unit.startsWith('d') ? 86400000 : unit.startsWith('h') ? 3600000 : 60000); end = match.index! + match[0].length; count++;
    }
    if (count && !duration.slice(end).trim() && total > 0 && total <= 366 * 86400000) return new Date(now.getTime() + total);
  }
  throw new Error('Try “Today at 9:00”, “Tomorrow at 6:30 pm” or “in 3 hours and 35 minutes”, or use the picker.');
}
export function scheduleSummary(value: string, seconds: number | undefined, mode: 'depart' | 'arrive', now = new Date()) {
  let date: Date;
  try { date = parseSchedule(value, now); } catch (e) { return (e as Error).message; }
  if (seconds === undefined) return 'Select a route to estimate arrival';
  if (mode === 'arrive' && !value.trim()) return 'Choose your desired arrival time';
  return `${mode === 'arrive' ? 'Suggested departure' : 'Estimated arrival'} ${new Date(date.getTime() + (mode === 'arrive' ? -1 : 1) * seconds * 1000).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
}
