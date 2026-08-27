import { AllotmentResult, AllotmentSettings, Room, SeatAllocation, SeatingMetrics, Student, RoomDistributionSummary } from '../types';

export function calculateRoomCapacity(room: Room): { totalSeats: number; usableSeats: number } {
  const total = room.rows * room.cols * room.seatsPerDesk;
  const blocked = room.blockedSeats.length;
  return {
    totalSeats: total,
    usableSeats: Math.max(0, total - blocked)
  };
}

export function generateSeatingAllotment(
  students: Student[],
  rooms: Room[],
  settings: AllotmentSettings
): AllotmentResult {
  if (students.length === 0 || rooms.length === 0) {
    return {
      allocations: [],
      unallocatedStudents: [...students],
      roomSummaries: [],
      metrics: {
        totalStudents: students.length,
        totalAllocated: 0,
        unallocatedCount: students.length,
        totalRoomCapacity: 0,
        overallOccupancy: 0,
        fairnessScore: 100,
        adjacentClashesCount: 0,
        clashDetails: [],
        departmentBreakdown: {}
      },
      generatedAt: new Date().toISOString(),
      settings
    };
  }

  // Calculate department breakdowns
  const departmentBreakdown: Record<string, number> = {};
  students.forEach(s => {
    departmentBreakdown[s.department] = (departmentBreakdown[s.department] || 0) + 1;
  });

  // Group students by department or subject
  const studentsByDept: Record<string, Student[]> = {};
  students.forEach(student => {
    const dept = student.department || 'General';
    if (!studentsByDept[dept]) {
      studentsByDept[dept] = [];
    }
    studentsByDept[dept].push({ ...student });
  });

  // Sort or shuffle within department based on strategy
  Object.keys(studentsByDept).forEach(dept => {
    if (settings.strategy === 'randomized_fair') {
      studentsByDept[dept].sort(() => Math.random() - 0.5);
    } else {
      // Natural roll number sorting
      studentsByDept[dept].sort((a, b) => 
        a.rollNo.localeCompare(b.rollNo, undefined, { numeric: true, sensitivity: 'base' })
      );
    }
  });

  // Calculate room capacities
  let totalUsableCapacity = 0;
  rooms.forEach(r => {
    const { usableSeats } = calculateRoomCapacity(r);
    totalUsableCapacity += usableSeats;
  });

  const allocations: SeatAllocation[] = [];
  const roomSummaries: RoomDistributionSummary[] = [];

  // Helper to check if a seat is blocked
  const isBlocked = (room: Room, r: number, c: number, s: number) => {
    return room.blockedSeats.some(b => b.row === r && b.col === c && b.seatIndex === s);
  };

  // Helper to get department/subject queues copy
  const queues = Object.keys(studentsByDept).map(dept => ({
    department: dept,
    students: [...studentsByDept[dept]]
  }));

  // Track room grid allocations for fast adjacency lookups
  // key: `${roomId}_${row}_${col}_${seatIndex}` -> Student
  const seatGridMap = new Map<string, Student>();

  for (const room of rooms) {
    const { totalSeats, usableSeats } = calculateRoomCapacity(room);
    let allocatedInRoom = 0;
    const roomDeptCount: Record<string, number> = {};
    const roomSubjectCount: Record<string, number> = {};

    // Generate traversal sequence of seat positions in this room
    interface SeatPos {
      row: number;
      col: number;
      seatIndex: number;
      benchNumber: number;
    }
    const seatSequence: SeatPos[] = [];

    let currentBench = 1;
    if (settings.strategy === 'snake_zigzag') {
      for (let r = 0; r < room.rows; r++) {
        // Even rows left-to-right, odd rows right-to-left
        const colIndices = r % 2 === 0 
          ? Array.from({ length: room.cols }, (_, i) => i)
          : Array.from({ length: room.cols }, (_, i) => room.cols - 1 - i);

        for (const c of colIndices) {
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (!isBlocked(room, r, c, s)) {
              seatSequence.push({ row: r, col: c, seatIndex: s, benchNumber: currentBench });
            }
          }
          currentBench++;
        }
      }
    } else {
      // Column-first or Row-first standard order (Default: Column interleaving for exam fairness)
      for (let c = 0; c < room.cols; c++) {
        for (let r = 0; r < room.rows; r++) {
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (!isBlocked(room, r, c, s)) {
              seatSequence.push({ row: r, col: c, seatIndex: s, benchNumber: (r * room.cols + c + 1) });
            }
          }
        }
      }
    }

    // Now assign students to each available seat position in the sequence
    for (const pos of seatSequence) {
      // Check if all queues are empty
      const hasAnyStudent = queues.some(q => q.students.length > 0);
      if (!hasAnyStudent) break;

      // Find best candidate student from queues
      // Constraints:
      // 1. If pos.seatIndex > 0 (same desk partner at pos.seatIndex - 1), try to avoid same dept / subject
      // 2. Neighbor in row - 1, row + 1, col - 1, col + 1
      const neighborStudents: Student[] = [];

      // Same desk partner (left or right)
      for (let s = 0; s < room.seatsPerDesk; s++) {
        if (s !== pos.seatIndex) {
          const n = seatGridMap.get(`${room.id}_${pos.row}_${pos.col}_${s}`);
          if (n) neighborStudents.push(n);
        }
      }

      // Horizontal neighbor (adjacent column same row)
      if (pos.col > 0) {
        const n = seatGridMap.get(`${room.id}_${pos.row}_${pos.col - 1}_${pos.seatIndex}`);
        if (n) neighborStudents.push(n);
      }
      if (pos.col < room.cols - 1) {
        const n = seatGridMap.get(`${room.id}_${pos.row}_${pos.col + 1}_${pos.seatIndex}`);
        if (n) neighborStudents.push(n);
      }

      // Vertical neighbor (adjacent row same column)
      if (pos.row > 0) {
        const n = seatGridMap.get(`${room.id}_${pos.row - 1}_${pos.col}_${pos.seatIndex}`);
        if (n) neighborStudents.push(n);
      }
      if (pos.row < room.rows - 1) {
        const n = seatGridMap.get(`${room.id}_${pos.row + 1}_${pos.col}_${pos.seatIndex}`);
        if (n) neighborStudents.push(n);
      }

      const neighborDepts = new Set(neighborStudents.map(n => n.department));
      const neighborSubjects = new Set(neighborStudents.map(n => n.subjectCode));

      // Sort queues to prioritize queues with most remaining students,
      // but penalize queues matching adjacent neighbor departments/subjects
      const sortedQueues = [...queues]
        .filter(q => q.students.length > 0)
        .sort((a, b) => {
          const aDeptClash = neighborDepts.has(a.department) ? 1000 : 0;
          const bDeptClash = neighborDepts.has(b.department) ? 1000 : 0;

          const aNextSubject = a.students[0]?.subjectCode;
          const bNextSubject = b.students[0]?.subjectCode;
          const aSubClash = (aNextSubject && neighborSubjects.has(aNextSubject)) ? 500 : 0;
          const bSubClash = (bNextSubject && neighborSubjects.has(bNextSubject)) ? 500 : 0;

          const aScore = aDeptClash + aSubClash - a.students.length;
          const bScore = bDeptClash + bSubClash - b.students.length;

          return aScore - bScore;
        });

      if (sortedQueues.length > 0) {
        const chosenQueue = sortedQueues[0];
        const student = chosenQueue.students.shift()!;

        seatGridMap.set(`${room.id}_${pos.row}_${pos.col}_${pos.seatIndex}`, student);

        // Desk and Seat label formatting
        const seatLetter = String.fromCharCode(65 + pos.seatIndex); // A, B, C...
        const seatLabel = `R${pos.row + 1}C${pos.col + 1}-${seatLetter}`;
        const deskCode = `Desk ${pos.benchNumber}`;

        allocations.push({
          id: `alloc_${room.id}_${pos.row}_${pos.col}_${pos.seatIndex}`,
          studentId: student.id,
          student,
          roomId: room.id,
          roomName: room.name,
          row: pos.row,
          col: pos.col,
          seatIndex: pos.seatIndex,
          benchNumber: pos.benchNumber,
          seatLabel,
          deskCode
        });

        allocatedInRoom++;
        roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
        roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
      }
    }

    roomSummaries.push({
      roomId: room.id,
      roomName: room.name,
      totalSeats,
      usableSeats,
      allocatedCount: allocatedInRoom,
      departmentCounts: roomDeptCount,
      subjectCounts: roomSubjectCount,
      occupancyPercentage: usableSeats > 0 ? Math.round((allocatedInRoom / usableSeats) * 100) : 0
    });
  }

  // Find unallocated students
  const unallocatedStudents: Student[] = [];
  queues.forEach(q => {
    unallocatedStudents.push(...q.students);
  });

  // Calculate fairness metrics and identify adjacent clashes
  const clashDetails: SeatingMetrics['clashDetails'] = [];
  let adjacentClashesCount = 0;

  allocations.forEach(alloc => {
    // Check horizontal same-row right neighbor
    const rightNeighbor = allocations.find(
      a => a.roomId === alloc.roomId && a.row === alloc.row && a.col === alloc.col + 1 && a.seatIndex === alloc.seatIndex
    );
    if (rightNeighbor) {
      if (settings.disallowSameDeptAdjacentHorizontal && rightNeighbor.student.department === alloc.student.department) {
        adjacentClashesCount++;
        clashDetails.push({
          roomId: alloc.roomId,
          roomName: alloc.roomName,
          seatA: alloc.seatLabel,
          seatB: rightNeighbor.seatLabel,
          studentA: `${alloc.student.rollNo} (${alloc.student.department})`,
          studentB: `${rightNeighbor.student.rollNo} (${rightNeighbor.student.department})`,
          type: 'same_dept'
        });
      } else if (settings.disallowSameSubjectAdjacent && rightNeighbor.student.subjectCode === alloc.student.subjectCode) {
        adjacentClashesCount++;
        clashDetails.push({
          roomId: alloc.roomId,
          roomName: alloc.roomName,
          seatA: alloc.seatLabel,
          seatB: rightNeighbor.seatLabel,
          studentA: `${alloc.student.rollNo} (${alloc.student.subjectCode})`,
          studentB: `${rightNeighbor.student.rollNo} (${rightNeighbor.student.subjectCode})`,
          type: 'same_subject'
        });
      }
    }

    // Check same bench partner
    const benchPartner = allocations.find(
      a => a.roomId === alloc.roomId && a.row === alloc.row && a.col === alloc.col && a.seatIndex === alloc.seatIndex + 1
    );
    if (benchPartner) {
      if (settings.disallowSameDeptOnSameDesk && benchPartner.student.department === alloc.student.department) {
        adjacentClashesCount++;
        clashDetails.push({
          roomId: alloc.roomId,
          roomName: alloc.roomName,
          seatA: alloc.seatLabel,
          seatB: benchPartner.seatLabel,
          studentA: `${alloc.student.rollNo} (${alloc.student.department})`,
          studentB: `${benchPartner.student.rollNo} (${benchPartner.student.department})`,
          type: 'same_dept'
        });
      }
    }

    // Check vertical front-back neighbor
    const backNeighbor = allocations.find(
      a => a.roomId === alloc.roomId && a.row === alloc.row + 1 && a.col === alloc.col && a.seatIndex === alloc.seatIndex
    );
    if (backNeighbor) {
      if (settings.disallowSameDeptAdjacentVertical && backNeighbor.student.department === alloc.student.department) {
        adjacentClashesCount++;
        clashDetails.push({
          roomId: alloc.roomId,
          roomName: alloc.roomName,
          seatA: alloc.seatLabel,
          seatB: backNeighbor.seatLabel,
          studentA: `${alloc.student.rollNo} (${alloc.student.department})`,
          studentB: `${backNeighbor.student.rollNo} (${backNeighbor.student.department})`,
          type: 'same_dept'
        });
      }
    }
  });

  const totalAllocated = allocations.length;
  const overallOccupancy = totalUsableCapacity > 0 ? Math.round((totalAllocated / totalUsableCapacity) * 100) : 0;
  const potentialComparisons = Math.max(1, totalAllocated * 2);
  const rawScore = Math.max(0, 100 - (adjacentClashesCount / potentialComparisons) * 100);
  const fairnessScore = Math.round(rawScore * 10) / 10;

  return {
    allocations,
    unallocatedStudents,
    roomSummaries,
    metrics: {
      totalStudents: students.length,
      totalAllocated,
      unallocatedCount: unallocatedStudents.length,
      totalRoomCapacity: totalUsableCapacity,
      overallOccupancy,
      fairnessScore,
      adjacentClashesCount,
      clashDetails: clashDetails.slice(0, 20), // Top 20 for display
      departmentBreakdown
    },
    generatedAt: new Date().toISOString(),
    settings
  };
}

export function getDepartmentColor(department: string): { bg: string; text: string; border: string; badgeBg: string } {
  const hash = department.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const palette = [
    { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-300', badgeBg: 'bg-blue-600' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-300', badgeBg: 'bg-emerald-600' },
    { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-300', badgeBg: 'bg-amber-600' },
    { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-300', badgeBg: 'bg-purple-600' },
    { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-300', badgeBg: 'bg-rose-600' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-300', badgeBg: 'bg-cyan-600' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-300', badgeBg: 'bg-indigo-600' },
    { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-300', badgeBg: 'bg-teal-600' },
    { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-300', badgeBg: 'bg-orange-600' },
  ];
  return palette[hash % palette.length];
}
