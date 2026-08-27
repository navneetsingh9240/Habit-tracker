const { TimezoneService } = require('../services/timezone.service');

describe('TimezoneService', () => {
  it('validates IANA timezones', () => {
    expect(TimezoneService.isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(TimezoneService.isValidTimezone('America/New_York')).toBe(true);
    expect(TimezoneService.isValidTimezone('UTC')).toBe(true);
    expect(TimezoneService.isValidTimezone('Invalid/Zone')).toBe(false);
    expect(TimezoneService.isValidTimezone('')).toBe(false);
  });

  it('correctly calculates local date across timezone boundaries', () => {
    // 2026-08-25 22:30:00 UTC
    const refDate = new Date('2026-08-25T22:30:00.000Z');

    // In UTC, date is 2026-08-25
    expect(TimezoneService.getTodayLocalDate('UTC', refDate)).toBe('2026-08-25');

    // In Asia/Kolkata (+5:30), UTC 22:30 turns into next day 04:00 AM on 2026-08-26
    expect(TimezoneService.getTodayLocalDate('Asia/Kolkata', refDate)).toBe('2026-08-26');

    // In America/Los_Angeles (-7:00), UTC 22:30 is 15:30 PM on 2026-08-25
    expect(TimezoneService.getTodayLocalDate('America/Los_Angeles', refDate)).toBe('2026-08-25');
  });

  it('correctly identifies future local dates', () => {
    const refDate = new Date('2026-08-25T12:00:00.000Z');
    const tz = 'Asia/Kolkata'; // Local date is 2026-08-25

    expect(TimezoneService.isFutureLocalDate('2026-08-26', tz, refDate)).toBe(true);
    expect(TimezoneService.isFutureLocalDate('2026-08-25', tz, refDate)).toBe(false);
    expect(TimezoneService.isFutureLocalDate('2026-08-24', tz, refDate)).toBe(false);
  });

  it('normalizes local date strings', () => {
    expect(TimezoneService.normalizeLocalDate('2026-08-25')).toBe('2026-08-25');
  });
});
