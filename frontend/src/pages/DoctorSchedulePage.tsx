import { useEffect, useState, useCallback } from 'react';
import { doctorService, type ScheduleResponse, type SlotCell } from '../services/doctor.service';
import { RealDoctorCalendar } from '../components/Calendar/RealDoctorCalendar';
import { Modal } from '../components/SlotModal';
import { addDays, format } from 'date-fns';
import { 
  Calendar, 
  Clock, 
  FileText, 
  CheckCircle, 
  User,       
  StickyNote  
} from 'lucide-react';
// 1. Importujemy toast
import toast, { Toaster } from 'react-hot-toast';

export const DoctorSchedulePage = () => {
  const [doctorId, setDoctorId] = useState<string | null>(null);
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

  const [selectedSlot, setSelectedSlot] = useState<{ cell: SlotCell, date: string } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    doctorService.getMyProfile()
      .then(data => setDoctorId(data.doctorId))
      .catch(err => console.error("Nie udało się pobrać profilu lekarza:", err));
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const dateStr = format(currentWeekStart, 'yyyy-MM-dd');
      const data = await doctorService.getMySlots(doctorId, dateStr);
      setSchedule(data);
    } catch (e) {
      console.error("Błąd pobierania grafiku:", e);
      // Opcjonalnie: toast.error("Błąd ładowania grafiku");
    } finally {
      setLoading(false);
    }
  }, [doctorId, currentWeekStart]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);


  const handleSlotClick = (cell: SlotCell, date: string) => {
    setSelectedSlot({ cell, date });
  };

  // 2. Zmodernizowana funkcja zamykania wizyty
  const handleCompleteVisit = async () => {
    if (!selectedSlot?.cell.appointmentId) return;
    
    setIsCompleting(true);
    
    // Tworzymy promise, ale jeszcze nie czekamy na wynik (await zrobimy w toast)
    const promise = doctorService.completeAppointment(selectedSlot.cell.appointmentId);

    try {
      // toast.promise automatycznie obsłuży loading, success i error
      await toast.promise(promise, {
        loading: 'Zamykanie wizyty...',
        success: 'Wizyta została pomyślnie oznaczona jako zrealizowana!',
        error: (err) => err.response?.data?.message || 'Wystąpił błąd. Spróbuj ponownie.'
      });
      
      // Jeśli promise się powiódł (nie rzucił błędu), kod przejdzie tutaj:
      setSelectedSlot(null); // Zamykamy modal
      fetchSlots();          // Odświeżamy grafik (wizyta zmieni kolor na szary/zakończony)
      
    } catch (e) {
      // Błąd został już wyświetlony przez toast.error, 
      // tutaj tylko łapiemy go, żeby aplikacja się nie wysypała.
      console.error(e);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 3. Dodajemy Toaster */}
      <Toaster position="top-center" />

      <header className="flex justify-between items-end border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mój Grafik</h1>
          <p className="text-gray-500 mt-1">Przeglądaj zaplanowane wizyty i zarządzaj ich statusem.</p>
        </div>
      </header>
      
      <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200">
        <RealDoctorCalendar 
          schedule={schedule} 
          loading={loading}
          onPrevWeek={() => setCurrentWeekStart(d => addDays(d, -7))}
          onNextWeek={() => setCurrentWeekStart(d => addDays(d, 7))}
          onSlotClick={handleSlotClick}
        />
      </div>

      <Modal 
        isOpen={!!selectedSlot} 
        onClose={() => !isCompleting && setSelectedSlot(null)}
        title="Szczegóły Wizyty"
      >
        {selectedSlot && (
          <div className="space-y-6">
            
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-5">
              
              <div className="flex items-start gap-4 border-b border-blue-200/50 pb-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                  <User size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Pacjent</p>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedSlot.cell.patientSnapshot?.fullName || 'Brak danych'}
                  </p>
                  <p className="text-sm text-gray-600 mt-0.5">
                    Wiek: <span className="font-semibold text-gray-800">{selectedSlot.cell.patientSnapshot?.age || '-'} lat</span>
                    {' • '}
                    Płeć: {selectedSlot.cell.patientSnapshot?.gender || '-'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-md shadow-sm text-blue-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">Data</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSlot.date}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-md shadow-sm text-blue-600">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-500 uppercase">Godzina</p>
                      <p className="text-sm font-semibold text-gray-900">{selectedSlot.cell.time}</p>
                    </div>
                  </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-2 bg-white rounded-lg shadow-sm text-blue-600">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Typ Konsultacji</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedSlot.cell.visitType}</p>
                </div>
              </div>

              {selectedSlot.cell.notesForDoctor && (
                  <div className="flex items-start gap-4 bg-amber-50 p-3 rounded-lg border border-amber-100 mt-2">
                    <div className="text-amber-500 mt-0.5">
                      <StickyNote size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-wide mb-1">Notatka od pacjenta</p>
                      <p className="text-sm text-gray-700 italic leading-relaxed">
                        "{selectedSlot.cell.notesForDoctor}"
                      </p>
                    </div>
                  </div>
              )}

            </div>

            <div className="flex flex-col gap-3 pt-2">
              <button 
                onClick={handleCompleteVisit}
                disabled={isCompleting}
                className="w-full bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-100 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isCompleting ? (
                  <span>Przetwarzanie...</span>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    <span>Oznacz jako Zrealizowaną</span>
                  </>
                )}
              </button>
              
              <button 
                onClick={() => setSelectedSlot(null)}
                disabled={isCompleting}
                className="w-full py-3 text-gray-500 hover:bg-gray-100 hover:text-gray-700 font-medium rounded-xl transition-colors disabled:opacity-50"
              >
                Zamknij
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};