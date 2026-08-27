import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AllotmentResult } from '../types';

export function exportToCSV(result: AllotmentResult, filename = 'exam_seating_allotment.csv') {
  if (!result.allocations.length) return;

  const headers = ['Room Name', 'Desk/Bench', 'Seat Label', 'Roll Number', 'Student Name', 'Department', 'Subject Code', 'Subject Name', 'Semester'];
  const rows = result.allocations.map(a => [
    `"${a.roomName}"`,
    `"${a.deskCode}"`,
    `"${a.seatLabel}"`,
    `"${a.student.rollNo}"`,
    `"${a.student.name}"`,
    `"${a.student.department}"`,
    `"${a.student.subjectCode}"`,
    `"${a.student.subjectName || ''}"`,
    `"${a.student.semester || ''}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(result: AllotmentResult, filename = 'exam_seating_allotment.xlsx') {
  if (!result.allocations.length) return;

  const wb = XLSX.utils.book_new();

  // 1. Master Sheet
  const masterData = result.allocations.map(a => ({
    'Room Name': a.roomName,
    'Desk': a.deskCode,
    'Seat Label': a.seatLabel,
    'Roll Number': a.student.rollNo,
    'Student Name': a.student.name,
    'Department': a.student.department,
    'Subject Code': a.student.subjectCode,
    'Subject Name': a.student.subjectName || '',
    'Semester': a.student.semester || ''
  }));
  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, 'All Allotments');

  // 2. Room-wise Sheets
  const rooms = Array.from(new Set(result.allocations.map(a => a.roomName)));
  rooms.forEach(roomName => {
    const roomAllocs = result.allocations
      .filter(a => a.roomName === roomName)
      .map(a => ({
        'Desk': a.deskCode,
        'Seat Label': a.seatLabel,
        'Roll Number': a.student.rollNo,
        'Student Name': a.student.name,
        'Department': a.student.department,
        'Subject Code': a.student.subjectCode
      }));
    const cleanSheetName = roomName.replace(/[:\\/?*\[\]]/g, '').substring(0, 31);
    const wsRoom = XLSX.utils.json_to_sheet(roomAllocs);
    XLSX.utils.book_append_sheet(wb, wsRoom, cleanSheetName);
  });

  // 3. Summary Sheet
  const summaryData = result.roomSummaries.map(r => ({
    'Room Name': r.roomName,
    'Total Seats': r.totalSeats,
    'Usable Seats': r.usableSeats,
    'Students Allocated': r.allocatedCount,
    'Occupancy Rate': `${r.occupancyPercentage}%`
  }));
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Room Summaries');

  XLSX.writeFile(wb, filename);
}

export function generateNoticeBoardPDF(result: AllotmentResult) {
  const doc = new jsPDF();
  const settings = result.settings;

  // Title
  doc.setFontSize(16);
  doc.text(settings.examTitle || 'EXAMINATION SEATING ARRANGEMENT', 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(`Academic Session: ${settings.academicSession || '2026 Session'} | Date: ${settings.examDate} | Time: ${settings.examTime}`, 105, 22, { align: 'center' });
  doc.text(`Notice Board Master Seating Plan - Total Students Allocated: ${result.allocations.length}`, 105, 27, { align: 'center' });
  doc.line(14, 30, 196, 30);

  let currentY = 35;

  // Group by room
  const rooms = Array.from(new Set(result.allocations.map(a => a.roomName)));

  rooms.forEach((roomName, idx) => {
    if (idx > 0) {
      doc.addPage();
      currentY = 20;
    }

    const roomAllocs = result.allocations.filter(a => a.roomName === roomName);
    
    doc.setFontSize(13);
    doc.text(`Room: ${roomName} (${roomAllocs.length} Students)`, 14, currentY);
    currentY += 4;

    const tableData = roomAllocs.map((a, i) => [
      (i + 1).toString(),
      a.seatLabel,
      a.student.rollNo,
      a.student.name,
      a.student.department,
      a.student.subjectCode
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Seat', 'Roll Number', 'Student Name', 'Department', 'Subject']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [41, 72, 152], textColor: 255 },
      styles: { fontSize: 8.5, cellPadding: 2 },
      margin: { left: 14, right: 14 }
    });
  });

  doc.save(`Notice_Board_Seating_${settings.examDate || 'Arrangement'}.pdf`);
}

export function generateInvigilatorSheetPDF(result: AllotmentResult) {
  const doc = new jsPDF();
  const settings = result.settings;

  const rooms = Array.from(new Set(result.allocations.map(a => a.roomName)));

  rooms.forEach((roomName, idx) => {
    if (idx > 0) {
      doc.addPage();
    }

    const roomAllocs = result.allocations.filter(a => a.roomName === roomName);

    doc.setFontSize(14);
    doc.text('EXAMINATION ATTENDANCE & VERIFICATION ROSTER', 105, 14, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`${settings.examTitle} | Date: ${settings.examDate} | Session: ${settings.examTime}`, 105, 20, { align: 'center' });
    doc.text(`Room: ${roomName} | Total Candidates: ${roomAllocs.length}`, 14, 27);
    doc.text(`Invigilator Signature: _______________________`, 130, 27);
    doc.line(14, 30, 196, 30);

    const tableData = roomAllocs.map((a, i) => [
      (i + 1).toString(),
      a.seatLabel,
      a.student.rollNo,
      a.student.name,
      a.student.subjectCode,
      '[  ] Present  [  ] Absent',
      '________________'
    ]);

    autoTable(doc, {
      startY: 33,
      head: [['#', 'Seat', 'Roll No', 'Candidate Name', 'Subject', 'Attendance Status', 'Candidate Signature']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [50, 50, 50], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        5: { cellWidth: 36 },
        6: { cellWidth: 36 }
      },
      margin: { left: 14, right: 14 }
    });
  });

  doc.save(`Invigilator_Attendance_Rosters.pdf`);
}
