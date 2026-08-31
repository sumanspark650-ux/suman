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
  return [];
}

export function generateCompactSample(): { students: Student[]; rooms: Room[] } {
  return { students: [], rooms: SAMPLE_ROOMS };
}
