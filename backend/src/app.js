const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRouter = require('./modules/auth/auth.router');
const habitsRouter = require('./modules/habits/habits.router');
const dashboardRouter = require('./modules/dashboard/dashboard.router');
const { errorHandler } = require('./middleware/error.middleware');

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
}));

app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/dashboard', dashboardRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Centralized error handler
app.use(errorHandler);

module.exports = app;
