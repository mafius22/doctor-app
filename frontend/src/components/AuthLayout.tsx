import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: Props) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 relative">
      
      <Link 
        to="/" 
        className="absolute top-4 left-4 md:top-8 md:left-8 flex items-center gap-2 text-gray-500 hover:text-blue-600 transition font-medium bg-white/80 px-4 py-2 rounded-full shadow-sm hover:shadow-md backdrop-blur-sm"
      >
        <ArrowLeft size={20} />
        <span>Wróć na stronę główną</span>
      </Link>

      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden relative z-10">
        <div className="px-8 py-10">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">{title}</h1>
          <p className="text-center text-gray-500 mb-8">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
};