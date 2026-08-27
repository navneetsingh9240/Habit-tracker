const prisma = require('../db');
const { AppError } = require('../utils/errors');

const verifyHabitOwnership = async (req, res, next) => {
  try {
    const habitIdParam = req.params.id || req.params.habitId;
    const habitId = Array.isArray(habitIdParam) ? habitIdParam[0] : habitIdParam;

    if (!habitId) {
      throw new AppError('Habit ID required', 400);
    }

    const userId = req.user?.id;
    if (!userId) {
      throw new AppError('Unauthorized', 401);
    }

    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
      select: { id: true, userId: true },
    });

    if (!habit) {
      throw new AppError('Habit not found', 404);
    }

    if (habit.userId !== userId) {
      throw new AppError('Forbidden: You do not own this habit', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { verifyHabitOwnership };
