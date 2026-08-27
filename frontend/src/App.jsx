import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthForm } from './components/AuthForm';
import { HabitCard } from './components/HabitCard';
import { CreateHabitModal } from './components/CreateHabitModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { LogOut, Plus, RefreshCw, Clock, CheckCircle2, Flame, Layers } from 'lucide-react';

export function App() {
  const { token, user, loading: authLoading, login, logout } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [authError, setAuthError] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashError, setDashError] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState(null);
  const [checkingInId, setCheckingInId] = useState(null);

  const fetchDashboard = useCallback(async () => {
    if (!token) return;
    try {
      setDashLoading(true);
      setDashError(null);
      const res = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          logout();
          return;
        }
        const data = await res.json();
        throw new Error(data.error?.message || 'Failed to load dashboard');
      }

      const data = await res.json();
      setDashboardData(data);
    } catch (err) {
      setDashError(err.message);
    } finally {
      setDashLoading(false);
    }
  }, [token, logout]);

  useEffect(() => {
    if (token && user) {
      fetchDashboard();
    }
  }, [token, user]);

  const handleAuthSubmit = async (formData) => {
    try {
      setAuthSubmitting(true);
      setAuthError(null);
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Authentication failed');
      }

      login(data.token, data.user);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthSubmitting(false);
    }
  };

  const handleCreateHabit = async (name, description) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, description }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error?.message || 'Failed to create habit');
    }

    await fetchDashboard();
  };

  const handleQuickCheckIn = async (habitId) => {
    try {
      setCheckingInId(habitId);
      const res = await fetch(`/api/habits/${habitId}/check-ins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error?.message || 'Check-in failed');
        return;
      }

      await fetchDashboard();
    } catch (err) {
      alert(err.message);
    } finally {
      setCheckingInId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
        Loading...
      </div>
    );
  }

  if (!token || !user) {
    return (
      <AuthForm
        type={authMode}
        onSubmit={handleAuthSubmit}
        loading={authSubmitting}
        error={authError}
        onSwitchMode={() => {
          setAuthMode(authMode === 'login' ? 'register' : 'login');
          setAuthError(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
              H
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 leading-tight">
                Habit Tracker
              </h1>
              <p className="text-xs text-slate-500 flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-400" />
                Timezone: <span className="font-semibold text-slate-600 ml-1">{user.timezone}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 bg-slate-100 rounded-full text-slate-600">
              {user.email}
            </span>
            <button
              onClick={logout}
              className="flex items-center text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 mr-1" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-8">
        {/* Header section & actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Dashboard
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Local calendar day:{' '}
              <span className="font-semibold text-indigo-600">
                {dashboardData?.todayLocalDate || 'Loading...'}
              </span>
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={fetchDashboard}
              className="p-2.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition cursor-pointer"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${dashLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5" /> New Habit
            </button>
          </div>
        </div>

        {/* Stats Summary Banner */}
        {dashboardData && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Habits
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardData.stats.totalHabits}
                </p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Completed Today
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardData.stats.habitsCompletedToday} / {dashboardData.stats.totalHabits}
                </p>
              </div>
            </div>

            <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Check-ins
                </p>
                <p className="text-2xl font-extrabold text-slate-900">
                  {dashboardData.stats.totalCheckIns}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {dashError && (
          <div className="p-4 mb-6 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
            {dashError}
          </div>
        )}

        {/* Habits list */}
        {dashLoading && !dashboardData ? (
          <div className="text-center py-16 text-slate-400">Loading your habits...</div>
        ) : dashboardData?.habits.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No habits tracked yet</h3>
            <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
              Start building positive routines today. Create your first habit to get started!
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition cursor-pointer"
            >
              Create Habit
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData?.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                todayLocalDate={dashboardData.todayLocalDate}
                onCheckIn={handleQuickCheckIn}
                onSelect={(h) => setSelectedHabit(h)}
                checkingInId={checkingInId}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateHabitModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateHabit}
      />

      <HabitDetailModal
        habit={selectedHabit}
        token={token}
        userTimezone={user.timezone}
        todayLocalDate={dashboardData?.todayLocalDate || ''}
        onClose={() => setSelectedHabit(null)}
        onCheckInSuccess={fetchDashboard}
        onDeleteSuccess={fetchDashboard}
      />
    </div>
  );
}

export default App;
