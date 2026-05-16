import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Edit2, Calendar, Clock, CalendarClock, X, Loader2, Briefcase, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface DaySchedule {
    dayOfWeek: number;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

interface DoctorWithSchedule {
    _id: string;
    name: string;
    specialization?: string;
    schedules: {
        [key: number]: { startTime: string; endTime: string } | null;
    };
}

const AdminSchedules: React.FC = () => {
    const [doctors, setDoctors] = useState<DoctorWithSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithSchedule | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Weekly availability state (indexed by dayOfWeek 0-6)
    const [weeklySchedule, setWeeklySchedule] = useState<DaySchedule[]>(
        Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isActive: false,
            startTime: '09:00',
            endTime: '17:00'
        }))
    );

    const fullDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schedRes, docRes] = await Promise.all([
                api.get('/admin/schedules'),
                api.get('/admin/doctors')
            ]);
            
            const schedules = schedRes.data;
            const doctorsData = docRes.data;

            // Build a map of schedules by doctorId
            const schedulesByDoctor: { [key: string]: { [key: number]: any } } = {};
            
            schedules.forEach((sched: any) => {
                const docId = sched.doctorId?._id || sched.doctorId;
                if (!schedulesByDoctor[docId]) {
                    schedulesByDoctor[docId] = {};
                }
                schedulesByDoctor[docId][sched.dayOfWeek] = {
                    startTime: sched.startTime,
                    endTime: sched.endTime
                };
            });

            // Enrich doctors with their schedules
            const enrichedDoctors: DoctorWithSchedule[] = doctorsData.map((doc: any) => ({
                _id: doc._id,
                name: doc.name,
                specialization: doc.specialization || 'General Physician',
                schedules: schedulesByDoctor[doc._id] || {}
            }));

            setDoctors(enrichedDoctors);
        } catch (error) {
            console.error("Failed to fetch data");
        } finally {
            setLoading(false);
        }
    };

    const openEditModal = (doctor: DoctorWithSchedule) => {
        setSelectedDoctor(doctor);
        
        // Initialize weekly schedule from doctor's existing schedules
        const newWeekly = Array.from({ length: 7 }, (_, i) => ({
            dayOfWeek: i,
            isActive: !!doctor.schedules[i],
            startTime: doctor.schedules[i]?.startTime || '09:00',
            endTime: doctor.schedules[i]?.endTime || '17:00'
        }));
        
        setWeeklySchedule(newWeekly);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setShowEditModal(false);
        setSelectedDoctor(null);
    };

    const toggleDay = (dayOfWeek: number) => {
        setWeeklySchedule(prev =>
            prev.map(day =>
                day.dayOfWeek === dayOfWeek
                    ? { ...day, isActive: !day.isActive }
                    : day
            )
        );
    };

    const updateTime = (dayOfWeek: number, field: 'startTime' | 'endTime', value: string) => {
        setWeeklySchedule(prev =>
            prev.map(day =>
                day.dayOfWeek === dayOfWeek
                    ? { ...day, [field]: value }
                    : day
            )
        );
    };

    const handleSaveSchedule = async () => {
        if (!selectedDoctor) return;

        // Filter only active days
        const activeSchedules = weeklySchedule
            .filter(day => day.isActive)
            .map(day => ({
                dayOfWeek: day.dayOfWeek,
                startTime: day.startTime,
                endTime: day.endTime
            }));

        if (activeSchedules.length === 0) {
            alert("Please select at least one day");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/admin/schedules/bulk', {
                doctorId: selectedDoctor._id,
                schedules: activeSchedules
            });

            alert("Schedule updated successfully!");
            closeEditModal();
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || "Failed to save schedules");
        } finally {
            setIsSubmitting(false);
        }
    };



    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto min-h-[calc(100vh-4rem)] font-sans">
            {/* Header */}
            <div className="mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <CalendarClock className="text-emerald-600" />
                        Doctor Schedules
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Manage weekly working hours and availability</p>
                </div>
            </div>

            {/* Content Area */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <Loader2 size={40} className="animate-spin text-emerald-600 mb-4" />
                    <p>Loading schedules...</p>
                </div>
            ) : doctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-12 bg-white rounded-3xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Calendar size={32} className="text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">No doctors found</p>
                    <p className="text-sm opacity-60">Add doctors first to configure their schedules.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                        <motion.div
                            key={doctor._id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                        >
                            {/* Doctor Header */}
                            <div className="p-5 border-b border-gray-50 bg-gradient-to-r from-emerald-50/50 to-white">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-emerald-600 shadow-sm text-xl font-bold">
                                            {doctor.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 text-lg">{doctor.name}</h3>
                                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                                                <Briefcase size={12} />
                                                {doctor.specialization}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Summary */}
                            <div className="p-5 flex-1">
                                <div className="space-y-3">
                                    {Object.keys(doctor.schedules).length > 0 ? (
                                        Object.entries(doctor.schedules)
                                            .filter(([_, sched]) => sched)
                                            .map(([day, sched]) => {
                                                const dayNum = parseInt(day);
                                                return (
                                                    <div key={dayNum} className="flex justify-between items-center p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                                                        <span className="font-semibold text-gray-700 text-sm">
                                                            {fullDays[dayNum]}
                                                        </span>
                                                        <span className="flex items-center gap-1 text-emerald-700 font-medium text-sm">
                                                            <Clock size={14} />
                                                            {sched!.startTime} - {sched!.endTime}
                                                        </span>
                                                    </div>
                                                );
                                            })
                                    ) : (
                                        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                                            <AlertCircle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-xs text-amber-700">No schedule configured yet</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Edit Button */}
                            <div className="p-4 border-t border-gray-50 flex gap-2">
                                <button
                                    onClick={() => openEditModal(doctor)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-md shadow-emerald-600/20 font-medium active:scale-95"
                                >
                                    <Edit2 size={16} />
                                    Edit Availability
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Edit Availability Modal */}
            <AnimatePresence>
                {showEditModal && selectedDoctor && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col"
                        >
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex justify-between items-center text-white">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Clock size={20} className="text-emerald-100" />
                                    Edit Weekly Availability
                                </h3>
                                <button
                                    onClick={closeEditModal}
                                    className="text-emerald-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Doctor Info */}
                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                                <p className="text-sm text-gray-600">
                                    <span className="font-semibold text-gray-800">{selectedDoctor.name}</span>
                                    <span className="text-gray-500"> • {selectedDoctor.specialization}</span>
                                </p>
                            </div>

                            {/* Weekly Schedule Grid */}
                            <div className="p-6 space-y-4 flex-1">
                                {weeklySchedule.map((day) => (
                                    <motion.div
                                        key={day.dayOfWeek}
                                        layout
                                        className="p-4 border border-gray-200 rounded-xl hover:border-emerald-300 transition-colors"
                                    >
                                        <div className="flex items-center justify-between gap-4">
                                            {/* Day Toggle */}
                                            <div className="flex items-center gap-3 flex-1">
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={day.isActive}
                                                        onChange={() => toggleDay(day.dayOfWeek)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                                                </label>
                                                <span className="font-bold text-gray-700 min-w-24">{fullDays[day.dayOfWeek]}</span>
                                            </div>

                                            {/* Time Inputs (disabled if inactive) */}
                                            {day.isActive && (
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="time"
                                                            value={day.startTime}
                                                            onChange={(e) => updateTime(day.dayOfWeek, 'startTime', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                                        />
                                                        <span className="text-gray-400">to</span>
                                                        <input
                                                            type="time"
                                                            value={day.endTime}
                                                            onChange={(e) => updateTime(day.dayOfWeek, 'endTime', e.target.value)}
                                                            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {!day.isActive && (
                                                <div className="text-sm text-gray-400 font-medium">Off</div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Footer Actions */}
                            <div className="sticky bottom-0 px-6 py-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold"
                                    onClick={closeEditModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    disabled={isSubmitting}
                                    onClick={handleSaveSchedule}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        'Save Schedule'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminSchedules;