const { DateTime } = require('luxon');

class StreakService {
  /**
   * Calculates current and longest streaks given check-in local dates (YYYY-MM-DD) and user's current local date.
   *
   * @param {string[]} checkInDates Array of YYYY-MM-DD date strings
   * @param {string} todayLocalDate Current local date of the user in YYYY-MM-DD
   */
  static calculateStreaks(checkInDates, todayLocalDate) {
    if (!checkInDates || checkInDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Deduplicate and sort dates in ascending order
    const uniqueDates = Array.from(new Set(checkInDates)).sort();
    const dateSet = new Set(uniqueDates);

    // Calculate longest streak across all check-ins
    let longestStreak = 0;
    let tempStreak = 0;
    let prevDt = null;

    for (const dateStr of uniqueDates) {
      const currentDt = DateTime.fromISO(dateStr, { zone: 'utc' });
      if (!currentDt.isValid) continue;

      if (!prevDt) {
        tempStreak = 1;
      } else {
        const diffDays = Math.round(currentDt.diff(prevDt, 'days').days);
        if (diffDays === 1) {
          tempStreak += 1;
        } else {
          tempStreak = 1;
        }
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
      prevDt = currentDt;
    }

    // Calculate current streak relative to todayLocalDate
    const todayDt = DateTime.fromISO(todayLocalDate, { zone: 'utc' });
    const yesterdayDt = todayDt.minus({ days: 1 });
    const yesterdayLocalDate = yesterdayDt.toISODate();

    let currentStreak = 0;
    let startPointDt = null;

    if (dateSet.has(todayLocalDate)) {
      startPointDt = todayDt;
    } else if (dateSet.has(yesterdayLocalDate)) {
      startPointDt = yesterdayDt;
    }

    if (startPointDt) {
      let checkDt = startPointDt;
      while (dateSet.has(checkDt.toISODate())) {
        currentStreak++;
        checkDt = checkDt.minus({ days: 1 });
      }
    }

    return {
      currentStreak,
      longestStreak,
    };
  }
}

module.exports = { StreakService };
