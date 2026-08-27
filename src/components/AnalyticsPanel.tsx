import React from 'react';
import { ShieldCheck, AlertTriangle, Users, Building2, PieChart, CheckCircle2 } from 'lucide-react';
import { AllotmentResult } from '../types';
import { getDepartmentColor } from '../utils/seatingAlgorithm';

interface AnalyticsPanelProps {
  result: AllotmentResult;
}

export const AnalyticsPanel: React.FC<AnalyticsPanelProps> = ({ result }) => {
  const { metrics, roomSummaries } = result;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-600" />
            Seating Optimization & Fairness Analytics
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown of multi-branch separation and room capacity efficiency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {metrics.adjacentClashesCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              100% Anti-Cheating Isolation
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              {metrics.adjacentClashesCount} Adjacent Clashes
            </span>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Total Candidates</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {metrics.totalStudents}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">
            {metrics.totalAllocated} Allocated ({metrics.unallocatedCount} unseated)
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Room Usable Capacity</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
            {metrics.totalRoomCapacity}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Across {roomSummaries.length} Examination Halls
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Overall Occupancy</div>
          <div className="text-xl sm:text-2xl font-black text-blue-700 mt-1">
            {metrics.overallOccupancy}%
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            {metrics.totalRoomCapacity - metrics.totalAllocated} Spare seats available
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <div className="text-xs text-slate-500 font-medium">Fairness Index</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {metrics.fairnessScore}%
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
            Branch Separation Score
          </div>
        </div>
      </div>

      {/* Room-wise Occupancy & Branch Spread */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Room Occupancy & Multi-Branch Spread
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {roomSummaries.map(room => (
            <div key={room.roomId} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900 mb-1">
                <span>{room.roomName}</span>
                <span className="text-blue-700">{room.occupancyPercentage}% Occupied</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${room.occupancyPercentage}%` }}
                />
              </div>

              <div className="text-[11px] text-slate-500 flex justify-between mb-2">
                <span>Seats Filled: <strong>{room.allocatedCount} / {room.usableSeats}</strong></span>
              </div>

              {/* Department breakdown tags */}
              <div className="flex flex-wrap gap-1 pt-1.5 border-t border-slate-200/80">
                {Object.keys(room.departmentCounts).map(dept => {
                  const colors = getDepartmentColor(dept);
                  return (
                    <span
                      key={dept}
                      className={`text-[10px] px-1.5 py-0.2 rounded font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                    >
                      {dept.split(' ')[0]}: {room.departmentCounts[dept]}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clash Report List (if any) */}
      {metrics.clashDetails.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Adjacent Branch Warnings ({metrics.clashDetails.length})</span>
          </div>
          <p className="text-xs text-amber-800">
            These occurred due to asymmetric student counts or compact single-hall limits:
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1 text-xs text-amber-900 pr-1">
            {metrics.clashDetails.map((c, i) => (
              <div key={i} className="p-1.5 bg-white/80 rounded border border-amber-200 flex items-center justify-between text-[11px]">
                <span><strong>{c.roomName}</strong>: {c.seatA} ↔ {c.seatB}</span>
                <span className="font-mono text-slate-700">{c.studentA} and {c.studentB}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
