const { AppError } = require('../utils/errors');

const errorHandler = (err, req, res, next) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const details = err instanceof AppError ? err.details : undefined;

  if (statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  res.status(statusCode).json({
    error: {
      message: statusCode === 500 && process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : message,
      status: statusCode,
      ...(details ? { details } : {}),
    },
  });
};

module.exports = { errorHandler };
