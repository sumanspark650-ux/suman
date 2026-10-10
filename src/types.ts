export interface Student {
  id: string;
  rollNo: string;
  name: string;
  department: string;
  subjectCode: string;
  subjectName?: string;
  semester?: string | number;
  year?: string | number;
  email?: string;
}

export interface BlockedSeat {
  row: number; // 0-indexed
  col: number; // 0-indexed
  seatIndex: number; // 0-indexed within desk
  reason?: string;
}

export interface Room {
  id: string;
  name: string;
  building?: string;
  floor?: string;
  rows: number;
  cols: number;
  seatsPerDesk: number; // 1 = single desk, 2 = double desk, 3 = triple bench
  blockedSeats: BlockedSeat[];
  invigilatorName?: string;
  invigilatorPhone?: string;
}

export type AllotmentStrategy = 
  | 'interleaved_departments' // Checkerboard / Round-robin across branches
  | 'snake_zigzag'            // Snake path interleaving
  | 'cross_subject_bench'     // Prioritize distinct subjects on same desk
  | 'randomized_fair'         // Shuffle within branch but strictly isolate neighbors
  | 'same_dept_rows'          // Place same Department / Branch across each classroom row
  | 'same_dept_cols'          // Place same Department / Branch down each classroom column
  | 'same_dept_rows_split_sides' // Place one Department in rows on one side and another Department in rows on the other side
  | 'desk_side_by_side_dept'  // Desk one side one department and other side other department seat one by one
  | 'zigzag_two_dept_desk_col' // Zigzag two departments in one desk one by one using column
  | 'same_dept_one_by_one_col' // Same department student one by one using column
  | 'sequential_roll';        // Keep roll order within branch stream

export interface AllotmentSettings {
  strategy: AllotmentStrategy;
  disallowSameDeptAdjacentHorizontal: boolean;
  disallowSameDeptAdjacentVertical: boolean;
  disallowSameDeptOnSameDesk: boolean;
  disallowSameSubjectAdjacent: boolean;
  emptySeatGapColumns: boolean;
  prioritizeFullRoomUsage: boolean;
  examTitle: string;
  examDate: string;
  examTime: string; // e.g. "09:30 AM - 12:30 PM"
  academicSession: string; // e.g. "Spring 2026 Mid-Semester"
}

export interface SeatAllocation {
  id: string;
  studentId: string;
  student: Student;
  roomId: string;
  roomName: string;
  row: number; // 0-indexed
  col: number; // 0-indexed
  seatIndex: number; // 0-indexed within desk (0: Left, 1: Right, etc.)
  benchNumber: number; // human-readable bench number e.g. 1, 2, 3...
  seatLabel: string; // e.g. "R1-C1-A", "B1-Left"
  deskCode: string; // e.g. "D-101"
}

export interface RoomDistributionSummary {
  roomId: string;
  roomName: string;
  totalSeats: number;
  usableSeats: number;
  allocatedCount: number;
  departmentCounts: Record<string, number>;
  subjectCounts: Record<string, number>;
  occupancyPercentage: number;
}

export interface SeatingMetrics {
  totalStudents: number;
  totalAllocated: number;
  unallocatedCount: number;
  totalRoomCapacity: number;
  overallOccupancy: number;
  fairnessScore: number; // 0 - 100%
  adjacentClashesCount: number; // cases where same dept/subject ended up adjacent
  clashDetails: Array<{
    roomId: string;
    roomName: string;
    seatA: string;
    seatB: string;
    studentA: string;
    studentB: string;
    type: 'same_dept' | 'same_subject';
  }>;
  departmentBreakdown: Record<string, number>;
}

export interface AllotmentResult {
  allocations: SeatAllocation[];
  unallocatedStudents: Student[];
  roomSummaries: RoomDistributionSummary[];
  metrics: SeatingMetrics;
  generatedAt: string;
  settings: AllotmentSettings;
}
