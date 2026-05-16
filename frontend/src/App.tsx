import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Appointments from './pages/Appointments';
import Queue from './pages/Queue';
import AdminDoctors from './pages/admin/Doctors';
import AdminStaff from './pages/admin/Staff';
import AdminSchedules from './pages/admin/Schedule';
import AdminReschedule from './pages/admin/Reschedule';
import AuditLogs from './pages/admin/AuditLogs';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* WRAP ALL DASHBOARD ROUTES */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            
            {/* SHARED ACCESS (Doctor, Receptionist, Admin) */}
            <Route path="patients" element={<Patients />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="queue" element={<Queue />} />

            {/* ADMIN & RECEPTIONIST ONLY */}
            <Route path="admin/doctors" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <AdminDoctors />
              </ProtectedRoute>
            } />
            <Route path="admin/schedules" element={
              <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                <AdminSchedules />
              </ProtectedRoute>
            } />

            {/* ADMIN ONLY (Strict Security) */}
            <Route path="admin/receptionists" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminStaff />
              </ProtectedRoute>
            } />
            <Route path="admin/audit-logs" element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AuditLogs />
              </ProtectedRoute>
            } />
            
            {/* Note: AdminReschedule wasn't in backend docs, assuming Admin/Recep */}
            <Route path="admin/reschedule" element={
               <ProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']}>
                 <AdminReschedule />
               </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};
export default App;