import { api } from '../api/axios';


export type SlotStatus = 'UNAVAILABLE' | 'FREE' | 'BOOKED' | 'ABSENT';

export interface PatientSnapshot {
  fullName: string;
  gender: "M" | "F" | "OTHER";
  age: number;
}

export interface SlotCell {
  time: string;
  status: SlotStatus;
  isPast: boolean;
  appointmentId: string | null;
  visitType: string | null;
  patientSnapshot?: PatientSnapshot | null;
  notesForDoctor?: string | null;
}

export interface DaySchedule {
  date: string;
  dow: number;
  isToday: boolean;
  isAbsent: boolean;
  bookedCount: number;
  cells: SlotCell[];
}

export interface ScheduleResponse {
  doctorId: string;
  weekStart: string;
  slotMinutes: number;
  timeAxis: string[];
  days: DaySchedule[];
}

export interface AvailabilityPayload {
  type: 'RECURRING' | 'ONE_TIME';
  daysOfWeek?: number[];
  date?: string;        
  timeRanges: { start: string; end: string }[];
}

export interface AbsencePayload {
  dateFrom: string; 
  dateTo: string;   
  reason: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  authorName: string;
  doctorReply?: string;
  doctorReplyAt?: string;
}


export const doctorService = {
  async getMyProfile() {
    const res = await api.get<{ doctorId: string; displayName: string; email: string }>('/doctor/me');
    return res.data;
  },

  async getMySlots(doctorId: string, weekStart?: string) {
    const params = weekStart ? { weekStart } : {};
    const res = await api.get<ScheduleResponse>(`/doctors/${doctorId}/slots`, { params });
    return res.data;
  },

  async addAvailability(payload: AvailabilityPayload) {
    return api.post('/doctor/availability', payload);
  },

  async addAbsence(payload: AbsencePayload) {
    return api.post('/doctor/absences', payload);
  },

  async getMyReviews() {
    const { doctorId } = await this.getMyProfile();
    const res = await api.get<Review[]>(`/doctors/${doctorId}/reviews`);
    return res.data;
  },

  async replyToReview(reviewId: string, reply: string) {
    return api.post(`/reviews/${reviewId}/reply`, { reply });
  },
  
  async completeAppointment(appointmentId: string) {
    return api.patch(`/doctor/appointments/${appointmentId}/complete`);
  }
};