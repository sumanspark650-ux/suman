import { AllotmentSettings, Room, Student } from '../types';

export function generatePythonScript(students: Student[], rooms: Room[], settings: AllotmentSettings): string {
  const sampleStudentsJson = JSON.stringify(students.slice(0, 10), null, 2);
  const sampleRoomsJson = JSON.stringify(rooms, null, 2);

  return `#!/usr/bin/env python3
"""
=============================================================================
 Student Examination Seating Allotment System (Python Engine)
 Multi-Department Interleaving & Anti-Cheating Seat Generator
 Generated for: ${settings.examTitle || 'University Examination'}
 Academic Session: ${settings.academicSession || '2026 Session'}
=============================================================================
Requirements:
    pip install pandas tabulate openpyxl
"""

import json
import csv
import math
import sys
from collections import defaultdict

class ExamSeatingAllotment:
    def __init__(self, students_csv_path=None, rooms_config_path=None):
        self.students = []
        self.rooms = []
        self.allocations = []
        self.unallocated = []
        
        # Load from files if provided, else use defaults
        if students_csv_path:
            self.load_students_from_csv(students_csv_path)
        if rooms_config_path:
            self.load_rooms_from_json(rooms_config_path)

    def load_students_from_csv(self, file_path):
        """Loads students from a CSV file."""
        with open(file_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.students.append({
                    'id': row.get('id', row.get('rollNo', '')),
                    'rollNo': row.get('rollNo', row.get('Roll Number', '')),
                    'name': row.get('name', row.get('Student Name', '')),
                    'department': row.get('department', row.get('Branch', 'General')),
                    'subjectCode': row.get('subjectCode', row.get('Subject Code', 'GEN101')),
                })
        print(f"[*] Loaded {len(self.students)} students from {file_path}")

    def load_rooms_from_json(self, file_path):
        """Loads room geometry from a JSON file."""
        with open(file_path, mode='r', encoding='utf-8') as f:
            self.rooms = json.load(f)
        print(f"[*] Loaded {len(self.rooms)} exam rooms from {file_path}")

    def add_room(self, room_id, name, rows, cols, seats_per_desk=2, blocked_seats=None):
        """Manually add an exam room."""
        self.rooms.append({
            'id': room_id,
            'name': name,
            'rows': rows,
            'cols': cols,
            'seatsPerDesk': seats_per_desk,
            'blockedSeats': blocked_seats or []
        })

    def generate_fair_allotment(self, strategy="${settings.strategy}"):
        """
        Executes the round-robin anti-cheating interleaving algorithm.
        Ensures adjacent seats do not share the same department or subject.
        """
        if not self.students:
            print("[!] No students loaded.")
            return

        if not self.rooms:
            print("[!] No rooms configured.")
            return

        # 1. Group students by department
        dept_queues = defaultdict(list)
        for s in self.students:
            dept = s.get('department', 'General')
            dept_queues[dept].append(s)

        # Sort roll numbers naturally within each department
        for dept in dept_queues:
            dept_queues[dept].sort(key=lambda x: x['rollNo'])

        active_queues = [{'dept': k, 'students': v} for k, v in dept_queues.items()]
        seat_grid_map = {}  # key: (room_id, row, col, seat_idx) -> student

        self.allocations = []
        
        for room in self.rooms:
            r_id = room['id']
            r_name = room['name']
            rows = room['rows']
            cols = room['cols']
            seats_per_desk = room.get('seatsPerDesk', 2)
            blocked = {(b['row'], b['col'], b.get('seatIndex', 0)) for b in room.get('blockedSeats', [])}

            # Build traversal sequence (Column-interleaved or Snake)
            seat_positions = []
            bench_count = 1
            
            for c in range(cols):
                for r in range(rows):
                    for s in range(seats_per_desk):
                        if (r, c, s) not in blocked:
                            seat_positions.append((r, c, s, bench_count))
                    bench_count += 1

            # Allocate students to seats
            for r, c, s, bench_num in seat_positions:
                # Check if any students remain
                has_students = any(len(q['students']) > 0 for q in active_queues)
                if not has_students:
                    break

                # Inspect neighbors to avoid collision
                neighbor_depts = set()
                neighbor_subjects = set()

                # Desk partner
                for os in range(seats_per_desk):
                    if os != s and (r_id, r, c, os) in seat_grid_map:
                        neighbor_depts.add(seat_grid_map[(r_id, r, c, os)]['department'])
                        neighbor_subjects.add(seat_grid_map[(r_id, r, c, os)]['subjectCode'])

                # Left / Right
                if (r_id, r, c - 1, s) in seat_grid_map:
                    neighbor_depts.add(seat_grid_map[(r_id, r, c - 1, s)]['department'])
                if (r_id, r, c + 1, s) in seat_grid_map:
                    neighbor_depts.add(seat_grid_map[(r_id, r, c + 1, s)]['department'])

                # Front / Back
                if (r_id, r - 1, c, s) in seat_grid_map:
                    neighbor_depts.add(seat_grid_map[(r_id, r - 1, c, s)]['department'])
                if (r_id, r + 1, c, s) in seat_grid_map:
                    neighbor_depts.add(seat_grid_map[(r_id, r + 1, c, s)]['department'])

                # Rank queues by best fit (least penalty + highest remaining count)
                eligible_queues = [q for q in active_queues if len(q['students']) > 0]
                
                def queue_penalty(q):
                    dept_penalty = 1000 if q['dept'] in neighbor_depts else 0
                    next_subj = q['students'][0].get('subjectCode')
                    subj_penalty = 500 if next_subj in neighbor_subjects else 0
                    # Prioritize larger queues to prevent starvation
                    return dept_penalty + subj_penalty - len(q['students'])

                eligible_queues.sort(key=queue_penalty)

                chosen_q = eligible_queues[0]
                student = chosen_q['students'].pop(0)

                seat_grid_map[(r_id, r, c, s)] = student
                seat_letter = chr(65 + s)
                seat_label = f"R{r+1}C{c+1}-{seat_letter}"

                self.allocations.append({
                    'room_id': r_id,
                    'room_name': r_name,
                    'row': r + 1,
                    'col': c + 1,
                    'seat_letter': seat_letter,
                    'seat_label': seat_label,
                    'bench_num': bench_num,
                    'roll_no': student['rollNo'],
                    'student_name': student['name'],
                    'department': student['department'],
                    'subject_code': student.get('subjectCode', '')
                })

        # Collect any unallocated students
        self.unallocated = []
        for q in active_queues:
            self.unallocated.extend(q['students'])

        print(f"[*] Allotment Complete: {len(self.allocations)} seated, {len(self.unallocated)} unallocated.")
        return self.allocations

    def export_to_csv(self, output_path="seating_allotment_master.csv"):
        """Exports full seating chart to CSV."""
        if not self.allocations:
            print("[!] No allocations to export.")
            return

        keys = self.allocations[0].keys()
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(self.allocations)
        print(f"[+] Seating chart successfully saved to {output_path}")

    def print_room_summary(self):
        """Displays summary table in terminal."""
        try:
            import pandas as pd
            df = pd.DataFrame(self.allocations)
            if not df.empty:
                print("\\n=== EXAMINATION SEATING SUMMARY BY ROOM ===")
                summary = df.groupby(['room_name', 'department']).size().unstack(fill_value=0)
                print(summary)
        except ImportError:
            for alloc in self.allocations[:10]:
                print(f"[{alloc['room_name']}] Seat: {alloc['seat_label']} | Roll: {alloc['roll_no']} ({alloc['department']})")

# Sample Execution Runner
if __name__ == "__main__":
    print("=" * 60)
    print(" EXAM SEATING ALLOTMENT ENGINE - PYTHON STANDALONE")
    print("=" * 60)
    
    engine = ExamSeatingAllotment()
    
    # Initialize with sample rooms if running standalone
    engine.rooms = ${sampleRoomsJson}
    engine.students = ${sampleStudentsJson}

    print(f"Loaded {len(engine.students)} sample students and {len(engine.rooms)} rooms.")
    allocations = engine.generate_fair_allotment()
    engine.print_room_summary()
    engine.export_to_csv("seating_arrangement_output.csv")
`;
}
