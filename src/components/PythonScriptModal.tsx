import React, { useState } from 'react';
import { Code2, Download, Copy, Check, X, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { AllotmentSettings, Room, Student } from '../types';
import { generatePythonScript } from '../utils/pythonGenerator';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  rooms: Room[];
  settings: AllotmentSettings;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({
  isOpen,
  onClose,
  students,
  rooms,
  settings
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const pythonScript = generatePythonScript(students, rooms, settings);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPyFile = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exam_seating_allotment.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-950 rounded-2xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 text-slate-100 my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Python Seating Allotment Script
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                  Python 3.8+
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Executable Python engine using Pandas, multi-queue interleaving & anti-cheating algorithms.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Instructions Bar */}
        <div className="py-3 px-4 my-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-mono text-[11px] text-emerald-300">
              $ python3 exam_seating_allotment.py
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              id="btn-copy-python-script"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Script!' : 'Copy Code'}</span>
            </button>

            <button
              onClick={handleDownloadPyFile}
              id="btn-download-python-file"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py File</span>
            </button>
          </div>
        </div>

        {/* Python Code Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-emerald-300 leading-relaxed max-h-[480px]">
          <pre className="whitespace-pre overflow-x-auto text-[11px] text-slate-200">
            {pythonScript}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>
            Input formats: CSV, JSON, Pandas DataFrames • Outputs: CSV, XLSX & Terminal Tables
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
