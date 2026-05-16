import mongoose, { Schema, Document } from 'mongoose';

export interface IAppointmentType extends Document {
    name: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AppointmentTypeSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Index for active appointment types
AppointmentTypeSchema.index({ isActive: 1 });

export default mongoose.model<IAppointmentType>('AppointmentType', AppointmentTypeSchema);
