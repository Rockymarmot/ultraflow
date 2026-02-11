import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, Pause, RotateCcw, Settings, TrendingUp } from 'lucide-react';

// Main App Component
function App() {
  const [view, setView] = useState('timer'); // 'timer', 'stats', 'settings'
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">UltraFlow</h1>
          <p className="text-sm text-gray-600">Optimize your learning cycles</p>
        </div>
      </nav>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <TabButton 
            active={view === 'timer'} 
            onClick={() => setView('timer')}
            icon={<Play size={16} />}
          >
            Focus Timer
          </TabButton>
          <TabButton 
            active={view === 'stats'} 
            onClick={() => setView('stats')}
            icon={<TrendingUp size={16} />}
          >
            Insights
          </TabButton>
          <TabButton 
            active={view === 'settings'} 
            onClick={() => setView('settings')}
            icon={<Settings size={16} />}
          >
            Settings
          </TabButton>
        </div>

        {/* Content Views */}
        {view === 'timer' && <TimerView />}
        {view === 'stats' && <StatsView />}
        {view === 'settings' && <SettingsView />}
      </div>
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, children, icon }) {
  return (
    <button
      onClick={onClick}
      style={{ touchAction: 'manipulation' }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
        active 
          ? 'bg-indigo-600 text-white shadow-md' 
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// Timer View Component
function TimerView() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ultradianSettings');
    return saved ? JSON.parse(saved) : {
      focusDuration: 90,
      breakDuration: 20,
      enableNotifications: true
    };
  });

  const [phase, setPhase] = useState('focus'); // 'focus' or 'break'
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [energyLevel, setEnergyLevel] = useState(null);
  
  const intervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handlePhaseComplete();
    }
    
    return () => clearInterval(intervalRef.current);
  }, [isRunning, timeLeft]);

  const handlePhaseComplete = () => {
    setIsRunning(false);
    
    // Notification
    if (settings.enableNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(
          phase === 'focus' ? 'Focus session complete!' : 'Break time over!',
          { body: phase === 'focus' ? 'Time for a break!' : 'Ready to focus again?' }
        );
      }
    }

    // Switch phase
    if (phase === 'focus') {
      setPhase('break');
      setTimeLeft(settings.breakDuration * 60);
      setSessionsCompleted(prev => prev + 1);
      
      // Prompt for energy level at end of focus session
      // (In production, this would be a nicer modal)
      setTimeout(() => {
        const level = prompt('How was your energy during that session? (1-5)');
        if (level && level >= 1 && level <= 5) {
          saveSession(parseInt(level));
        }
      }, 500);
    } else {
      setPhase('focus');
      setTimeLeft(settings.focusDuration * 60);
    }
  };

  const saveSession = (energy) => {
    const sessions = JSON.parse(localStorage.getItem('ultradianSessions') || '[]');
    sessions.push({
      date: new Date().toISOString(),
      duration: settings.focusDuration,
      energyLevel: energy,
      timeOfDay: new Date().getHours()
    });
    localStorage.setItem('ultradianSessions', JSON.stringify(sessions));
  };

  const toggleTimer = async () => {
    // Request notification permission only once, and don't block the timer
    if (!isRunning && settings.enableNotifications && 'Notification' in window && Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.log('Notification permission request failed:', error);
        // Continue anyway - don't block the timer
      }
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('focus');
    setTimeLeft(settings.focusDuration * 60);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = phase === 'focus' 
    ? ((settings.focusDuration * 60 - timeLeft) / (settings.focusDuration * 60)) * 100
    : ((settings.breakDuration * 60 - timeLeft) / (settings.breakDuration * 60)) * 100;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Phase Indicator */}
      <div className="text-center mb-8">
        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
          phase === 'focus' 
            ? 'bg-indigo-100 text-indigo-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {phase === 'focus' ? '🎯 Focus Phase' : '☕ Break Time'}
        </div>
      </div>

      {/* Timer Display */}
      <div className="relative w-64 h-64 mx-auto mb-8">
        {/* Progress Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx="128"
            cy="128"
            r="120"
            stroke={phase === 'focus' ? '#4f46e5' : '#10b981'}
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 120}`}
            strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Time Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800">
              {formatTime(timeLeft)}
            </div>
            <div className="text-sm text-gray-500 mt-2">
              {phase === 'focus' ? settings.focusDuration : settings.breakDuration} min session
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            toggleTimer();
          }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all active:scale-95 ${
            isRunning
              ? 'bg-gray-600 hover:bg-gray-700 text-white'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
          }`}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} />}
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            resetTimer();
          }}
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 transition-all active:scale-95"
        >
          <RotateCcw size={20} />
          Reset
        </button>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">{sessionsCompleted}</div>
          <div className="text-sm text-gray-600">Sessions Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {sessionsCompleted * settings.focusDuration}
          </div>
          <div className="text-sm text-gray-600">Minutes Focused</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-indigo-600">
            {Math.floor((sessionsCompleted * (settings.focusDuration + settings.breakDuration)) / 60)}
          </div>
          <div className="text-sm text-gray-600">Hours Total</div>
        </div>
      </div>
    </div>
  );
}

// Stats View Component
function StatsView() {
  const [sessions, setSessions] = useState([]);
  const [timeframe, setTimeframe] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem('ultradianSessions') || '[]');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - (timeframe === 'week' ? 7 : 30));
    
    const filtered = data.filter(s => new Date(s.date) >= cutoffDate);
    setSessions(filtered);
  }, [timeframe]);

  // Process data for charts
  const dailyData = sessions.reduce((acc, session) => {
    const date = new Date(session.date).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = { date, sessions: 0, totalMinutes: 0, avgEnergy: 0, energyCount: 0 };
    }
    acc[date].sessions++;
    acc[date].totalMinutes += session.duration;
    acc[date].avgEnergy += session.energyLevel;
    acc[date].energyCount++;
    return acc;
  }, {});

  const chartData = Object.values(dailyData).map(day => ({
    ...day,
    avgEnergy: (day.avgEnergy / day.energyCount).toFixed(1)
  }));

  // Time of day analysis
  const hourData = sessions.reduce((acc, session) => {
    const hour = session.timeOfDay;
    if (!acc[hour]) {
      acc[hour] = { hour: `${hour}:00`, sessions: 0, avgEnergy: 0, count: 0 };
    }
    acc[hour].sessions++;
    acc[hour].avgEnergy += session.energyLevel;
    acc[hour].count++;
    return acc;
  }, {});

  const hourChartData = Object.values(hourData)
    .map(h => ({
      ...h,
      avgEnergy: (h.avgEnergy / h.count).toFixed(1)
    }))
    .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));

  const avgEnergy = sessions.length > 0
    ? (sessions.reduce((sum, s) => sum + s.energyLevel, 0) / sessions.length).toFixed(1)
    : 0;

  const totalSessions = sessions.length;
  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SummaryCard
          title="Total Sessions"
          value={totalSessions}
          subtitle={`in the last ${timeframe === 'week' ? '7 days' : '30 days'}`}
          color="indigo"
        />
        <SummaryCard
          title="Focus Time"
          value={`${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`}
          subtitle="productive work"
          color="blue"
        />
        <SummaryCard
          title="Avg Energy"
          value={`${avgEnergy}/5`}
          subtitle="session quality"
          color="green"
        />
      </div>

      {/* Timeframe Toggle */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setTimeframe('week')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            timeframe === 'week'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeframe('month')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            timeframe === 'month'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Last 30 Days
        </button>
      </div>

      {/* Charts */}
      {sessions.length > 0 ? (
        <>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Daily Activity</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="sessions" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  name="Sessions"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Energy Levels by Time of Day</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Bar dataKey="avgEnergy" fill="#10b981" name="Avg Energy" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <h3 className="text-lg font-semibold mb-3">💡 Insights</h3>
            <ul className="space-y-2 text-sm">
              <li>
                • Your best energy time is around{' '}
                <strong>
                  {hourChartData.length > 0
                    ? hourChartData.sort((a, b) => b.avgEnergy - a.avgEnergy)[0].hour
                    : 'N/A'}
                </strong>
              </li>
              <li>
                • You average <strong>{(totalMinutes / totalSessions).toFixed(0)} minutes</strong> per focus session
              </li>
              {avgEnergy >= 4 && <li>• Great work! Your energy levels are consistently high 🌟</li>}
              {avgEnergy < 3 && <li>• Consider adjusting session length or break times to maintain energy</li>}
            </ul>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No data yet</h3>
          <p className="text-gray-600">Complete some focus sessions to see your insights!</p>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
  const colors = {
    indigo: 'from-indigo-500 to-indigo-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-2xl shadow-lg p-6 text-white`}>
      <div className="text-sm opacity-90 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-75">{subtitle}</div>
    </div>
  );
}

// Settings View Component
function SettingsView() {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ultradianSettings');
    return saved ? JSON.parse(saved) : {
      focusDuration: 90,
      breakDuration: 20,
      enableNotifications: true
    };
  });

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('ultradianSettings', JSON.stringify(newSettings));
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Customize Your Cycles</h2>
      
      <div className="space-y-6">
        {/* Focus Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Focus Duration (minutes)
          </label>
          <input
            type="range"
            min="30"
            max="120"
            step="5"
            value={settings.focusDuration}
            onChange={(e) => updateSetting('focusDuration', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>30 min</span>
            <span className="font-semibold text-indigo-600">{settings.focusDuration} min</span>
            <span>120 min</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Research suggests 90-120 minutes for deep focus work
          </p>
        </div>

        {/* Break Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Break Duration (minutes)
          </label>
          <input
            type="range"
            min="5"
            max="30"
            step="5"
            value={settings.breakDuration}
            onChange={(e) => updateSetting('breakDuration', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>5 min</span>
            <span className="font-semibold text-green-600">{settings.breakDuration} min</span>
            <span>30 min</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            15-20 minutes recommended for optimal recovery
          </p>
        </div>

        {/* Notifications */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div>
            <div className="font-medium text-gray-800">Enable Notifications</div>
            <div className="text-sm text-gray-600">Get alerts when sessions end</div>
          </div>
          <button
            onClick={() => updateSetting('enableNotifications', !settings.enableNotifications)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings.enableNotifications ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.enableNotifications ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-900 mb-2">About Ultradian Rhythms</h4>
          <p className="text-sm text-blue-800">
            Your brain naturally cycles between high and low alertness every 90-120 minutes. 
            By aligning your work with these cycles and taking strategic breaks, you can 
            maintain peak performance and avoid burnout.
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;