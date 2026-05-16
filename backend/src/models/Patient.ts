import mongoose, { Schema, Document } from 'mongoose';

export interface IPatient extends Document {
    patientName: string;
    fatherName: string;
    phone?: string;
    email?: string;
    dob: Date;
    gender: string;
    address?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PatientSchema: Schema = new Schema(
    {
        patientName: { type: String, required: true },
        fatherName: { type: String, required: true },
        phone: { type: String },
        email: { type: String },
        dob: { type: Date, required: true },
        gender: { type: String, required: true },
        address: { type: String },
    },
    { timestamps: true }
);

// Compound index for uniqueness rule
PatientSchema.index({ patientName: 1, fatherName: 1, phone: 1 }, { unique: true });

export default mongoose.model<IPatient>('Patient', PatientSchema);
