import { Request, Response } from 'express';
import Patient from '../models/Patient';
import Appointment from '../models/Appointment';
import { AuthRequest } from '../middleware/authMiddleware';
import { logAudit } from '../utils/auditLogger';
import mongoose from 'mongoose';

export const getPatients = async (req: Request, res: Response) => {
    const { search } = req.query;
    let query = {};
    if (search) {
        query = {
            $or: [
                { patientName: { $regex: search, $options: 'i' } },
                { fatherName: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ]
        };
    }
    const patients = await Patient.find(query).limit(50);
    res.json(patients);
};

export const getPatientById = async (req: Request, res: Response) => {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const appointments = await Appointment.find({ patientId: patient._id }).populate('doctorId', 'name').sort({ date: -1 });
    res.json({ patient, appointments });
};

export const createPatient = async (req: AuthRequest, res: Response) => {
    try {
        const patient = new Patient(req.body);
        const savedPatient = await patient.save();

        await logAudit({
            actorUserId: req.user!._id as mongoose.Types.ObjectId,
            actorRole: req.user!.role,
            actionType: 'CREATE',
            entityType: 'Patient',
            entityId: savedPatient._id as mongoose.Types.ObjectId,
            newValue: savedPatient,
        });

        res.status(201).json(savedPatient);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Patient with this name, father name and phone already exists' });
        }
        res.status(500).json({ message: error.message });
    }
};

export const updatePatient = async (req: AuthRequest, res: Response) => {
    const patient = await Patient.findById(req.params.id);
    if (patient) {
        const oldVal = patient.toObject();
        Object.assign(patient, req.body);
        const updatedPatient = await patient.save();

        await logAudit({
            actorUserId: req.user!._id as mongoose.Types.ObjectId,
            actorRole: req.user!.role,
            actionType: 'UPDATE',
            entityType: 'Patient',
            entityId: updatedPatient._id as mongoose.Types.ObjectId,
            oldValue: oldVal,
            newValue: updatedPatient,
        });
        res.json(updatedPatient);
    } else {
        res.status(404).json({ message: 'Patient not found' });
    }
};
