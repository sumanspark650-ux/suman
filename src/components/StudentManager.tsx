import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { Upload, Plus, Trash2, Search, Filter, FileSpreadsheet, Sparkles, CheckCircle2, AlertCircle, Users, Download } from 'lucide-react';
import { Student } from '../types';
import { getDepartmentColor } from '../utils/seatingAlgorithm';
import { generateSampleStudents } from '../utils/sampleData';

interface StudentManagerProps {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  onProceedToRooms: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  setStudents,
  onProceedToRooms
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    rollNo: '',
    name: '',
    department: 'Computer Science',
    subjectCode: 'CS401',
    subjectName: '',
    semester: 6
  });

  // Calculate unique departments and counts
  const departmentCounts: Record<string, number> = {};
  students.forEach(s => {
    departmentCounts[s.department] = (departmentCounts[s.department] || 0) + 1;
  });
  const departments = Object.keys(departmentCounts).sort();

  // Filtered student list
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDept = selectedDeptFilter === 'ALL' || s.department === selectedDeptFilter;
    return matchesSearch && matchesDept;
  });

  // File Upload Handler (CSV & Excel)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Parsing file...');
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processRawImportData(results.data as Record<string, any>[]);
        },
        error: (err) => {
          setUploadStatus(`Error parsing CSV: ${err.message}`);
        }
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          processRawImportData(data as Record<string, any>[]);
        } catch (err: any) {
          setUploadStatus(`Error reading Excel: ${err.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } else {
      setUploadStatus('Please upload a valid .csv, .xlsx, or .xls file.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processRawImportData = (rows: Record<string, any>[]) => {
    if (!rows || rows.length === 0) {
      setUploadStatus('The uploaded file was empty or could not be parsed.');
      return;
    }

    const imported: Student[] = [];
    rows.forEach((row, index) => {
      // Find key matching roll number
      const rollKey = Object.keys(row).find(k => 
        /roll|reg|id|enrollment/i.test(k)
      ) || Object.keys(row)[0];

      const nameKey = Object.keys(row).find(k => 
        /name|student/i.test(k)
      );

      const deptKey = Object.keys(row).find(k => 
        /dept|department|branch|stream|course|program/i.test(k)
      );

      const subjKey = Object.keys(row).find(k => 
        /subj|paper|code/i.test(k)
      );

      const rollVal = String(row[rollKey] || `ST-${index + 1}`).trim();
      const nameVal = nameKey && row[nameKey] ? String(row[nameKey]).trim() : `Student ${index + 1}`;
      const deptVal = deptKey && row[deptKey] ? String(row[deptKey]).trim() : 'General';
      const subjVal = subjKey && row[subjKey] ? String(row[subjKey]).trim() : `${deptVal.substring(0, 2).toUpperCase()}101`;

      if (rollVal) {
        imported.push({
          id: `imp_${Date.now()}_${index}`,
          rollNo: rollVal,
          name: nameVal,
          department: deptVal,
          subjectCode: subjVal,
          subjectName: row['Subject Name'] || row['subject_name'] || '',
          semester: row['Semester'] || row['semester'] || 1,
          year: row['Year'] || row['year'] || 1
        });
      }
    });

    if (imported.length > 0) {
      setStudents(prev => [...prev, ...imported]);
      setUploadStatus(`Successfully imported ${imported.length} student records!`);
      setTimeout(() => setUploadStatus(null), 4000);
    } else {
      setUploadStatus('Could not extract valid student records from file.');
    }
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.rollNo || !newStudent.name || !newStudent.department) return;

    const student: Student = {
      id: `std_${Date.now()}`,
      rollNo: newStudent.rollNo.trim(),
      name: newStudent.name.trim(),
      department: newStudent.department.trim(),
      subjectCode: newStudent.subjectCode?.trim() || 'GEN101',
      subjectName: newStudent.subjectName?.trim() || '',
      semester: newStudent.semester || 1
    };

    setStudents(prev => [...prev, student]);
    setNewStudent({
      rollNo: '',
      name: '',
      department: newStudent.department,
      subjectCode: newStudent.subjectCode,
      subjectName: '',
      semester: newStudent.semester
    });
    setIsAddModalOpen(false);
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all students from the database?')) {
      setStudents([]);
    }
  };

  const handleDownloadTemplate = () => {
    const templateCSV = `Roll Number,Student Name,Department,Subject Code,Subject Name,Semester\n2026-CS-001,John Doe,Computer Science,CS401,Database Management Systems,6\n2026-EC-001,Jane Smith,Electronics & Comm,EC401,Digital Signal Processing,6\n2026-ME-001,Alex Johnson,Mechanical Engg,ME401,Thermodynamics,6`;
    const blob = new Blob([templateCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'student_database_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Upload Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Student Database Management
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Upload candidate spreadsheets (.csv, .xlsx) or add examinees across departments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hidden input for file upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv, .xlsx, .xls"
              className="hidden"
              id="file-student-upload"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              id="btn-upload-file"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload CSV / Excel</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              id="btn-add-single-student"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>Add Candidate</span>
            </button>

            <button
              onClick={handleDownloadTemplate}
              id="btn-download-csv-template"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Download CSV template"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>CSV Template</span>
            </button>

            {students.length > 0 && (
              <button
                onClick={handleClearAll}
                id="btn-clear-all-students"
                className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                title="Clear all students"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div className={`mt-4 p-3 rounded-lg text-xs flex items-center gap-2 ${
            uploadStatus.includes('Error') || uploadStatus.includes('valid')
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {uploadStatus.includes('Error') ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{uploadStatus}</span>
          </div>
        )}

        {/* Department Summary Chips */}
        {departments.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-medium text-slate-500">
                Department & Branch Breakdown ({students.length} Total Candidates):
              </span>
              <span className="text-xs text-slate-400">
                {departments.length} Branches Registered
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedDeptFilter('ALL')}
                id="filter-dept-all"
                className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedDeptFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All Departments ({students.length})
              </button>
              {departments.map(dept => {
                const colors = getDepartmentColor(dept);
                const isSelected = selectedDeptFilter === dept;
                return (
                  <button
                    key={dept}
                    id={`filter-dept-${dept.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() => setSelectedDeptFilter(dept)}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                      isSelected
                        ? `${colors.bg} ${colors.text} ${colors.border} ring-2 ring-blue-400 font-semibold shadow-2xs`
                        : `${colors.bg} ${colors.text} ${colors.border} hover:opacity-80`
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${colors.badgeBg}`}></span>
                    <span>{dept}</span>
                    <span className="opacity-75 font-bold">({departmentCounts[dept]})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Database View / Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-search-students"
              placeholder="Search by Roll No, Name, or Subject..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs text-slate-500 font-medium">
              Showing {filteredStudents.length} of {students.length} candidates
            </span>
            {students.length > 0 && (
              <button
                onClick={onProceedToRooms}
                id="btn-proceed-to-rooms"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Proceed to Exam Rooms &rarr;
              </button>
            )}
          </div>
        </div>

        {students.length === 0 ? (
          <div className="py-14 px-4 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-blue-600 border border-blue-100">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">No Students in Database</h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1 mb-5">
              Upload a spreadsheet with your student records or load our realistic pre-configured dataset with 100 students across 4 branches.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setStudents(generateSampleStudents())}
                id="btn-load-sample-students-empty"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs cursor-pointer transition-colors"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Load 100 Multi-Branch Demo Students</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                id="btn-upload-empty"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Upload CSV / Excel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead className="bg-slate-100/80 sticky top-0 z-10 text-slate-700 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Roll Number</th>
                  <th className="py-2.5 px-3">Candidate Name</th>
                  <th className="py-2.5 px-3">Department / Branch</th>
                  <th className="py-2.5 px-3">Subject Code & Paper</th>
                  <th className="py-2.5 px-3 text-center">Semester</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredStudents.map((student, idx) => {
                  const colors = getDepartmentColor(student.department);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold font-mono text-slate-900">
                        {student.rollNo}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {student.name}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${colors.badgeBg}`}></span>
                          {student.department}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-mono text-xs font-semibold text-slate-700">{student.subjectCode}</div>
                        {student.subjectName && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{student.subjectName}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                        {student.semester ? `Sem ${student.semester}` : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteStudent(student.id)}
                          id={`btn-delete-student-${student.id}`}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Delete student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Single Candidate Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Individual Candidate</h3>
            <p className="text-xs text-slate-500 mb-4">Enter candidate details for the examination roll list.</p>

            <form onSubmit={handleAddSingleStudent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number / Registration ID *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026-CS-045"
                  value={newStudent.rollNo}
                  onChange={e => setNewStudent({ ...newStudent, rollNo: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alexander Hamilton"
                  value={newStudent.name}
                  onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Branch *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={newStudent.department}
                    onChange={e => setNewStudent({ ...newStudent, department: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. CS401"
                    value={newStudent.subjectCode}
                    onChange={e => setNewStudent({ ...newStudent, subjectCode: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Database Systems"
                    value={newStudent.subjectName}
                    onChange={e => setNewStudent({ ...newStudent, subjectName: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={newStudent.semester}
                    onChange={e => setNewStudent({ ...newStudent, semester: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-student-modal"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
