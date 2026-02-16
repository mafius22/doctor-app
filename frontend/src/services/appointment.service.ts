import { BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { api } from '../api/axios';


export interface DoctorProfile {
  fullName: string;
  specialization: string;
}

export interface DoctorUser {
  _id: string;
  displayName: string;
  doctorProfileId?: DoctorProfile | string; 
}

export interface Appointment {
  _id: string;
  startAt: string; 
  endAt: string;
  status: 'RESERVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  visitType: string;

  doctorId: string | DoctorUser;

  patientSnapshot: {
    fullName: string;
    gender: "M" | "F" | "OTHER";
    age: number;
  };

  notesForDoctor?: string;
  price?: number; 
}


const appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
let socket: Socket | null = null;

export const appointmentService = {
  appointments$: appointmentsSubject.asObservable(),

  initSocket() {
    if (socket) return;
    
    socket = io('http://localhost:4000'); 

    socket.on('appointment_cancelled', (payload: { appointmentId: string, reason: string }) => {
      console.log('Otrzymano powiadomienie o anulowaniu:', payload);
      
      const current = appointmentsSubject.value;
      const updated = current.map(app => 
        app._id === payload.appointmentId 
          ? { ...app, status: 'CANCELLED' as const } 
          : app
      );
      appointmentsSubject.next(updated);
    });
  },

  async loadMyAppointments() {
    try {
      const res = await api.get<Appointment[]>('/appointments');
      appointmentsSubject.next(res.data);
    } catch (e) {
      console.error("Błąd ładowania wizyt:", e);
    }
  },

  async payForAppointment(id: string) {
    try {
      await api.post(`/appointments/${id}/pay`);
      
      await this.loadMyAppointments();
    } catch (error) {
      console.error("Błąd płatności:", error);
      throw error;
    }
  },

  async cancelAppointment(id: string) {
    try {
      await api.patch(`/appointments/${id}`);
      
      await this.loadMyAppointments();
    } catch (error) {
      console.error("Błąd anulowania:", error);
      throw error;
    }
  }
};