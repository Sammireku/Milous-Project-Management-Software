import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Layers, 
  Share2, 
  Globe, 
  MoreHorizontal, 
  Check, 
  X,
  Compass,
  Sparkles,
  Info
} from 'lucide-react';
import { useFirestore } from '../../context/FirestoreContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';

export const CalendarsWorkspaceView: React.FC = () => {
  const { tasks, createTask, projects } = useFirestore();
  const { user } = useAuth();

  // Onboarding modal (shown on first visit or via help button)
  const [showTour, setShowTour] = useState<boolean>(() => {
    return !localStorage.getItem('milous_calendar_tour_seen');
  });
  const [tourStep, setTourStep] = useState(1);

  // Calendar state
  const [viewMode, setViewMode] = useState<'Month' | 'Quarter' | 'Year'>('Month');
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 12)); // September 2026
  const [activeCalendars, setActiveCalendars] = useState<string[]>(['my_work', 'project_milestones']);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('2026-09-15');

  const finishTour = () => {
    setShowTour(false);
    localStorage.setItem('milous_calendar_tour_seen', 'true');
  };

  const handleNextTour = () => {
    if (tourStep < 3) {
      setTourStep(tourStep + 1);
    } else {
      finishTour();
    }
  };

  const handleBackTour = () => {
    if (tourStep > 1) {
      setTourStep(tourStep - 1);
    }
  };

  // Calendar days calculation for September 2026
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = [];
  const currentMonthDays = [];
  for (let i = 1; i <= daysInMonth; i++) {
    currentMonthDays.push(i);
  }

  const handleAddQuickEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    await createTask({
      projectId: projects[0]?.id || 'default-proj',
      title: newEventTitle.trim(),
      description: 'Scheduled on calendar',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: user?.id || 'usr-milou-01',
      assigneeName: user?.displayName || 'Milou Mireku',
      plannedStartDate: `${newEventDate}T09:00:00.000Z`,
      plannedEndDate: `${newEventDate}T17:00:00.000Z`,
      dependencies: [],
      blockedBy: [],
    });
    setNewEventTitle('');
    setIsAddModalOpen(false);
  };

  const tasksWithDates = tasks.filter((t) => t.plannedStartDate || t.plannedEndDate);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* 3-Step Walkthrough Modal */}
      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 flex flex-col">
            {/* Tour Illustration Header */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-slate-100 p-8 flex flex-col items-center justify-center border-b border-slate-100 relative">
              <button
                onClick={finishTour}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>

              {tourStep === 1 && (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                    <CalendarIcon className="w-8 h-8" />
                  </div>
                  <div className="w-48 h-10 bg-white/80 rounded-lg border border-emerald-200 shadow-2xs p-2 flex items-center justify-between text-xs">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-slate-700">Team Work Calendar</span>
                    <span className="text-[10px] text-slate-400">Sep 2026</span>
                  </div>
                </div>
              )}

              {tourStep === 2 && (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-600/20">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-3 py-1 bg-white rounded-md text-xs font-semibold text-slate-700 shadow-2xs border border-slate-200">Q1 Roadmaps</span>
                    <span className="px-3 py-1 bg-teal-100 rounded-md text-xs font-semibold text-teal-800 shadow-2xs border border-teal-200">Q2 Deadlines</span>
                  </div>
                </div>
              )}

              {tourStep === 3 && (
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 text-white flex items-center justify-center shadow-lg shadow-slate-900/20">
                    <Share2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 shadow-2xs">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Shareable link for partners & team</span>
                  </div>
                </div>
              )}
            </div>

            {/* Tour Body */}
            <div className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-slate-900 text-center">
                Calendars help plan, visualize and share work
              </h3>

              {tourStep === 1 && (
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Organize and plan your tasks and projects on a calendar. Color-code layers to create clear schedules with easy color legends.
                </p>
              )}

              {tourStep === 2 && (
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Use Month, Quarter, and Year views to build roadmaps connected to your work. Easily visualize upcoming deadlines on a high-level overview.
                </p>
              )}

              {tourStep === 3 && (
                <p className="text-sm text-slate-600 text-center leading-relaxed">
                  Collaborate with your team or share view-only links to loop in clients and partners with zero technical setup.
                </p>
              )}

              {/* Step Dots */}
              <div className="flex justify-center space-x-2 pt-2">
                {[1, 2, 3].map((step) => (
                  <button
                    key={step}
                    onClick={() => setTourStep(step)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      tourStep === step ? 'w-6 bg-emerald-600' : 'bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Tour Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={finishTour}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5"
              >
                Later
              </button>

              <div className="flex items-center space-x-2">
                {tourStep > 1 && (
                  <button
                    onClick={handleBackTour}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={handleNextTour}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  {tourStep === 3 ? 'Got it!' : 'Next'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Calendar Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-bold text-slate-900">Calendar</h2>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-slate-800 pl-1">
              {monthNames[month]} {year}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            {(['Month', 'Quarter', 'Year'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-md transition-all ${
                  viewMode === m
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowTour(true)}
            title="Help & overview"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          >
            <Info className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add to calendar</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex flex-1 gap-4 overflow-hidden">
        {/* Left Calendars Sidebar */}
        <div className="w-64 bg-white rounded-xl border border-slate-200/80 p-4 flex flex-col space-y-4 shrink-0 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              My calendars
            </span>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={activeCalendars.includes('my_work')}
                onChange={(e) => {
                  if (e.target.checked) setActiveCalendars([...activeCalendars, 'my_work']);
                  else setActiveCalendars(activeCalendars.filter((c) => c !== 'my_work'));
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="font-medium text-slate-800">My to-dos & work</span>
            </label>

            <label className="flex items-center space-x-2.5 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50">
              <input
                type="checkbox"
                checked={activeCalendars.includes('project_milestones')}
                onChange={(e) => {
                  if (e.target.checked) setActiveCalendars([...activeCalendars, 'project_milestones']);
                  else setActiveCalendars(activeCalendars.filter((c) => c !== 'project_milestones'));
                }}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="font-medium text-slate-800">Important deadlines</span>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
            <p className="font-semibold text-slate-700">Quick Tips</p>
            <p className="leading-relaxed">
              Click any calendar day to quickly schedule a task or due date.
            </p>
          </div>
        </div>

        {/* Right Calendar Grid / Empty State */}
        <div className="flex-1 bg-white rounded-xl border border-slate-200/80 p-4 shadow-2xs overflow-auto flex flex-col">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-slate-200 text-center py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* If there are NO items with dates, show the friendly lighthouse empty state */}
          {tasksWithDates.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
              {/* Cute lighthouse SVG / illustration */}
              <div className="w-24 h-24 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shadow-xs">
                <svg className="w-12 h-12 text-emerald-600" viewBox="0 0 64 64" fill="none">
                  <path d="M28 14H36L38 48H26L28 14Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M24 48H40L44 56H20L24 48Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2.5" />
                  <circle cx="32" cy="10" r="4" fill="currentColor" />
                  <path d="M12 24L26 20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                  <path d="M52 24L38 20" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                </svg>
              </div>

              <div className="max-w-md space-y-1">
                <h3 className="text-base font-bold text-slate-900">Nothing to show here</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a calendar or schedule an item to see work appear on the calendar.
                </p>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add first item</span>
              </button>
            </div>
          ) : (
            /* Month Calendar Grid */
            <div className="grid grid-cols-7 flex-1 auto-rows-fr gap-px bg-slate-200 border-b border-slate-200">
              {/* Empty leading days */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-50/60 p-2 min-h-[90px]" />
              ))}

              {/* Month Days */}
              {currentMonthDays.map((day) => {
                const dayString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayTasks = tasks.filter((t) => {
                  const s = t.plannedStartDate?.split('T')[0];
                  const e = t.plannedEndDate?.split('T')[0];
                  return s === dayString || e === dayString;
                });
                const isToday = day === 12 && month === 8;

                return (
                  <div
                    key={day}
                    onClick={() => {
                      setNewEventDate(dayString);
                      setIsAddModalOpen(true);
                    }}
                    className="bg-white p-2 min-h-[90px] hover:bg-emerald-50/20 transition-colors cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center ${
                          isToday
                            ? 'bg-emerald-600 text-white shadow-2xs font-bold'
                            : 'text-slate-700 group-hover:text-emerald-700'
                        }`}
                      >
                        {day}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 text-emerald-600" />
                    </div>

                    <div className="space-y-1 mt-1">
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className="px-2 py-0.5 rounded bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-[11px] font-medium truncate"
                        >
                          {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">Add to calendar</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuickEvent} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Team Planning Session"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 text-xs"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none focus:border-emerald-600 text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
