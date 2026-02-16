export type UserRole = 'ADMIN' | 'DOCTOR' | 'PATIENT';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  isBannedFromReviews?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  user: User;
}

export interface Doctor {
  id: string;
  fullName: string;
  specialization: string;
}

export interface Appointment {
  _id: string;
  startAt: string;
  endAt: string;
  status: 'RESERVED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  doctorId: Doctor | string;
  visitType: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  authorName: string;
  doctorReply?: string;
  createdAt: string;
}