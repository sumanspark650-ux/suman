import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { StudentManager } from './components/StudentManager';
import { RoomManager } from './components/RoomManager';
import { AllotmentControls } from './components/AllotmentControls';
import { RoomVisualizer } from './components/RoomVisualizer';
import { AnalyticsPanel } from './components/AnalyticsPanel';
import { StudentLookup } from './components/StudentLookup';
import { PrintExportModal } from './components/PrintExportModal';
import { AllotmentResult, AllotmentSettings, Room, Student } from './types';
import { generateSampleStudents, SAMPLE_ROOMS } from './utils/sampleData';
import { calculateRoomCapacity, generateSeatingAllotment } from './utils/seatingAlgorithm';
import { Sparkles, Grid3X3 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'students' | 'rooms' | 'allotment' | 'lookup'>('allotment');

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
  const handleGenerateAllotment = (customSettings?: AllotmentSettings) => {
    const activeSettings = customSettings || settings;
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateSeatingAllotment(students, rooms, activeSettings);
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
      </main>

      {/* Export / Print Hub Modal */}
      <PrintExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        result={allotmentResult}
      />
    </div>
  );
}
