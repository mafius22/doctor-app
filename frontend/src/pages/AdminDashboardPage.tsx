import { useEffect, useState } from 'react';
import { adminService, type AdminUser, type AdminSettings, type AdminReview } from '../services/admin.service';
import { 
  Shield, Users, UserPlus, Settings, Ban, CheckCircle, MessageSquare, AlertTriangle, Star, Trash2  
} from 'lucide-react';

export const AdminDashboardPage = () => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'ADD_DOCTOR' | 'SETTINGS' | 'REVIEWS'>('USERS');
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);

  const [docForm, setDocForm] = useState({
    fullName: '',
    specialization: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, settingsData, reviewsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getSettings(),
        adminService.getAllReviews()
      ]);
      setUsers(usersData);
      setSettings(settingsData);
      setReviews(reviewsData);
    } catch (err) {
      console.error("Błąd ładowania panelu admina:", err);
      setError("Nie udało się pobrać danych administratora. Sprawdź połączenie z serwerem.");
    } finally {
      setLoading(false);
    }
  };


  const handleBan = async (userId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const confirmMsg = newStatus 
      ? "Czy na pewno chcesz zablokować temu użytkownikowi możliwość dodawania opinii?" 
      : "Czy chcesz odblokować tego użytkownika?";
    
    if (!confirm(confirmMsg)) return;

    try {
      await adminService.banUser(userId, newStatus);
      setUsers(prev => prev.map(u => 
        u._id === userId ? { ...u, isBannedFromReviews: newStatus } : u
      ));
    } catch (e) {
      alert("Wystąpił błąd podczas zmiany statusu bana.");
    }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!docForm.email || !docForm.password || !docForm.fullName || !docForm.specialization) {
      alert("Wypełnij wszystkie pola!");
      return;
    }

    try {
      await adminService.createDoctor(docForm);
      alert(`Lekarz ${docForm.fullName} został utworzony pomyślnie.`);
      setDocForm({ fullName: '', specialization: '', email: '', password: '' }); 
      loadData(); 
    } catch (e) {
      alert("Błąd tworzenia lekarza. Może email jest zajęty?");
    }
  };

  const handleUpdateSettings = async (mode: "LOCAL" | "SESSION" | "NONE") => {
    try {
      const updated = await adminService.updateAuthPersistence(mode);
      setSettings(updated);
      alert("Ustawienia zapisane.");
    } catch (e) {
      alert("Nie udało się zmienić ustawień.");
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Czy na pewno chcesz trwale usunąć tę opinię? Akcja jest nieodwracalna.")) return;

    setDeletingReviewId(reviewId);
    try {
      await adminService.deleteReview(reviewId);
      alert("Opinia została usunięta.");
      setReviews(prev => prev.filter(r => r._id !== reviewId));
    } catch (e) {
      alert("Błąd podczas usuwania opinii.");
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (loading) {
    return <div className="p-10 text-center text-gray-500">Ładowanie panelu administratora...</div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center">
        <div className="text-red-600 text-lg font-bold mb-4">Błąd</div>
        <div className="text-gray-600">{error}</div>
        <button 
          onClick={loadData} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen">
      
      <div className="mb-8 flex items-center gap-3 border-b pb-4">
        <div className="bg-red-600 text-white p-3 rounded-xl shadow-lg shadow-red-200">
          <Shield size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel Administratora</h1>
          <p className="text-gray-500">Zarządzaj użytkownikami, lekarzami i systemem.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button 
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'USERS' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Users size={20} /> Użytkownicy
        </button>
        <button 
          onClick={() => setActiveTab('ADD_DOCTOR')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'ADD_DOCTOR' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <UserPlus size={20} /> Dodaj Lekarza
        </button>
        <button 
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'SETTINGS' ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Settings size={20} /> Ustawienia
        </button>
        <button 
          onClick={() => setActiveTab('REVIEWS')}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition ${
            activeTab === 'REVIEWS' ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-100'
          }`}
        >
          <MessageSquare size={20} /> Moderacja Opinii
</button>
      </div>


      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800 flex items-center gap-2">
              <Users size={20} className="text-gray-500"/> Lista Użytkowników ({users.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100 text-gray-500 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Użytkownik</th>
                  <th className="px-6 py-4">Rola</th>
                  <th className="px-6 py-4">Data rej.</th>
                  <th className="px-6 py-4">Status Opinii</th>
                  <th className="px-6 py-4 text-right">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">{u.displayName}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'DOCTOR' ? 'bg-blue-100 text-blue-700' : 
                        u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      {u.isBannedFromReviews ? (
                        <span className="flex items-center gap-1 text-red-600 font-bold text-xs bg-red-50 px-2 py-1 rounded w-fit">
                          <Ban size={12}/> ZABLOKOWANY
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-green-600 font-bold text-xs bg-green-50 px-2 py-1 rounded w-fit">
                          <CheckCircle size={12}/> AKTYWNY
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {u.role !== 'ADMIN' && (
                        <button 
                          onClick={() => handleBan(u._id, u.isBannedFromReviews)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            u.isBannedFromReviews 
                              ? 'border-gray-300 text-gray-600 hover:bg-gray-100' 
                              : 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                          }`}
                        >
                          {u.isBannedFromReviews ? 'Odblokuj' : 'Zablokuj opinie'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ADD_DOCTOR' && (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-blue-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <UserPlus className="text-blue-600" /> Rejestracja Nowego Lekarza
          </h2>
          <form onSubmit={handleCreateDoctor} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imię i Nazwisko</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. Jan Kowalski"
                  value={docForm.fullName}
                  onChange={e => setDocForm({...docForm, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specjalizacja</label>
                <input 
                  type="text" 
                  className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="np. Kardiolog"
                  value={docForm.specialization}
                  onChange={e => setDocForm({...docForm, specialization: e.target.value})}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adres Email</label>
              <input 
                type="email" 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="lekarz@przychodnia.pl"
                value={docForm.email}
                onChange={e => setDocForm({...docForm, email: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hasło Startowe</label>
              <input 
                type="password" 
                className="w-full p-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Minimum 6 znaków"
                value={docForm.password}
                onChange={e => setDocForm({...docForm, password: e.target.value})}
              />
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-lg shadow-blue-200 mt-4"
            >
              Utwórz konto lekarza
            </button>
          </form>
        </div>
      )}

      {activeTab === 'SETTINGS' && settings && (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Settings className="text-gray-600" /> Konfiguracja Systemu
          </h2>
          
          <div className="mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-2">Tryb Trwałości Sesji</label>
            <p className="text-xs text-gray-500 mb-4">
              Decyduje o tym, jak długo użytkownicy pozostają zalogowani po zamknięciu przeglądarki.
            </p>
            
            <div className="space-y-3">
              {[
                { val: 'LOCAL', label: 'LOCAL', desc: 'Użytkownik pozostaje zalogowany nawet po restarcie.' },
                { val: 'SESSION', label: 'SESSION', desc: 'Wylogowanie po zamknięciu karty/przeglądarki.' },
                { val: 'NONE', label: 'NONE', desc: 'Brak zapamiętywania.' },
              ].map((opt) => (
                <div 
                  key={opt.val}
                  onClick={() => handleUpdateSettings(opt.val as any)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                    settings.authPersistence === opt.val 
                      ? 'border-blue-600 bg-blue-50' 
                      : 'border-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div className={`font-bold ${settings.authPersistence === opt.val ? 'text-blue-700' : 'text-gray-700'}`}>
                      {opt.label}
                    </div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                  {settings.authPersistence === opt.val && <CheckCircle className="text-blue-600" size={20}/>}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 flex gap-3 text-sm text-yellow-800">
            <AlertTriangle className="shrink-0" size={20} />
            <p>Zmiana tych ustawień wpłynie na wszystkich nowo logujących się użytkowników.</p>
          </div>
        </div>
      )}

      {activeTab === 'REVIEWS' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b bg-red-50">
            <h2 className="font-bold text-lg text-red-800 flex items-center gap-2">
              <Ban size={20}/> Moderacja Treści
            </h2>
            <p className="text-xs text-red-600 mt-1">Tutaj możesz usuwać niestosowne komentarze pacjentów.</p>
          </div>
          
          <div className="p-6 space-y-4">
            {reviews.map(rev => (
              <div key={rev._id} className="p-4 border rounded-xl flex justify-between items-start hover:border-red-200 transition">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{rev.authorName}</span>
                    <span className="text-yellow-500 flex items-center">
                      <Star size={14} fill="currentColor"/> {rev.rating}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm italic">"{rev.comment}"</p>
                </div>
                <button 
                  onClick={() => handleDeleteReview(rev._id)}
                  disabled={deletingReviewId === rev._id}
                  className={`p-2 text-red-600 hover:bg-red-50 rounded-lg transition ${
                    deletingReviewId === rev._id ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  title="Usuń opinię"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};