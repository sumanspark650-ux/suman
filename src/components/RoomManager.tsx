import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Ban, CheckCircle2, AlertTriangle, Sparkles, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { Room, BlockedSeat } from '../types';
import { calculateRoomCapacity } from '../utils/seatingAlgorithm';
import { SAMPLE_ROOMS } from '../utils/sampleData';

interface RoomManagerProps {
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
  studentsCount: number;
  onProceedToAllotment: () => void;
}

export const RoomManager: React.FC<RoomManagerProps> = ({
  rooms,
  setRooms,
  studentsCount,
  onProceedToAllotment
}) => {
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State for Adding / Editing Room
  const [roomName, setRoomName] = useState('Lecture Hall 101');
  const [building, setBuilding] = useState('Main Academic Block');
  const [floor, setFloor] = useState('1st Floor');
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(5);
  const [seatsPerDesk, setSeatsPerDesk] = useState<number>(2);
  const [blockedSeats, setBlockedSeats] = useState<BlockedSeat[]>([]);
  const [invigilatorName, setInvigilatorName] = useState('');
  const [invigilatorPhone, setInvigilatorPhone] = useState('');

  // Total capacity calculations
  let totalUsableSeats = 0;
  let totalPhysicalSeats = 0;
  rooms.forEach(r => {
    const { totalSeats, usableSeats } = calculateRoomCapacity(r);
    totalPhysicalSeats += totalSeats;
    totalUsableSeats += usableSeats;
  });

  const capacityDiff = totalUsableSeats - studentsCount;
  const isCapacitySufficient = totalUsableSeats >= studentsCount && totalUsableSeats > 0;

  const openAddModal = () => {
    setEditingRoom(null);
    setRoomName(`Exam Hall ${rooms.length + 101}`);
    setBuilding('Science Block');
    setFloor('2nd Floor');
    setRows(5);
    setCols(5);
    setSeatsPerDesk(2);
    setBlockedSeats([]);
    setInvigilatorName('');
    setInvigilatorPhone('');
    setIsModalOpen(true);
  };

  const openEditModal = (room: Room) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setBuilding(room.building || '');
    setFloor(room.floor || '');
    setRows(room.rows);
    setCols(room.cols);
    setSeatsPerDesk(room.seatsPerDesk);
    setBlockedSeats([...room.blockedSeats]);
    setInvigilatorName(room.invigilatorName || '');
    setInvigilatorPhone(room.invigilatorPhone || '');
    setIsModalOpen(true);
  };

  const handleToggleBlockSeat = (r: number, c: number, s: number) => {
    setBlockedSeats(prev => {
      const exists = prev.some(b => b.row === r && b.col === c && b.seatIndex === s);
      if (exists) {
        return prev.filter(b => !(b.row === r && b.col === c && b.seatIndex === s));
      } else {
        return [...prev, { row: r, col: c, seatIndex: s, reason: 'Marked unavailable' }];
      }
    });
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName) return;

    const newRoomObj: Room = {
      id: editingRoom ? editingRoom.id : `room_${Date.now()}`,
      name: roomName.trim(),
      building: building.trim(),
      floor: floor.trim(),
      rows,
      cols,
      seatsPerDesk,
      blockedSeats,
      invigilatorName: invigilatorName.trim(),
      invigilatorPhone: invigilatorPhone.trim()
    };

    if (editingRoom) {
      setRooms(prev => prev.map(r => r.id === editingRoom.id ? newRoomObj : r));
    } else {
      setRooms(prev => [...prev, newRoomObj]);
    }

    setIsModalOpen(false);
  };

  const handleDeleteRoom = (id: string) => {
    setRooms(prev => prev.filter(r => r.id !== id));
  };

  const handleLoadSampleRooms = () => {
    setRooms(SAMPLE_ROOMS);
  };

  return (
    <div className="space-y-6">
      {/* Capacity & Readiness Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Exam Rooms & Hall Configuration
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Define classroom dimensions, bench desk seating capacity, and mark damaged/blocked seats.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={openAddModal}
              id="btn-add-room"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Exam Room</span>
            </button>

            <button
              onClick={handleLoadSampleRooms}
              id="btn-load-sample-rooms"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Preset 3 Halls (132 Seats)</span>
            </button>
          </div>
        </div>

        {/* Live Capacity Meter */}
        <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">Capacity Feasibility</span>
              {isCapacitySufficient ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sufficient Capacity
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                  <AlertTriangle className="w-3.5 h-3.5" /> Capacity Deficit
                </span>
              )}
            </div>

            <div className="text-xs text-slate-600">
              <strong>{totalUsableSeats}</strong> Usable Seats across <strong>{rooms.length}</strong> Rooms vs <strong>{studentsCount}</strong> Candidates
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 ${
                isCapacitySufficient ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, totalUsableSeats > 0 ? (studentsCount / totalUsableSeats) * 100 : 0)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
            <span>
              {isCapacitySufficient ? (
                <span className="text-emerald-700 font-medium">
                  +{capacityDiff} Buffer seats available ({Math.round((studentsCount / Math.max(1, totalUsableSeats)) * 100)}% occupancy)
                </span>
              ) : (
                <span className="text-rose-700 font-medium">
                  Need {Math.abs(capacityDiff)} more seats to accommodate all students!
                </span>
              )}
            </span>
            {rooms.length > 0 && studentsCount > 0 && isCapacitySufficient && (
              <button
                onClick={onProceedToAllotment}
                id="btn-proceed-from-rooms"
                className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                Proceed to Seating Engine <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      {rooms.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Exam Rooms Configured</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mt-1 mb-5">
            Add exam halls with custom row & column dimensions or load the standard 3-hall preset.
          </p>
          <button
            onClick={handleLoadSampleRooms}
            id="btn-load-sample-rooms-empty"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs cursor-pointer transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Load Preset 3 Exam Rooms</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((room, index) => {
            const { totalSeats, usableSeats } = calculateRoomCapacity(room);
            const deskCount = room.rows * room.cols;

            return (
              <div
                key={room.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 font-bold text-xs flex items-center justify-center">
                          {index + 1}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900">{room.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {room.building || 'Main Campus'} • {room.floor || 'Ground Floor'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(room)}
                        id={`btn-edit-room-${room.id}`}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                        title="Edit room layout"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRoom(room.id)}
                        id={`btn-delete-room-${room.id}`}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Room Stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4 py-3 px-3 bg-slate-50 rounded-lg text-center border border-slate-100">
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Layout</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800">
                        {room.rows}R × {room.cols}C
                      </div>
                      <div className="text-[10px] text-slate-400">{deskCount} Desks</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Desk Type</div>
                      <div className="text-xs sm:text-sm font-bold text-slate-800">
                        {room.seatsPerDesk === 1 ? 'Single Desk' : room.seatsPerDesk === 2 ? 'Double Bench' : '3-Seater Bench'}
                      </div>
                      <div className="text-[10px] text-slate-400">{room.seatsPerDesk} / desk</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400 font-medium">Capacity</div>
                      <div className="text-xs sm:text-sm font-bold text-indigo-700">
                        {usableSeats} Seats
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {room.blockedSeats.length > 0 ? `(${room.blockedSeats.length} blocked)` : '100% available'}
                      </div>
                    </div>
                  </div>

                  {/* Invigilator Info */}
                  {room.invigilatorName && (
                    <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-600">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Invigilator: <strong>{room.invigilatorName}</strong></span>
                    </div>
                  )}

                  {/* Mini visual preview */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Front: Teacher Podium / Blackboard
                    </div>
                    <div
                      className="grid gap-1 bg-slate-100 p-2 rounded-lg border border-slate-200/80"
                      style={{ gridTemplateColumns: `repeat(${room.cols}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: room.rows * room.cols }).map((_, idx) => {
                        const r = Math.floor(idx / room.cols);
                        const c = idx % room.cols;
                        const isBlocked = room.blockedSeats.some(b => b.row === r && b.col === c);
                        return (
                          <div
                            key={idx}
                            className={`h-4 rounded-xs text-[8px] flex items-center justify-center font-mono ${
                              isBlocked ? 'bg-rose-200 text-rose-700' : 'bg-white text-slate-400 border border-slate-200'
                            }`}
                            title={`Row ${r + 1}, Col ${c + 1} (${isBlocked ? 'Blocked' : 'Available'})`}
                          >
                            {isBlocked ? '✕' : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Room Builder & Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {editingRoom ? 'Edit Room Configuration' : 'Configure New Exam Room'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Set classroom dimensions, bench capacity, and click on seats in the preview to block/unblock.
            </p>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Room / Hall Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hall 101 or Audi B"
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Floor</label>
                  <input
                    type="text"
                    placeholder="e.g. 1st Floor"
                    value={floor}
                    onChange={e => setFloor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Building / Wing</label>
                  <input
                    type="text"
                    placeholder="e.g. Science Block"
                    value={building}
                    onChange={e => setBuilding(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Seats Per Desk / Bench</label>
                  <select
                    value={seatsPerDesk}
                    onChange={e => setSeatsPerDesk(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value={1}>Single Desk (1 Student)</option>
                    <option value={2}>Double Bench (2 Students: Left & Right)</option>
                    <option value={3}>Triple Bench (3 Students)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rows (Depth)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={rows}
                    onChange={e => setRows(Math.max(1, Math.min(12, Number(e.target.value))))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Columns (Width)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={cols}
                    onChange={e => setCols(Math.max(1, Math.min(12, Number(e.target.value))))}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Desks</label>
                  <div className="px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded-lg">
                    {rows * cols} Desks
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Usable Capacity</label>
                  <div className="px-3 py-1.5 text-xs sm:text-sm font-bold text-indigo-700 bg-white border border-slate-200 rounded-lg">
                    {rows * cols * seatsPerDesk - blockedSeats.length} Seats
                  </div>
                </div>
              </div>

              {/* Interactive Visual Seat Clicker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Interactive Desk Layout (Click seat to Block / Mark Damaged):
                  </label>
                  <span className="text-[11px] text-slate-500">
                    {blockedSeats.length} Seats Blocked
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl p-3 bg-slate-900 text-white">
                  <div className="text-center py-1 mb-3 bg-slate-800 rounded-md text-[11px] font-semibold text-slate-300 tracking-wider">
                    FRONT: BLACKBOARD / TEACHER PODIUM
                  </div>

                  <div
                    className="grid gap-2 overflow-x-auto p-1"
                    style={{ gridTemplateColumns: `repeat(${cols}, minmax(48px, 1fr))` }}
                  >
                    {Array.from({ length: rows }).map((_, r) =>
                      Array.from({ length: cols }).map((_, c) => (
                        <div
                          key={`${r}_${c}`}
                          className="bg-slate-800 border border-slate-700 p-1.5 rounded-lg text-center flex flex-col gap-1"
                        >
                          <div className="text-[9px] text-slate-400 font-mono">
                            R{r + 1}C{c + 1}
                          </div>
                          <div className="flex gap-1 justify-center">
                            {Array.from({ length: seatsPerDesk }).map((_, s) => {
                              const isBlocked = blockedSeats.some(b => b.row === r && b.col === c && b.seatIndex === s);
                              const letter = String.fromCharCode(65 + s);
                              return (
                                <button
                                  type="button"
                                  key={s}
                                  onClick={() => handleToggleBlockSeat(r, c, s)}
                                  className={`w-5 h-6 rounded-xs text-[9px] font-bold transition-colors cursor-pointer flex items-center justify-center ${
                                    isBlocked
                                      ? 'bg-rose-600 text-white ring-1 ring-rose-400'
                                      : 'bg-indigo-600 text-white hover:bg-indigo-500'
                                  }`}
                                  title={`Row ${r + 1} Col ${c + 1} Seat ${letter} (${isBlocked ? 'Blocked' : 'Available'})`}
                                >
                                  {isBlocked ? '✕' : letter}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Invigilator Assignment */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invigilator / Proctor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={invigilatorName}
                    onChange={e => setInvigilatorName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Invigilator Phone / Extension</label>
                  <input
                    type="text"
                    placeholder="e.g. +1 555 234-5678"
                    value={invigilatorPhone}
                    onChange={e => setInvigilatorPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-room-modal"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Save Exam Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
