import React, { useState, useMemo } from 'react';
import { Search, MapPin, Building2, User, BookOpen, Clock, Calendar, Printer, CheckCircle2, QrCode, AlertCircle } from 'lucide-react';
import { AllotmentResult, Room, SeatAllocation } from '../types';
import { getDepartmentColor } from '../utils/seatingAlgorithm';

interface StudentLookupProps {
  result: AllotmentResult;
  rooms: Room[];
}

export const StudentLookup: React.FC<StudentLookupProps> = ({
  result,
  rooms
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAllocation, setSelectedAllocation] = useState<SeatAllocation | null>(
    result.allocations[0] || null
  );

  // Auto-search and filter allocations
  const matchingAllocations = useMemo(() => {
    if (!searchQuery.trim()) return result.allocations.slice(0, 15);
    const q = searchQuery.toLowerCase().trim();
    return result.allocations.filter(
      a =>
        a.student.rollNo.toLowerCase().includes(q) ||
        a.student.name.toLowerCase().includes(q) ||
        a.student.department.toLowerCase().includes(q) ||
        a.roomName.toLowerCase().includes(q)
    );
  }, [result.allocations, searchQuery]);

  const activeRoom = useMemo(() => {
    if (!selectedAllocation) return null;
    return rooms.find(r => r.id === selectedAllocation.roomId) || null;
  }, [selectedAllocation, rooms]);

  const handlePrintSlip = () => {
    window.print();
  };

  if (result.allocations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600">
          <Search className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">No Seating Allotment Generated Yet</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1">
          Please run the seating generator in Tab 3 first to generate the student room allocations.
        </p>
      </div>
    );
  }

  const deptColors = selectedAllocation ? getDepartmentColor(selectedAllocation.student.department) : null;

  return (
    <div className="space-y-6">
      {/* Search Bar Banner */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="max-w-xl mx-auto text-center mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center justify-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Candidate Exam Sitting & Hall Locator
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Search by Candidate Roll Number, Name, or Department to locate exam room and exact desk coordinates.
          </p>
        </div>

        <div className="max-w-xl mx-auto relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            id="input-candidate-search"
            placeholder="Enter Roll Number (e.g. 2026-CS-001) or Candidate Name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-xs"
          />
        </div>

        {/* Search Results Quick List */}
        {searchQuery.trim() && (
          <div className="max-w-xl mx-auto mt-3 max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-md">
            {matchingAllocations.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No matching candidate found for "{searchQuery}".
              </div>
            ) : (
              matchingAllocations.map(alloc => (
                <div
                  key={alloc.id}
                  onClick={() => setSelectedAllocation(alloc)}
                  className={`p-3 text-xs flex items-center justify-between cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedAllocation?.id === alloc.id ? 'bg-blue-50/80 font-semibold text-blue-900' : 'text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-slate-900">{alloc.student.rollNo}</span>
                    <span className="text-slate-700">{alloc.student.name}</span>
                    <span className="text-slate-400 text-[11px]">({alloc.student.department})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-blue-700">{alloc.roomName}</span>
                    <span className="text-slate-400 ml-2 font-mono">{alloc.seatLabel}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Selected Student Seating Slip & Interactive Minimap */}
      {selectedAllocation && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Hall Ticket & Seating Slip Card */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-6 flex flex-col justify-between print:shadow-none print:border-none">
            <div>
              {/* Slip Header */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    Official Exam Seating Pass
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    {result.settings.examTitle || 'Semester Examination'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {result.settings.academicSession || '2026 Academic Session'}
                  </p>
                </div>

                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-sm">
                  {selectedAllocation.student.department.substring(0, 2).toUpperCase()}
                </div>
              </div>

              {/* Candidate Info */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Candidate Full Name</span>
                  <span className="text-base font-bold text-slate-900">{selectedAllocation.student.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Roll / Reg Number</span>
                    <span className="font-mono font-bold text-sm text-slate-900">{selectedAllocation.student.rollNo}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Department</span>
                    <span className="font-semibold text-slate-800">{selectedAllocation.student.department}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Subject Code</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedAllocation.student.subjectCode}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">Semester</span>
                    <span className="font-semibold text-slate-800">{selectedAllocation.student.semester ? `Semester ${selectedAllocation.student.semester}` : 'Regular'}</span>
                  </div>
                </div>

                {/* Big Golden Room & Desk Callout Box */}
                <div className="my-4 p-4 rounded-xl bg-blue-50/70 border-2 border-blue-200 text-blue-950">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                    Allocated Examination Seat
                  </div>
                  <div className="text-xl font-black text-blue-900">
                    {selectedAllocation.roomName}
                  </div>
                  <div className="flex items-center gap-4 mt-2 font-mono text-sm">
                    <div>
                      <span className="text-xs text-blue-600 block">Desk:</span>
                      <strong>{selectedAllocation.deskCode}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 block">Seat Label:</span>
                      <strong>{selectedAllocation.seatLabel}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-blue-600 block">Position:</span>
                      <strong>
                        {selectedAllocation.seatIndex === 0 ? 'Left' : selectedAllocation.seatIndex === 1 ? 'Right' : 'Center'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="flex items-center justify-between text-slate-600 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{result.settings.examDate || 'Scheduled Date'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{result.settings.examTime || 'Session Time'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Print Slip Button */}
            <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-[11px] text-slate-400">
                Carry valid College ID to the hall
              </span>
              <button
                onClick={handlePrintSlip}
                id="btn-print-hall-pass"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Pass</span>
              </button>
            </div>
          </div>

          {/* Interactive Minimap Showing Exact Desk in Room */}
          <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-md text-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    Room Seating Map: {selectedAllocation.roomName}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Glowing seat indicates candidate's exact allotted position.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="text-slate-400 block font-mono">
                    Row {selectedAllocation.row + 1}, Col {selectedAllocation.col + 1}
                  </span>
                </div>
              </div>

              {/* Teacher Board / Front */}
              <div className="bg-slate-800/80 border border-emerald-500/30 rounded-lg py-1.5 text-center text-[10px] font-bold tracking-wider text-emerald-400 uppercase mb-5">
                FRONT: TEACHER PODIUM & BLACKBOARD
              </div>

              {/* Minimap Grid */}
              {activeRoom && (
                <div className="overflow-x-auto pb-2">
                  <div
                    className="grid gap-2 mx-auto w-max min-w-full justify-center"
                    style={{
                      gridTemplateColumns: `repeat(${activeRoom.cols}, minmax(70px, 1fr))`
                    }}
                  >
                    {Array.from({ length: activeRoom.rows }).map((_, r) =>
                      Array.from({ length: activeRoom.cols }).map((_, c) => {
                        const isStudentDesk = r === selectedAllocation.row && c === selectedAllocation.col;
                        const deskNum = r * activeRoom.cols + c + 1;

                        return (
                          <div
                            key={`${r}_${c}`}
                            className={`p-2 rounded-lg text-center transition-all border ${
                              isStudentDesk
                                ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-400/80 shadow-lg scale-105'
                                : 'bg-slate-800/60 border-slate-700/60'
                            }`}
                          >
                            <div className="text-[9px] font-mono text-slate-400 mb-1">
                              Desk {deskNum}
                            </div>
                            <div className="flex gap-1 justify-center">
                              {Array.from({ length: activeRoom.seatsPerDesk }).map((_, s) => {
                                const isExactSeat = isStudentDesk && s === selectedAllocation.seatIndex;
                                const letter = String.fromCharCode(65 + s);
                                return (
                                  <div
                                    key={s}
                                    className={`w-6 h-6 rounded-xs text-[10px] font-bold flex items-center justify-center ${
                                      isExactSeat
                                        ? 'bg-blue-500 text-white ring-2 ring-white animate-bounce shadow-md'
                                        : isStudentDesk
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-slate-900 text-slate-500'
                                    }`}
                                  >
                                    {letter}
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
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Candidate: <strong className="text-white">{selectedAllocation.student.name}</strong></span>
              <span className="font-mono text-emerald-400">Seat: {selectedAllocation.seatLabel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
