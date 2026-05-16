import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Calendar, Clock, AlertCircle, Search, Stethoscope, ArrowRight, X, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Appointment {
    _id: string;
    patientId: { _id: string; patientName: string; phone: string };
    doctorId: { _id: string; name: string };
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    appointmentTypeId?: { name: string };
}

interface RescheduleRequest {
    appointmentId: string;
    newDate: string;
    newStartTime: string;
}

const AdminReschedule: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Form State
    const [rescheduleData, setRescheduleData] = useState<RescheduleRequest>({
        appointmentId: '',
        newDate: '',
        newStartTime: '',
    });

    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchAppointments();
    }, []);

    useEffect(() => {
        filterAppointments();
    }, [searchTerm, appointments]);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const { data } = await api.get<Appointment[]>('/appointments');
            // Show newest first
            setAppointments(data.reverse());
        } catch (err) {
            setError('Failed to fetch appointments');
        } finally {
            setLoading(false);
        }
    };

    const filterAppointments = () => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = appointments.filter(apt =>
            apt.patientId?.patientName?.toLowerCase().includes(lowerTerm) ||
            apt.doctorId?.name?.toLowerCase().includes(lowerTerm) ||
            apt.date?.includes(lowerTerm)
        );
        setFilteredAppointments(filtered);
    };

    const handleSelectAppointment = (apt: Appointment) => {
        setSelectedAppointment(apt);
        setRescheduleData({
            appointmentId: apt._id,
            newDate: apt.date,
            newStartTime: apt.startTime,
        });
        setError('');
        setSuccess('');
    };

    const handleReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!rescheduleData.newDate || !rescheduleData.newStartTime) {
            setError('Please fill in all required fields');
            return;
        }

        if (!selectedAppointment) return;

        // Calculate duration to preserve it
        const [startHour, startMin] = selectedAppointment.startTime.split(':').map(Number);
        const [endHour, endMin] = selectedAppointment.endTime.split(':').map(Number);
        const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

        try {
            setProcessing(true);
            await api.patch(`/appointments/${rescheduleData.appointmentId}/reschedule`, {
                date: rescheduleData.newDate,
                startTime: rescheduleData.newStartTime,
                durationMinutes,
                rescheduleReason: 'Rescheduled by admin'
            });

            setSuccess('Appointment rescheduled successfully');
            fetchAppointments();

            // Auto-clear selection after delay
            setTimeout(() => {
                setSelectedAppointment(null);
                setSuccess('');
            }, 2000);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reschedule appointment');
        } finally {
            setProcessing(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'SCHEDULED': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'COMPLETED': return 'bg-gray-100 text-gray-700 border-gray-200';
            case 'CANCELLED': return 'bg-red-50 text-red-600 border-red-100';
            case 'CHECKED_IN': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-gray-50 text-gray-600 border-gray-100';
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col font-sans">
            <div className="mb-6 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Calendar className="text-emerald-600" />
                    Reschedule Appointments
                </h2>
                <p className="text-sm text-gray-500 mt-1">Modify dates and times for existing bookings</p>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden min-h-0">

                {/* --- Left Column: Search & List --- */}
                <div className="lg:col-span-2 flex flex-col bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden h-full">
                    {/* Search Header */}
                    <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search patient, doctor, or date..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-gray-400 text-sm bg-gray-50 focus:bg-white"
                            />
                        </div>
                    </div>

                    {/* Scrollable List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-4"></div>
                                <p>Loading appointments...</p>
                            </div>
                        ) : filteredAppointments.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                                <Calendar size={48} className="mb-4 opacity-20" />
                                <p>No matching appointments found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {filteredAppointments.map(apt => (
                                    <motion.div
                                        key={apt._id}
                                        layout
                                        onClick={() => handleSelectAppointment(apt)}
                                        className={`p-4 cursor-pointer transition-all hover:bg-emerald-50/40 relative group ${selectedAppointment?._id === apt._id
                                                ? 'bg-emerald-50/60'
                                                : 'bg-white'
                                            }`}
                                    >
                                        {/* Active Indicator Strip */}
                                        {selectedAppointment?._id === apt._id && (
                                            <motion.div
                                                layoutId="activeStrip"
                                                className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"
                                            />
                                        )}

                                        <div className="flex justify-between items-start">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${selectedAppointment?._id === apt._id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {apt.patientId?.patientName?.[0]}
                                                </div>
                                                <div>
                                                    <h3 className={`text-sm font-bold ${selectedAppointment?._id === apt._id ? 'text-emerald-900' : 'text-gray-900'}`}>
                                                        {apt.patientId?.patientName}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                                        <Stethoscope size={12} />
                                                        <span>{apt.doctorId?.name}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-xs font-bold text-gray-700 flex items-center justify-end gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                    <Calendar size={12} className="text-emerald-500" />
                                                    {apt.date}
                                                </div>
                                                <div className="mt-1.5 flex justify-end">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border tracking-wide ${getStatusStyle(apt.status)}`}>
                                                        {apt.status}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* --- Right Column: Reschedule Form --- */}
                <div className="lg:col-span-1 h-full relative">
                    <AnimatePresence mode="wait">
                        {selectedAppointment ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden sticky top-0 flex flex-col h-fit"
                            >
                                {/* Form Header */}
                                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Clock size={64} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            Modify Booking
                                        </h3>
                                        <p className="text-emerald-100 text-sm mt-1 opacity-90">
                                            Update schedule details
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedAppointment(null)}
                                        className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors hover:bg-white/10 p-1 rounded-lg"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    {/* Current Details Card */}
                                    <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100 relative">
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-200 px-3 py-1 rounded-full text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm">
                                            Current Slot
                                        </div>
                                        <div className="text-center mt-2">
                                            <div className="text-2xl font-bold text-gray-800 font-mono tracking-tight">
                                                {selectedAppointment.startTime}
                                            </div>
                                            <div className="text-sm text-gray-500 font-medium mt-1">
                                                {new Date(selectedAppointment.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Messages */}
                                    {error && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-start gap-2 text-xs font-medium border border-red-100">
                                            <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                            {error}
                                        </motion.div>
                                    )}

                                    {success && (
                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium border border-emerald-100 flex items-center gap-2">
                                            <CheckCircle size={14} />
                                            {success}
                                        </motion.div>
                                    )}

                                    {/* Inputs */}
                                    <form onSubmit={handleReschedule} className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Date</label>
                                            <div className="relative">
                                                <Calendar size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="date"
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white"
                                                    value={rescheduleData.newDate}
                                                    onChange={e => setRescheduleData({ ...rescheduleData, newDate: e.target.value })}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">New Start Time</label>
                                            <div className="relative">
                                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                <input
                                                    type="time"
                                                    required
                                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all font-medium text-gray-700 bg-gray-50 focus:bg-white"
                                                    value={rescheduleData.newStartTime}
                                                    onChange={e => setRescheduleData({ ...rescheduleData, newStartTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-50 font-semibold shadow-lg shadow-emerald-600/20 active:scale-[0.98] flex items-center justify-center gap-2 mt-4"
                                        >
                                            {processing ? (
                                                <span className="flex items-center gap-2">Saving...</span>
                                            ) : (
                                                <>
                                                    <span>Confirm Reschedule</span>
                                                    <ArrowRight size={16} />
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="hidden lg:flex flex-col items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center min-h-[400px]"
                            >
                                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                                    <Clock size={40} className="text-emerald-200" />
                                </div>
                                <h3 className="text-gray-900 font-bold text-lg mb-2">No Selection</h3>
                                <p className="text-sm text-gray-500 max-w-[200px] leading-relaxed">
                                    Select an appointment from the list to modify its date or time.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default AdminReschedule;