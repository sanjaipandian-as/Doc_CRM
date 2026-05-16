import { Request, Response } from 'express';
import Appointment, { AppointmentStatus, BookingMode } from '../models/Appointment';
import Doctor from '../models/Doctor';
import DoctorScheduleTemplate from '../models/DoctorScheduleTemplate';
import DoctorLeave from '../models/DoctorLeave';
import AppointmentStatusHistory from '../models/AppointmentStatusHistory';
import NotificationOutbox, { NotificationType, NotificationTarget, NotificationChannel, NotificationStatus } from '../models/NotificationOutbox';
import { AuthRequest } from '../middleware/authMiddleware';
import { logAudit } from '../utils/auditLogger';
import { generateSlots } from '../utils/slotHelper';
import { sendAppointmentCreatedToDoctor } from '../utils/emailService';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

export const getAvailableSlots = async (req: Request, res: Response) => {
    try {
        const { doctorId } = req.params;
        const { date, duration } = req.query;

        console.log(`\n--- Fetching Slots ---`);
        console.log(`Doctor: ${doctorId}, Date: ${date}, Duration: ${duration}`);

        if (!date || !duration) {
            return res.status(400).json({ message: 'Date and duration are required' });
        }

        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            console.log('Error: Doctor not found');
            return res.status(404).json({ message: 'Doctor not found' });
        }

        // 1. Check for Leave
        const leave = await DoctorLeave.findOne({ doctorId, date: date as string });
        if (leave) {
            console.log('Info: Doctor is on leave');
            return res.json([]); 
        }

        // 2. Calculate Day of Week (0=Sun, 1=Mon, ..., 6=Sat)
        // Luxon .weekday returns 1 (Mon) to 7 (Sun). 
        // We use % 7 to convert 7 (Sun) to 0.
        const dt = DateTime.fromISO(date as string);
        const dayOfWeek = dt.weekday % 7; 
        
        console.log(`Calculated Day Index: ${dayOfWeek} (for date ${date})`);

        // 3. Find Schedule
        const schedule = await DoctorScheduleTemplate.findOne({ 
            doctorId, 
            dayOfWeek 
        });

        if (!schedule) {
            console.log(`Info: No schedule found for day index ${dayOfWeek}`);
            return res.json([]);
        }

        // 4. Get Existing Appointments
        const bookedAppointments = await Appointment.find({
            doctorId,
            date: date as string,
            status: { $nin: [AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW] }
        });

        const bookedSlots = bookedAppointments.map(a => ({ startTime: a.startTime, endTime: a.endTime }));
        
        // FIX: Handle undefined breakSlots to prevent crash
        const breaks = schedule.breakSlots || [];
        const breakSlots = breaks.map(b => ({ startTime: b.startTime, endTime: b.endTime }));

        // 5. Generate Slots
        const slots = generateSlots(
            date as string,
            schedule.startTime,
            schedule.endTime,
            parseInt(duration as string),
            bookedSlots,
            breakSlots
        );

        console.log(`Success: Generated ${slots.length} slots`);
        res.json(slots);

    } catch (error) {
        console.error("Slot Generation Error:", error);
        res.status(500).json({ message: 'Server error generating slots' });
    }
};

