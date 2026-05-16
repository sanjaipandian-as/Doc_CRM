import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeRange {
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
}

export interface IDoctorScheduleTemplate extends Document {
    doctorId: mongoose.Types.ObjectId;
    dayOfWeek: number; // 0-6
    startTime: string; // HH:mm
    endTime: string;   // HH:mm
    breakSlots: ITimeRange[];
    createdAt: Date;
    updatedAt: Date;
}

const TimeRangeSchema = new Schema({
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
}, { _id: false });

const DoctorScheduleTemplateSchema: Schema = new Schema(
    {
        doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
        dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        breakSlots: [TimeRangeSchema],
    },
    { timestamps: true }
);

// Index for quick schedule lookups by doctor and day
DoctorScheduleTemplateSchema.index({ doctorId: 1, dayOfWeek: 1 });

export default mongoose.model<IDoctorScheduleTemplate>('DoctorScheduleTemplate', DoctorScheduleTemplateSchema);
