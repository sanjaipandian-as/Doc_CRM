import { DateTime } from 'luxon';

export interface Slot {
    startTime: string;
    endTime: string;
    available: boolean;
    reason?: string;
}

export const generateSlots = (
    date: string,              // "2026-01-21"
    workStartTime: string,     // "09:00"
    workEndTime: string,       // "17:00" or "05:00" (Overnight)
    durationMinutes: number,   // 30
    bookedSlots: { startTime: string; endTime: string }[],
    breakSlots: { startTime: string; endTime: string }[]
): Slot[] => {
    
    // Config: Granularity (Step size)
    const STEP_MINUTES = 5; 

    if (!workStartTime || !workEndTime) return [];

    const slots: Slot[] = [];
    const zone = 'Asia/Kolkata';

    // 1. Parse Start and End Times relative to the specific Date
    let current = DateTime.fromFormat(`${date} ${workStartTime}`, 'yyyy-MM-dd HH:mm', { zone });
    let end = DateTime.fromFormat(`${date} ${workEndTime}`, 'yyyy-MM-dd HH:mm', { zone });

    // --- FIX: STRICT DAY BOUNDARY ---
    // If the End Time is earlier than Start Time (e.g., Start 21:00, End 05:00),
    // it normally means the shift goes to the next day.
    // BUT, since you want ONLY slots for "That Day", we cut it off at 23:59:59.
    if (end < current) {
        // Instead of adding a day, we clamp the end time to the end of the current day.
        end = DateTime.fromFormat(`${date} 23:59:59`, 'yyyy-MM-dd HH:mm:ss', { zone });
        
        console.log(`[SlotGen] Overnight shift detected. Clamping end time to ${end.toFormat('HH:mm')} to stay within date.`);
    }
    // --------------------------------

    if (!current.isValid || !end.isValid) return [];

    // 2. Loop Logic
    // checks if (Slot Start + Duration) fits before the End Time
    while (current.plus({ minutes: durationMinutes }) <= end) {
        const slotStart = current;
        const slotEnd = current.plus({ minutes: durationMinutes });

        const slotStartStr = slotStart.toFormat('HH:mm');
        const slotEndStr = slotEnd.toFormat('HH:mm');

        let available = true;
        let reason = '';

        // Check Breaks
        for (const breakSlot of breakSlots) {
            if (
                (slotStartStr >= breakSlot.startTime && slotStartStr < breakSlot.endTime) ||
                (slotEndStr > breakSlot.startTime && slotEndStr <= breakSlot.endTime) ||
                (slotStartStr <= breakSlot.startTime && slotEndStr >= breakSlot.endTime)
            ) {
                available = false;
                reason = 'BREAK';
                break;
            }
        }

        // Check Bookings
        if (available) {
            for (const booked of bookedSlots) {
                if (
                    (slotStartStr >= booked.startTime && slotStartStr < booked.endTime) ||
                    (slotEndStr > booked.startTime && slotEndStr <= booked.endTime) ||
                    (slotStartStr <= booked.startTime && slotEndStr >= booked.endTime)
                ) {
                    available = false;
                    reason = 'BOOKED';
                    break;
                }
            }
        }

        slots.push({
            startTime: slotStartStr,
            endTime: slotEndStr,
            available,
            reason
        });

        // Increment by STEP (5 mins) for flexibility
        current = current.plus({ minutes: STEP_MINUTES });
    }
    
    return slots;
};