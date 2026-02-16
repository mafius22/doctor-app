import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { authService, type UserRole } from '../services/auth.service';

interface Props {
  allowedRoles: UserRole[];
}

export const ProtectedRoute = ({ allowedRoles }: Props) => {
  const [user, setUser] = useState(authService.currentUserValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = authService.currentUser$.subscribe((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  if (loading && !user) return <div className="p-4">Loading session...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <div className="p-10 text-center text-red-600">Brak uprawnień do tego widoku.</div>;
  }

  return <Outlet />;
};