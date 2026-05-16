import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Plus, Mail, Shield, Trash2, User, Lock, Loader2, X, BadgeCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminStaff: React.FC = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAdd, setShowAdd] = useState(false);
    
    // Form State
    const [newStaff, setNewStaff] = useState({ 
        name: '', 
        email: '', 
        password: '' 
    });

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/receptionists');
            setStaff(data);
        } catch (error) {
            console.error("Failed to fetch staff");
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/admin/receptionists', newStaff);
            setShowAdd(false);
            setNewStaff({ name: '', email: '', password: '' });
            fetchStaff();
        } catch (error) {
            alert("Failed to add staff member");
        }
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col font-sans">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 flex-shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Shield className="text-emerald-600" />
                        Manage Staff
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Receptionists and administrative access control</p>
                </div>
                <button 
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-600/20 font-medium active:scale-95"
                >
                    <Plus size={20} />
                    <span>Add Staff</span>
                </button>
            </div>

            {/* Table Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400">
                        <Loader2 size={40} className="animate-spin text-emerald-600 mb-4" />
                        <p>Loading staff list...</p>
                    </div>
                ) : staff.length === 0 ? (
                    <div className="flex flex-col items-center justify-center flex-1 text-gray-400 p-12">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                            <User size={32} className="text-gray-300" />
                        </div>
                        <p className="font-medium text-gray-600">No staff members found</p>
                        <p className="text-sm opacity-60">Add a receptionist to manage front-desk operations.</p>
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Member</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {staff.map((member: any) => (
                                    <tr key={member._id} className="hover:bg-emerald-50/40 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                                                    <User size={18} />
                                                </div>
                                                <span className="font-semibold text-gray-800">{member.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Mail size={14} className="text-gray-400" />
                                                <span className="text-sm font-medium">{member.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 w-fit text-xs font-bold text-gray-600 uppercase tracking-wide">
                                                <Shield size={12} className="text-emerald-500" />
                                                {member.role}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                <BadgeCheck size={12} className="text-emerald-600" />
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Staff Modal */}
            <AnimatePresence>
                {showAdd && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
                        >
                            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-5 flex justify-between items-center text-white">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center backdrop-blur-sm">
                                        <User size={18} className="text-white" />
                                    </div>
                                    New Staff Member
                                </h3>
                                <button onClick={() => setShowAdd(false)} className="text-emerald-100 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form onSubmit={handleAdd} className="p-6 space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Full Name</label>
                                    <input 
                                        required 
                                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                        placeholder="e.g. John Doe"
                                        value={newStaff.name} 
                                        onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                                    />
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email Address</label>
                                    <div className="relative">
                                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            required 
                                            type="email"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="staff@clinic.com"
                                            value={newStaff.email} 
                                            onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Password</label>
                                    <div className="relative">
                                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input 
                                            required 
                                            type="password"
                                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                                            placeholder="••••••••"
                                            value={newStaff.password} 
                                            onChange={e => setNewStaff({ ...newStaff, password: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <button 
                                        type="button" 
                                        className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm transition-all font-semibold"
                                        onClick={() => setShowAdd(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/30 transition-all font-semibold"
                                    >
                                        Create Account
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

export default AdminStaff;