import React from 'react';
import { Sparkles, ShieldCheck, Shuffle, Sliders, RefreshCw, Cpu, Layers, GitFork } from 'lucide-react';
import { AllotmentSettings, AllotmentStrategy } from '../types';

interface AllotmentControlsProps {
  settings: AllotmentSettings;
  setSettings: React.Dispatch<React.SetStateAction<AllotmentSettings>>;
  onGenerate: () => void;
  isGenerating: boolean;
  canGenerate: boolean;
  totalStudents: number;
  totalCapacity: number;
}

export const AllotmentControls: React.FC<AllotmentControlsProps> = ({
  settings,
  setSettings,
  onGenerate,
  isGenerating,
  canGenerate,
  totalStudents,
  totalCapacity
}) => {
  const strategies: Array<{ id: AllotmentStrategy; title: string; desc: string; icon: any }> = [
    {
      id: 'interleaved_departments',
      title: 'Checkerboard Interleaving (Recommended)',
      desc: 'Alternates candidates from distinct departments across rows & columns to eliminate peer cheating.',
      icon: ShieldCheck
    },
     {
      id: 'snake_zigzag',
      title: 'Snake / Zigzag Traversal',
      desc: 'Traverses benches in alternating serpentine order while isolating branch neighbors.',
      icon: GitFork
    },
    {
      id: 'cross_subject_bench',
      title: 'Cross-Subject Desk Pairing',
      desc: 'Guarantees that bench partners on 2-seater desks are from completely different exam papers.',
      icon: Layers
    },
     {
      id: 'randomized_fair',
      title: 'Randomized Anti-Cheat Order',
      desc: 'Randomizes roll sequence while strictly keeping department spacing boundaries.',
      icon: Shuffle
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-600" />
            Seating Arrangement Optimization Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Select allocation strategy and configure anti-malpractice separation rules.
          </p>
        </div>

        <button
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          id="btn-generate-allotment-main"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer ${
            !canGenerate
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : isGenerating
              ? 'bg-blue-400 text-white cursor-wait'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white hover:shadow-lg'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Optimizing Seating Plan...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>⚡ Generate Fair Seating Plan</span>
            </>
          )}
        </button>
      </div>

      {/* Strategy Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {strategies.map(s => {
          const isSelected = settings.strategy === s.id;
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              id={`strategy-card-${s.id}`}
              onClick={() => setSettings(prev => ({ ...prev, strategy: s.id }))}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-200 text-blue-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="text-xs sm:text-sm font-bold text-slate-900 mb-1">
                  {s.title}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Constraints & Rule Toggles */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            id="checkbox-rule-same-desk"
            checked={settings.disallowSameDeptOnSameDesk}
            onChange={e => setSettings(prev => ({ ...prev, disallowSameDeptOnSameDesk: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Diff Branch on Same Desk</span>
            <span className="text-[11px] text-slate-500">Bench mates must differ</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            id="checkbox-rule-same-horizontal"
            checked={settings.disallowSameDeptAdjacentHorizontal}
            onChange={e => setSettings(prev => ({ ...prev, disallowSameDeptAdjacentHorizontal: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Isolate Horizontal Neighbors</span>
            <span className="text-[11px] text-slate-500">No same branch left/right</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            id="checkbox-rule-same-vertical"
            checked={settings.disallowSameDeptAdjacentVertical}
            onChange={e => setSettings(prev => ({ ...prev, disallowSameDeptAdjacentVertical: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Isolate Front-Back Rows</span>
            <span className="text-[11px] text-slate-500">No same branch behind</span>
          </div>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
          <input
            type="checkbox"
            id="checkbox-rule-same-subject"
            checked={settings.disallowSameSubjectAdjacent}
            onChange={e => setSettings(prev => ({ ...prev, disallowSameSubjectAdjacent: e.target.checked }))}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <div className="text-xs">
            <span className="font-semibold text-slate-800 block">Subject Code Isolation</span>
            <span className="text-[11px] text-slate-500">Different question papers</span>
          </div>
        </label>
      </div>

      {/* Exam Details Bar */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Examination Title</label>
          <input
            type="text"
            id="input-exam-title"
            value={settings.examTitle}
            onChange={e => setSettings(prev => ({ ...prev, examTitle: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. End Semester Examinations May 2026"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Exam Date</label>
          <input
            type="date"
            id="input-exam-date"
            value={settings.examDate}
            onChange={e => setSettings(prev => ({ ...prev, examDate: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Session / Timing</label>
          <input
            type="text"
            id="input-exam-time"
            value={settings.examTime}
            onChange={e => setSettings(prev => ({ ...prev, examTime: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. 09:30 AM - 12:30 PM (Morning)"
          />
        </div>
      </div>
    </div>
  );
};
