import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';

export const MainLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t py-4 text-center text-gray-400 text-xs">
        &copy; 2026 E-Doktor Online Booking System. Wszystkie prawa zastrzeżone.
      </footer>
    </div>
  );
};