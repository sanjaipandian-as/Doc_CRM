import { Request, Response } from 'express';
import QueueToken, { QueueStatus } from '../models/QueueToken';
import Appointment, { AppointmentStatus } from '../models/Appointment';
import Patient from '../models/Patient';
import { AuthRequest } from '../middleware/authMiddleware';
import { logAudit } from '../utils/auditLogger';
import mongoose from 'mongoose';
import { DateTime } from 'luxon';

export const getQueue = async (req: Request, res: Response) => {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ message: 'Doctor ID and date are required' });

    const queue = await QueueToken.find({ doctorId: doctorId as string, date: date as string })
        .populate('patientId', 'patientName phone')
        .populate('appointmentId', 'startTime endTime')
        .sort({ queuePosition: 1 });

    res.json(queue);
};

export const addToQueue = async (req: AuthRequest, res: Response) => {
    const { doctorId, date, patientId, appointmentId } = req.body;

    // Get max token number and position for today
    const lastToken = await QueueToken.findOne({ doctorId, date }).sort({ tokenNumber: -1 });
    const tokenNumber = (lastToken?.tokenNumber || 0) + 1;
    const queuePosition = (lastToken?.queuePosition || 0) + 1;

    const queueToken = new QueueToken({
        doctorId,
        date,
        patientId,
        appointmentId,
        tokenNumber,
        queuePosition,
        status: QueueStatus.WAITING
    });

    const savedToken = await queueToken.save();

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'CREATE',
        entityType: 'QueueToken',
        entityId: savedToken._id as mongoose.Types.ObjectId,
        newValue: savedToken,
    });

    res.status(201).json(savedToken);
};

export const reorderQueue = async (req: AuthRequest, res: Response) => {
    const { tokens } = req.body; // Array of { id, queuePosition }

    for (const item of tokens) {
        await QueueToken.findByIdAndUpdate(item.id, { queuePosition: item.queuePosition });
    }

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'REORDER',
        entityType: 'QueueToken',
        entityId: new mongoose.Types.ObjectId(), // Generic ID for bulk action
        newValue: tokens,
    });

    res.json({ message: 'Queue reordered' });
};

export const updateQueueStatus = async (req: AuthRequest, res: Response) => {
    const { status } = req.body;
    const token = await QueueToken.findById(req.params.id);
    if (!token) return res.status(404).json({ message: 'Token not found' });

    const oldVal = token.toObject();
    token.status = status;
    const updatedToken = await token.save();

    await logAudit({
        actorUserId: req.user!._id as mongoose.Types.ObjectId,
        actorRole: req.user!.role,
        actionType: 'STATUS_CHANGE',
        entityType: 'QueueToken',
        entityId: updatedToken._id as mongoose.Types.ObjectId,
        oldValue: oldVal,
        newValue: updatedToken,
    });

    res.json(updatedToken);
};

export const syncQueue = async (req: AuthRequest, res: Response) => {
    const { doctorId, date } = req.query;
    if (!doctorId || !date) return res.status(400).json({ message: 'Doctor ID and date are required' });

    // Find appointments for this doctor and date that are not in queue yet
    const appointments = await Appointment.find({
        doctorId: doctorId as string,
        date: date as string,
        status: { $in: [AppointmentStatus.SCHEDULED, AppointmentStatus.CHECKED_IN] }
    });

    const existingAppointmentIds = (await QueueToken.find({ doctorId: doctorId as string, date: date as string }))
        .map(t => t.appointmentId?.toString())
        .filter(id => id);

    const newAppointments = appointments.filter(a => !existingAppointmentIds.includes(a._id.toString()));

    let lastToken = await QueueToken.findOne({ doctorId: doctorId as string, date: date as string }).sort({ tokenNumber: -1 });
    let tokenNumber = lastToken?.tokenNumber || 0;
    let queuePosition = lastToken?.queuePosition || 0;

    const tokensToCreate = newAppointments.map(a => {
        tokenNumber++;
        queuePosition++;
        return {
            doctorId,
            date,
            patientId: a.patientId,
            appointmentId: a._id,
            tokenNumber,
            queuePosition,
            status: QueueStatus.WAITING
        };
    });

    if (tokensToCreate.length > 0) {
        await QueueToken.insertMany(tokensToCreate);
        await logAudit({
            actorUserId: req.user!._id as mongoose.Types.ObjectId,
            actorRole: req.user!.role,
            actionType: 'SYNC',
            entityType: 'QueueToken',
            entityId: new mongoose.Types.ObjectId(),
            newValue: tokensToCreate,
        });
    }

    res.json({ message: `Synced ${tokensToCreate.length} appointments to queue` });
};
