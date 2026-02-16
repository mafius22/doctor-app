import React, { useState } from 'react';
import { doctorService } from '../services/doctor.service';
import { Settings, Clock, CalendarOff, Plus, Trash2, Calendar, CheckCircle } from 'lucide-react';

interface TimeRange {
  start: string;
  end: string;
}

export const DoctorSettingsPage = () => {
  const [availType, setAvailType] = useState<'RECURRING' | 'ONE_TIME'>('RECURRING');
  
  const [dateFrom, setDateFrom] = useState(''); 
  const [dateTo, setDateTo] = useState('');   
  const [specificDate, setSpecificDate] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]); 
  
  const [timeRanges, setTimeRanges] = useState<TimeRange[]>([{ start: '08:00', end: '16:00' }]);

  const [absenceForm, setAbsenceForm] = useState({
    dateFrom: '',
    dateTo: '',
    reason: ''
  });


  const addTimeRange = () => {
    setTimeRanges([...timeRanges, { start: '08:00', end: '16:00' }]);
  };

  const removeTimeRange = (index: number) => {
    setTimeRanges(timeRanges.filter((_, i) => i !== index));
  };

  const updateTimeRange = (index: number, field: 'start' | 'end', value: string) => {
    const newRanges = [...timeRanges];
    newRanges[index][field] = value;
    setTimeRanges(newRanges);
  };

  const toggleDay = (d: number) => {
    setDaysOfWeek(prev => 
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (availType === 'RECURRING' && daysOfWeek.length === 0) {
      alert('Wybierz przynajmniej jeden dzień tygodnia.');
      return;
    }

    try {
      await doctorService.addAvailability({
        type: availType,
        ...(availType === 'RECURRING' && {
          dateFrom: dateFrom || undefined, 
          dateTo: dateTo || undefined,
          daysOfWeek
        }),
        ...(availType === 'ONE_TIME' && {
          date: specificDate
        }),
        timeRanges
      });
      alert('Pomyślnie dodano dostępność!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Błąd API');
    }
  };

  const handleAddAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('To anuluje wizyty w tym terminie. Kontynuować?')) return;
    try {
      const res = await doctorService.addAbsence(absenceForm);
      alert(`Dodano absencję. Anulowano wizyt: ${(res.data as any).cancelledAppointments}`);
      setAbsenceForm({ dateFrom: '', dateTo: '', reason: '' });
    } catch (e) {
      alert('Błąd API');
    }
  };

  const daysMap = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB'];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Settings className="text-gray-600" />
          Ustawienia Grafiku
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <section className="bg-white p-6 rounded-xl shadow-md border border-blue-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-blue-800 flex items-center gap-2">
              <Clock size={20} />
              Dodaj Dostępność
            </h2>
            
            <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
              <button
                onClick={() => setAvailType('RECURRING')}
                className={`px-3 py-1.5 rounded-md transition ${availType === 'RECURRING' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
              >
                Cykliczna
              </button>
              <button
                onClick={() => setAvailType('ONE_TIME')}
                className={`px-3 py-1.5 rounded-md transition ${availType === 'ONE_TIME' ? 'bg-white shadow text-blue-600 font-bold' : 'text-gray-500'}`}
              >
                Jednorazowa
              </button>
            </div>
          </div>

          <form onSubmit={handleAddAvailability} className="space-y-6">
            
            {availType === 'RECURRING' && (
              <div className="space-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-sm font-semibold text-blue-700 mb-2">1. Zakres dat i dni</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Obowiązuje od</label>
                    <input type="date" className="border p-2 rounded w-full text-sm" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Obowiązuje do</label>
                    <input type="date" className="border p-2 rounded w-full text-sm" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-gray-500 block mb-2">Dni tygodnia (Maska):</label>
                  <div className="flex flex-wrap gap-2">
                    {[1,2,3,4,5,6,7].map(d => (
                      <button
                        key={d} type="button"
                        onClick={() => toggleDay(d)}
                        className={`w-9 h-9 rounded border text-xs font-bold transition flex items-center justify-center
                          ${daysOfWeek.includes(d) 
                            ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200' 
                            : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-300'}`}
                      >
                        {daysMap[d === 7 ? 0 : d]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {availType === 'ONE_TIME' && (
              <div className="bg-orange-50/50 p-4 rounded-lg border border-orange-100">
                <h3 className="text-sm font-semibold text-orange-700 mb-2">1. Konkretny dzień</h3>
                <label className="text-xs text-gray-500 block mb-1">Data dyżuru</label>
                <input 
                  type="date" 
                  required 
                  className="border p-2 rounded w-full text-sm focus:ring-2 focus:ring-orange-200 outline-none" 
                  value={specificDate} 
                  onChange={e => setSpecificDate(e.target.value)} 
                />
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-gray-700">2. Godziny przyjęć</h3>
                <button type="button" onClick={addTimeRange} className="text-xs flex items-center gap-1 text-green-600 hover:text-green-700 font-medium">
                  <Plus size={14} /> Dodaj przerwę
                </button>
              </div>

              <div className="space-y-3">
                {timeRanges.map((range, idx) => (
                  <div key={idx} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Od</label>
                      <input 
                        type="time" 
                        required
                        className="border p-2 rounded w-full text-sm"
                        value={range.start}
                        onChange={e => updateTimeRange(idx, 'start', e.target.value)}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-400 uppercase tracking-wide">Do</label>
                      <input 
                        type="time" 
                        required
                        className="border p-2 rounded w-full text-sm"
                        value={range.end}
                        onChange={e => updateTimeRange(idx, 'end', e.target.value)}
                      />
                    </div>
                    {timeRanges.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => removeTimeRange(idx)}
                        className="mb-1 p-2 text-red-500 hover:bg-red-50 rounded transition"
                        title="Usuń ten zakres"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition flex items-center justify-center gap-2">
              <CheckCircle size={18} />
              Zapisz Dostępność
            </button>
          </form>
        </section>

        <section className="bg-white p-6 rounded-xl shadow-md border-t-4 border-red-500 h-fit">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-red-700">
            <CalendarOff size={20} />
            Zgłoś Urlop / Nieobecność
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            Dodanie absencji automatycznie <strong>anuluje wszystkie wizyty</strong> w wybranym terminie.
          </p>

          <form onSubmit={handleAddAbsence} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Początek</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input 
                    type="date" 
                    required 
                    className="border p-2 pl-9 rounded w-full text-sm outline-none focus:ring-2 focus:ring-red-200" 
                    value={absenceForm.dateFrom} 
                    onChange={e => setAbsenceForm({...absenceForm, dateFrom: e.target.value})} 
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Koniec</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-2.5 top-2.5 text-gray-400" />
                  <input 
                    type="date" 
                    required 
                    className="border p-2 pl-9 rounded w-full text-sm outline-none focus:ring-2 focus:ring-red-200" 
                    value={absenceForm.dateTo} 
                    onChange={e => setAbsenceForm({...absenceForm, dateTo: e.target.value})} 
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase mb-1 block">Powód</label>
              <input 
                type="text" 
                placeholder="Podaj powód nieobecności" 
                required 
                className="border p-2 rounded w-full text-sm outline-none focus:border-red-400" 
                value={absenceForm.reason} 
                onChange={e => setAbsenceForm({...absenceForm, reason: e.target.value})} 
              />
            </div>
            
            <button className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 font-bold shadow-lg shadow-red-100 transition flex items-center justify-center gap-2">
              <CalendarOff size={18} />
              Zatwierdź Absencję
            </button>
          </form>
        </section>

      </div>
    </div>
  );
};