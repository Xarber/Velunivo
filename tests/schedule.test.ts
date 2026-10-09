import { test } from 'node:test';
import assert from 'node:assert/strict';
import { localDateTime, parseSchedule, scheduleSummary } from '../src/core/schedule';
const now = new Date(2026, 9, 9, 7, 10, 0);
test('natural schedules have explicit calendar and elapsed-duration semantics', () => {
  assert.equal(localDateTime(parseSchedule('Today at 9:00', now)), '2026-10-09T09:00');
  assert.equal(localDateTime(parseSchedule('Tomorrow at 6:30 pm', now)), '2026-10-10T18:30');
  assert.equal(localDateTime(parseSchedule('in 3 hours and 35 minutes', now)), '2026-10-09T10:45');
  assert.equal(localDateTime(parseSchedule('in 1 day 2 hours 5 minutes', now)), '2026-10-10T09:15');
  assert.equal(localDateTime(parseSchedule('today at 12 am', now)), '2026-10-09T00:00');
  assert.equal(localDateTime(parseSchedule('2026-10-09 09:00', now)), '2026-10-09T09:00');
});
test('invalid or ambiguous schedules never silently become another date', () => {
  for (const value of ['2026-02-30T12:00', 'today at 24:01', 'tomorrow at 13 pm', 'in 3 hours garbage', 'in 0 minutes', 'in -1 hour', 'next sometime']) assert.throws(() => parseSchedule(value, now));
});
test('arrival schedules subtract the same traffic-free ETA', () => {
  const expected = new Date(2026, 9, 9, 8, 30).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  assert.equal(scheduleSummary('2026-10-09T09:00', 1800, 'arrive', now), `Suggested departure ${expected}`);
});
