import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { AuthLayout } from '../components/AuthLayout';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await authService.login(formData.email, formData.password);
      
      if (user.role === 'DOCTOR') {
        navigate('/doctor/schedule');
      } else if (user.role === 'ADMIN') {
        navigate('/admin/users');
      } else {
        navigate('/my-appointments'); 
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Wystąpił błąd logowania');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Witaj ponownie" subtitle="Zaloguj się do swojego konta">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Hasło</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Logowanie...' : 'Zaloguj się'}
        </button>

        <div className="text-center text-sm text-gray-500">
          Nie masz konta?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Zarejestruj się
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};