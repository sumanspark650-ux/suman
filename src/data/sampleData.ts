import { Student, Room, AllotmentSettings } from '../types';

export const SAMPLE_STUDENTS: Student[] = [];

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room-01',
    name: 'Hall 101 (Main Block)',
    rows: 5,
    cols: 4,
    seatsPerDesk: 2,
    blockedSeats: []
  },
  {
    id: 'room-02',
    name: 'Hall 102 (Engineering Block)',
    rows: 4,
    cols: 4,
    seatsPerDesk: 2,
    blockedSeats: [{ row: 1, col: 1, seatIndex: 0 }]
  },
  {
    id: 'room-03',
    name: 'Seminar Hall B (Auditorium)',
    rows: 6,
    cols: 5,
    seatsPerDesk: 3,
    blockedSeats: [
      { row: 0, col: 0, seatIndex: 0 },
      { row: 0, col: 4, seatIndex: 2 }
    ]
  }
];

export const DEFAULT_SCHEDULE = {
  sessionName: 'Mid-Term Examinations - Spring 2026',
  date: '2026-04-15',
  timeSlot: '10:00 AM - 01:00 PM',
  academicYear: '2025-2026',
  institutionName: 'Institute of Engineering & Advanced Technology'
};

export const DEFAULT_SETTINGS: AllotmentSettings = {
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
};
