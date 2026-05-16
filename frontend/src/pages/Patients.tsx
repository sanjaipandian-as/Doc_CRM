import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Search, UserPlus, Phone, ChevronRight, X, User, History, MapPin, FileText, Stethoscope, Mail, Calendar, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface Patient {
    _id: string;
    patientName: string;
    fatherName: string;
    phone: string;
    email: string;
    dob: string;
    gender: string;
    address: string;
}

interface PatientDetails extends Patient {
    appointments?: any[];
}

const Patients: React.FC = () => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [search, setSearch] = useState('');

    // UI States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<PatientDetails | null>(null);

    // Form State
    const [newPatient, setNewPatient] = useState({
        patientName: '',
        fatherName: '',
        phone: '',
        email: '',
        dob: '',
        gender: 'Male',
        address: ''
    });

    // 1. Fetch Patients List (Debounced)
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const { data } = await api.get(`/patients?search=${search}`);
                setPatients(data);
            } catch (error) {
                console.error("Failed to fetch patients");
            }
        };
        const timer = setTimeout(fetchPatients, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // 2. Fetch Patient Details
    const handleViewPatient = async (id: string) => {
        try {
            const { data } = await api.get(`/patients/${id}`);
            setSelectedPatient({ ...data.patient, appointments: data.appointments });
        } catch (error) {
            alert('Failed to fetch patient details');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/patients', newPatient);
            setShowCreateModal(false);
            setSearch('');
            setNewPatient({ patientName: '', fatherName: '', phone: '', email: '', dob: '', gender: 'Male', address: '' });
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to create patient');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
            case 'CANCELLED': return 'text-red-700 bg-red-50 border-red-100';
            case 'CHECKED_IN': return 'text-blue-700 bg-blue-50 border-blue-100';
            default: return 'text-gray-700 bg-gray-50 border-gray-100';
        }
    };

    const calculateAge = (dob: string) => {
        if (!dob) return 'N/A';
        const age = new Date().getFullYear() - new Date(dob).getFullYear();
        return `${age} Yrs`;
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col font-sans bg-gray-50/30">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 flex-shrink-0">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
                            <User size={28} />
                        </div>
                        Patient Records
                    </h2>
                    <p className="text-gray-500 mt-2 font-medium">Manage patient profiles, history, and contact details.</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80 group">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-medium"
                        />
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 font-semibold justify-center"
                    >
                        <UserPlus size={18} />
                        <span>Add Patient</span>
                    </motion.button>
                </div>
            </div>

            {/* Patient Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-12 pr-2 custom-scrollbar">
                {patients.length > 0 ? patients.map((patient) => (
                    <motion.div
                        key={patient._id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={() => handleViewPatient(patient._id)}
                        className="group bg-white rounded-2xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-xl hover:border-emerald-200 transition-all duration-300 flex flex-col overflow-hidden relative"
                    >
                        {/* Card Content */}
                        <div className="p-5 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xl shadow-inner">
                                        {patient.patientName?.[0]?.toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 font-bold text-lg truncate leading-tight group-hover:text-emerald-700 transition-colors">
                                            {patient.patientName}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-1">S/o {patient.fatherName}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100 flex items-center gap-1">
                                    <User size={12} />
                                    {patient.gender}
                                </span>
                                <span className="px-2.5 py-1 rounded-md bg-gray-50 text-gray-600 text-xs font-semibold border border-gray-100 flex items-center gap-1">
                                    <Calendar size={12} />
                                    {calculateAge(patient.dob)}
                                </span>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-gray-50/50 px-5 py-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                            <div className="flex items-center gap-1.5 font-medium">
                                <Phone size={12} className="text-emerald-500" />
                                {patient.phone || 'N/A'}
                            </div>
                            <div className="flex items-center gap-1 group-hover:translate-x-1 transition-transform text-emerald-600 font-semibold">
                                View
                                <ChevronRight size={14} />
                            </div>
                        </div>
                    </motion.div>
                )) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-200">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <User size={32} className="opacity-20 text-gray-500" />
                        </div>
                        <p className="font-bold text-gray-600 text-lg">No patients found</p>
                        <p className="text-sm opacity-60">Try a different search or add a new patient</p>
                    </div>
                )}
            </div>

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                        <UserPlus size={20} />
                                    </div>
                                    New Patient Registration
                                </h2>
                                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-8 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Patient Name <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            value={newPatient.patientName}
                                            onChange={e => setNewPatient({ ...newPatient, patientName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium"
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Father's Name <span className="text-red-500">*</span></label>
                                        <input
                                            required
                                            value={newPatient.fatherName}
                                            onChange={e => setNewPatient({ ...newPatient, fatherName: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium"
                                            placeholder="e.g. Robert Doe"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                value={newPatient.phone}
                                                onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium"
                                                placeholder="9876543210"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                            <input
                                                type="email"
                                                value={newPatient.email}
                                                onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Date of Birth <span className="text-red-500">*</span></label>
                                        <input
                                            type="date"
                                            required
                                            value={newPatient.dob}
                                            onChange={e => setNewPatient({ ...newPatient, dob: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white text-sm font-medium text-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Gender <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <select
                                                value={newPatient.gender}
                                                onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white appearance-none text-sm font-medium text-gray-600"
                                            >
                                                <option>Male</option>
                                                <option>Female</option>
                                                <option>Other</option>
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-gray-400" size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Address</label>
                                    <textarea
                                        rows={3}
                                        value={newPatient.address}
                                        onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none bg-gray-50 focus:bg-white text-sm font-medium"
                                        placeholder="Enter full address..."
                                    />
                                </div>
                            </form>

                            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-4 sticky bottom-0">
                                <button type="button" className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:border-gray-300 transition-all font-bold" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="submit" onClick={handleCreate} className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 transition-all font-bold">Create Profile</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Details Modal */}
            <AnimatePresence>
                {selectedPatient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-8 py-8 text-white flex justify-between items-start relative overflow-hidden">
                                {/* Decorative circle */}
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>

                                <div className="relative z-10">
                                    <h2 className="text-3xl font-bold">{selectedPatient.patientName}</h2>
                                    <div className="flex items-center gap-3 mt-2 text-emerald-100 text-sm font-medium">
                                        <span className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-lg border border-white/10">
                                            <Hash size={12} /> {selectedPatient._id.slice(-6).toUpperCase()}
                                        </span>
                                        <span>•</span>
                                        <span>{calculateAge(selectedPatient.dob)}</span>
                                        <span>•</span>
                                        <span>{selectedPatient.gender}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedPatient(null)} className="text-emerald-100 hover:text-white hover:bg-white/20 rounded-full p-2 transition-colors relative z-10">
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    {/* Info Column */}
                                    <div className="col-span-1 space-y-8 border-r border-gray-100 pr-6">
                                        <div className="space-y-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                                <User size={14} /> Personal Details
                                            </h3>

                                            <div className="space-y-4">
                                                <div className="group">
                                                    <span className="block text-xs font-bold text-gray-400 mb-0.5">Father's Name</span>
                                                    <span className="font-semibold text-gray-800">{selectedPatient.fatherName}</span>
                                                </div>
                                                <div className="group">
                                                    <span className="block text-xs font-bold text-gray-400 mb-0.5">Contact</span>
                                                    <div className="font-semibold text-gray-800 flex items-center gap-2">
                                                        <Phone size={14} className="text-emerald-500" />
                                                        {selectedPatient.phone}
                                                    </div>
                                                </div>
                                                <div className="group">
                                                    <span className="block text-xs font-bold text-gray-400 mb-0.5">Email</span>
                                                    <span className="font-semibold text-gray-800 break-words">{selectedPatient.email || 'N/A'}</span>
                                                </div>
                                                <div className="group">
                                                    <span className="block text-xs font-bold text-gray-400 mb-0.5">Address</span>
                                                    <div className="text-sm font-medium text-gray-600 leading-snug flex items-start gap-2">
                                                        <MapPin size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                        {selectedPatient.address || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* History Column */}
                                    <div className="col-span-1 md:col-span-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                                            <History size={14} /> Medical Timeline
                                        </h3>

                                        {selectedPatient.appointments && selectedPatient.appointments.length > 0 ? (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 font-bold text-xs uppercase tracking-wider border-b border-gray-200">
                                                        <tr>
                                                            <th className="px-5 py-3">Date</th>
                                                            <th className="px-5 py-3">Doctor</th>
                                                            <th className="px-5 py-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 bg-white">
                                                        {selectedPatient.appointments.map((app: any) => (
                                                            <tr key={app._id} className="hover:bg-emerald-50/50 transition-colors group">
                                                                <td className="px-5 py-4 text-gray-600 font-semibold font-mono text-xs">
                                                                    {app.date}
                                                                </td>
                                                                <td className="px-5 py-4 text-gray-800">
                                                                    <div className="flex items-center gap-2 font-medium">
                                                                        <div className="p-1 bg-emerald-100 rounded text-emerald-600">
                                                                            <Stethoscope size={14} />
                                                                        </div>
                                                                        {app.doctorId?.name || 'Unknown'}
                                                                    </div>
                                                                </td>
                                                                <td className="px-5 py-4">
                                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border uppercase tracking-wide ${getStatusColor(app.status)}`}>
                                                                        {app.status}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                                                <FileText size={40} className="mx-auto mb-3 opacity-30" />
                                                <p className="font-semibold text-gray-500">No medical history recorded</p>
                                                <p className="text-xs mt-1">Appointments will appear here once created.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Patients;