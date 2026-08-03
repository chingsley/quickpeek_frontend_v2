import {
  formatDate,
  formatListTime,
  formatSystemMessageTime,
} from '@/utils/date';

describe('formatSystemMessageTime', () => {
  const now = new Date('2026-08-03T15:30:00.000Z');

  it('labels events from today', () => {
    expect(formatSystemMessageTime('2026-08-03T10:55:00.000Z', now)).toMatch(/^Today • /);
    expect(formatSystemMessageTime('2026-08-03T10:55:00.000Z', now)).toContain(
      formatListTime('2026-08-03T10:55:00.000Z'),
    );
  });

  it('labels events from yesterday', () => {
    expect(formatSystemMessageTime('2026-08-02T10:55:00.000Z', now)).toMatch(/^Yesterday • /);
  });

  it('uses the absolute date style for older events', () => {
    expect(formatSystemMessageTime('2026-07-15T10:55:00.000Z', now)).toBe(
      formatDate('2026-07-15T10:55:00.000Z'),
    );
  });
});
