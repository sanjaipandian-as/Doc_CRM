import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User, { UserRole } from './models/User';
import Doctor from './models/Doctor';
import AppointmentType from './models/AppointmentType';
import DoctorScheduleTemplate from './models/DoctorScheduleTemplate';

dotenv.config();

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/clinic_management');
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Doctor.deleteMany({});
        await AppointmentType.deleteMany({});
        await DoctorScheduleTemplate.deleteMany({});

        // Create Admin
        const adminSalt = await bcrypt.genSalt(10);
        const adminPasswordHash = await bcrypt.hash('zippy@clinic.2026@', adminSalt);
        await User.create({
            name: 'System Admin',
            email: 'zippy@clinic.com',
            passwordHash: adminPasswordHash,
            role: UserRole.ADMIN,
        });
        console.log('Admin user created: zippy@clinic.com / zippy@clinic.2026@');

        // Create Receptionist
        const recepSalt = await bcrypt.genSalt(10);
        const recepPasswordHash = await bcrypt.hash('recep123', recepSalt);
        await User.create({
            name: 'Main Receptionist',
            email: 'recep@clinic.com',
            passwordHash: recepPasswordHash,
            role: UserRole.RECEPTIONIST,
        });
        console.log('Receptionist user created: recep@clinic.com / recep123');

        // Create Doctors
        const doctor1 = await Doctor.create({
            name: 'Dr. John Smith',
            email: 'john.smith@clinic.com',
            specialization: 'General Physician',
            defaultSlotDurationMinutes: 15,
        });
        const doctor2 = await Doctor.create({
            name: 'Dr. Sarah Wilson',
            email: 'sarah.wilson@clinic.com',
            specialization: 'Pediatrician',
            defaultSlotDurationMinutes: 20,
        });
        const doctor3 = await Doctor.create({
            name: 'Dr. Michael Johnson',
            email: 'michael.johnson@clinic.com',
            specialization: 'Cardiologist',
            defaultSlotDurationMinutes: 30,
        });
        const doctor4 = await Doctor.create({
            name: 'Dr. Emily Davis',
            email: 'emily.davis@clinic.com',
            specialization: 'Dentist',
            defaultSlotDurationMinutes: 25,
        });
        console.log('Doctors created with email');

        // Create Appointment Types
        await AppointmentType.create([
            { name: 'Consultation' },
            { name: 'Follow-up' },
            { name: 'Emergency' },
            { name: 'Vaccination' },
        ]);
        console.log('Appointment types created');

        // Create Sample Schedules for Doctor 1 (Mon-Fri, 10:00-17:00, break 13:00-14:00)
        for (let i = 1; i <= 5; i++) {
            await DoctorScheduleTemplate.create({
                doctorId: doctor1._id,
                dayOfWeek: i,
                startTime: '10:00',
                endTime: '17:00',
                breakSlots: [{ startTime: '13:00', endTime: '14:00' }]
            });
        }

        // Create Sample Schedules for Doctor 2 (Tue-Sat, 09:00-18:00, break 12:00-13:00)
        for (let i = 2; i <= 6; i++) {
            const dayOfWeek = i === 6 ? 6 : i;
            await DoctorScheduleTemplate.create({
                doctorId: doctor2._id,
                dayOfWeek: dayOfWeek,
                startTime: '09:00',
                endTime: '18:00',
                breakSlots: [{ startTime: '12:00', endTime: '13:00' }]
            });
        }
        console.log('Schedules created for all doctors');

        console.log('Seeding completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
