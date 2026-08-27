const { DateTime } = require('luxon');

class TimezoneService {
  /**
   * Checks if an IANA timezone string is valid.
   */
  static isValidTimezone(timezone) {
    if (!timezone || typeof timezone !== 'string') return false;
    const dt = DateTime.now().setZone(timezone);
    return dt.isValid;
  }

  /**
   * Returns the user's current local date in YYYY-MM-DD format.
   * @param {string} timezone User's IANA timezone
   * @param {Date} [referenceDate] Optional JavaScript Date object (defaults to current system time)
   */
  static getTodayLocalDate(timezone, referenceDate) {
    const baseLuxon = referenceDate ? DateTime.fromJSDate(referenceDate) : DateTime.now();
    const userLocal = baseLuxon.setZone(timezone);
    if (!userLocal.isValid) {
      throw new Error(`Invalid timezone: ${timezone}`);
    }
    return userLocal.toISODate(); // Returns YYYY-MM-DD
  }

  /**
   * Normalizes and validates a given ISO date string or date object into YYYY-MM-DD local format.
   */
  static normalizeLocalDate(dateStr) {
    const dt = DateTime.fromISO(dateStr, { zone: 'utc' });
    if (!dt.isValid) {
      throw new Error(`Invalid local date format: ${dateStr}`);
    }
    return dt.toISODate(); // Returns YYYY-MM-DD
  }

  /**
   * Checks if the given local date string (YYYY-MM-DD) is in the user's future relative to the user's current time.
   */
  static isFutureLocalDate(targetLocalDate, timezone, referenceDate) {
    const todayLocalDate = this.getTodayLocalDate(timezone, referenceDate);
    const targetDt = DateTime.fromISO(targetLocalDate, { zone: 'utc' });
    const todayDt = DateTime.fromISO(todayLocalDate, { zone: 'utc' });

    if (!targetDt.isValid) {
      throw new Error(`Invalid target date: ${targetLocalDate}`);
    }

    return targetDt > todayDt;
  }
}

module.exports = { TimezoneService };
