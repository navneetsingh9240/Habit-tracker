const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { AppError } = require('../utils/errors');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Authentication token required', 401);
    }

    const secret = process.env.JWT_SECRET || 'fallback-secret';
    let decoded;

    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      throw new AppError('Invalid or expired token', 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, timezone: true },
    });

    if (!user) {
      throw new AppError('User not found or session invalid', 401);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticateToken };
