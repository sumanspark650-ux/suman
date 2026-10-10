import React, { useState } from 'react';
import { AllotmentResult, Room, SeatAllocation, Student } from '../types';
import { getDepartmentColor } from '../utils/seatingAlgorithm';
import { Building2, User, ArrowLeftRight, CheckCircle2, AlertTriangle, Eye, Info, Sparkles, MapPin, Hash, BookOpen } from 'lucide-react';

interface RoomVisualizerProps {
  result: AllotmentResult;
  rooms: Room[];
  onManualSwap: (seatAId: string, seatBId: string) => void;
}

export const RoomVisualizer: React.FC<RoomVisualizerProps> = ({
  result,
  rooms,
  onManualSwap
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id || '');
  const [selectedSeat, setSelectedSeat] = useState<SeatAllocation | null>(null);
  const [swapTargetSeat, setSwapTargetSeat] = useState<SeatAllocation | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);
  const [viewDensity, setViewDensity] = useState<'compact' | 'normal' | 'detailed'>('normal');

  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];
  const roomAllocations = result.allocations.filter(a => a.roomId === (activeRoom?.id || ''));

  if (!activeRoom) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        No exam rooms available to display.
      </div>
    );
  }

  const roomSummary = result.roomSummaries.find(r => r.roomId === activeRoom.id);

  // Helper to find allocation at row, col, seatIndex
  const getAllocationAt = (r: number, c: number, s: number) => {
    return roomAllocations.find(a => a.row === r && a.col === c && a.seatIndex === s);
  };

  const isSeatBlocked = (r: number, c: number, s: number) => {
    return activeRoom.blockedSeats.some(b => b.row === r && b.col === c && b.seatIndex === s);
  };

  const handleSeatClick = (alloc?: SeatAllocation) => {
    if (!alloc) return;

    if (isSwapMode) {
      if (!selectedSeat) {
        setSelectedSeat(alloc);
      } else if (selectedSeat.id !== alloc.id) {
        setSwapTargetSeat(alloc);
      }
    } else {
      setSelectedSeat(alloc);
    }
  };

  const handleExecuteSwap = () => {
    if (selectedSeat && swapTargetSeat) {
      onManualSwap(selectedSeat.id, swapTargetSeat.id);
      setSelectedSeat(null);
      setSwapTargetSeat(null);
      setIsSwapMode(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Room Selection Tabs & Visual Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Halls:</span>
          {rooms.map(room => {
            const summary = result.roomSummaries.find(s => s.roomId === room.id);
            const isSelected = selectedRoomId === room.id;
            return (
              <button
                key={room.id}
                id={`btn-tab-room-${room.id}`}
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setSelectedSeat(null);
                  setSwapTargetSeat(null);
                  setIsSwapMode(false);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>{room.name}</span>
                {summary && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {summary.allocatedCount}/{summary.usableSeats}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View density and swap modes */}
        <div className="flex items-center gap-2.5 justify-end">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewDensity('compact')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewDensity === 'compact' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setViewDensity('normal')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewDensity === 'normal' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setViewDensity('detailed')}
              className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-colors ${
                viewDensity === 'detailed' ? 'bg-white text-slate-900 shadow-2xs font-semibold' : 'text-slate-600'
              }`}
            >
              Full Info
            </button>
          </div>

          <button
            onClick={() => {
              setIsSwapMode(!isSwapMode);
              setSelectedSeat(null);
              setSwapTargetSeat(null);
            }}
            id="btn-toggle-swap-mode"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
              isSwapMode
                ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
            <span>{isSwapMode ? 'Cancel Swap' : 'Manual Swap'}</span>
          </button>
        </div>
      </div>

      {/* Swap Mode Action Banner */}
      {isSwapMode && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {!selectedSeat
                ? 'Click the FIRST candidate seat you wish to move.'
                : !swapTargetSeat
                ? `Selected: ${selectedSeat.student.name} (${selectedSeat.seatLabel}). Now click the SECOND candidate seat to swap with.`
                : `Ready to swap ${selectedSeat.student.rollNo} ↔ ${swapTargetSeat.student.rollNo}!`}
            </span>
          </div>

          {selectedSeat && swapTargetSeat && (
            <button
              onClick={handleExecuteSwap}
              id="btn-confirm-seat-swap"
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Confirm Swap Seats
            </button>
          )}
        </div>
      )}

      {/* 2D Interactive Classroom Floor Map Canvas */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl text-white overflow-hidden">
        {/* Blackboard / Teacher Podium */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="bg-slate-800 border-2 border-emerald-600/40 rounded-xl py-2 px-4 text-center shadow-inner relative">
            <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Chalkboard / Invigilator Podium
            </div>
            <div className="text-[10px] text-slate-400">
              Room: {activeRoom.name} • Rows: {activeRoom.rows} | Columns: {activeRoom.cols} • Invigilator: {activeRoom.invigilatorName || 'Assigned Staff'}
            </div>
            {/* Front Stage Indicator Marker */}
            <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-900 border-t-2 border-l-2 border-emerald-500 rotate-45"></div>
          </div>
        </div>

        {/* Room Grid Matrix */}
        <div className="overflow-x-auto pb-4">
          <div
            className="grid gap-3 sm:gap-4 mx-auto w-max min-w-full justify-center"
            style={{
              gridTemplateColumns: `repeat(${activeRoom.cols}, minmax(130px, 1fr))`
            }}
          >
            {Array.from({ length: activeRoom.rows }).map((_, r) =>
              Array.from({ length: activeRoom.cols }).map((_, c) => {
                const deskNumber = r * activeRoom.cols + c + 1;
                return (
                  <div
                    key={`${r}_${c}`}
                    className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 flex flex-col justify-between shadow-xs transition-all hover:border-slate-500"
                  >
                    {/* Desk Header */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2 pb-1 border-b border-slate-700/50">
                      <span className="font-mono font-semibold text-slate-300">Desk {deskNumber}</span>
                      <span className="text-[9px] text-slate-500">R{r + 1} C{c + 1}</span>
                    </div>

                    {/* Desk Seats (Benches) */}
                    <div className={`grid gap-1.5 ${
                      activeRoom.seatsPerDesk === 1 ? 'grid-cols-1' : activeRoom.seatsPerDesk === 2 ? 'grid-cols-2' : 'grid-cols-3'
                    }`}>
                      {Array.from({ length: activeRoom.seatsPerDesk }).map((_, s) => {
                        const isBlocked = isSeatBlocked(r, c, s);
                        const alloc = getAllocationAt(r, c, s);
                        const seatLetter = String.fromCharCode(65 + s);
                        const isSelectedForSwap = (selectedSeat?.id === alloc?.id) || (swapTargetSeat?.id === alloc?.id);

                        if (isBlocked) {
                          return (
                            <div
                              key={s}
                              className="bg-rose-950/40 border border-rose-800/50 rounded-lg p-2 text-center flex flex-col items-center justify-center min-h-[72px]"
                            >
                              <span className="text-[10px] font-bold text-rose-400">Seat {seatLetter}</span>
                              <span className="text-[9px] text-rose-500">BLOCKED</span>
                            </div>
                          );
                        }

                        if (!alloc) {
                          return (
                            <div
                              key={s}
                              className="bg-slate-800/40 border border-dashed border-slate-700 rounded-lg p-2 text-center flex flex-col items-center justify-center min-h-[72px] text-slate-500"
                            >
                              <span className="text-[10px] font-mono">Seat {seatLetter}</span>
                              <span className="text-[9px] italic">Empty</span>
                            </div>
                          );
                        }

                        const deptColors = getDepartmentColor(alloc.student.department);

                        return (
                          <div
                            key={s}
                            onClick={() => handleSeatClick(alloc)}
                            id={`seat-card-${alloc.id}`}
                            className={`rounded-lg p-2 text-left cursor-pointer transition-all border flex flex-col justify-between min-h-[76px] relative group ${
                              isSelectedForSwap
                                ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400 shadow-md scale-102'
                                : 'bg-slate-900/90 border-slate-700 hover:border-blue-400 hover:bg-slate-800'
                            }`}
                          >
                            <div>
                              {/* Seat badge & Branch badge */}
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <span className="text-[10px] font-mono font-bold text-slate-400">
                                  {seatLetter}
                                </span>
                                <span
                                  className={`text-[9px] px-1.5 py-0.2 rounded font-semibold truncate max-w-[85px] ${deptColors.badgeBg} text-white`}
                                  title={alloc.student.department}
                                >
                                  {alloc.student.department.split(' ')[0]}
                                </span>
                              </div>

                              {/* Roll Number */}
                              <div className="text-xs font-bold text-white font-mono tracking-tight truncate">
                                {alloc.student.rollNo}
                              </div>

                              {/* Student Name */}
                              {(viewDensity === 'normal' || viewDensity === 'detailed') && (
                                <div className="text-[11px] text-slate-300 font-medium truncate mt-0.5">
                                  {alloc.student.name}
                                </div>
                              )}

                              {/* Subject Code */}
                              {viewDensity === 'detailed' && (
                                <div className="text-[9px] font-mono text-slate-400 truncate mt-0.5">
                                  {alloc.student.subjectCode}
                                </div>
                              )}
                            </div>

                            {/* Click to inspect hint on hover */}
                            <div className="mt-1 pt-1 border-t border-slate-800 text-[8px] text-slate-500 group-hover:text-blue-300 transition-colors">
                              {alloc.seatLabel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Room Bottom Legend */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-slate-300">Department Palette:</span>
            {roomSummary && Object.keys(roomSummary.departmentCounts).map(dept => {
              const colors = getDepartmentColor(dept);
              return (
                <div key={dept} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${colors.badgeBg}`}></span>
                  <span className="text-slate-300">{dept}</span>
                  <span className="text-slate-500 font-mono">({roomSummary.departmentCounts[dept]})</span>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-slate-400">
            Total Seated in {activeRoom.name}: <strong className="text-white">{roomAllocations.length}</strong> / {activeRoom.rows * activeRoom.cols * activeRoom.seatsPerDesk}
          </div>
        </div>
      </div>

      {/* Seat Inspector Modal */}
      {selectedSeat && !isSwapMode && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-slate-900">
            <div className="flex items-start justify-between gap-2 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                  {selectedSeat.seatLabel.split('-')[1] || 'S'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedSeat.student.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedSeat.student.rollNo}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedSeat(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Candidate Details Grid */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400 block font-medium">Department</span>
                  <span className="font-semibold text-slate-800">{selectedSeat.student.department}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Subject Code</span>
                  <span className="font-semibold font-mono text-slate-800">{selectedSeat.student.subjectCode}</span>
                </div>
              </div>

              {selectedSeat.student.subjectName && (
                <div>
                  <span className="text-slate-400 block font-medium">Subject Title</span>
                  <span className="font-semibold text-slate-800">{selectedSeat.student.subjectName}</span>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                <div>
                  <span className="text-slate-400 block font-medium">Exam Hall</span>
                  <span className="font-bold text-blue-700">{selectedSeat.roomName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Desk Code</span>
                  <span className="font-bold text-slate-800">{selectedSeat.deskCode}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Seat Label</span>
                  <span className="font-bold font-mono text-slate-800">{selectedSeat.seatLabel}</span>
                </div>
              </div>
            </div>

            {/* Location Navigation Directions */}
            <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-start gap-2 text-xs text-blue-900">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Physical Coordinates:</strong> Row {selectedSeat.row + 1}, Column {selectedSeat.col + 1} (
                {selectedSeat.seatIndex === 0 ? 'Left Bench Position' : selectedSeat.seatIndex === 1 ? 'Right Bench Position' : 'Center Position'}
                )
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-5">
              <button
                onClick={() => {
                  setIsSwapMode(true);
                }}
                className="px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Move / Swap Seat</span>
              </button>
              <button
                onClick={() => setSelectedSeat(null)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