export const createAppointment = async (req: AuthRequest, res: Response) => {
    const { doctorId, patientId, appointmentTypeId, date, startTime, durationMinutes } = req.body;

    const endTime = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Kolkata' })
        .plus({ minutes: durationMinutes })
        .toFormat('HH:mm');

    // Double booking check
    const existing = await Appointment.findOne({
        doctorId,
        date,
        status: { $nin: [AppointmentStatus.CANCELLED] },
        $or: [
            { startTime: { $gte: startTime, $lt: endTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
    });

    if (existing) return res.status(400).json({ message: 'Double booking not allowed' });

    // Past time check
    const now = DateTime.now().setZone('Asia/Kolkata');
    const appTime = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Kolkata' });
    const bookingMode = appTime < now ? BookingMode.BACKDATED : BookingMode.NORMAL;

    const appointment = new Appointment({
        ...req.body,
        endTime,
        bookingMode,
        createdBy: req.user!._id,
        updatedBy: req.user!._id,
    });

    const savedAppointment = await appointment.save();

    // Status History
    await AppointmentStatusHistory.create({
        appointmentId: savedAppointment._id,
        fromStatus: AppointmentStatus.SCHEDULED,
        toStatus: AppointmentStatus.SCHEDULED,
        changedBy: req.user!._id,
        note: 'Initial booking'
    });

    // Notifications
    await NotificationOutbox.create([
        {
            type: NotificationType.APPOINTMENT_CREATED,
            target: NotificationTarget.DOCTOR,
            doctorId,
            appointmentId: savedAppointment._id,
            channel: NotificationChannel.EMAIL,
            payload: { message: `New appointment scheduled for ${date} at ${startTime}` }
        },
        {
            type: NotificationType.APPOINTMENT_CREATED,
            target: NotificationTarget.PATIENT,
            patientId,
            appointmentId: savedAppointment._id,
            channel: NotificationChannel.SMS,
            payload: { message: `Your appointment is scheduled for ${date} at ${startTime}` }
        }
    ]);

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'Appointment',
        entityId: savedAppointment._id as mongoose.Types.ObjectId,
        newValue: savedAppointment,
    });

    // Send email to doctor asynchronously (don't wait for it)
    sendAppointmentCreatedToDoctor(savedAppointment._id.toString()).catch(err => 
        console.error('Failed to send email to doctor:', err)
    );

    res.status(201).json(savedAppointment);
};

export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
    const { date, startTime, durationMinutes, rescheduleReason } = req.body;
    if (!rescheduleReason) return res.status(400).json({ message: 'Reschedule reason is mandatory' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldVal = appointment.toObject();
    const endTime = DateTime.fromFormat(`${date} ${startTime}`, 'yyyy-MM-dd HH:mm', { zone: 'Asia/Kolkata' })
        .plus({ minutes: durationMinutes })
        .toFormat('HH:mm');

    // Double booking check (excluding self)
    const existing = await Appointment.findOne({
        _id: { $ne: appointment._id },
        doctorId: appointment.doctorId,
        date,
        status: { $nin: [AppointmentStatus.CANCELLED] },
        $or: [
            { startTime: { $gte: startTime, $lt: endTime } },
            { endTime: { $gt: startTime, $lte: endTime } },
            { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
        ]
    });

    if (existing) return res.status(400).json({ message: 'Double booking not allowed' });

    appointment.date = date;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.durationMinutes = durationMinutes;
    appointment.rescheduleReason = rescheduleReason;
    appointment.updatedBy = req.user!._id as mongoose.Types.ObjectId;

    const updatedAppointment = await appointment.save();

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'RESCHEDULE',
        entityType: 'Appointment',
        entityId: updatedAppointment._id as mongoose.Types.ObjectId,
        oldValue: oldVal,
        newValue: updatedAppointment,
    });

    res.json(updatedAppointment);
};

export const cancelAppointment = async (req: AuthRequest, res: Response) => {
    const { cancellationReason } = req.body;
    if (!cancellationReason) return res.status(400).json({ message: 'Cancellation reason is mandatory' });

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldVal = appointment.toObject();
    const oldStatus = appointment.status;
    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = cancellationReason;
    appointment.updatedBy = req.user!._id as mongoose.Types.ObjectId;

    const updatedAppointment = await appointment.save();

    await AppointmentStatusHistory.create({
        appointmentId: updatedAppointment._id,
        fromStatus: oldStatus,
        toStatus: AppointmentStatus.CANCELLED,
        changedBy: req.user!._id,
        note: cancellationReason
    });

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CANCEL',
        entityType: 'Appointment',
        entityId: updatedAppointment._id as mongoose.Types.ObjectId,
        oldValue: oldVal,
        newValue: updatedAppointment,
    });

    res.json(updatedAppointment);
};

export const updateAppointmentStatus = async (req: AuthRequest, res: Response) => {
    const { status, note } = req.body;
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    const oldStatus = appointment.status;
    appointment.status = status;
    appointment.updatedBy = req.user!._id as mongoose.Types.ObjectId;

    const updatedAppointment = await appointment.save();

    await AppointmentStatusHistory.create({
        appointmentId: updatedAppointment._id,
        fromStatus: oldStatus,
        toStatus: status,
        changedBy: req.user!._id,
        note
    });

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'STATUS_CHANGE',
        entityType: 'Appointment',
        entityId: updatedAppointment._id as mongoose.Types.ObjectId,
        oldValue: { status: oldStatus },
        newValue: { status },
    });

    res.json(updatedAppointment);
};

export const getAppointments = async (req: Request, res: Response) => {
    const { doctorId, date, status, search } = req.query;
    let query: any = {};
    if (doctorId) query.doctorId = doctorId;
    if (date) query.date = date;
    if (status) query.status = status;

    const appointments = await Appointment.find(query)
        .populate('doctorId', 'name')
        .populate('patientId', 'patientName phone')
        .populate('appointmentTypeId', 'name')
        .sort({ startTime: 1 });

    res.json(appointments);
};
