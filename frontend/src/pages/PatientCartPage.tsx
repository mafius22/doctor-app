import { useEffect, useState } from 'react';
import { appointmentService } from '../services/appointment.service';
import { type Appointment } from '../services/appointment.service';
import { ReviewModal } from '../components/ReviewModal';
import { 
  ShoppingCart, History, CreditCard, Calendar, Clock, 
  User, Stethoscope, Trash2, UserRound, AlertCircle 
} from 'lucide-react';
// 1. Importujemy toast
import toast, { Toaster } from 'react-hot-toast';

export const PatientCartPage = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    appointmentService.initSocket();
    appointmentService.loadMyAppointments();

    const sub = appointmentService.appointments$.subscribe(setAppointments);
    return () => sub.unsubscribe();
  }, []);

  // 2. Ładna obsługa płatności z "Loading..."
  const handlePay = async (id: string) => {
    // Używamy toast.promise - to automatycznie obsługuje 3 stany:
    // Loading (kręciołek), Success (zielony) i Error (czerwony)
    await toast.promise(
      appointmentService.payForAppointment(id),
      {
        loading: 'Przetwarzanie płatności...',
        success: 'Płatność przyjęta! Wizyta potwierdzona.',
        error: (err) => `Błąd: ${err.response?.data?.message || 'Nie udało się opłacić'}`
      }
    );
  };

  // 3. Ładna obsługa usuwania z potwierdzeniem w dymku (bez window.confirm)
  const handleCancel = (id: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 font-medium text-gray-800">
          <AlertCircle className="text-red-500" size={20} />
          Usunąć tę wizytę?
        </div>
        <div className="text-sm text-gray-500 mb-2">
          Tej operacji nie można cofnąć.
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              toast.dismiss(t.id); // Zamykamy pytanie
              performDelete(id);   // Wykonujemy usuwanie
            }}
            className="bg-red-500 text-white text-xs px-3 py-1.5 rounded hover:bg-red-600 font-bold transition"
          >
            Tak, usuń
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded hover:bg-gray-200 font-medium transition"
          >
            Anuluj
          </button>
        </div>
      </div>
    ), { duration: 5000, position: 'top-center' });
  };

  // Funkcja pomocnicza faktycznie wykonująca usuwanie (wywoływana z toasta)
  const performDelete = async (id: string) => {
    const deletePromise = appointmentService.cancelAppointment(id);
    
    // Tu też pokazujemy loading/success dla samego procesu usuwania
    await toast.promise(deletePromise, {
      loading: 'Usuwanie...',
      success: 'Wizyta usunięta z koszyka.',
      error: 'Nie udało się usunąć wizyty.'
    });
  };

  const getDoctorDetails = (docData: any) => {
    if (!docData) return { id: null, name: 'Brak danych', spec: '' };
    if (typeof docData === 'string') return { id: docData, name: 'Wczytywanie...', spec: '' };

    return {
      id: docData._id,
      name: docData.fullName || 'Nieznany Lekarz',
      spec: docData.specialization || 'Lekarz'
    };
  };

  const cartItems = appointments.filter(a => a.status === 'RESERVED');
  const historyItems = appointments.filter(a => ['CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(a.status));

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Dodajemy Toaster */}
      <Toaster position="top-right" />
      
      {/* --- KOSZYK --- */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
           <ShoppingCart className="text-blue-600" /> Koszyk
        </h2>
        {cartItems.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-xl text-center border border-dashed text-gray-500">
            Twój koszyk jest pusty.
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map(item => {
              const doc = getDoctorDetails(item.doctorId);
              return (
                <div key={item._id} className="bg-white border border-blue-100 p-5 rounded-xl shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-start gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg text-blue-600 hidden sm:block"><User size={24} /></div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                          {doc.name} 
                          {doc.spec && <span className="text-xs bg-gray-100 text-gray-600 px-2 rounded-full"><Stethoscope size={10}/> {doc.spec}</span>}
                        </h3>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-2">
                            <span><Calendar size={14} className="inline"/> {new Date(item.startAt).toLocaleDateString()}</span>
                            <span><Clock size={14} className="inline"/> {new Date(item.startAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                            <span className="font-bold text-blue-600">{item.visitType}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <UserRound size={12}/> Pacjent: {item.patientSnapshot.fullName}
                        </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button 
                        onClick={() => handleCancel(item._id)} 
                        className="text-red-500 p-2 hover:bg-red-50 rounded transition-colors" 
                        title="Usuń z koszyka"
                      >
                        <Trash2 size={20}/>
                      </button>
                      <button 
                        onClick={() => handlePay(item._id)} 
                        className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-sm hover:shadow-md"
                      >
                        <CreditCard size={18} /> Zapłać
                      </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* --- HISTORIA --- */}
      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
           <History className="text-gray-600" /> Historia Wizyt
        </h2>
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
            {historyItems.length === 0 ? <div className="p-8 text-center text-gray-500">Brak historii.</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs">
                    <tr>
                      <th className="px-6 py-4">Data</th>
                      <th className="px-6 py-4">Lekarz</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {historyItems.map(item => {
                      const doc = getDoctorDetails(item.doctorId);
                      const isCompleted = item.status === 'COMPLETED';
                      const isCancelled = item.status === 'CANCELLED';
                      
                      return (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                              <div className="font-medium">{new Date(item.startAt).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-500">{new Date(item.startAt).toLocaleTimeString([],{hour:'2-digit', minute:'2-digit'})}</div>
                          </td>
                          <td className="px-6 py-4">
                              <div className="font-bold">{doc.name}</div>
                              <div className="text-xs text-gray-400">{doc.spec}</div>
                          </td>
                          <td className="px-6 py-4">
                             <span className={`px-2.5 py-1 rounded-full text-xs font-bold border 
                              ${item.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-200' : 
                                isCompleted ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                                'bg-gray-100 text-gray-500 border-gray-200'}`}>
                              {isCancelled ? 'ANULOWANA' : item.status === 'CONFIRMED' ? 'OPŁACONA' : item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                              {isCompleted && doc.id ? (
                                <div className="flex justify-end">
                                  <ReviewModal 
                                      doctorId={doc.id} 
                                      doctorName={doc.name} 
                                      onSuccess={() => appointmentService.loadMyAppointments()}
                                  />
                                </div>
                              ) : (
                                <span className="text-gray-300 text-xs">-</span>
                              )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
              </table>
            </div>
            )}
        </div>
      </section>
    </div>
  );
};