import React, { useState } from 'react';
import { Download, Printer, FileSpreadsheet, FileText, CheckCircle2, QrCode, X, Copy, Check } from 'lucide-react';
import { AllotmentResult } from '../types';
import { exportToCSV, exportToExcel, generateInvigilatorSheetPDF, generateNoticeBoardPDF } from '../utils/exportUtils';
import { getDepartmentColor } from '../utils/seatingAlgorithm';

interface PrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: AllotmentResult;
}

export const PrintExportModal: React.FC<PrintExportModalProps> = ({
  isOpen,
  onClose,
  result
}) => {
  const [activeExportTab, setActiveExportTab] = useState<'notice_board' | 'invigilator_sheet' | 'desk_slips' | 'raw_data'>('notice_board');
  const [copiedNotification, setCopiedNotification] = useState(false);

  if (!isOpen) return null;

  const handlePrintDeskSlips = () => {
    window.print();
  };

  const handleCopyTextRoster = () => {
    const text = result.allocations
      .map(a => `${a.roomName}\t${a.deskCode}\t${a.seatLabel}\t${a.student.rollNo}\t${a.student.name}\t${a.student.department}\t${a.student.subjectCode}`)
      .join('\n');
    navigator.clipboard.writeText(`Room\tDesk\tSeat\tRollNo\tName\tDepartment\tSubject\n` + text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-100 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-600" />
              Examination Seating Export & Print Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate Official Notice Board Sheets, Invigilator Attendance Lists, Desk Slips, or Excel Spreadsheets.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 pt-4 border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveExportTab('notice_board')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeExportTab === 'notice_board'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            📋 Notice Board PDF
          </button>
          <button
            onClick={() => setActiveExportTab('invigilator_sheet')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeExportTab === 'invigilator_sheet'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            ✍️ Invigilator Attendance Sheets
          </button>
          <button
            onClick={() => setActiveExportTab('desk_slips')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeExportTab === 'desk_slips'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            🏷️ Printable Desk Slips (Tags)
          </button>
          <button
            onClick={() => setActiveExportTab('raw_data')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeExportTab === 'raw_data'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            📊 Excel & CSV Raw Data
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto py-5 space-y-4">
          {/* TAB 1: Notice Board PDF */}
          {activeExportTab === 'notice_board' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-blue-900">Notice Board Seating Arrangement PDF</h4>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Official multi-page PDF grouped by Exam Hall with complete Roll Numbers, Candidate Names, and Seat Labels.
                  </p>
                </div>
                <button
                  onClick={() => generateNoticeBoardPDF(result)}
                  id="btn-download-notice-pdf"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF Document</span>
                </button>
              </div>

              {/* Preview Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <div className="p-3 bg-slate-100 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>Preview: Sample Candidate Seating Notice</span>
                  <span>{result.allocations.length} Total Candidates</span>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="p-2">Exam Hall</th>
                        <th className="p-2">Seat</th>
                        <th className="p-2">Roll Number</th>
                        <th className="p-2">Candidate Name</th>
                        <th className="p-2">Department</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {result.allocations.slice(0, 15).map((a, i) => (
                        <tr key={a.id}>
                          <td className="p-2 font-semibold text-blue-700">{a.roomName}</td>
                          <td className="p-2 font-mono font-bold">{a.seatLabel}</td>
                          <td className="p-2 font-mono">{a.student.rollNo}</td>
                          <td className="p-2">{a.student.name}</td>
                          <td className="p-2 text-slate-500">{a.student.department}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Invigilator Attendance Sheets */}
          {activeExportTab === 'invigilator_sheet' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Invigilator Attendance & Signature Rosters</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hall-wise roster with Candidate Present/Absent checkboxes and official signature columns for proctors.
                  </p>
                </div>
                <button
                  onClick={() => generateInvigilatorSheetPDF(result)}
                  id="btn-download-invigilator-pdf"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Attendance Rosters (PDF)</span>
                </button>
              </div>

              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                💡 <strong>Tip for Exam Superintendants:</strong> Each room's attendance sheet starts on a fresh page in the PDF for easy distribution to respective hall invigilators.
              </div>
            </div>
          )}

          {/* TAB 3: Printable Desk Slips */}
          {activeExportTab === 'desk_slips' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Individual Desk Stickers / Bench Tags</h4>
                  <p className="text-xs text-slate-500">
                    Ready to cut and stick on physical desks before the examination.
                  </p>
                </div>
                <button
                  onClick={handlePrintDeskSlips}
                  id="btn-print-desk-tags"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Desk Slips</span>
                </button>
              </div>

              {/* Grid of Desk Stickers */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
                {result.allocations.slice(0, 12).map(alloc => {
                  const colors = getDepartmentColor(alloc.student.department);
                  return (
                    <div
                      key={alloc.id}
                      className="p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col justify-between text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">{alloc.roomName}</span>
                        <span className="text-xs font-mono font-black text-blue-700">{alloc.seatLabel}</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">ROLL NUMBER</div>
                        <div className="font-mono font-bold text-sm text-slate-900">{alloc.student.rollNo}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400">CANDIDATE</div>
                        <div className="font-semibold text-slate-800 truncate">{alloc.student.name}</div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
                        <span className={`px-1.5 py-0.2 rounded font-medium ${colors.bg} ${colors.text}`}>
                          {alloc.student.department.split(' ')[0]}
                        </span>
                        <span className="font-mono text-slate-500">{alloc.student.subjectCode}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Raw Excel & CSV Data */}
          {activeExportTab === 'raw_data' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm mb-1">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                      Microsoft Excel (.xlsx)
                    </div>
                    <p className="text-xs text-emerald-700">
                      Includes Master Allotment tab, individual Room tabs, and Capacity Summary sheets.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToExcel(result)}
                    id="btn-export-excel-file"
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel Workbook</span>
                  </button>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                      <FileText className="w-5 h-5 text-slate-600" />
                      Comma-Separated Values (.csv)
                    </div>
                    <p className="text-xs text-slate-600">
                      Standard universal format compatible with student information systems and database imports.
                    </p>
                  </div>
                  <button
                    onClick={() => exportToCSV(result)}
                    id="btn-export-csv-file"
                    className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download CSV File</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleCopyTextRoster}
                  id="btn-copy-roster-clipboard"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  {copiedNotification ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedNotification ? 'Copied to Clipboard!' : 'Copy TSV Table'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {result.allocations.length} Candidate Seats Allotted • 0 Unallocated
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
