const { z } = require('zod');
const { TimezoneService } = require('../services/timezone.service');

const registerSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
  timezone: z
    .string()
    .trim()
    .refine((tz) => TimezoneService.isValidTimezone(tz), {
      message: 'Invalid IANA timezone (e.g., "Asia/Kolkata", "America/New_York")',
    }),
});

const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required'),
});

const habitCreateSchema = z.object({
  name: z.string().trim().min(1, 'Habit name is required').max(100, 'Habit name must not exceed 100 characters'),
  description: z.string().trim().max(500, 'Description must not exceed 500 characters').optional().nullable(),
});

const checkInCreateSchema = z.object({
  localDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

module.exports = {
  registerSchema,
  loginSchema,
  habitCreateSchema,
  checkInCreateSchema,
};
