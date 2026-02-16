import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom'; // Usunąłem useNavigate, bo nie jest już potrzebny
import { patientService } from '../services/patient.service';
import { type ScheduleResponse, type SlotCell } from '../services/doctor.service'; 
import { RealDoctorCalendar } from '../components/Calendar/RealDoctorCalendar';
import { Modal } from '../components/SlotModal';
import { addDays, format } from 'date-fns';
import { CalendarCheck, Clock } from 'lucide-react';
import { authService } from '../services/auth.service';
import toast, { Toaster } from 'react-hot-toast';

export const PatientBookingPage = () => {
  const { doctorId } = useParams();
  // const navigate = useNavigate(); // <--- Usunięte
  const [schedule, setSchedule] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSlot, setSelectedSlot] = useState<{ cell: SlotCell, date: string } | null>(null);
  const [formData, setFormData] = useState({
    visitType: 'KONSULTACJA',
    notes: '',
    gender: 'M',
    age: 30
  });

  const fetchSlots = async () => {
    if (!doctorId) return;
    // Opcjonalnie: można tu nie ustawiać setLoading(true) jeśli to tylko odświeżenie po rezerwacji,
    // ale zostawiamy, żeby użytkownik widział, że kalendarz się aktualizuje.
    setLoading(true); 
    try {
      const dateStr = format(currentWeekStart, 'yyyy-MM-dd');
      const data = await patientService.getDoctorSlots(doctorId, dateStr);
      setSchedule(data);
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSlots(); }, [doctorId, currentWeekStart]);

  const handleSlotClick = (cell: SlotCell, date: string) => {
    if (cell.status === 'FREE') {
      setSelectedSlot({ cell, date });
    }
  };

  const confirmReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !doctorId) return;

    setIsSubmitting(true);
    const loadingToast = toast.loading('Rezerwowanie terminu...');

    try {
      const currentUser = authService.currentUserValue;
      const startAt = `${selectedSlot.date}T${selectedSlot.cell.time}:00`; 

      await patientService.reserveAppointment({
        doctorId,
        startAt: new Date(startAt).toISOString(),
        durationSlots: 1,
        visitType: formData.visitType,
        patient: {
          fullName: currentUser?.displayName || 'Pacjent',
          gender: formData.gender as any,
          age: Number(formData.age)
        },
        notesForDoctor: formData.notes
      });

      toast.dismiss(loadingToast);
      
      // 1. Zamykamy modal
      setSelectedSlot(null);
      
      // 2. Wyświetlamy sukces
      toast.success('Wizyta została pomyślnie zarezerwowana!');

      // 3. Odświeżamy kalendarz, żeby zajęty termin zniknął
      await fetchSlots();

    } catch (e: any) {
      toast.dismiss(loadingToast);
      const errorMsg = e.response?.data?.message || 'Nie udało się zarezerwować wizyty.';
      toast.error(errorMsg);
    } finally {
      // Zawsze odblokowujemy przycisk na końcu
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster position="top-center" />

      <header>
        <h1 className="text-2xl font-bold text-gray-800">Rezerwacja Wizyty</h1>
      </header>

      <div className="bg-white p-2 rounded-xl border">
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
        onClose={() => !isSubmitting && setSelectedSlot(null)} 
        title="Potwierdź Termin"
      >
        {selectedSlot && (
          <form onSubmit={confirmReservation} className="space-y-4">
            {/* ... (sekcja podglądu daty bez zmian) ... */}
            <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800 flex flex-col gap-1">
              <div className="flex gap-2"><CalendarCheck size={16}/> <strong>Data:</strong> {selectedSlot.date}</div>
              <div className="flex gap-2"><Clock size={16}/> <strong>Godzina:</strong> {selectedSlot.cell.time}</div>
            </div>

            {/* ... (reszta pól formularza bez zmian) ... */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Typ Wizyty</label>
              <select 
                className="w-full border p-2 rounded"
                value={formData.visitType}
                onChange={e => setFormData({...formData, visitType: e.target.value})}
              >
                <option value="KONSULTACJA">Konsultacja Lekarska</option>
                <option value="BADANIE">Badanie Kontrolne</option>
                <option value="ONLINE">Teleporada</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Wiek Pacjenta</label>
                <input 
                  type="number" min="0" required
                  className="w-full border p-2 rounded"
                  value={formData.age}
                  onChange={e => setFormData({...formData, age: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Płeć</label>
                <select 
                  className="w-full border p-2 rounded"
                  value={formData.gender}
                  onChange={e => setFormData({...formData, gender: e.target.value})}
                >
                  <option value="M">Mężczyzna</option>
                  <option value="F">Kobieta</option>
                  <option value="OTHER">Inne</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Notatka dla lekarza (opcjonalnie)</label>
              <textarea 
                className="w-full border p-2 rounded text-sm"
                rows={2}
                value={formData.notes}
                onChange={e => setFormData({...formData, notes: e.target.value})}
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full font-bold py-2 rounded-lg transition flex justify-center items-center gap-2
                ${isSubmitting 
                  ? 'bg-gray-400 cursor-not-allowed text-gray-100' 
                  : 'bg-green-600 hover:bg-green-700 text-white'}`
              }
            >
              {isSubmitting ? 'Przetwarzanie...' : 'Rezerwuj Termin'}
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};