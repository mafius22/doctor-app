import { api } from '../api/axios';
import { type ScheduleResponse } from './doctor.service';

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
}

export interface ReservationPayload {
  doctorId: string; 
  startAt: string;
  durationSlots: number;
  visitType: string;
  patient: {
    fullName: string;
    gender: 'M' | 'F' | 'OTHER';
    age: number;
  };
  notesForDoctor?: string;
}


export const patientService = {
  async getAllDoctors(specialization?: string) {
    const params = specialization ? { specialization } : {};
    const res = await api.get<Doctor[]>('/doctors', { params });
    return res.data;
  },

  async getDoctorSlots(doctorId: string, weekStart?: string) {
    const params = weekStart ? { weekStart } : {};
    const res = await api.get<ScheduleResponse>(`/doctors/${doctorId}/slots`, { params });
    return res.data;
  },

  async reserveAppointment(payload: ReservationPayload) {
    const res = await api.post<{ id: string; status: string }>('/appointments/reserve', payload);
    return res.data;
  },

  async addReview(payload: { doctorId: string; rating: number; comment?: string }) {
    return api.post('/reviews', payload);
  },

  async getDoctorReviews(doctorId: string) {
    const res = await api.get(`/doctors/${doctorId}/reviews`);
    return res.data; 
  },
};