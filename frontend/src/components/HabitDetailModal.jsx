import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Calendar, Flame, Trophy, Trash2, Plus } from 'lucide-react';
import { DateTime } from 'luxon';

export const HabitDetailModal = ({
  habit,
  token,
  userTimezone,
  todayLocalDate,
  onClose,
  onCheckInSuccess,
  onDeleteSuccess,
}) => {
  const [checkIns, setCheckIns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [backfillDate, setBackfillDate] = useState('');
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    if (!habit) return;

    const fetchCheckIns = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/habits/${habit.id}/check-ins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCheckIns(data.checkIns);
        }
      } catch (err) {
        console.error('Failed to fetch check-ins', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckIns();
    setActionError(null);
    setActionSuccess(null);
    setBackfillDate('');
  }, [habit, token]);

  if (!habit) return null;

  const handleCheckIn = async (dateStr) => {
    try {
      setCheckingIn(true);
      setActionError(null);
      setActionSuccess(null);

      const targetDate = dateStr || todayLocalDate;

      const res = await fetch(`/api/habits/${habit.id}/check-ins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ localDate: targetDate }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to check in');
      }

      setActionSuccess(`Check-in recorded for ${targetDate}`);
      setBackfillDate('');
      onCheckInSuccess();

      // Refresh check-ins list
      const updatedRes = await fetch(`/api/habits/${habit.id}/check-ins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setCheckIns(updatedData.checkIns);
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleDeleteHabit = async () => {
    if (!window.confirm(`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/habits/${habit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to delete habit');
      }

      onDeleteSuccess();
      onClose();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const checkedInDatesSet = new Set(checkIns.map((c) => c.localDate));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <button
            onClick={onClose}
            className="flex items-center text-slate-600 hover:text-slate-900 text-sm font-medium transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
          </button>
          <button
            onClick={handleDeleteHabit}
            className="flex items-center text-red-600 hover:text-red-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete Habit
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Title & Info */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{habit.name}</h2>
            {habit.description && (
              <p className="text-slate-600 text-sm mt-1">{habit.description}</p>
            )}
          </div>

          {/* Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-orange-500 text-white">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-orange-600 uppercase tracking-wider">
                  Current Streak
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {habit.currentStreak} {habit.currentStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-amber-500 text-white">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                  Longest Streak
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {habit.longestStreak} {habit.longestStreak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center space-x-3 col-span-2 sm:col-span-1">
              <div className="p-2.5 rounded-lg bg-indigo-500 text-white">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                  Total Check-ins
                </p>
                <p className="text-xl font-extrabold text-slate-900">
                  {checkIns.length}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {actionError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {actionError}
            </div>
          )}

          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg">
              {actionSuccess}
            </div>
          )}

          {/* Check-in / Backfill Actions */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
            <h3 className="text-sm font-semibold text-slate-800 flex items-center">
              <Calendar className="w-4 h-4 mr-2 text-indigo-600" /> Check-in & Backfill
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              {checkedInDatesSet.has(todayLocalDate) ? (
                <div className="flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 font-semibold text-sm rounded-lg border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Completed Today ({todayLocalDate})
                </div>
              ) : (
                <button
                  onClick={() => handleCheckIn(todayLocalDate)}
                  disabled={checkingIn}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition disabled:opacity-50 flex items-center cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Check In Today ({todayLocalDate})
                </button>
              )}
            </div>

            {/* Backfill Section */}
            <div className="pt-2 border-t border-slate-200">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Backfill a Missed Past Local Date
              </label>
              <div className="flex items-center gap-2 max-w-xs">
                <input
                  type="date"
                  max={todayLocalDate}
                  value={backfillDate}
                  onChange={(e) => setBackfillDate(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-sm focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleCheckIn(backfillDate)}
                  disabled={!backfillDate || checkingIn || backfillDate > todayLocalDate}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs rounded-lg transition disabled:opacity-40 cursor-pointer"
                >
                  Backfill
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dates in your future (after {todayLocalDate}) will be rejected by local date rules.
              </p>
            </div>
          </div>

          {/* History Timeline */}
          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">
              Check-in History
            </h3>
            {loading ? (
              <p className="text-sm text-slate-400">Loading history...</p>
            ) : checkIns.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-slate-50 p-4 rounded-lg border border-slate-100 text-center">
                No check-ins logged yet.
              </p>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg">
                {checkIns.map((ci) => (
                  <div key={ci.id} className="p-3 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-700">{ci.localDate}</span>
                    <span className="text-xs text-slate-400">
                      Logged {DateTime.fromISO(ci.createdAt).toRelative()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
