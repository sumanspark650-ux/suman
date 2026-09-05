import { Room, Student } from '../types';

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'room_101',
    name: 'Hall 101 (Main Auditorium)',
    building: 'Science Block',
    floor: '1st Floor',
    rows: 5,
    cols: 6,
    seatsPerDesk: 2, // 5 x 6 x 2 = 60 seats
    blockedSeats: [
      { row: 0, col: 0, seatIndex: 0, reason: 'Teacher podium space' },
      { row: 4, col: 5, seatIndex: 1, reason: 'Broken desk' }
    ],
    invigilatorName: 'Dr. Sarah Jenkins',
    invigilatorPhone: '+1 (555) 234-5678'
  },
  {
    id: 'room_102',
    name: 'Room 204 (Lecture Hall B)',
    building: 'Engineering Block',
    floor: '2nd Floor',
    rows: 4,
    cols: 5,
    seatsPerDesk: 2, // 4 x 5 x 2 = 40 seats
    blockedSeats: [
      { row: 0, col: 0, seatIndex: 0, reason: 'Projector setup' }
    ],
    invigilatorName: 'Prof. David Miller',
    invigilatorPhone: '+1 (555) 876-5432'
  },
  {
    id: 'room_103',
    name: 'Room 305 (Seminar Room)',
    building: 'Technology Tower',
    floor: '3rd Floor',
    rows: 4,
    cols: 4,
    seatsPerDesk: 2, // 4 x 4 x 2 = 32 seats
    blockedSeats: [],
    invigilatorName: 'Prof. Ananya Sharma',
    invigilatorPhone: '+1 (555) 345-9876'
  }
];

export function generateSampleStudents(): Student[] {
  const departments = [
    { name: 'Computer Science', code: 'CS', subjects: [{ code: 'CS401', name: 'Database Management Systems' }, { code: 'CS402', name: 'Computer Networks' }] },
    { name: 'Electronics & Comm', code: 'EC', subjects: [{ code: 'EC401', name: 'Digital Signal Processing' }, { code: 'EC402', name: 'Microcontrollers' }] },
    { name: 'Mechanical Engg', code: 'ME', subjects: [{ code: 'ME401', name: 'Thermodynamics & Heat Transfer' }, { code: 'ME402', name: 'Fluid Mechanics' }] },
    { name: 'Civil Engineering', code: 'CE', subjects: [{ code: 'CE401', name: 'Structural Analysis' }, { code: 'CE402', name: 'Geotechnical Engineering' }] }
  ];

  const firstNames = [
    'Aarav', 'Sophia', 'Liam', 'Olivia', 'Noah', 'Emma', 'Ethan', 'Ava', 'Lucas', 'Mia',
    'Mason', 'Isabella', 'Oliver', 'Amelia', 'Elijah', 'Harper', 'James', 'Evelyn', 'Benjamin', 'Abigail',
    'Alexander', 'Emily', 'Daniel', 'Elizabeth', 'Henry', 'Sofia', 'Jackson', 'Avery', 'Sebastian', 'Ella',
    'Rohan', 'Priya', 'Kavya', 'Aditya', 'Sneha', 'Vikram', 'Meera', 'Arjun', 'Ananya', 'Rahul',
    'Siddharth', 'Tanvi', 'Varun', 'Ishita', 'Amit', 'Neha', 'Gaurav', 'Pooja', 'Manish', 'Divya'
  ];

  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Patel', 'Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Mehta', 'Nair', 'Singh', 'Kapoor'
  ];

  const students: Student[] = [];
  let idCounter = 1;

  departments.forEach((dept) => {
    // 25 students per department -> 100 students total
    for (let i = 1; i <= 25; i++) {
      const rollSuffix = i.toString().padStart(3, '0');
      const rollNo = `2026-${dept.code}-${rollSuffix}`;
      const fName = firstNames[(idCounter * 7 + i * 3) % firstNames.length];
      const lName = lastNames[(idCounter * 11 + i * 5) % lastNames.length];
      const subj = dept.subjects[i % dept.subjects.length];

      students.push({
        id: `std_${idCounter}`,
        rollNo,
        name: `${fName} ${lName}`,
        department: dept.name,
        subjectCode: subj.code,
        subjectName: subj.name,
        semester: 6,
        year: 3,
        email: `${fName.toLowerCase()}.${lName.toLowerCase()}@university.edu`
      });

      idCounter++;
    }
  });

  return students;
}

export function generateCompactSample(): { students: Student[]; rooms: Room[] } {
  const depts = [
    { name: 'Computer Science', code: 'CS', subj: 'CS101' },
    { name: 'Electrical Engg', code: 'EE', subj: 'EE101' }
  ];

  const students: Student[] = [];
  let id = 1;
  depts.forEach(d => {
    for (let i = 1; i <= 15; i++) {
      students.push({
        id: `compact_${id}`,
        rollNo: `${d.code}-0${i < 10 ? '0' + i : i}`,
        name: `Student ${d.code} ${i}`,
        department: d.name,
        subjectCode: d.subj,
        semester: 4
      });
      id++;
    }
  });

  const room: Room = {
    id: 'room_compact',
    name: 'Exam Room 101',
    rows: 4,
    cols: 4,
    seatsPerDesk: 2,
    blockedSeats: [],
    invigilatorName: 'Prof. Anderson'
  };

  return { students, rooms: [room] };
}
