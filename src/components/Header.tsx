import React from 'react';
import { Users, Building2, Grid3X3, Search, Code2, Sparkles, Download, Calendar, Clock } from 'lucide-react';
import { AllotmentSettings, Room, Student } from '../types';

interface HeaderProps {
  activeTab: 'students' | 'rooms' | 'allotment' | 'lookup' | 'python';
  setActiveTab: (tab: 'students' | 'rooms' | 'allotment' | 'lookup' | 'python') => void;
  studentsCount: number;
  roomsCount: number;
  totalRoomCapacity: number;
  allocatedCount: number;
  settings: AllotmentSettings;
  setSettings: React.Dispatch<React.SetStateAction<AllotmentSettings>>;
  onOpenExportModal: () => void;
  onOpenPythonModal: () => void;
  onLoadSampleData: () => void;
}

interface TabItem {
  id: 'students' | 'rooms' | 'allotment' | 'lookup' | 'python';
  label: string;
  icon: React.ElementType;
  count?: number;
  badge?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  studentsCount,
  roomsCount,
  totalRoomCapacity,
  allocatedCount,
  settings,
  setSettings,
  onOpenExportModal,
  onOpenPythonModal,
  onLoadSampleData
}) => {
  const tabs: TabItem[] = [
    { id: 'students', label: '1. Students Database', icon: Users, count: studentsCount },
    { id: 'rooms', label: '2. Exam Rooms', icon: Building2, count: roomsCount },
    { id: 'allotment', label: '3. Seating Engine & Map', icon: Grid3X3, badge: allocatedCount > 0 ? `${allocatedCount} Seated` : undefined },
    { id: 'lookup', label: '4. Student Search & Slips', icon: Search },
    { id: 'python', label: 'Python Script', icon: Code2 }
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner with Exam Title & Quick Details */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm font-bold text-lg tracking-wider">
            ES
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                ExamSeat
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 rounded-full">
                Sitting Allotment Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Anti-cheating interleaved multi-branch seating allocator with room layout visualizers
            </p>
          </div>
        </div>

        {/* Exam Schedule Bar & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onLoadSampleData}
            id="btn-sample-data"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            title="Load ready-made 100 students across 4 branches & 3 exam halls"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Load Demo Data</span>
          </button>

          {allocatedCount > 0 && (
            <button
              onClick={onOpenExportModal}
              id="btn-export-pdf-excel"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export & Print</span>
            </button>
          )}

          <button
            onClick={onOpenPythonModal}
            id="btn-view-python-code"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>Python Engine</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between overflow-x-auto border-t border-slate-100 scrollbar-none">
        <nav className="flex space-x-1 sm:space-x-2 py-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-200 text-blue-800' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick status counters */}
        <div className="hidden lg:flex items-center gap-4 text-xs text-slate-500 py-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>Students: <strong className="text-slate-800">{studentsCount}</strong></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Room Capacity: <strong className="text-slate-800">{totalRoomCapacity}</strong></span>
          </div>
          {allocatedCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Allotted: <strong className="text-emerald-700">{allocatedCount}</strong></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
