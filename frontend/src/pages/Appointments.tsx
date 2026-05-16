import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, X, Check, Calendar, Clock, User, Ban, UserPlus, ArrowLeft, Loader2, MapPin, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- HELPER: Get Local Date String (YYYY-MM-DD) ---
const getLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const Appointments: React.FC = () => {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [showBooking, setShowBooking] = useState(false);

    // Data States
    const [doctors, setDoctors] = useState([]);
    const [types, setTypes] = useState([]);
    const [patients, setPatients] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // UI States
    const [viewDate, setViewDate] = useState(getLocalDate());
    const [patientSearch, setPatientSearch] = useState('');
    const [isCreatingPatient, setIsCreatingPatient] = useState(false);
    const [isSavingPatient, setIsSavingPatient] = useState(false);
    const [hoveredPatient, setHoveredPatient] = useState<any | null>(null);
    const [loadingSlots, setLoadingSlots] = useState(false);

    // Booking Form State
    const [booking, setBooking] = useState({
        patientId: '',
        doctorId: '',
        appointmentTypeId: '',
        date: getLocalDate(),
        startTime: '',
        durationMinutes: 15
    });

    const [newPatient, setNewPatient] = useState({
        patientName: '',
        fatherName: '',
        phone: '',
        dob: '',
        gender: 'Male'
    });

    // --- EFFECTS ---

    useEffect(() => {
        fetchAppointments();
    }, [viewDate, user]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const typesRes = await api.get('/admin/appointment-types');
                setTypes(typesRes.data);

                if (user?.role !== 'DOCTOR') {
                    const doctorsRes = await api.get('/admin/doctors');
                    setDoctors(doctorsRes.data);
                } else if (user?.role === 'DOCTOR' && user.doctorId) {
                    setBooking(prev => ({ ...prev, doctorId: user.doctorId || '' }));
                }
            } catch (error) {
                console.error("Failed to fetch initial data");
            }
        };
        fetchInitialData();
    }, [user]);

    // Search Effect
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            if (patientSearch.length > 1 && !isCreatingPatient && !booking.patientId) {
                api.get(`/patients?search=${patientSearch}`).then(res => setPatients(res.data));
            } else {
                setPatients([]);
            }
        }, 300);
        return () => clearTimeout(delayDebounce);
    }, [patientSearch, isCreatingPatient, booking.patientId]);

    // Slots Effect
    useEffect(() => {
        if (booking.doctorId && booking.date && booking.durationMinutes) {
            setLoadingSlots(true);
            setAvailableSlots([]);

            api.get(`/doctors/${booking.doctorId}/slots?date=${booking.date}&duration=${booking.durationMinutes}`)
                .then(res => {
                    // --- FRONTEND FILTER: Ensure no past slots for Today ---
                    let slots = res.data;
                    const today = getLocalDate();

                    // If viewing Today, filter out times that have passed
                    if (booking.date === today) {
                        const now = new Date();
                        const currentHours = now.getHours();
                        const currentMinutes = now.getMinutes();
                        const currentTimeVal = currentHours * 60 + currentMinutes;

                        slots = slots.filter((slot: any) => {
                            const [h, m] = slot.startTime.split(':').map(Number);
                            const slotTimeVal = h * 60 + m;
                            return slotTimeVal > currentTimeVal; // Only future slots
                        });
                    }
                    setAvailableSlots(slots);
                })
                .catch(err => {
                    console.error("Error fetching slots:", err);
                    setAvailableSlots([]);
                })
                .finally(() => {
                    setLoadingSlots(false);
                });
        }
    }, [booking.doctorId, booking.date, booking.durationMinutes]);

    // --- ACTIONS ---

    const fetchAppointments = async () => {
        try {
            const endpoint = user?.role === 'DOCTOR'
                ? `/appointments?date=${viewDate}&doctorId=${user.doctorId}`
                : `/appointments?date=${viewDate}`;
            const { data } = await api.get(endpoint);
            setAppointments(data);
        } catch (error) {
            console.error("Failed to fetch appointments");
        }
    };

    const startCreateWithSearchTerm = () => {
        setNewPatient(prev => ({ ...prev, patientName: patientSearch }));
        setIsCreatingPatient(true);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPatientSearch(e.target.value);
        if (booking.patientId) {
            setBooking(prev => ({ ...prev, patientId: '' }));
        }
    };

    const handleCreatePatient = async () => {
        if (!newPatient.patientName || !newPatient.fatherName || !newPatient.dob) {
            alert("Please fill in Name, Father's Name and DOB");
            return;
        }
        setIsSavingPatient(true);
        try {
            const { data } = await api.post('/patients', newPatient);
            setBooking(prev => ({ ...prev, patientId: data._id }));
            setPatientSearch(data.patientName);
            setIsCreatingPatient(false);
            setPatients([]);
            setNewPatient({ patientName: '', fatherName: '', phone: '', dob: '', gender: 'Male' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create patient');
        } finally {
            setIsSavingPatient(false);
        }
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/appointments', booking);
            setShowBooking(false);
            fetchAppointments();
            setBooking({
                patientId: '',
                doctorId: user?.role === 'DOCTOR' ? user.doctorId || '' : '',
                appointmentTypeId: '',
                date: getLocalDate(),
                startTime: '',
                durationMinutes: 15
            });
            setPatientSearch('');
        } catch (error: any) {
            alert(error.response?.data?.message || 'Booking failed');
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await api.patch(`/appointments/${id}/status`, { status });
            fetchAppointments();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleCancel = async (id: string) => {
        const reason = window.prompt("Please enter a reason for cancellation:");
        if (!reason) return;
        try {
            await api.patch(`/appointments/${id}/cancel`, { cancellationReason: reason });
            fetchAppointments();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to cancel appointment');
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'CHECKED_IN': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
            case 'NO_SHOW': return 'bg-orange-50 text-orange-600 border-orange-100';
            default: return 'bg-gray-50 text-gray-600';
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Calendar className="text-emerald-600" />
                        Appointments
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage patient bookings and schedule</p>
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="date"
                        value={viewDate}
                        onChange={(e) => setViewDate(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm text-gray-600"
                    />
                    <button
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
                        onClick={() => setShowBooking(true)}
                    >
                        <Plus size={20} />
                        <span>Book Appointment</span>
                    </button>
                </div>
            </div>

            {/* Appointments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <Calendar size={48} className="mb-2 opacity-20" />
                            <p>No appointments found for this date.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-emerald-50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100">Time</th>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100">Patient</th>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100">Doctor</th>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100">Type</th>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-emerald-700 uppercase border-b border-emerald-100 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {appointments.map((app: any) => (
                                    <tr key={app._id} className="hover:bg-emerald-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                                                <Clock size={14} />
                                                {app.startTime}
                                            </span>
                                            <span className="text-xs text-gray-400">{app.durationMinutes} mins</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                    {app.patientId.patientName.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{app.patientId.patientName}</div>
                                                    <div className="text-xs text-gray-400">{app.patientId.phone}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 text-sm">{app.doctorId.name}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                                {app.appointmentTypeId.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wide ${getStatusStyle(app.status)}`}>
                                                {app.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {app.status === 'SCHEDULED' && (
                                                    <>
                                                        <button
                                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            onClick={() => handleStatusChange(app._id, 'CHECKED_IN')}
                                                            title="Check In"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            onClick={() => handleCancel(app._id)}
                                                            title="Cancel"
                                                        >
                                                            <Ban size={18} />
                                                        </button>
                                                    </>
                                                )}
                                                {app.status !== 'CANCELLED' && app.status !== 'COMPLETED' && (
                                                    <button
                                                        className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors"
                                                        onClick={() => handleStatusChange(app._id, 'NO_SHOW')}
                                                        title="No Show"
                                                    >
                                                        <User size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Booking Modal */}
            <AnimatePresence>
                {showBooking && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-visible flex flex-col max-h-[90vh]"
                        >
                            <div className="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center flex-shrink-0 rounded-t-2xl">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    {isCreatingPatient ? 'New Patient Details' : 'Book Appointment'}
                                </h2>
                                <button onClick={() => { setShowBooking(false); setIsCreatingPatient(false); setHoveredPatient(null); }} className="text-emerald-100 hover:text-white transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-5 rounded-b-2xl">

                                {/* --- SECTION 1: Patient Selection OR Creation --- */}
                                <div className="space-y-1.5 relative bg-gray-50 p-4 rounded-xl border border-gray-200">
                                    {isCreatingPatient ? (
                                        // CREATE PATIENT FORM
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <h3 className="text-sm font-bold text-emerald-700 uppercase">Quick Create</h3>
                                                <button onClick={() => setIsCreatingPatient(false)} className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1">
                                                    <ArrowLeft size={12} /> Back to Search
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input placeholder="Full Name *" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={newPatient.patientName} onChange={e => setNewPatient({ ...newPatient, patientName: e.target.value })} />
                                                <input placeholder="Father's Name *" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={newPatient.fatherName} onChange={e => setNewPatient({ ...newPatient, fatherName: e.target.value })} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <input placeholder="Phone" className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} />
                                                <select className="w-full px-3 py-2 border rounded-lg text-sm bg-white" value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}>
                                                    <option>Male</option>
                                                    <option>Female</option>
                                                    <option>Other</option>
                                                </select>
                                            </div>
                                            <div className="grid grid-cols-1">
                                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Date of Birth *</label>
                                                <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm text-gray-600 bg-white" value={newPatient.dob} onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })} />
                                            </div>
                                            <button onClick={handleCreatePatient} disabled={isSavingPatient} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 flex justify-center gap-2 shadow-sm">
                                                {isSavingPatient && <Loader2 size={16} className="animate-spin" />}
                                                Save & Select Patient
                                            </button>
                                        </motion.div>
                                    ) : (
                                        // SEARCH PATIENT
                                        <>
                                            <label className="text-xs font-bold text-gray-500 uppercase flex justify-between">
                                                <span>Search Patient</span>
                                            </label>
                                            <div className="relative">
                                                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    placeholder="Type name (e.g. Sanjai) or phone..."
                                                    value={patientSearch}
                                                    onChange={handleSearchChange}
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                                />
                                                {booking.patientId && (
                                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-full">
                                                        <Check size={12} /> Selected
                                                    </div>
                                                )}
                                            </div>

                                            {/* Search Results Dropdown */}
                                            {patients.length > 0 && !booking.patientId && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 max-h-56 overflow-visible">
                                                    <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
                                                        {patients.map((p: any) => (
                                                            <div
                                                                key={p._id}
                                                                className={`px-4 py-3 cursor-pointer text-sm hover:bg-emerald-50 transition-colors flex justify-between items-center group relative`}
                                                                onClick={() => {
                                                                    setBooking({ ...booking, patientId: p._id });
                                                                    setPatientSearch(p.patientName);
                                                                    setPatients([]);
                                                                    setHoveredPatient(null);
                                                                }}
                                                                onMouseEnter={() => setHoveredPatient(p)}
                                                                onMouseLeave={() => setHoveredPatient(null)}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-gray-800">{p.patientName}</span>
                                                                    <span className="text-gray-400 text-xs flex items-center gap-1">
                                                                        <User size={10} /> S/o {p.fatherName}
                                                                    </span>
                                                                </div>
                                                                <span className="text-gray-400 text-xs">{p.phone || 'No Phone'}</span>

                                                                {/* HOVER POPUP */}
                                                                {hoveredPatient?._id === p._id && (
                                                                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="absolute left-full top-0 ml-2 w-60 bg-gray-800 text-white p-4 rounded-xl shadow-2xl z-50 pointer-events-none hidden md:block border border-gray-700">
                                                                        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-700">
                                                                            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-lg">{p.patientName[0]}</div>
                                                                            <div><p className="font-bold text-sm text-emerald-50">{p.patientName}</p><p className="text-xs text-gray-400 font-mono">ID: ...{p._id.slice(-4)}</p></div>
                                                                        </div>
                                                                        <div className="space-y-2.5 text-xs text-gray-300">
                                                                            <div className="flex gap-2 items-center"><User size={12} className="text-emerald-400" /><span>{p.gender}, {new Date().getFullYear() - new Date(p.dob).getFullYear()} Years</span></div>
                                                                            <div className="flex gap-2 items-start"><MapPin size={12} className="text-emerald-400 mt-0.5" /><span className="leading-tight">{p.address || 'No Address'}</span></div>
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Create Prompt */}
                                            {patientSearch.length > 1 && patients.length === 0 && !booking.patientId && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-20 p-2">
                                                    <button onClick={startCreateWithSearchTerm} className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors flex items-center justify-between group">
                                                        <div><span className="block font-bold text-sm">Create "{patientSearch}"</span><span className="text-xs text-emerald-600/70">Patient not found. Click to add.</span></div>
                                                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><UserPlus size={16} /></div>
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>

                                {/* --- SECTION 2: Appointment Details --- */}
                                <div className={`space-y-5 transition-opacity ${isCreatingPatient ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Doctor</label>
                                            <select
                                                required
                                                value={booking.doctorId}
                                                disabled={user?.role === 'DOCTOR'}
                                                onChange={e => setBooking({ ...booking, doctorId: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white disabled:bg-gray-100"
                                            >
                                                {user?.role === 'DOCTOR' ? (
                                                    <option value={user.doctorId}>{user.name}</option>
                                                ) : (
                                                    <>
                                                        <option value="">Select Doctor</option>
                                                        {doctors.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Type</label>
                                            <select
                                                required
                                                value={booking.appointmentTypeId}
                                                onChange={e => setBooking({ ...booking, appointmentTypeId: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                            >
                                                <option value="">Select Type</option>
                                                {types.map((t: any) => <option key={t._id} value={t._id}>{t.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
                                            <input
                                                type="date"
                                                required
                                                value={booking.date}
                                                onChange={e => setBooking({ ...booking, date: e.target.value })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                                            <select
                                                value={booking.durationMinutes}
                                                onChange={e => setBooking({
                                                    ...booking,
                                                    durationMinutes: parseInt(e.target.value),
                                                    startTime: '' // <--- ADD THIS: Reset time when duration changes
                                                })}
                                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                                            >
                                                <option value={5}>5 mins</option>
                                                <option value={10}>10 mins</option>
                                                <option value={15}>15 mins</option>
                                                <option value={30}>30 mins</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 uppercase">Available Slots</label>
                                        <div className="bg-gray-50 rounded-lg border border-gray-200 p-2 min-h-[100px]">
                                            {loadingSlots ? (
                                                <div className="flex flex-col items-center justify-center h-24 text-emerald-600 gap-2">
                                                    <Loader2 size={24} className="animate-spin" />
                                                    <span className="text-xs font-medium">Checking availability...</span>
                                                </div>
                                            ) : !booking.doctorId ? (
                                                <div className="flex flex-col items-center justify-center h-24 text-gray-400 gap-1">
                                                    <User size={20} className="opacity-50" />
                                                    <span className="text-xs">Select a doctor to view slots</span>
                                                </div>
                                            ) : availableSlots.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center h-24 text-red-400 gap-1">
                                                    <AlertCircle size={20} className="opacity-50" />
                                                    <span className="text-xs font-medium text-red-500">No slots available for this date</span>
                                                    <span className="text-[10px] text-gray-400">Check doctor's schedule settings</span>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                                                    {availableSlots.map((slot: any) => (
                                                        <button
                                                            key={slot.startTime}
                                                            type="button"
                                                            // FIX: Disable if unavailable OR if user hasn't picked a Type yet
                                                            disabled={!slot.available}
                                                            className={`py-2 px-1 text-xs font-semibold rounded border transition-all ${booking.startTime === slot.startTime
                                                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-200'
                                                                    : !slot.available
                                                                        ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed decoration-slice'
                                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600'
                                                                }`}
                                                            onClick={() => setBooking({ ...booking, startTime: slot.startTime })}
                                                        >
                                                            {slot.startTime}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50 flex gap-3 flex-shrink-0 rounded-b-2xl">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors font-medium"
                                    onClick={() => setShowBooking(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBook}
                                    // FIX: Added !booking.appointmentTypeId to prevent validation error
                                    disabled={!booking.startTime || !booking.patientId || !booking.appointmentTypeId || isCreatingPatient}
                                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                                >
                                    Confirm Booking
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Appointments;