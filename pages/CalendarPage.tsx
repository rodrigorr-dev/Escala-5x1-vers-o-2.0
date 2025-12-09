import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Zap, Wrench } from 'lucide-react';
import { CalendarViewType } from '../types';
import { BottomMenu } from '../components/BottomMenu';

interface VacationPeriod {
  start: Date;
  end: Date;
}

interface EmployeeScheduleConfig {
  name: string;
  role: string;
  referenceDate: Date; // A known day off
  vacations?: VacationPeriod[];
}

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<CalendarViewType>(CalendarViewType.MONTH);
  const [currentMonth, setCurrentMonth] = useState(new Date()); // Opens on current month
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Configuration based on User's prompt for December 2025
  // Cycle is 6 days (5 work + 1 off)
  const employeesConfig: EmployeeScheduleConfig[] = [
    { name: 'Valci Jacinto', role: 'Mecânico', referenceDate: new Date(2025, 11, 1) }, // 01/12/2025
    { name: 'Mauro Luiz', role: 'Eletricista', referenceDate: new Date(2025, 11, 1) }, // 01/12/2025
    { 
      name: 'Antonio Marcos', 
      role: 'Eletricista', 
      referenceDate: new Date(2025, 11, 2) 
    }, // 02/12/2025
    { name: 'Adriano Pinto', role: 'Eletricista', referenceDate: new Date(2025, 11, 3) }, // 03/12/2025
    { name: 'Mário de Souza', role: 'Mecânico', referenceDate: new Date(2025, 11, 4) }, // 04/12/2025
    { 
      name: 'Manuel Gonçalves', 
      role: 'Mecânico', 
      referenceDate: new Date(2025, 11, 5), // 05/12/2025
      vacations: [
        { start: new Date(2025, 11, 22), end: new Date(2026, 0, 10) } // 22/12/2025 to 10/01/2026
      ]
    }, 
    { name: 'Alan Pereira', role: 'Mecânico', referenceDate: new Date(2025, 11, 6) }, // 06/12/2025
  ];

  // Navigation Logic
  const nextPeriod = () => {
    if (view === CalendarViewType.MONTH) {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    } else {
        // Next week
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
        setCurrentMonth(newDate); // Sync month header
    }
  };

  const prevPeriod = () => {
    if (view === CalendarViewType.MONTH) {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else {
        // Prev week
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
        setCurrentMonth(newDate); // Sync month header
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // Helper: Check if employee is on vacation
  const isEmployeeOnVacation = (employee: EmployeeScheduleConfig, date: Date) => {
    if (!employee.vacations) return false;
    const target = new Date(date).setHours(0,0,0,0);
    
    return employee.vacations.some(v => {
      const start = new Date(v.start).setHours(0,0,0,0);
      const end = new Date(v.end).setHours(0,0,0,0);
      return target >= start && target <= end;
    });
  };

  // Helper: Check if employee is on regular 5x1 day off
  const isRegularDayOff = (employee: EmployeeScheduleConfig, date: Date) => {
    // If on vacation, logic 5x1 doesn't matter for display purposes (Vacation takes precedence)
    // But pure 5x1 calculation is purely mathematical
    const target = new Date(date).setHours(0,0,0,0);
    const ref = new Date(employee.referenceDate).setHours(0,0,0,0);
    
    const diffTime = target - ref;
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Modulo 6 arithmetic
    return ((diffDays % 6) + 6) % 6 === 0;
  };

  // Helper: Get status for a specific date
  const getEmployeeStatusOnDate = (date: Date) => {
    const onVacation: EmployeeScheduleConfig[] = [];
    const onDayOff: EmployeeScheduleConfig[] = [];
    const working: EmployeeScheduleConfig[] = [];

    employeesConfig.forEach(emp => {
      if (isEmployeeOnVacation(emp, date)) {
        onVacation.push(emp);
      } else if (isRegularDayOff(emp, date)) {
        onDayOff.push(emp);
      } else {
        working.push(emp);
      }
    });

    return { onVacation, onDayOff, working };
  };

  const renderRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('eletricista')) {
      return (
        <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center border border-yellow-700/50">
          <Zap className="w-5 h-5 text-yellow-400" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center border border-indigo-700/50">
        <Wrench className="w-5 h-5 text-indigo-400" />
      </div>
    );
  };

  const renderRoleIconSmall = (role: string) => {
    if (role.toLowerCase().includes('eletricista')) {
        return (
            <div className="h-10 w-10 rounded-full ring-2 ring-[#0f172a] bg-yellow-900/40 flex items-center justify-center">
                <Zap className="w-5 h-5 text-yellow-400" />
            </div>
        )
    }
    return (
        <div className="h-10 w-10 rounded-full ring-2 ring-[#0f172a] bg-indigo-900/40 flex items-center justify-center">
            <Wrench className="w-5 h-5 text-indigo-400" />
        </div>
    )
  }

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Logic to generate days
  const getDaysToRender = () => {
    if (view === CalendarViewType.WEEK) {
        // Calculate start of week (Sunday) based on selectedDate
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
        
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            weekDays.push(day);
        }
        return weekDays;
    } else {
        // Month Logic
        const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

        const daysInMonth = getDaysInMonth(currentMonth);
        const startDay = getFirstDayOfMonth(currentMonth);

        const monthDays = [];
        for (let i = 0; i < startDay; i++) monthDays.push(null); // Empty slots
        for (let i = 1; i <= daysInMonth; i++) {
            monthDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
        }
        return monthDays;
    }
  };

  const daysToRender = getDaysToRender();

  // Selected Date Stats
  const dailyStats = getEmployeeStatusOnDate(selectedDate);
  const formattedSelectedDate = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  // Display Month Name (Use selected date for week view to avoid confusion if week spans months)
  const displayDate = view === CalendarViewType.WEEK ? selectedDate : currentMonth;

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white relative">
      {/* Custom Header for Calendar */}
      <div className="flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
           <button 
             onClick={prevPeriod} 
             className="p-1 rounded-full hover:bg-[#1e293b] text-slate-300 hover:text-white transition-colors"
           >
             <ChevronLeft className="w-6 h-6" />
           </button>
           <h1 className="text-xl font-bold w-40 text-center">
             {monthNames[displayDate.getMonth()]} {displayDate.getFullYear()}
           </h1>
           <button 
             onClick={nextPeriod} 
             className="p-1 rounded-full hover:bg-[#1e293b] text-slate-300 hover:text-white transition-colors"
           >
             <ChevronRight className="w-6 h-6" />
           </button>
        </div>
        <button 
          onClick={goToToday} 
          className="text-blue-500 font-semibold text-sm px-3 py-1 rounded-lg hover:bg-[#1e293b] transition-colors"
        >
          Hoje
        </button>
      </div>

      {/* Toggle */}
      <div className="px-4 mb-6">
        <div className="bg-[#1e293b] p-1 rounded-xl flex">
          <button
            onClick={() => setView(CalendarViewType.MONTH)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              view === CalendarViewType.MONTH ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => setView(CalendarViewType.WEEK)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              view === CalendarViewType.WEEK ? 'bg-[#0f172a] text-white shadow-sm' : 'text-slate-400'
            }`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* Content Container with Scroll */}
      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Calendar Grid */}
        <div className="px-4 mb-6">
          {/* Days Header */}
          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-center text-slate-400 text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className={`grid grid-cols-7 gap-y-4 gap-x-1 ${view === CalendarViewType.WEEK ? 'py-4 bg-[#1e293b]/30 rounded-2xl' : ''}`}>
            {daysToRender.map((dateObj, index) => {
              if (!dateObj) return <div key={`empty-${index}`} />;
              
              const isToday = new Date().setHours(0,0,0,0) === dateObj.setHours(0,0,0,0);
              const isSelected = selectedDate.setHours(0,0,0,0) === dateObj.setHours(0,0,0,0);
              
              const stats = getEmployeeStatusOnDate(dateObj);
              const hasVacation = stats.onVacation.length > 0;
              const hasDayOff = stats.onDayOff.length > 0;

              // Larger size for Week View
              const sizeClass = view === CalendarViewType.WEEK ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
              const dotSize = view === CalendarViewType.WEEK ? 'w-1.5 h-1.5' : 'w-1 h-1';

              return (
                <div key={index} className="flex flex-col items-center gap-1 relative h-auto">
                  <button
                    onClick={() => {
                        // Create a copy to ensure immutability
                        const newDate = new Date(dateObj);
                        setSelectedDate(newDate);
                        
                        if (view === CalendarViewType.WEEK) {
                            // Optionally sync current month if clicking a day from adjacent month in week view
                            if (newDate.getMonth() !== currentMonth.getMonth()) {
                                setCurrentMonth(newDate);
                            }
                        }
                    }}
                    className={`${sizeClass} flex items-center justify-center rounded-full font-medium transition-all ${
                        isSelected 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40 scale-110' 
                        : isToday 
                            ? 'border border-blue-500 text-blue-400' 
                            : 'text-white hover:bg-[#1e293b]'
                    }`}
                  >
                    {dateObj.getDate()}
                  </button>
                  
                  {/* Indicator Dots */}
                  {!isSelected && (hasVacation || hasDayOff) && (
                    <div className="flex gap-0.5 absolute -bottom-1">
                        {hasVacation && <div className={`${dotSize} rounded-full bg-blue-400`}></div>}
                        {hasDayOff && <div className={`${dotSize} rounded-full bg-orange-500`}></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Schedule Section */}
        <div className="px-4 mt-4">
          <h3 className="text-slate-400 text-sm font-medium mb-3 border-b border-slate-800 pb-2">
            Escala: {formattedSelectedDate}
          </h3>
          
          <div className="space-y-4">
            
            {/* Vacation Section */}
            {dailyStats.onVacation.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-bold text-blue-400 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                        De Férias ({dailyStats.onVacation.length})
                    </h4>
                    <div className="grid gap-3">
                        {dailyStats.onVacation.map((emp) => (
                            <div key={emp.name} className="flex items-center gap-3 bg-[#1e293b] p-3 rounded-xl border border-blue-900/30">
                                {renderRoleIcon(emp.role)}
                                <div>
                                    <p className="font-medium text-white text-sm">{emp.name}</p>
                                    <p className="text-xs text-blue-300">Férias</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Day Off Section */}
            <div className="space-y-2">
                <h4 className="text-sm font-bold text-orange-400 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                    De Folga ({dailyStats.onDayOff.length})
                </h4>
                
                {dailyStats.onDayOff.length > 0 ? (
                    <div className="grid gap-3">
                    {dailyStats.onDayOff.map((emp) => (
                        <div key={emp.name} className="flex items-center gap-3 bg-[#1e293b] p-3 rounded-xl border border-slate-800">
                             {renderRoleIcon(emp.role)}
                            <div>
                                <p className="font-medium text-white text-sm">{emp.name}</p>
                                <p className="text-xs text-slate-400">{emp.role}</p>
                            </div>
                        </div>
                    ))}
                    </div>
                ) : (
                    <p className="text-slate-500 text-sm italic">Ninguém está de folga hoje (5x1).</p>
                )}
            </div>

            {/* Working Section */}
            <div className="pt-4 border-t border-slate-800/50">
                <h4 className="text-sm font-bold text-green-400 flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span>
                    Trabalhando ({dailyStats.working.length})
                </h4>
                <div className="flex -space-x-3 overflow-hidden py-2 pl-1">
                    {dailyStats.working.map(emp => (
                        <div key={emp.name} title={emp.name}>
                             {renderRoleIconSmall(emp.role)}
                        </div>
                    ))}
                    {dailyStats.working.length === 0 && (
                        <span className="text-slate-500 text-sm italic">Ninguém trabalhando.</span>
                    )}
                </div>
            </div>

          </div>
        </div>

      </div>

      {/* Floating Action Button - Positioned above BottomMenu */}
      <div className="absolute bottom-20 right-6 z-20">
        <button
          onClick={() => navigate('/request')}
          className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomMenu />
    </div>
  );
};

export default CalendarPage;