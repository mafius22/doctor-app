import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';
import { AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ 
    displayName: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Hasła nie są identyczne.');
      setLoading(false);
      return;
    }

    try {
      await authService.register(formData.email, formData.password, formData.displayName);
      
      navigate('/my-appointments');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Wystąpił błąd podczas rejestracji.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="Załóż konto Pacjenta" 
      subtitle="Zarejestruj się, aby rezerwować wizyty i przeglądać historię leczenia."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Obsługa błędów */}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2 border border-red-100 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Imię i Nazwisko */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Imię i Nazwisko</label>
          <div className="relative">
            <input
              type="text"
              required
              minLength={3}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.displayName}
              onChange={e => setFormData({...formData, displayName: e.target.value})}
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Adres Email</label>
          <div className="relative">
            <input
              type="email"
              required
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>
        </div>

        {/* Hasło */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Hasło</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={6}
              className="w-full pl-3 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1 ml-1">Minimum 6 znaków</p>
        </div>

        {/* Powtórz Hasło */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Powtórz Hasło</label>
          <div className="relative">
            <input
              type="password"
              required
              minLength={6}
              className={`w-full pl-3 pr-4 py-2 border rounded-lg outline-none transition focus:ring-2 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword 
                ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              value={formData.confirmPassword}
              onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Tworzenie konta...' : 'Zarejestruj się'}
        </button>

        {/* Link do logowania */}
        <div className="text-center text-sm text-gray-600 mt-4">
          Masz już konto?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-bold hover:underline">
            Zaloguj się
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};