import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { authService } from './services/auth.service';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainLayout } from './components/MainLayout';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PublicDoctorsPage } from './pages/PublicDoctorsPage';
import { PatientCartPage } from './pages/PatientCartPage';
import { PatientBookingPage } from './pages/PatientBookingPage';
import { DoctorSchedulePage } from './pages/DoctorSchedulePage';
import { DoctorSettingsPage } from './pages/DoctorSettingsPage';
import { DoctorReviewsPage } from './pages/DoctorReviewsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

function App() {
  
  useEffect(() => {
    authService.tryAutoLogin();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<MainLayout />}>
          
          <Route path="/" element={<PublicDoctorsPage />} />

          <Route element={<ProtectedRoute allowedRoles={['PATIENT']} />}>
            <Route path="/my-appointments" element={<PatientCartPage />} />
            <Route path="/book/:doctorId" element={<PatientBookingPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['DOCTOR']} />}>
            <Route path="/doctor/schedule" element={<DoctorSchedulePage />} />
            <Route path="/doctor/settings" element={<DoctorSettingsPage />} />
            <Route path="/doctor/reviews" element={<DoctorReviewsPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin/settings" element={<AdminDashboardPage />} />
          </Route>

        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;