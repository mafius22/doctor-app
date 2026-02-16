import { api } from '../api/axios';


export interface AdminSettings {
  _id: string;
  authPersistence: "LOCAL" | "SESSION" | "NONE";
}

export interface AdminUser {
  _id: string;
  email: string;
  displayName: string;
  role: "PATIENT" | "DOCTOR" | "ADMIN";
  isBannedFromReviews: boolean;
  createdAt: string;
}

export interface CreateDoctorPayload {
  email: string;
  password: string;
  fullName: string;
  specialization: string;
}

export interface AdminReview {
  _id: string;
  authorName: string;
  rating: number;
  comment: string;
  doctorId: string;
  createdAt: string;
}


export const adminService = {
  async getSettings() {
    const res = await api.get<AdminSettings>('/admin/settings');
    return res.data;
  },

  async updateAuthPersistence(mode: "LOCAL" | "SESSION" | "NONE") {
    const res = await api.patch<AdminSettings>('/admin/settings/auth-persistence', { mode });
    return res.data;
  },

  async getAllUsers() {
    const res = await api.get<AdminUser[]>('/admin/users');
    return res.data;
  },

  async banUser(userId: string, ban: boolean) {
    const res = await api.patch<{ ok: boolean; isBanned: boolean }>(`/admin/users/${userId}/ban`, { ban });
    return res.data;
  },

  async createDoctor(payload: CreateDoctorPayload) {
    const res = await api.post('/admin/doctors', payload);
    return res.data;
  },

  async deleteReview(reviewId: string) {
    const res = await api.delete<{ ok: boolean }>(`/admin/reviews/${reviewId}`);
    return res.data;
  },

  async getAllReviews() {
    const res = await api.get<AdminReview[]>('/admin/reviews/all');
    console.log(res.data)
    return res.data;
  }
};