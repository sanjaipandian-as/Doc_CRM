import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Edit2, Power, User, Stethoscope, Clock, X, Loader2, CheckCircle2, Sparkles, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Interfaces
interface Doctor {
    _id: string;
    name: string;
    email: string;
    specialization: string;
    defaultSlotDurationMinutes: number;
    isActive: boolean;
}

const AdminDoctors: React.FC = () => {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        specialization: '',
        defaultSlotDurationMinutes: 15
    });

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/doctors');
            setDoctors(data);
        } catch (error) {
            console.error("Failed to fetch doctors");
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ name: '', email: '', specialization: '', defaultSlotDurationMinutes: 15 });
        setShowModal(true);
    };

    const openEditModal = (doc: Doctor) => {
        setEditingId(doc._id);
        setFormData({
            name: doc.name,
            email: doc.email,
            specialization: doc.specialization,
            defaultSlotDurationMinutes: doc.defaultSlotDurationMinutes
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.patch(`/admin/doctors/${editingId}`, formData);
            } else {
                await api.post('/admin/doctors', formData);
            }
            setShowModal(false);
            fetchDoctors();
        } catch (error) {
            alert(editingId ? "Failed to update doctor" : "Failed to add doctor");
        }
    };

    const toggleActive = async (id: string, current: boolean) => {
        if (!window.confirm(`Are you sure you want to ${current ? 'deactivate' : 'activate'} this doctor profile?`)) return;

        try {
            await api.patch(`/admin/doctors/${id}`, { isActive: !current });
            fetchDoctors();
        } catch (error) {
            alert("Failed to update status");
        }
    };

    // Stats for Header
    const activeCount = doctors.filter(d => d.isActive).length;

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-gray-50/50 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm">
                            <Stethoscope size={28} />
                        </div>
                        Medical Staff
                    </h2>
                    <div className="flex items-center gap-4 mt-2 text-sm font-medium text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <User size={14} /> {doctors.length} Total
                        </span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                        <span className="flex items-center gap-1.5 text-emerald-600">
                            <CheckCircle2 size={14} /> {activeCount} Active
                        </span>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/20 font-semibold transition-all justify-center"
                >
                    <Plus size={20} />
                    <span>Add New Doctor</span>
                </motion.button>
            </div>

            {/* Content Grid */}
            {loading ? (
                <div className="flex flex-col items-center justify-center h-96">
                    <Loader2 size={48} className="animate-spin text-emerald-600 mb-4" />
                    <p className="text-gray-400 font-medium">Syncing profiles...</p>
                </div>
            ) : doctors.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-3xl border border-dashed border-gray-300 shadow-sm">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <User size={40} className="text-gray-300" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700">No Doctors Found</h3>
                    <p className="text-gray-400 mt-2">Add your first medical professional to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
                    <AnimatePresence>
                        {doctors.map((doc) => (
                            <motion.div
                                key={doc._id}
                                layout
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    relative bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl group
                                    ${doc.isActive ? 'border-gray-200' : 'border-gray-100 opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100'}
                                `}
                            >
                                {/* Card Body */}
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        {/* Avatar */}
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 text-2xl font-bold">
                                            {doc.name.charAt(0)}
                                        </div>

                                        {/* Status Badge */}
                                        <div className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 ${doc.isActive
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-red-50 text-red-700 border-red-100'
                                            }`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${doc.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                                            {doc.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900 leading-tight">{doc.name}</h3>
                                        <p className="text-sm font-medium text-emerald-600 mt-1">{doc.specialization}</p>
                                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                            <Mail size={12} />
                                            {doc.email}
                                        </p>
                                    </div>

                                    <div className="mt-6 flex items-center gap-3">
                                        <div className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-2 text-xs font-semibold text-gray-600">
                                            <Clock size={14} className="text-emerald-500" />
                                            {doc.defaultSlotDurationMinutes} min slots
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center gap-3">
                                    <button
                                        onClick={() => openEditModal(doc)}
                                        className="flex-1 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-emerald-500 hover:text-emerald-600 text-gray-700 px-3 py-2 rounded-lg transition-all text-sm font-semibold shadow-sm"
                                    >
                                        <Edit2 size={14} /> Edit
                                    </button>

                                    <button
                                        onClick={() => toggleActive(doc._id, doc.isActive)}
                                        className={`p-2.5 rounded-lg border transition-all shadow-sm ${doc.isActive
                                                ? 'bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50'
                                                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                                            }`}
                                        title={doc.isActive ? "Deactivate Profile" : "Activate Profile"}
                                    >
                                        <Power size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-md p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
                        >
                            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        {editingId ? <Edit2 size={20} className="text-emerald-600" /> : <Sparkles size={20} className="text-emerald-600" />}
                                        {editingId ? 'Edit Profile' : 'New Doctor'}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {editingId ? 'Update details below.' : 'Onboard a new medical professional.'}
                                    </p>
                                </div>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Doctor Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            required
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white text-sm font-medium"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. Dr. Sarah Smith"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            required
                                            type="email"
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white text-sm font-medium"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="e.g. doctor@clinic.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Specialization</label>
                                    <div className="relative">
                                        <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white text-sm font-medium"
                                            value={formData.specialization}
                                            onChange={e => setFormData({ ...formData, specialization: e.target.value })}
                                            placeholder="e.g. General Physician, Cardiology"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Default Slot Duration</label>
                                    <div className="relative group">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500" size={18} />
                                        <select
                                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all bg-gray-50/50 focus:bg-white appearance-none text-sm font-medium text-gray-600"
                                            value={formData.defaultSlotDurationMinutes}
                                            onChange={e => setFormData({ ...formData, defaultSlotDurationMinutes: parseInt(e.target.value) })}
                                        >
                                            <option value={5}>5 Minutes (Rapid)</option>
                                            <option value={10}>10 Minutes</option>
                                            <option value={15}>15 Minutes (Standard)</option>
                                            <option value={30}>30 Minutes (Consultation)</option>
                                            <option value={60}>1 Hour (Surgery/Special)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-4">
                                    <button
                                        type="button"
                                        className="flex-1 px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all font-bold text-sm"
                                        onClick={() => setShowModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-500/30 transition-all font-bold text-sm"
                                    >
                                        {editingId ? 'Save Changes' : 'Create Profile'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDoctors;