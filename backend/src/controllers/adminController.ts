import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User, { UserRole } from '../models/User';
import Doctor from '../models/Doctor';
import AppointmentType from '../models/AppointmentType';
import DoctorScheduleTemplate from '../models/DoctorScheduleTemplate';
import DoctorLeave from '../models/DoctorLeave';
import AuditLog from '../models/AuditLog';
import { AuthRequest } from '../middleware/authMiddleware';
import { logAudit } from '../utils/auditLogger';
import mongoose from 'mongoose';
import { AnyBulkWriteOperation } from 'mongodb';

// Doctors
export const getDoctors = async (req: Request, res: Response) => {
    const doctors = await Doctor.find({});
    res.json(doctors);
};

export const createDoctor = async (req: AuthRequest, res: Response) => {
    const { name, email, specialization, defaultSlotDurationMinutes } = req.body;
    const doctor = new Doctor({ name, email, specialization, defaultSlotDurationMinutes });
    const savedDoctor = await doctor.save();

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'Doctor',
        entityId: savedDoctor._id as mongoose.Types.ObjectId,
        newValue: savedDoctor,
    });

    res.status(201).json(savedDoctor);
};

export const updateDoctor = async (req: AuthRequest, res: Response) => {
    const doctor = await Doctor.findById(req.params.id);
    if (doctor) {
        const oldVal = doctor.toObject();
        doctor.name = req.body.name || doctor.name;
        doctor.email = req.body.email || doctor.email;
        doctor.specialization = req.body.specialization || doctor.specialization;
        doctor.isActive = req.body.isActive !== undefined ? req.body.isActive : doctor.isActive;
        doctor.defaultSlotDurationMinutes = req.body.defaultSlotDurationMinutes || doctor.defaultSlotDurationMinutes;

        const updatedDoctor = await doctor.save();
        await logAudit({
            actorUserId: req.user!._id as mongoose.Types.ObjectId,
            actorRole: req.user!.role,
            actionType: 'UPDATE',
            entityType: 'Doctor',
            entityId: updatedDoctor._id as mongoose.Types.ObjectId,
            oldValue: oldVal,
            newValue: updatedDoctor,
        });
        res.json(updatedDoctor);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
};

// Receptionists (Users with role RECEPTIONIST)
export const getReceptionists = async (req: Request, res: Response) => {
    const receptionists = await User.find({ role: UserRole.RECEPTIONIST }).select('-passwordHash');
    res.json(receptionists);
};

export const createReceptionist = async (req: AuthRequest, res: Response) => {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
        name,
        email,
        passwordHash,
        role: UserRole.RECEPTIONIST,
    });

    const savedUser = await user.save();
    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'User',
        entityId: savedUser._id as mongoose.Types.ObjectId,
        newValue: { name, email, role: UserRole.RECEPTIONIST },
    });

    res.status(201).json({ _id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role });
};

// Appointment Types
export const getAppointmentTypes = async (req: Request, res: Response) => {
    const types = await AppointmentType.find({});
    res.json(types);
};

export const createAppointmentType = async (req: AuthRequest, res: Response) => {
    const { name } = req.body;
    const type = new AppointmentType({ name });
    const savedType = await type.save();
    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'AppointmentType',
        entityId: savedType._id as mongoose.Types.ObjectId,
        newValue: savedType,
    });
    res.status(201).json(savedType);
};

// Schedules
export const getSchedules = async (req: Request, res: Response) => {
    const { doctorId } = req.query;
    const filter = doctorId ? { doctorId: doctorId as string } : {};
    const schedules = await DoctorScheduleTemplate.find(filter).populate('doctorId', 'name');
    res.json(schedules);
};

export const createSchedule = async (req: AuthRequest, res: Response) => {
    const schedule = new DoctorScheduleTemplate(req.body);
    const savedSchedule = await schedule.save();
    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'Schedule',
        entityId: savedSchedule._id as mongoose.Types.ObjectId,
        newValue: savedSchedule,
    });
    res.status(201).json(savedSchedule);
};

export const createBulkSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const { doctorId, schedules } = req.body;

        // Validation
        if (!doctorId) {
            return res.status(400).json({ message: 'doctorId is required' });
        }

        if (!schedules || !Array.isArray(schedules) || schedules.length === 0) {
            return res.status(400).json({ message: 'schedules array is required and must have at least one entry' });
        }

        // Validate each schedule entry
        for (const schedule of schedules) {
            if (schedule.dayOfWeek === undefined || schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
                return res.status(400).json({ message: 'Each schedule must have a valid dayOfWeek (0-6)' });
            }
            if (!schedule.startTime || !schedule.endTime) {
                return res.status(400).json({ message: 'Each schedule must have startTime and endTime' });
            }
        }

        // Verify doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // 1. Prepare Bulk Operations
        // Each schedule object is { dayOfWeek, startTime, endTime }
        // Filter ensures no duplicates: { doctorId, dayOfWeek }
        const bulkOps: AnyBulkWriteOperation<any>[] = schedules.map((schedule: any) => ({
            updateOne: {
                filter: { doctorId, dayOfWeek: schedule.dayOfWeek },
                update: {
                    $set: {
                        doctorId,
                        dayOfWeek: schedule.dayOfWeek,
                        startTime: schedule.startTime,
                        endTime: schedule.endTime,
                        // Preserve existing breakSlots if not provided, otherwise use empty array
                        ...(schedule.breakSlots !== undefined && { breakSlots: schedule.breakSlots })
                    }
                },
                upsert: true
            }
        }));

        // 2. Execute Bulk Write
        const result = await DoctorScheduleTemplate.bulkWrite(bulkOps);

        // 3. Audit Log
        await logAudit({
            actorUserId: req.user!._id as mongoose.Types.ObjectId,
            actorRole: req.user!.role,
            actionType: 'BULK_SCHEDULE_UPDATE',
            entityType: 'Schedule',
            entityId: new mongoose.Types.ObjectId(doctorId),
            newValue: {
                doctorName: doctor.name,
                updatedDays: schedules.length,
                schedules
            },
        });

        res.status(200).json({
            message: `Successfully updated schedules for ${schedules.length} day(s)`,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount
        });

    } catch (error) {
        console.error("Bulk Schedule Error:", error);
        res.status(500).json({ message: 'Server Error processing bulk schedule' });
    }
};

export const deleteSchedule = async (req: AuthRequest, res: Response) => {
    try {
        const schedule = await DoctorScheduleTemplate.findById(req.params.id);
        
        if (schedule) {
            await schedule.deleteOne(); // Use deleteOne() for Mongoose documents
            
            // Audit Log
            await logAudit({
                actorUserId: req.user!._id as mongoose.Types.ObjectId,
                actorRole: req.user!.role,
                actionType: 'DELETE',
                entityType: 'Schedule',
                entityId: schedule._id as mongoose.Types.ObjectId,
                oldValue: schedule
            });

            res.json({ message: 'Schedule removed' });
        } else {
            res.status(404).json({ message: 'Schedule not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Leaves
export const getLeaves = async (req: Request, res: Response) => {
    const { doctorId } = req.query;
    const filter = doctorId ? { doctorId: doctorId as string } : {};
    const leaves = await DoctorLeave.find(filter).populate('doctorId', 'name');
    res.json(leaves);
};

export const createLeave = async (req: AuthRequest, res: Response) => {
    const leave = new DoctorLeave(req.body);
    const savedLeave = await leave.save();
    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'Leave',
        entityId: savedLeave._id as mongoose.Types.ObjectId,
        newValue: savedLeave,
    });
    res.status(201).json(savedLeave);
};

// Audit Logs
export const getAuditLogs = async (req: Request, res: Response) => {
    const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(100).populate('actorUserId', 'name');
    res.json(logs);
};
