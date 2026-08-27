const { Router } = require('express');
const prisma = require('../../db');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { TimezoneService } = require('../../services/timezone.service');
const { StreakService } = require('../../services/streak.service');

const router = Router();

// GET /api/dashboard - Summary dashboard for authenticated user
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userTimezone = req.user.timezone;
    const todayLocalDate = TimezoneService.getTodayLocalDate(userTimezone);

    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        checkIns: {
          select: { localDate: true, createdAt: true },
          orderBy: { localDate: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let totalCheckInsCount = 0;
    let habitsCompletedTodayCount = 0;

    const habitSummaries = habits.map((habit) => {
      const checkInDates = habit.checkIns.map((ci) => ci.localDate);
      const isCompletedToday = checkInDates.includes(todayLocalDate);
      if (isCompletedToday) habitsCompletedTodayCount++;
      totalCheckInsCount += checkInDates.length;

      const streaks = StreakService.calculateStreaks(checkInDates, todayLocalDate);

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        isCompletedToday,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        recentCheckIns: checkInDates.slice(0, 7), // Last 7 check-in dates
      };
    });

    res.json({
      user: req.user,
      todayLocalDate,
      stats: {
        totalHabits: habits.length,
        habitsCompletedToday: habitsCompletedTodayCount,
        totalCheckIns: totalCheckInsCount,
      },
      habits: habitSummaries,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
