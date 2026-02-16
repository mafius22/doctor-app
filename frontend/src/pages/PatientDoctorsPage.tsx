import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { patientService, type Doctor } from '../services/patient.service';
import { User, Stethoscope, CalendarCheck } from 'lucide-react';

export const PatientDoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    patientService.getAllDoctors()
      .then(setDoctors)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Stethoscope className="text-blue-600" />
        Znajdź Lekarza
      </h1>

      {loading ? (
        <div className="text-center py-10">Ładowanie listy lekarzy...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-blue-100 p-3 rounded-full text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{doc.fullName}</h3>
                  <p className="text-sm text-gray-500 font-medium">{doc.specialization}</p>
                </div>
              </div>
              
              <Link 
                to={`/book/${doc.id}`}
                className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2"
              >
                <CalendarCheck size={18} />
                Umów Wizytę
              </Link>
            </div>
          ))}
          
          {doctors.length === 0 && (
            <p className="text-gray-500 col-span-full text-center">Brak dostępnych lekarzy.</p>
          )}
        </div>
      )}
    </div>
  );
};