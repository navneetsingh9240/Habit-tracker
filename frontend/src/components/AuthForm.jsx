import React, { useState } from 'react';
import { COMMON_TIMEZONES } from '../utils/timezones';

export const AuthForm = ({
  type,
  onSubmit,
  loading,
  error,
  onSwitchMode,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (type === 'register') {
      onSubmit({ email, password, timezone });
    } else {
      onSubmit({ email, password });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-slate-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
            Habit Tracker
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {type === 'login'
              ? 'Welcome back! Sign in to track your habits.'
              : 'Create an account to start building positive daily habits.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              minLength={type === 'register' ? 8 : 1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800 text-sm"
            />
            {type === 'register' && (
              <p className="text-xs text-slate-400 mt-1">
                Must be at least 8 characters long.
              </p>
            )}
          </div>

          {type === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Your IANA Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-slate-800 text-sm bg-white"
              >
                {!COMMON_TIMEZONES.includes(timezone) && (
                  <option value={timezone}>{timezone}</option>
                )}
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">
                Used to determine your local calendar days for check-ins and streaks.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition disabled:opacity-50 text-sm cursor-pointer"
          >
            {loading ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {type === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={onSwitchMode}
                className="text-indigo-600 font-semibold hover:underline"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
