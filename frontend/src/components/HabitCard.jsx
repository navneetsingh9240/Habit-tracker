import React from 'react';
import { Flame, Trophy, CheckCircle2, Eye, Plus } from 'lucide-react';

export const HabitCard = ({
  habit,
  todayLocalDate,
  onCheckIn,
  onSelect,
  checkingInId,
}) => {
  const isCheckingIn = checkingInId === habit.id;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <h3
            onClick={() => onSelect(habit)}
            className="text-lg font-bold text-slate-800 hover:text-indigo-600 transition cursor-pointer line-clamp-1"
          >
            {habit.name}
          </h3>
          <button
            onClick={() => onSelect(habit)}
            className="text-slate-400 hover:text-indigo-600 p-1 rounded transition cursor-pointer"
            title="View Details & History"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>

        {habit.description && (
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {habit.description}
          </p>
        )}

        {/* Streaks */}
        <div className="flex items-center space-x-4 mt-4 py-2 px-3 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center text-xs font-semibold text-orange-600">
            <Flame className="w-4 h-4 mr-1 fill-orange-500 text-orange-500" />
            <span>{habit.currentStreak} current</span>
          </div>
          <div className="w-px h-4 bg-slate-200" />
          <div className="flex items-center text-xs font-semibold text-amber-600">
            <Trophy className="w-4 h-4 mr-1 text-amber-500" />
            <span>{habit.longestStreak} max</span>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">
          {todayLocalDate}
        </span>

        {habit.isCompletedToday ? (
          <button
            disabled
            className="flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 cursor-default"
          >
            <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-600" /> Completed
          </button>
        ) : (
          <button
            onClick={() => onCheckIn(habit.id)}
            disabled={isCheckingIn}
            className="flex items-center px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-sm transition disabled:opacity-50 cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1" />
            {isCheckingIn ? 'Saving...' : 'Check In'}
          </button>
        )}
      </div>
    </div>
  );
};
