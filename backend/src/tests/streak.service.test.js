const { StreakService } = require('../services/streak.service');

describe('StreakService', () => {
  const today = '2026-08-25';

  it('handles empty check-ins', () => {
    const result = StreakService.calculateStreaks([], today);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('calculates single-day streak for today', () => {
    const result = StreakService.calculateStreaks(['2026-08-25'], today);
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it('calculates single-day streak for yesterday (streak active)', () => {
    const result = StreakService.calculateStreaks(['2026-08-24'], today);
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1 });
  });

  it('returns 0 current streak if last check-in was 2 days ago', () => {
    const result = StreakService.calculateStreaks(['2026-08-23'], today);
    expect(result).toEqual({ currentStreak: 0, longestStreak: 1 });
  });

  it('calculates multiple consecutive days ending today', () => {
    const checkIns = ['2026-08-23', '2026-08-24', '2026-08-25'];
    const result = StreakService.calculateStreaks(checkIns, today);
    expect(result).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('calculates multiple consecutive days ending yesterday', () => {
    const checkIns = ['2026-08-22', '2026-08-23', '2026-08-24'];
    const result = StreakService.calculateStreaks(checkIns, today);
    expect(result).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('calculates broken streak with longest streak in the past', () => {
    // Past sequence: Aug 1, 2, 3 (streak = 3)
    // Gap: Aug 4 (missed)
    // Recent sequence: Aug 5, 6 (today = Aug 6, streak = 2)
    const checkIns = [
      '2026-08-01',
      '2026-08-02',
      '2026-08-03',
      '2026-08-05',
      '2026-08-06',
    ];
    const result = StreakService.calculateStreaks(checkIns, '2026-08-06');
    expect(result).toEqual({ currentStreak: 2, longestStreak: 3 });
  });

  it('correctly incorporates backfilled dates into streaks', () => {
    // Initially check-ins on Aug 23, Aug 25 (today) -> current streak 1 (since Aug 24 missed)
    let result = StreakService.calculateStreaks(['2026-08-23', '2026-08-25'], today);
    expect(result).toEqual({ currentStreak: 1, longestStreak: 1 });

    // User backfills Aug 24
    result = StreakService.calculateStreaks(['2026-08-23', '2026-08-24', '2026-08-25'], today);
    expect(result).toEqual({ currentStreak: 3, longestStreak: 3 });
  });

  it('handles duplicate or unsorted date entries safely', () => {
    const checkIns = ['2026-08-25', '2026-08-24', '2026-08-25', '2026-08-23'];
    const result = StreakService.calculateStreaks(checkIns, today);
    expect(result).toEqual({ currentStreak: 3, longestStreak: 3 });
  });
});
