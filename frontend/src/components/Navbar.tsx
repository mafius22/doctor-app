import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService, type User } from '../services/auth.service';
import { 
  LogOut, 
  Calendar,       
  Settings,       
  MessageSquare,  
  Users,        
  User as UserIcon, 
  Stethoscope,  
  CalendarCheck  
} from 'lucide-react';

export const Navbar = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(authService.currentUserValue);

  useEffect(() => {
    const sub = authService.currentUser$.subscribe(setUser);
    return () => sub.unsubscribe();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-[100]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        
        <Link to="/" className="text-xl font-bold text-blue-600 flex items-center gap-2">
          <Calendar size={24} />
          <span>E-Doktor</span>
        </Link>

        <div className="flex items-center gap-4">
          
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 mr-4">
                
                {user.role === 'PATIENT' && (
                  <>
                    <Link to="/" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition shadow-md shadow-blue-100">
                      <Stethoscope size={16} />
                      <span>Umów wizytę</span>
                    </Link>
                    <Link to="/my-appointments" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1 px-3 py-2 rounded-md transition text-sm font-medium">
                      <CalendarCheck size={18} />
                      <span>Moje Wizyty</span>
                    </Link>
                  </>
                )}

                {user.role === 'DOCTOR' && (
                  <>
                    <Link to="/doctor/schedule" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1 px-3 py-2 rounded-md transition text-sm font-medium">
                      <Calendar size={18} />
                      <span>Grafik</span>
                    </Link>
                    <Link to="/doctor/settings" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1 px-3 py-2 rounded-md transition text-sm font-medium">
                      <Settings size={18} />
                      <span>Ustawienia grafiku</span>
                    </Link>
                    <Link to="/doctor/reviews" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1 px-3 py-2 rounded-md transition text-sm font-medium">
                      <MessageSquare size={18} />
                      <span>Opinie</span>
                    </Link>
                  </>
                )}

                {user.role === 'ADMIN' && (
                   <Link to="/admin/settings" className="text-gray-600 hover:text-blue-600 hover:bg-gray-50 flex items-center gap-1 px-3 py-2 rounded-md transition text-sm font-medium">
                     <Users size={18} />
                     <span>Panel Admina</span>
                   </Link>
                )}
              </div>

              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full">
                  <UserIcon size={16} />
                  <span className="whitespace-nowrap">{user.displayName}</span>
                </div>
                <button 
                  onClick={handleLogout} 
                  className="text-red-500 hover:bg-red-50 p-2 rounded-md transition" 
                  title="Wyloguj się"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/" className="text-gray-600 hover:text-blue-600 font-medium hidden sm:block">
                Lista Lekarzy
              </Link>
              <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
              <Link to="/login" className="text-gray-600 hover:text-blue-600 font-medium">
                Zaloguj się
              </Link>
              <Link to="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition text-sm">
                Rejestracja
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};