import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService, type Doctor } from '../services/patient.service';
import { authService } from '../services/auth.service';
import { PublicReviewsModal } from '../components/PublicReviewsModal';
import { User, Stethoscope, CalendarCheck, Lock, MessageSquare } from 'lucide-react';

export const PublicDoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocForReviews, setSelectedDocForReviews] = useState<Doctor | null>(null);
  const navigate = useNavigate();

  const user = authService.currentUserValue;

  useEffect(() => {
    patientService.getAllDoctors()
      .then(data => {
        // ZOBACZ W KONSOLI (F12), CZY DANE SĄ POPRAWNE
        console.log("🔥 DANE Z BACKENDU:", data); 
        setDoctors(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleBookClick = (doctorId: string) => {
    if (!user) {
      navigate('/login');
    } else if (user.role === 'PATIENT') {
      navigate(`/book/${doctorId}`);
    } else {
      alert('Tylko pacjenci mogą rezerwować wizyty.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
          Znajdź najlepszego specjalistę
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl mx-auto">
          Przeglądaj listę naszych lekarzy, czytaj opinie i rezerwuj wizyty online.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-10">Ładowanie listy lekarzy...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {doctors.map((doc) => {
            
            return (
              <div key={doc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-full">
                
                {/* GÓRA KARTY */}
                <div>
                    <div className="flex items-start gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-xl text-blue-600">
                        <User size={32} />
                    </div>
                    <div>
                        {/* Wyświetlamy doc.fullName wprost */}
                        <h3 className="font-bold text-xl text-gray-800">
                          {doc.fullName || 'Brak Imienia'}
                        </h3>
                        
                        <div className="flex items-center gap-1 text-blue-600 font-medium text-sm mt-1">
                          <Stethoscope size={14} />
                          {/* Wyświetlamy doc.specialization wprost */}
                          {doc.specialization || 'Brak Specjalizacji'}
                        </div>
                    </div>
                    </div>
                </div>
                
                {/* DÓŁ KARTY */}
                <div className="space-y-3 mt-4 pt-4 border-t border-gray-50">
                    
                    {/* PRZYCISK OPINII */}
                    <button
                        onClick={() => setSelectedDocForReviews(doc)}
                        className="w-full py-2.5 rounded-xl font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center gap-2 transition"
                    >
                        <MessageSquare size={16} />
                        Zobacz opinie
                    </button>

                    {/* PRZYCISK REZERWACJI */}
                    <button 
                    onClick={() => handleBookClick(doc.id)}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition
                        ${user && user.role === 'PATIENT' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 shadow-lg' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                    {user ? (
                        <>
                        <CalendarCheck size={18} />
                        Sprawdź Grafik
                        </>
                    ) : (
                        <>
                        <Lock size={18} />
                        Zaloguj by umówić
                        </>
                    )}
                    </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedDocForReviews && (
          <PublicReviewsModal 
            doctorId={selectedDocForReviews.id} 
            doctorName={selectedDocForReviews.fullName}
            onClose={() => setSelectedDocForReviews(null)}
          />
      )}

    </div>
  );
};