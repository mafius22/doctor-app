import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';
import { type ScheduleResponse, type SlotCell } from '../../services/doctor.service';
import { Clock, CalendarX, User } from 'lucide-react';

interface Props {
  schedule: ScheduleResponse | null;
  loading: boolean;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onSlotClick: (cell: SlotCell, date: string) => void;
}

export const RealDoctorCalendar = ({ 
  schedule, 
  loading, 
  onPrevWeek, 
  onNextWeek, 
  onSlotClick 
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      setCurrentTimeMinutes(minutes);
    };
    updateTime(); 
    const interval = setInterval(updateTime, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && !loading && schedule?.timeAxis?.length) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = Math.max(0, (currentHour - 8) * 80); 
      
      if (scrollContainerRef.current.scrollHeight > scrollContainerRef.current.clientHeight) {
        scrollContainerRef.current.scrollTop = (currentHour > 8 ? currentHour - 1 : 7) * 40; 
      }
    }
  }, [loading, schedule]);

  const scrollbarHideStyle = {
    msOverflowStyle: 'none' as const,  
    scrollbarWidth: 'none' as const,  
  };

  if (loading || !schedule) {
    return (
      <div className="h-[600px] flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl">
        <div className="animate-pulse flex flex-col items-center">
          <Clock className="w-12 h-12 text-gray-300 mb-4" />
          <span className="text-gray-400 font-medium">Ładowanie grafiku...</span>
        </div>
      </div>
    );
  }

  const daysMap = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB', 'ND'];
  const SLOT_HEIGHT = 40; 
  const SLOT_MINUTES = schedule.slotMinutes || 30;
  const rawTimeAxis = schedule.timeAxis || [];
  
  const displayTimeAxis = rawTimeAxis.length > 0 
    ? rawTimeAxis 
    : Array.from({length: 10}, (_, i) => `${i + 8}:00`);

  const firstSlotTime = displayTimeAxis[0]; 
  const [startH, startM] = firstSlotTime ? firstSlotTime.split(':').map(Number) : [8, 0];
  const startMinutes = startH * 60 + startM;
  const timeLineOffset = ((currentTimeMinutes - startMinutes) / SLOT_MINUTES) * SLOT_HEIGHT;
  const showTimeLine = timeLineOffset >= 0 && timeLineOffset < (displayTimeAxis.length * SLOT_HEIGHT);

  const getSlotStyle = (cell: SlotCell) => {
    if (cell.isPast) {
      return 'bg-gray-200 border-gray-300 text-gray-500 grayscale opacity-70 cursor-default';
    }

    const appStatus = (cell as any).appointmentStatus;

    if (appStatus === 'CONFIRMED') {
      return 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200 font-semibold shadow-sm';
    }

    
    if (appStatus === 'COMPLETED') {
      return 'bg-blue-200 border-blue-400 text-blue-900';
    }

    const type = (cell.visitType || '').toUpperCase();
    
    if (type.includes('ONLINE')) return 'bg-purple-100 border-purple-300 text-purple-800 hover:bg-purple-200';
    if (type.includes('BADANIE')) return 'bg-yellow-100 border-yellow-300 text-yellow-800 hover:bg-yellow-200';
    
    return 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200';
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[600px]">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>

      <div className="p-4 border-b flex justify-between items-center bg-white z-20 shadow-sm shrink-0">
        <button onClick={onPrevWeek} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium transition text-gray-700">&larr; Poprzedni</button>
        <div className="text-center">
          <h2 className="font-bold text-lg text-gray-800">{schedule.weekStart}</h2>
          <p className="text-xs text-gray-500 uppercase font-semibold">Widok Tygodniowy</p>
        </div>
        <button onClick={onNextWeek} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium transition text-gray-700">Następny &rarr;</button>
      </div>

      <div className="flex border-b bg-gray-50 z-10 shrink-0">
        <div className="w-14 flex-shrink-0 border-r bg-gray-50"></div>
        {schedule.days.map((day) => (
          <div key={day.date} className={clsx("flex-1 min-w-[100px] py-3 text-center border-r last:border-r-0 relative", day.isToday ? "bg-blue-50" : "bg-white")}>
            {day.isToday && <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>}
            <div className={clsx("text-xs font-bold uppercase", day.isToday ? "text-blue-600" : "text-gray-500")}>{daysMap[day.dow]}</div>
            <div className={clsx("text-xl font-bold", day.isToday ? "text-blue-700" : "text-gray-800")}>{day.date.split('-')[2]}</div>
            
            <div className="mt-1">
                <span className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium inline-block",
                    ((day as any).bookedCount || 0) > 0 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"
                )}>
                    {(day as any).bookedCount || 0}
                </span>
            </div>

          </div>
        ))}
      </div>

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto relative scroll-smooth no-scrollbar" style={scrollbarHideStyle}>
        <div className="flex min-w-[600px] relative min-h-full">
          
          <div className="w-14 flex-shrink-0 bg-white border-r text-right text-xs text-gray-400 font-medium select-none">
            {displayTimeAxis.map((time) => (
              <div key={time} style={{ height: SLOT_HEIGHT }} className="pr-2 pt-1 relative border-b border-transparent">
                <span className="-top-2.5 relative">{time}</span>
              </div>
            ))}
          </div>

          {showTimeLine && (
            <div className="absolute left-14 right-0 border-t-2 border-red-500 z-30 pointer-events-none opacity-80" style={{ top: `${timeLineOffset}px` }}>
              <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
            </div>
          )}

          {schedule.days.map((day) => {
            const hasSlots = day.cells && day.cells.length > 0;
            return (
              <div key={day.date} className={clsx("flex-1 min-w-[100px] border-r last:border-r-0 relative flex flex-col", day.isAbsent && "bg-red-500/50", (!hasSlots && !day.isAbsent) && "bg-gray-50/20")}>
                {!hasSlots ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-2 text-center" style={{ minHeight: displayTimeAxis.length * SLOT_HEIGHT }}>
                    <CalendarX className={clsx("w-6 h-6 mb-2", day.isAbsent ? "text-red-300" : "text-gray-300")} />
                    <span className={clsx("text-xs font-medium", day.isAbsent ? "text-red-400" : "text-gray-400")}>{day.isAbsent ? 'Nieobecność' : 'Brak przyjęć'}</span>
                  </div>
                ) : (
                  day.cells.map((cell) => {
                    const isBooked = cell.status === 'BOOKED';
                    let bgClass = "";
                    if (cell.status === 'UNAVAILABLE') bgClass = "bg-gray-100/40";
                    if (cell.status === 'FREE') bgClass = "hover:bg-green-50 cursor-pointer";

                    return (
                      <div 
                        key={`${day.date}-${cell.time}`}
                        style={{ height: SLOT_HEIGHT }}
                        className={clsx("border-b border-gray-100 p-1 relative box-border transition-colors", bgClass)}
                        onClick={() => { if (isBooked || cell.status === 'FREE') onSlotClick(cell, day.date); }}
                      >
                        {isBooked && (
                          <div className={clsx(
                            "h-full w-full rounded border shadow-sm text-[10px] px-1 overflow-hidden leading-tight flex items-center group relative",
                            getSlotStyle(cell)
                          )}>
                            <span className="truncate font-bold">{cell.visitType || "Wizyta"}</span>
                            
                            <div className="hidden group-hover:block absolute left-0 bottom-full mb-1 z-50 bg-gray-900 text-white p-2 rounded shadow-xl w-max min-w-[120px]">
                                <div className="font-bold border-b border-gray-700 pb-1 mb-1">{cell.time}</div>
                                <div className="flex items-center gap-1 text-xs">
                                   <User size={12} className="text-gray-400"/>
                                   {cell.patientSnapshot?.fullName || "Pacjent"}
                                </div>
                                <div className="text-[10px] mt-1 text-gray-400 uppercase tracking-wider font-bold">
                                  {(cell as any).appointmentStatus === 'CONFIRMED' ? 'POTWIERDZONA' : 'ZAREZERWOWANA'}
                                </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};