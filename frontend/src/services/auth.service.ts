import { BehaviorSubject } from 'rxjs';
import { api } from '../api/axios';
import { jwtDecode } from 'jwt-decode';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'ADMIN';

export interface User {
  userId: string;
  role: UserRole;
  displayName: string;
}

const currentUserSubject = new BehaviorSubject<User | null>(null);

export const authService = {
  currentUser$: currentUserSubject.asObservable(),
  get currentUserValue() { return currentUserSubject.value; },

  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, user } = response.data;
    
    this._saveSession(accessToken, user);
    return user;
  },

  async register(email: string, password: string, displayName: string) {
    const response = await api.post('/auth/register', { email, password, displayName });
    const { accessToken, user } = response.data;
    
    this._saveSession(accessToken, user);
    return user;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userData'); 
      currentUserSubject.next(null);
    }
  },

  tryAutoLogin() {
    const token = localStorage.getItem('accessToken');
    const userDataString = localStorage.getItem('userData');

    if (!token) return;

    try {
      const decoded: any = jwtDecode(token);
      const isExpired = decoded.exp * 1000 < Date.now();

      if (isExpired) {
        this.logout();
        return;
      }

      if (userDataString) {
        const user = JSON.parse(userDataString);
        currentUserSubject.next(user);
      } else {
        currentUserSubject.next({
          userId: decoded.userId,
          role: decoded.role,
          displayName: 'Użytkownik' 
        });
      }
    } catch (e) {
      this.logout();
    }
  },

  _saveSession(accessToken: string, user: User) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('userData', JSON.stringify(user)); 
    currentUserSubject.next(user);
  }
};