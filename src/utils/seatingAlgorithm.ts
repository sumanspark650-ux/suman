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
    const dept = student.department || 'Unassigned';
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
    if (settings.strategy === 'same_dept_rows') {
      // Row-by-row traversal: each classroom row is dedicated to a single Department / Branch
      let deptCycleIdx = 0;
      let prevRowDept: string | null = null;

      for (let r = 0; r < room.rows; r++) {
        const availableQueues = queues.filter(q => q.students.length > 0);
        if (availableQueues.length === 0) break;

        // Pick a department for this row, cycling through available departments and avoiding prevRowDept if possible
        let chosenQueue = availableQueues[deptCycleIdx % availableQueues.length];
        if (availableQueues.length > 1 && chosenQueue.department === prevRowDept) {
          deptCycleIdx++;
          chosenQueue = availableQueues[deptCycleIdx % availableQueues.length];
        }
        deptCycleIdx++;

        for (let c = 0; c < room.cols; c++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            // If current row's department queue is exhausted mid-row, switch to next available department
            if (chosenQueue.students.length === 0) {
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              chosenQueue = remaining.find(q => q.department !== prevRowDept) || remaining[0];
            }

            const student = chosenQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
        }

        prevRowDept = chosenQueue.department;
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
      continue;
    } else if (settings.strategy === 'same_dept_cols') {
      // Column-by-column traversal: each classroom column is dedicated to a single Department / Branch
      let deptCycleIdx = 0;
      let prevColDept: string | null = null;

      for (let c = 0; c < room.cols; c++) {
        const availableQueues = queues.filter(q => q.students.length > 0);
        if (availableQueues.length === 0) break;

        // Pick a department for this column, cycling through available departments and avoiding prevColDept if possible
        let chosenQueue = availableQueues[deptCycleIdx % availableQueues.length];
        if (availableQueues.length > 1 && chosenQueue.department === prevColDept) {
          deptCycleIdx++;
          chosenQueue = availableQueues[deptCycleIdx % availableQueues.length];
        }
        deptCycleIdx++;

        for (let r = 0; r < room.rows; r++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            // If current column's department queue is exhausted mid-column, switch to next available department
            if (chosenQueue.students.length === 0) {
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              chosenQueue = remaining.find(q => q.department !== prevColDept) || remaining[0];
            }

            const student = chosenQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
        }

        prevColDept = chosenQueue.department;
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
      continue;
    } else if (settings.strategy === 'same_dept_rows_split_sides') {
      // Split classroom into Left Side and Right Side:
      // One Department / Branch is seated in same rows on one side, and another Department / Branch on the other side
      const availableStart = queues.filter(q => q.students.length > 0);
      let leftQueue = availableStart[0] || null;
      let rightQueue = (availableStart.length > 1 ? availableStart[1] : availableStart[0]) || null;

      const midCol = Math.max(1, Math.ceil(room.cols / 2));

      for (let r = 0; r < room.rows; r++) {
        // Left Side of the classroom (columns 0 to midCol - 1)
        for (let c = 0; c < midCol; c++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            if (!leftQueue || leftQueue.students.length === 0) {
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              leftQueue = remaining.find(q => rightQueue && q.department !== rightQueue.department) || remaining[0];
            }

            const student = leftQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
        }

        // Right Side of the classroom (columns midCol to room.cols - 1)
        for (let c = midCol; c < room.cols; c++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            if (!rightQueue || rightQueue.students.length === 0) {
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              rightQueue = remaining.find(q => leftQueue && q.department !== leftQueue.department) || remaining[0];
            }

            const student = rightQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
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
      continue;
    } else if (settings.strategy === 'desk_side_by_side_dept') {
      // Column-by-column desk traversal (one by one down each column):
      // One side of the desk (Seat A) has one Department / Branch
      // and the other side of the desk (Seat B) has another Department / Branch
      const sideQueues: Array<{ department: string; students: Student[] } | null> = [];
      for (let s = 0; s < room.seatsPerDesk; s++) {
        const available = queues.filter(q => q.students.length > 0 && !sideQueues.includes(q));
        sideQueues[s] = available[0] || queues.find(q => q.students.length > 0) || null;
      }

      for (let c = 0; c < room.cols; c++) {
        for (let r = 0; r < room.rows; r++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            let activeQueue = sideQueues[s];
            if (!activeQueue || activeQueue.students.length === 0) {
              const otherActiveDepts = new Set(
                sideQueues
                  .filter((q, idx) => idx !== s && q && q.students.length > 0)
                  .map(q => q!.department)
              );
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              activeQueue = remaining.find(q => !otherActiveDepts.has(q.department)) || remaining[0];
              sideQueues[s] = activeQueue;
            }

            const student = activeQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
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
      continue;
    } else if (settings.strategy === 'zigzag_two_dept_desk_col') {
      // Zigzag two departments in one desk, one by one down each column:
      // Alternates which side of the desk (Seat A vs Seat B) each of the two active departments occupies
      // from row to row down each column and across columns.
      const sideQueues: Array<{ department: string; students: Student[] } | null> = [];
      for (let s = 0; s < room.seatsPerDesk; s++) {
        const available = queues.filter(q => q.students.length > 0 && !sideQueues.includes(q));
        sideQueues[s] = available[0] || queues.find(q => q.students.length > 0) || null;
      }

      for (let c = 0; c < room.cols; c++) {
        for (let r = 0; r < room.rows; r++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            // Zigzag the two department slots across Seat A and Seat B on alternating rows/columns
            const queueSlot = (r + c) % 2 === 0 ? s : (room.seatsPerDesk - 1 - s);

            let activeQueue = sideQueues[queueSlot];
            if (!activeQueue || activeQueue.students.length === 0) {
              const otherActiveDepts = new Set(
                sideQueues
                  .filter((q, idx) => idx !== queueSlot && q && q.students.length > 0)
                  .map(q => q!.department)
              );
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              activeQueue = remaining.find(q => !otherActiveDepts.has(q.department)) || remaining[0];
              sideQueues[queueSlot] = activeQueue;
            }

            const student = activeQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
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
      continue;
    } else if (settings.strategy === 'same_dept_one_by_one_col') {
      // One department student on one side of the desk (Seat A) and another department student on the other side (Seat B),
      // seated one by one down each column (Col 1 to Col N, Row 1 to Row N).
      const sideQueues: Array<{ department: string; students: Student[] } | null> = [];
      for (let s = 0; s < room.seatsPerDesk; s++) {
        const available = queues.filter(q => q.students.length > 0 && !sideQueues.includes(q));
        sideQueues[s] = available[0] || queues.find(q => q.students.length > 0) || null;
      }

      for (let c = 0; c < room.cols; c++) {
        for (let r = 0; r < room.rows; r++) {
          const benchNum = r * room.cols + c + 1;
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            let activeQueue = sideQueues[s];
            if (!activeQueue || activeQueue.students.length === 0) {
              const otherActiveDepts = new Set(
                sideQueues
                  .filter((q, idx) => idx !== s && q && q.students.length > 0)
                  .map(q => q!.department)
              );
              const remaining = queues.filter(q => q.students.length > 0);
              if (remaining.length === 0) break;
              activeQueue = remaining.find(q => !otherActiveDepts.has(q.department)) || remaining[0];
              sideQueues[s] = activeQueue;
            }

            const student = activeQueue.students.shift()!;
            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
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
      continue;
    } else if (settings.strategy === 'cross_subject_bench') {
      // Cross-Subject Desk Pairing: group remaining students by subjectCode and pair distinct exam papers on each desk
      const allRemainingStudents: Student[] = [];
      queues.forEach(q => {
        while (q.students.length > 0) {
          allRemainingStudents.push(q.students.shift()!);
        }
      });

      const subjectMap = new Map<string, Student[]>();
      allRemainingStudents.forEach(st => {
        const sub = st.subjectCode || 'GEN';
        if (!subjectMap.has(sub)) subjectMap.set(sub, []);
        subjectMap.get(sub)!.push(st);
      });

      const subjectQueues = Array.from(subjectMap.entries()).map(([subjectCode, list]) => ({
        subjectCode,
        students: list
      }));

      for (let r = 0; r < room.rows; r++) {
        for (let c = 0; c < room.cols; c++) {
          const benchNum = r * room.cols + c + 1;
          const deskChosenSubjects = new Set<string>();
          const deskChosenDepts = new Set<string>();

          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (isBlocked(room, r, c, s)) continue;

            const availableSubQueues = subjectQueues.filter(sq => sq.students.length > 0);
            if (availableSubQueues.length === 0) break;

            // Check immediate neighbors (above & left) to also avoid adjacent same subject/dept
            const neighborSubs = new Set<string>(deskChosenSubjects);
            const neighborDepts = new Set<string>(deskChosenDepts);

            if (c > 0) {
              const leftNeighbor = seatGridMap.get(`${room.id}_${r}_${c - 1}_${s}`);
              if (leftNeighbor) {
                neighborSubs.add(leftNeighbor.subjectCode);
                neighborDepts.add(leftNeighbor.department);
              }
            }
            if (r > 0) {
              const topNeighbor = seatGridMap.get(`${room.id}_${r - 1}_${c}_${s}`);
              if (topNeighbor) {
                neighborSubs.add(topNeighbor.subjectCode);
                neighborDepts.add(topNeighbor.department);
              }
            }

            availableSubQueues.sort((a, b) => {
              const aDeskSubClash = deskChosenSubjects.has(a.subjectCode) ? 2000 : 0;
              const bDeskSubClash = deskChosenSubjects.has(b.subjectCode) ? 2000 : 0;

              const aDept = a.students[0]?.department || '';
              const bDept = b.students[0]?.department || '';
              const aDeskDeptClash = deskChosenDepts.has(aDept) ? 1000 : 0;
              const bDeskDeptClash = deskChosenDepts.has(bDept) ? 1000 : 0;

              const aAdjSubClash = neighborSubs.has(a.subjectCode) ? 400 : 0;
              const bAdjSubClash = neighborSubs.has(b.subjectCode) ? 400 : 0;

              const aAdjDeptClash = neighborDepts.has(aDept) ? 200 : 0;
              const bAdjDeptClash = neighborDepts.has(bDept) ? 200 : 0;

              const aScore = aDeskSubClash + aDeskDeptClash + aAdjSubClash + aAdjDeptClash - a.students.length;
              const bScore = bDeskSubClash + bDeskDeptClash + bAdjSubClash + bAdjDeptClash - b.students.length;
              return aScore - bScore;
            });

            const chosenSubQueue = availableSubQueues[0];
            const student = chosenSubQueue.students.shift()!;
            deskChosenSubjects.add(student.subjectCode);
            deskChosenDepts.add(student.department);

            seatGridMap.set(`${room.id}_${r}_${c}_${s}`, student);

            const seatLetter = String.fromCharCode(65 + s);
            const seatLabel = `R${r + 1}C${c + 1}-${seatLetter}`;
            const deskCode = `Desk ${benchNum}`;

            allocations.push({
              id: `alloc_${room.id}_${r}_${c}_${s}`,
              studentId: student.id,
              student,
              roomId: room.id,
              roomName: room.name,
              row: r,
              col: c,
              seatIndex: s,
              benchNumber: benchNum,
              seatLabel,
              deskCode
            });

            allocatedInRoom++;
            roomDeptCount[student.department] = (roomDeptCount[student.department] || 0) + 1;
            roomSubjectCount[student.subjectCode] = (roomSubjectCount[student.subjectCode] || 0) + 1;
          }
        }
      }

      // Put any unallocated students back into department queues for subsequent rooms
      subjectQueues.forEach(sq => {
        sq.students.forEach(st => {
          const targetDeptQueue = queues.find(q => q.department === st.department);
          if (targetDeptQueue) {
            targetDeptQueue.students.push(st);
          } else if (queues.length > 0) {
            queues[0].students.push(st);
          }
        });
      });

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
      continue;
    } else if (settings.strategy === 'snake_zigzag') {
      for (let r = 0; r < room.rows; r++) {
        // Even rows left-to-right, odd rows right-to-left
        const colIndices = r % 2 === 0 
          ? Array.from({ length: room.cols }, (_, i) => i)
          : Array.from({ length: room.cols }, (_, i) => room.cols - 1 - i);

        for (const c of colIndices) {
          for (let s = 0; s < room.seatsPerDesk; s++) {
            if (!isBlocked(room, r, c, s)) {
              seatSequence.push({ row: r, col: c, seatIndex: s, benchNumber: (r * room.cols + c + 1) });
            }
          }
          currentBench++;
        }
      }
    } else {
      // Checkerboard Interleaving (Default: Column-first interleaving for exam fairness)
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
    let stepIndex = 0;
    for (const pos of seatSequence) {
      // Check if all queues are empty
      const hasAnyStudent = queues.some(q => q.students.length > 0);
      if (!hasAnyStudent) break;

      // Find best candidate student from queues
      // Constraints:
      // 1. If pos.seatIndex > 0 (same desk partner at pos.seatIndex - 1), try to avoid same dept / subject
      // 2. Neighbor in row - 1, row + 1, col - 1, col + 1
      const neighborStudents: Student[] = [];
      const sameDeskStudents: Student[] = [];

      // Same desk partner (left or right)
      for (let s = 0; s < room.seatsPerDesk; s++) {
        if (s !== pos.seatIndex) {
          const n = seatGridMap.get(`${room.id}_${pos.row}_${pos.col}_${s}`);
          if (n) {
            neighborStudents.push(n);
            sameDeskStudents.push(n);
          }
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
      const sameDeskDepts = new Set(sameDeskStudents.map(n => n.department));
      const neighborSubjects = new Set(neighborStudents.map(n => n.subjectCode));

      // Sort queues to prioritize queues with most remaining students,
      // while enforcing checkerboard / snake rotation and penalizing neighbor clashes
      const numQueues = Math.max(1, queues.length);
      const preferredQueueIdx =
        settings.strategy === 'snake_zigzag'
          ? stepIndex % numQueues
          : (pos.row * room.seatsPerDesk + pos.col + pos.seatIndex) % numQueues;

      const sortedQueues = queues
        .map((q, idx) => ({ q, idx }))
        .filter(item => item.q.students.length > 0)
        .sort((a, b) => {
          const aSameDeskClash = sameDeskDepts.has(a.q.department) ? 1500 : 0;
          const bSameDeskClash = sameDeskDepts.has(b.q.department) ? 1500 : 0;

          const aDeptClash = neighborDepts.has(a.q.department) ? 1000 : 0;
          const bDeptClash = neighborDepts.has(b.q.department) ? 1000 : 0;

          const aNextSubject = a.q.students[0]?.subjectCode;
          const bNextSubject = b.q.students[0]?.subjectCode;
          const aSubClash = (aNextSubject && neighborSubjects.has(aNextSubject)) ? 500 : 0;
          const bSubClash = (bNextSubject && neighborSubjects.has(bNextSubject)) ? 500 : 0;

          const aRotationBonus = a.idx === preferredQueueIdx ? -50 : 0;
          const bRotationBonus = b.idx === preferredQueueIdx ? -50 : 0;

          const aScore = aSameDeskClash + aDeptClash + aSubClash + aRotationBonus - a.q.students.length;
          const bScore = bSameDeskClash + bDeptClash + bSubClash + bRotationBonus - b.q.students.length;

          return aScore - bScore;
        })
        .map(item => item.q);

      stepIndex++;

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
