const { Router } = require('express');
const prisma = require('../../db');
const { authenticateToken } = require('../../middleware/auth.middleware');
const { verifyHabitOwnership } = require('../../middleware/authorizeHabit.middleware');
const { habitCreateSchema, checkInCreateSchema } = require('../../schemas/validation.schemas');
const { TimezoneService } = require('../../services/timezone.service');
const { StreakService } = require('../../services/streak.service');
const { AppError } = require('../../utils/errors');

const router = Router();

// Protect all habit routes with JWT auth
router.use(authenticateToken);

// GET /api/habits - List user's habits with today status & streaks
router.get('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userTimezone = req.user.timezone;

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

    const todayLocalDate = TimezoneService.getTodayLocalDate(userTimezone);

    const habitSummaries = habits.map((habit) => {
      const checkInDates = habit.checkIns.map((ci) => ci.localDate);
      const isCompletedToday = checkInDates.includes(todayLocalDate);
      const streaks = StreakService.calculateStreaks(checkInDates, todayLocalDate);

      return {
        id: habit.id,
        name: habit.name,
        description: habit.description,
        createdAt: habit.createdAt,
        updatedAt: habit.updatedAt,
        isCompletedToday,
        todayLocalDate,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
        totalCheckIns: habit.checkIns.length,
      };
    });

    res.json({ habits: habitSummaries });
  } catch (error) {
    next(error);
  }
});

// POST /api/habits - Create a new habit
router.post('/', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const parseResult = habitCreateSchema.safeParse(req.body);

    if (!parseResult.success) {
      const issueMsgs = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new AppError(`Validation failed: ${issueMsgs}`, 422, parseResult.error.format());
    }

    const { name, description } = parseResult.data;

    const habit = await prisma.habit.create({
      data: {
        userId,
        name,
        description: description || null,
      },
    });

    res.status(201).json({ habit });
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/:id - Get a specific habit details with streaks
router.get('/:id', verifyHabitOwnership, async (req, res, next) => {
  try {
    const habitIdParam = req.params.id;
    const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;
    const userTimezone = req.user.timezone;

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      include: {
        checkIns: {
          select: { id: true, localDate: true, createdAt: true },
          orderBy: { localDate: 'desc' },
        },
      },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    const checkInDates = habit.checkIns.map((ci) => ci.localDate);
    const todayLocalDate = TimezoneService.getTodayLocalDate(userTimezone);
    const isCompletedToday = checkInDates.includes(todayLocalDate);
    const streaks = StreakService.calculateStreaks(checkInDates, todayLocalDate);

    res.json({
      habit: {
        ...habit,
        isCompletedToday,
        todayLocalDate,
        currentStreak: streaks.currentStreak,
        longestStreak: streaks.longestStreak,
      },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/habits/:id - Delete a habit
router.delete('/:id', verifyHabitOwnership, async (req, res, next) => {
  try {
    const habitIdParam = req.params.id;
    const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;

    await prisma.habit.delete({
      where: { id: habitId },
    });

    res.json({ message: 'Habit deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// GET /api/habits/:id/check-ins - Get check-in history for a habit
router.get('/:id/check-ins', verifyHabitOwnership, async (req, res, next) => {
  try {
    const habitIdParam = req.params.id;
    const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;

    const checkIns = await prisma.habitCheckIn.findMany({
      where: { habitId },
      orderBy: { localDate: 'desc' },
    });

    res.json({ checkIns });
  } catch (error) {
    next(error);
  }
});

// POST /api/habits/:id/check-ins - Check in for today or backfill a past local date
router.post('/:id/check-ins', verifyHabitOwnership, async (req, res, next) => {
  try {
    const habitIdParam = req.params.id;
    const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;
    const userTimezone = req.user.timezone;

    let targetLocalDate;

    if (req.body && req.body.localDate) {
      const parseResult = checkInCreateSchema.safeParse(req.body);
      if (!parseResult.success) {
        const issueMsgs = parseResult.error.issues.map((i) => i.message).join(', ');
        throw new AppError(`Validation failed: ${issueMsgs}`, 422, parseResult.error.format());
      }
      targetLocalDate = TimezoneService.normalizeLocalDate(parseResult.data.localDate);
    } else {
      // Default to user's current local date
      targetLocalDate = TimezoneService.getTodayLocalDate(userTimezone);
    }

    // Verify date is not in the user's future
    if (TimezoneService.isFutureLocalDate(targetLocalDate, userTimezone)) {
      throw new AppError(
        `Cannot check in for future date (${targetLocalDate}). Your current local date is ${TimezoneService.getTodayLocalDate(userTimezone)}.`,
        400
      );
    }

    // Verify date is not before habit creation local date
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { createdAt: true },
    });

    if (habit) {
      const habitCreationLocalDate = TimezoneService.getTodayLocalDate(userTimezone, habit.createdAt);
      if (targetLocalDate < habitCreationLocalDate) {
        throw new AppError(
          `Cannot check in for date (${targetLocalDate}) prior to habit creation date (${habitCreationLocalDate}).`,
          400
        );
      }
    }

    // Attempt to create check-in with DB unique constraint protection
    try {
      const checkIn = await prisma.habitCheckIn.create({
        data: {
          habitId,
          localDate: targetLocalDate,
        },
      });

      // Recalculate updated streaks
      const allCheckIns = await prisma.habitCheckIn.findMany({
        where: { habitId },
        select: { localDate: true },
      });
      const checkInDates = allCheckIns.map((ci) => ci.localDate);
      const todayLocalDate = TimezoneService.getTodayLocalDate(userTimezone);
      const streaks = StreakService.calculateStreaks(checkInDates, todayLocalDate);

      res.status(201).json({
        message: 'Check-in recorded successfully',
        checkIn,
        streaks,
      });
    } catch (dbError) {
      // P2002 is Prisma unique constraint violation code
      if (dbError.code === 'P2002') {
        throw new AppError(`Check-in already exists for date ${targetLocalDate}`, 409);
      }
      throw dbError;
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
