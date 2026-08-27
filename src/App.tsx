import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StudentManager } from './components/StudentManager';
import { RoomManager } from './components/RoomManager';
import { AllotmentControls } from './components/AllotmentControls';
import { RoomVisualizer } from './components/RoomVisualizer';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { StudentLookup } from './components/StudentLookup';
import { PrintExportModal } from './components/PrintExportModal';
import { PythonScriptModal } from './components/PythonScriptModal';
import { AllotmentResult, AllotmentSettings, Room, Student } from './types';
import { generateSampleStudents, SAMPLE_ROOMS } from './utils/sampleData';
import { calculateRoomCapacity, generateSeatingAllotment } from './utils/seatingAlgorithm';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Download, Code2, Users, Building2, Grid3X3, Search } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'students' | 'rooms' | 'allotment' | 'lookup' | 'python'>('allotment');

  // Core Data States
  const [students, setStudents] = useState<Student[]>(() => generateSampleStudents());
  const [rooms, setRooms] = useState<Room[]>(() => SAMPLE_ROOMS);

  // Settings State
  const [settings, setSettings] = useState<AllotmentSettings>({
    strategy: 'interleaved_departments',
    disallowSameDeptAdjacentHorizontal: true,
    disallowSameDeptAdjacentVertical: true,
    disallowSameDeptOnSameDesk: true,
    disallowSameSubjectAdjacent: true,
    emptySeatGapColumns: false,
    prioritizeFullRoomUsage: true,
    examTitle: 'University End-Semester Examinations',
    examDate: '2026-05-18',
    examTime: '09:30 AM - 12:30 PM',
    academicSession: 'Spring 2026 Final Session'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPythonModalOpen, setIsPythonModalOpen] = useState(false);

  // Initial Seating Result
  const [allotmentResult, setAllotmentResult] = useState<AllotmentResult>(() => {
    return generateSeatingAllotment(generateSampleStudents(), SAMPLE_ROOMS, {
      strategy: 'interleaved_departments',
      disallowSameDeptAdjacentHorizontal: true,
      disallowSameDeptAdjacentVertical: true,
      disallowSameDeptOnSameDesk: true,
      disallowSameSubjectAdjacent: true,
      emptySeatGapColumns: false,
      prioritizeFullRoomUsage: true,
      examTitle: 'University End-Semester Examinations',
      examDate: '2026-05-18',
      examTime: '09:30 AM - 12:30 PM',
      academicSession: 'Spring 2026 Final Session'
    });
  });

  // Calculate capacities
  const totalRoomCapacity = useMemo(() => {
    return rooms.reduce((acc, r) => acc + calculateRoomCapacity(r).usableSeats, 0);
  }, [rooms]);

  // Run seating algorithm
  const handleGenerateAllotment = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateSeatingAllotment(students, rooms, settings);
      setAllotmentResult(result);
      setIsGenerating(false);
      setActiveTab('allotment');
    }, 250);
  };

  // Manual seat swap handler
  const handleManualSwap = (seatAId: string, seatBId: string) => {
    setAllotmentResult(prev => {
      const allocs = [...prev.allocations];
      const idxA = allocs.findIndex(a => a.id === seatAId);
      const idxB = allocs.findIndex(a => a.id === seatBId);

      if (idxA === -1 || idxB === -1) return prev;

      // Swap student payloads
      const tempStudent = allocs[idxA].student;
      allocs[idxA].student = allocs[idxB].student;
      allocs[idxA].studentId = allocs[idxB].student.id;

      allocs[idxB].student = tempStudent;
      allocs[idxB].studentId = tempStudent.id;

      return {
        ...prev,
        allocations: allocs
      };
    });
  };

  // Reset to full sample dataset
  const handleLoadSampleData = () => {
    const sampleStds = generateSampleStudents();
    const sampleRms = SAMPLE_ROOMS;
    setStudents(sampleStds);
    setRooms(sampleRms);
    const newResult = generateSeatingAllotment(sampleStds, sampleRms, settings);
    setAllotmentResult(newResult);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top App Header & Tabs */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        studentsCount={students.length}
        roomsCount={rooms.length}
        totalRoomCapacity={totalRoomCapacity}
        allocatedCount={allotmentResult.allocations.length}
        settings={settings}
        setSettings={setSettings}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenPythonModal={() => setIsPythonModalOpen(true)}
        onLoadSampleData={handleLoadSampleData}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: Student Database */}
        {activeTab === 'students' && (
          <StudentManager
            students={students}
            setStudents={setStudents}
            onProceedToRooms={() => setActiveTab('rooms')}
          />
        )}

        {/* TAB 2: Room Configurations */}
        {activeTab === 'rooms' && (
          <RoomManager
            rooms={rooms}
            setRooms={setRooms}
            studentsCount={students.length}
            onProceedToAllotment={() => {
              handleGenerateAllotment();
              setActiveTab('allotment');
            }}
          />
        )}

        {/* TAB 3: Seating Engine, 2D Map Visualizer & Analytics */}
        {activeTab === 'allotment' && (
          <div className="space-y-6">
            {/* Seating Generation Controls & Rules */}
            <AllotmentControls
              settings={settings}
              setSettings={setSettings}
              onGenerate={handleGenerateAllotment}
              isGenerating={isGenerating}
              canGenerate={students.length > 0 && rooms.length > 0}
              totalStudents={students.length}
              totalCapacity={totalRoomCapacity}
            />

            {/* Visualizer & 2D Floor Plan */}
            {allotmentResult.allocations.length > 0 ? (
              <>
                <RoomVisualizer
                  result={allotmentResult}
                  rooms={rooms}
                  onManualSwap={handleManualSwap}
                />

                <AnalyticsPanel result={allotmentResult} />
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600">
                  <Grid3X3 className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Ready to Generate Seating Plan</h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
                  Click the button below to execute the multi-branch anti-cheating distribution algorithm across all {rooms.length} configured exam halls.
                </p>
                <button
                  onClick={handleGenerateAllotment}
                  id="btn-generate-seating-empty-view"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Generate Fair Seating Plan</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Candidate Search & Hall Slips */}
        {activeTab === 'lookup' && (
          <StudentLookup
            result={allotmentResult}
            rooms={rooms}
          />
        )}

        {/* TAB 5: Standalone Python Script Engine */}
        {activeTab === 'python' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Code2 className="w-5 h-5 text-emerald-600" />
                    Python Seating Allotment Engine
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Run the exact same anti-cheating exam sitting allocation algorithm on local CSV files using Python 3 & Pandas.
                  </p>
                </div>

                <button
                  onClick={() => setIsPythonModalOpen(true)}
                  id="btn-open-python-modal-tab"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .py Script</span>
                </button>
              </div>

              {/* Instructions on running Python code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs flex items-center justify-center mb-2">
                    1
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Export Students CSV</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Download your candidate roster in CSV format from Tab 1 or prepare a spreadsheet with Roll No, Name, and Branch columns.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center mb-2">
                    2
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Run Python Script</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-mono text-[11px] bg-white p-1.5 rounded border border-slate-200 mt-1">
                    python3 exam_seating_allotment.py
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center mb-2">
                    3
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-1">Get Notice Boards & CSV</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    The script outputs formatted console summaries and saves <code className="text-emerald-700 font-bold">seating_arrangement_output.csv</code> ready for distribution.
                  </p>
                </div>
              </div>
            </div>

            {/* Embedded Python Inspector */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 shadow-xl text-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
                <span className="font-mono text-emerald-400 font-bold">exam_seating_allotment.py</span>
                <span className="text-slate-500">Standalone Python 3 Script</span>
              </div>
              <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto max-h-96 p-2 leading-relaxed">
                {`# Exam Seating Allotment Engine - Python 3
# Multi-Department Interleaving & Anti-Cheating Seat Generator
import csv, json, sys
from collections import defaultdict

# 1. Load candidates from CSV
# 2. Configure hall grid dimensions (rows x cols x seats_per_bench)
# 3. Interleave branches across columns and desks
# 4. Export final master seating chart to CSV / Excel`}
              </pre>
            </div>
          </div>
        )}
      </main>

      {/* Export / Print Hub Modal */}
      <PrintExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        result={allotmentResult}
      />

      {/* Standalone Python Script Modal */}
      <PythonScriptModal
        isOpen={isPythonModalOpen}
        onClose={() => setIsPythonModalOpen(false)}
        students={students}
        rooms={rooms}
        settings={settings}
      />
    </div>
  );
}
