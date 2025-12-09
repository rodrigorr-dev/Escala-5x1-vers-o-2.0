import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight, Zap, Wrench, AlertCircle, X, Save, PlusCircle, Palmtree } from 'lucide-react';
import { CalendarViewType } from '../types';
import { BottomMenu } from '../components/BottomMenu';

interface VacationPeriod {
  start: Date;
  end: Date;
}

interface ScheduleOverride {
  id: string; // unique ID for deletion/management
  date: string; // ISO string YYYY-MM-DD
  employeeName: string;
  type: 'emergency_work' | 'extra_day_off';
  note?: string;
}

interface EmployeeBase {
  name: string;
  role: string;
  referenceDate: Date; // A known day off
  vacations?: VacationPeriod[];
}

const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [view, setView] = useState<CalendarViewType>(CalendarViewType.MONTH);
  const [currentMonth, setCurrentMonth] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modal State
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideType, setOverrideType] = useState<'emergency_work' | 'extra_day_off'>('emergency_work');
  const [overrideEmployee, setOverrideEmployee] = useState('');
  const [overrideNote, setOverrideNote] = useState('');

  // Persistent Overrides State
  const [overrides, setOverrides] = useState<ScheduleOverride[]>(() => {
    const saved = localStorage.getItem('hr_flow_overrides');
    // Pre-populate with the specific case requested if storage is empty, just as an example
    if (!saved) {
        return [{
            id: 'default-1',
            date: '2025-12-09',
            employeeName: 'Adriano Pinto',
            type: 'emergency_work',
            note: 'Demanda de emergência'
        }];
    }
    return JSON.parse(saved);
  });

  // Save overrides whenever they change
  useEffect(() => {
    localStorage.setItem('hr_flow_overrides', JSON.stringify(overrides));
  }, [overrides]);

  // Static Configuration
  const employeesConfig: EmployeeBase[] = [
    { name: 'Valci Jacinto', role: 'Mecânico', referenceDate: new Date(2025, 11, 1) }, 
    { name: 'Mauro Luiz', role: 'Eletricista', referenceDate: new Date(2025, 11, 1) }, 
    { name: 'Antonio Marcos', role: 'Eletricista', referenceDate: new Date(2025, 11, 2) }, 
    { name: 'Adriano Pinto', role: 'Eletricista', referenceDate: new Date(2025, 11, 3) }, 
    { name: 'Mário de Souza', role: 'Mecânico', referenceDate: new Date(2025, 11, 4) }, 
    { 
      name: 'Manuel Gonçalves', 
      role: 'Mecânico', 
      referenceDate: new Date(2025, 11, 5),
      vacations: [
        { start: new Date(2025, 11, 22), end: new Date(2026, 0, 10) } 
      ]
    }, 
    { name: 'Alan Pereira', role: 'Mecânico', referenceDate: new Date(2025, 11, 6) }, 
  ];

  // Navigation Logic
  const nextPeriod = () => {
    if (view === CalendarViewType.MONTH) {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    } else {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + 7);
        setSelectedDate(newDate);
        setCurrentMonth(newDate); 
    }
  };

  const prevPeriod = () => {
    if (view === CalendarViewType.MONTH) {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    } else {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() - 7);
        setSelectedDate(newDate);
        setCurrentMonth(newDate); 
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  // --- Logic Helpers ---

  const isEmployeeOnVacation = (employee: EmployeeBase, date: Date) => {
    if (!employee.vacations) return false;
    const target = new Date(date).setHours(0,0,0,0);
    
    return employee.vacations.some(v => {
      const start = new Date(v.start).setHours(0,0,0,0);
      const end = new Date(v.end).setHours(0,0,0,0);
      return target >= start && target <= end;
    });
  };

  const getOverride = (employeeName: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0]; // Compare using YYYY-MM-DD
    return overrides.find(o => o.date === dateStr && o.employeeName === employeeName);
  };

  const isRegularDayOff = (employee: EmployeeBase, date: Date) => {
    const target = new Date(date).setHours(0,0,0,0);
    const ref = new Date(employee.referenceDate).setHours(0,0,0,0);
    
    const diffTime = target - ref;
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Modulo 6 arithmetic
    return ((diffDays % 6) + 6) % 6 === 0;
  };

  const getEmployeeStatusOnDate = (date: Date) => {
    const onVacation: EmployeeBase[] = [];
    const onDayOff: EmployeeBase[] = [];
    const emergencyWork: { emp: EmployeeBase, note?: string, id: string }[] = [];
    const extraDayOff: { emp: EmployeeBase, note?: string, id: string }[] = [];
    const working: EmployeeBase[] = [];

    employeesConfig.forEach(emp => {
      const override = getOverride(emp.name, date);

      // Priority Logic:
      // 1. Override (User manually set this)
      // 2. Vacation
      // 3. Regular Schedule

      if (override) {
        if (override.type === 'emergency_work') {
            emergencyWork.push({ emp, note: override.note, id: override.id });
        } else if (override.type === 'extra_day_off') {
            extraDayOff.push({ emp, note: override.note, id: override.id });
        }
      } else if (isEmployeeOnVacation(emp, date)) {
        onVacation.push(emp);
      } else if (isRegularDayOff(emp, date)) {
        onDayOff.push(emp);
      } else {
        working.push(emp);
      }
    });

    return { onVacation, onDayOff, emergencyWork, extraDayOff, working };
  };

  // --- Handlers ---

  const handleOpenModal = () => {
    setIsOverrideModalOpen(true);
    setOverrideType('emergency_work'); // Reset to default
    setOverrideEmployee('');
    setOverrideNote('');
  }

  const handleAddOverride = () => {
    if (!overrideEmployee) return;

    const newOverride: ScheduleOverride = {
        id: Date.now().toString(),
        date: selectedDate.toISOString().split('T')[0],
        employeeName: overrideEmployee,
        type: overrideType,
        note: overrideNote || (overrideType === 'emergency_work' ? 'Trabalho Extra' : 'Folga Extra')
    };

    setOverrides([...overrides, newOverride]);
    setIsOverrideModalOpen(false);
    setOverrideEmployee('');
    setOverrideNote('');
  };

  const handleDeleteOverride = (id: string) => {
      setOverrides(overrides.filter(o => o.id !== id));
  };

  // --- Render Helpers ---

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

  // Calendar Calculation
  const getDaysToRender = () => {
    if (view === CalendarViewType.WEEK) {
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
        const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

        const daysInMonth = getDaysInMonth(currentMonth);
        const startDay = getFirstDayOfMonth(currentMonth);

        const monthDays = [];
        for (let i = 0; i < startDay; i++) monthDays.push(null); 
        for (let i = 1; i <= daysInMonth; i++) {
            monthDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
        }
        return monthDays;
    }
  };

  const daysToRender = getDaysToRender();
  const dailyStats = getEmployeeStatusOnDate(selectedDate);
  const formattedSelectedDate = selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const displayDate = view === CalendarViewType.WEEK ? selectedDate : currentMonth;

  // Employees available for selection in modal logic
  const employeesAvailableForOverride = employeesConfig.filter(emp => {
      const isOff = isRegularDayOff(emp, selectedDate) || isEmployeeOnVacation(emp, selectedDate);
      
      const alreadyOverridden = dailyStats.emergencyWork.some(e => e.emp.name === emp.name) || 
                                dailyStats.extraDayOff.some(e => e.emp.name === emp.name);
      
      if (alreadyOverridden) return false;

      // Logic switch based on type
      if (overrideType === 'emergency_work') {
          // Can only make them work if they are OFF
          return isOff;
      } else {
          // Can only give extra day off if they are WORKING
          return !isOff;
      }
  });

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white relative">
      {/* Header */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Calendar Grid */}
        <div className="px-4 mb-6">
          <div className="grid grid-cols-7 mb-4">
            {daysOfWeek.map((day, i) => (
              <div key={i} className="text-center text-slate-400 text-sm font-medium">
                {day}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 gap-y-4 gap-x-1 ${view === CalendarViewType.WEEK ? 'py-4 bg-[#1e293b]/30 rounded-2xl' : ''}`}>
            {daysToRender.map((dateObj, index) => {
              if (!dateObj) return <div key={`empty-${index}`} />;
              
              const isToday = new Date().setHours(0,0,0,0) === dateObj.setHours(0,0,0,0);
              const isSelected = selectedDate.setHours(0,0,0,0) === dateObj.setHours(0,0,0,0);
              
              const stats = getEmployeeStatusOnDate(dateObj);
              const hasVacation = stats.onVacation.length > 0;
              const hasDayOff = stats.onDayOff.length > 0;
              const hasEmergency = stats.emergencyWork.length > 0;
              const hasExtraOff = stats.extraDayOff.length > 0;

              const sizeClass = view === CalendarViewType.WEEK ? 'w-11 h-11 text-base' : 'w-9 h-9 text-sm';
              const dotSize = view === CalendarViewType.WEEK ? 'w-1.5 h-1.5' : 'w-1 h-1';

              return (
                <div key={index} className="flex flex-col items-center gap-1 relative h-auto">
                  <button
                    onClick={() => {
                        const newDate = new Date(dateObj);
                        setSelectedDate(newDate);
                        if (view === CalendarViewType.WEEK) {
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
                  
                  {!isSelected && (hasVacation || hasDayOff || hasEmergency || hasExtraOff) && (
                    <div className="flex gap-0.5 absolute -bottom-1">
                        {hasVacation && <div className={`${dotSize} rounded-full bg-blue-400`}></div>}
                        {hasEmergency && <div className={`${dotSize} rounded-full bg-purple-500`}></div>}
                        {hasExtraOff && <div className={`${dotSize} rounded-full bg-teal-400`}></div>}
                        {/* Only show orange if no higher priority overrides/vacations exist, or if multiple people */}
                        {hasDayOff && !hasEmergency && !hasExtraOff && <div className={`${dotSize} rounded-full bg-orange-500`}></div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Schedule Section */}
        <div className="px-4 mt-4">
          <div className="flex justify-between items-end border-b border-slate-800 pb-2 mb-3">
             <h3 className="text-slate-400 text-sm font-medium">
                Escala: {formattedSelectedDate}
             </h3>
             <button 
                onClick={handleOpenModal}
                className="text-xs text-blue-400 font-bold hover:text-blue-300 flex items-center gap-1"
             >
                <PlusCircle className="w-4 h-4" />
                Ajustar Escala
             </button>
          </div>
          
          <div className="space-y-4">

            {/* Emergency Work Section */}
            {dailyStats.emergencyWork.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Trabalho Extra (Emergência)
                </h4>
                <div className="grid gap-3">
                  {dailyStats.emergencyWork.map(({ emp, note, id }) => (
                    <div key={emp.name} className="flex items-center gap-3 bg-purple-900/20 p-3 rounded-xl border border-purple-500/50 relative group">
                      {renderRoleIcon(emp.role)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-white text-sm">{emp.name}</p>
                          <span className="text-[10px] bg-purple-500 text-white px-1.5 rounded uppercase font-bold">A Compensar</span>
                        </div>
                        <p className="text-xs text-purple-300 mt-0.5">{note || 'Chamado de última hora'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteOverride(id)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 rounded-full p-1 shadow border border-slate-700 hover:text-red-400"
                      >
                         <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extra Day Off Section */}
            {dailyStats.extraDayOff.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-teal-400 flex items-center gap-2">
                  <Palmtree className="w-4 h-4" />
                  Folga Extra
                </h4>
                <div className="grid gap-3">
                  {dailyStats.extraDayOff.map(({ emp, note, id }) => (
                    <div key={emp.name} className="flex items-center gap-3 bg-teal-900/20 p-3 rounded-xl border border-teal-500/50 relative group">
                      {renderRoleIcon(emp.role)}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="font-medium text-white text-sm">{emp.name}</p>
                          <span className="text-[10px] bg-teal-500 text-white px-1.5 rounded uppercase font-bold">Extra</span>
                        </div>
                        <p className="text-xs text-teal-300 mt-0.5">{note || 'Folga concedida'}</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteOverride(id)}
                        className="absolute -top-2 -right-2 bg-slate-800 text-slate-400 rounded-full p-1 shadow border border-slate-700 hover:text-red-400"
                      >
                         <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
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

      {/* FAB */}
      <div className="absolute bottom-20 right-6 z-20">
        <button
          onClick={() => navigate('/request')}
          className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-8 h-8 text-white" />
        </button>
      </div>

      <BottomMenu />

      {/* Override Modal */}
      {isOverrideModalOpen && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#1e293b] w-full max-w-sm rounded-2xl p-5 border border-slate-700 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-white">Ajustar Escala</h3>
                      <button onClick={() => setIsOverrideModalOpen(false)} className="text-slate-400 hover:text-white">
                          <X className="w-6 h-6" />
                      </button>
                  </div>

                  {/* Type Toggle */}
                  <div className="flex bg-[#0f172a] rounded-lg p-1 mb-4">
                      <button 
                        onClick={() => { setOverrideType('emergency_work'); setOverrideEmployee(''); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                            overrideType === 'emergency_work' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                          Trabalho Extra
                      </button>
                      <button 
                         onClick={() => { setOverrideType('extra_day_off'); setOverrideEmployee(''); }}
                         className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
                            overrideType === 'extra_day_off' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                          Folga Extra
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Dia Selecionado</label>
                          <div className="text-white font-medium bg-[#0f172a] p-2 rounded-lg border border-slate-800">
                              {formattedSelectedDate}
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Funcionário</label>
                          <select 
                            value={overrideEmployee} 
                            onChange={(e) => setOverrideEmployee(e.target.value)}
                            className="w-full bg-[#0f172a] text-white p-3 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                          >
                              <option value="">Selecione...</option>
                              {employeesAvailableForOverride.map(emp => (
                                  <option key={emp.name} value={emp.name}>
                                      {emp.name}
                                  </option>
                              ))}
                          </select>
                          <p className="text-[10px] text-slate-500 mt-1">
                              {overrideType === 'emergency_work' 
                                ? 'Mostrando quem está de folga/férias hoje.' 
                                : 'Mostrando quem está trabalhando hoje.'}
                          </p>
                      </div>

                      <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Motivo / Obs</label>
                          <input 
                            type="text" 
                            value={overrideNote}
                            onChange={(e) => setOverrideNote(e.target.value)}
                            placeholder={overrideType === 'emergency_work' ? "Ex: Emergência" : "Ex: Banco de horas"}
                            className="w-full bg-[#0f172a] text-white p-3 rounded-xl border border-slate-700 focus:border-blue-500 focus:outline-none"
                          />
                      </div>

                      <button 
                        disabled={!overrideEmployee}
                        onClick={handleAddOverride}
                        className={`w-full text-white font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 ${
                            overrideType === 'emergency_work' 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                          <Save className="w-5 h-5" />
                          Salvar Ajuste
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default CalendarPage;