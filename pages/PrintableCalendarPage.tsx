import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Zap, Wrench, ArrowLeft } from 'lucide-react';
import { ScheduleOverride } from '../types';
import { loadOverrides } from '../services/storage';
import { BottomMenu } from '../components/BottomMenu';

interface EmployeeBase {
  name: string;
  role: string;
  referenceDate: Date;
  vacations?: { start: Date; end: Date }[];
}

const PrintableCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const data = await loadOverrides();
      setOverrides(data);
    };
    fetch();
  }, []);

  const employeesConfig: EmployeeBase[] = [
    { name: 'Valci Jacinto', role: 'Mecânico', referenceDate: new Date(2025, 11, 1) }, 
    { name: 'Mauro Luiz', role: 'Eletricista', referenceDate: new Date(2025, 11, 1) }, 
    { name: 'Antonio Marcos', role: 'Eletricista', referenceDate: new Date(2025, 11, 2) }, 
    { name: 'Adriano Pinto', role: 'Eletricista', referenceDate: new Date(2025, 11, 3) }, 
    { name: 'Mário de Souza', role: 'Mecânico', referenceDate: new Date(2025, 11, 4) }, 
    { name: 'Manuel Gonçalves', role: 'Mecânico', referenceDate: new Date(2025, 11, 5), vacations: [{ start: new Date(2025, 11, 22), end: new Date(2026, 0, 10) }] }, 
    { name: 'Alan Pereira', role: 'Mecânico', referenceDate: new Date(2025, 11, 6) }, 
  ];

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const formatDisplayName = (fullName: string) => {
    if (fullName === 'Antonio Marcos') return 'Marcos';
    return fullName.split(' ')[0];
  };

  const getWhoIsOff = (date: Date) => {
    const list: { name: string, role: string, type: 'regular' | 'vacation' | 'extra' }[] = [];
    const dateStr = date.toISOString().split('T')[0];
    const isEmployeeOnVacation = (employee: EmployeeBase, d: Date) => {
      if (!employee.vacations) return false;
      const target = new Date(d).setHours(0,0,0,0);
      return employee.vacations.some(v => {
        const start = new Date(v.start).setHours(0,0,0,0);
        const end = new Date(v.end).setHours(0,0,0,0);
        return target >= start && target <= end;
      });
    };
    const isRegularDayOff = (employee: EmployeeBase, d: Date) => {
      const target = new Date(d).setHours(0,0,0,0);
      const ref = new Date(employee.referenceDate).setHours(0,0,0,0);
      const diffDays = Math.round((target - ref) / (1000 * 3600 * 24));
      return ((diffDays % 6) + 6) % 6 === 0;
    };
    employeesConfig.forEach(emp => {
      const override = overrides.find(o => o.date === dateStr && o.employeeName === emp.name);
      if (override) { if (override.type === 'extra_day_off') list.push({ name: emp.name, role: emp.role, type: 'extra' }); }
      else if (isEmployeeOnVacation(emp, date)) list.push({ name: emp.name, role: emp.role, type: 'vacation' });
      else if (isRegularDayOff(emp, date)) list.push({ name: emp.name, role: emp.role, type: 'regular' });
    });
    return list;
  };

  const getDaysToRender = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const startDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const calendarDays = [];
    for (let i = 0; i < startDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) calendarDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    return calendarDays;
  };

  const handlePrint = () => {
    // Foca na janela para garantir que o comando de impressão seja capturado
    window.focus();
    // Pequeno delay para garantir que a UI não esteja bloqueada
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const calendarDays = getDaysToRender();

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white print:bg-white print:text-black min-h-screen transition-colors duration-300 overflow-y-auto print:overflow-visible relative">
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 5mm; }
          html, body, #root, .min-h-screen { 
            background: white !important; 
            color: black !important; 
            height: auto !important; 
            overflow: visible !important; 
            position: static !important;
          }
          .no-print { display: none !important; }
          .print-grid { 
            border: 1px solid black !important; 
            display: grid !important; 
            grid-template-columns: repeat(7, 1fr) !important; 
            width: 100% !important; 
          }
          .print-cell { border: 1px solid black !important; min-height: 25mm !important; background: white !important; }
          .print-bg-regular { background-color: #fff7ed !important; border-left: 5px solid #f97316 !important; }
          .print-bg-vacation { background-color: #eff6ff !important; border-left: 5px solid #3b82f6 !important; }
          .print-bg-extra { background-color: #f0fdfa !important; border-left: 5px solid #14b8a6 !important; }
          .print-text { color: black !important; font-weight: bold !important; font-size: 10pt !important; }
        }
      `}</style>

      {/* Header de Controle */}
      <div className="flex items-center justify-between px-4 py-4 bg-[#0f172a] border-b border-slate-800 no-print sticky top-0 z-[100] shadow-lg">
        <button 
          onClick={() => navigate('/calendar')}
          className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors flex items-center gap-2 group"
          title="Voltar"
        >
          <ArrowLeft className="w-6 h-6 text-white group-active:scale-90 transition-transform" />
          <span className="hidden sm:inline font-bold text-sm">Voltar</span>
        </button>

        <div className="flex items-center gap-1 sm:gap-4">
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-sm sm:text-base font-bold min-w-[120px] sm:min-w-[150px] text-center">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h1>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-1.5 hover:bg-slate-800 rounded-full transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-bold transition-all shadow-md active:scale-95 text-xs sm:text-sm"
        >
          <Download className="w-4 h-4" />
          <span className="hidden xs:inline">Baixar PDF</span>
          <span className="xs:hidden">PDF</span>
        </button>
      </div>

      <div className="print-container flex-1 p-4 sm:p-6 flex flex-col gap-4 print:p-0">
        {/* Título Visível Apenas no PDF */}
        <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-3xl font-black uppercase tracking-tight">Escala Mensal de Folgas - Manutenção</h1>
          <p className="text-lg font-bold text-slate-700">{monthNames[currentMonth.getMonth()]} de {currentMonth.getFullYear()}</p>
        </div>

        {/* Legenda */}
        <div className="flex gap-4 sm:gap-6 no-print mb-2 justify-center">
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="w-3 h-3 bg-orange-500 rounded"></span> Folga
          </div>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="w-3 h-3 bg-blue-500 rounded"></span> Férias
          </div>
          <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span className="w-3 h-3 bg-teal-500 rounded"></span> Extra
          </div>
        </div>

        {/* Grid do Calendário */}
        <div className="print-grid grid grid-cols-7 border-t border-l border-slate-700 flex-1 min-h-[450px] rounded-lg overflow-hidden border-slate-700">
          {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(day => (
            <div key={day} className="bg-slate-800/80 py-3 text-center text-[9px] sm:text-[10px] font-black border-r border-b border-slate-700 print:bg-slate-100 print:text-black print:border-black uppercase tracking-widest">
              {day}
            </div>
          ))}

          {calendarDays.map((date, idx) => {
            if (!date) return <div key={`empty-${idx}`} className="bg-slate-900/10 border-r border-b border-slate-700 print:border-black"></div>;
            
            const whoIsOff = getWhoIsOff(date);
            const isToday = new Date().setHours(0,0,0,0) === date.setHours(0,0,0,0);

            return (
              <div key={idx} className={`print-cell p-1 sm:p-2 border-r border-b border-slate-700 flex flex-col gap-1 min-h-[90px] sm:min-h-[110px] bg-slate-900/5 print:border-black ${isToday ? 'bg-blue-600/5 ring-1 ring-blue-500/50 ring-inset' : ''}`}>
                <span className={`text-right text-[10px] sm:text-xs font-black block mb-0.5 sm:mb-1 ${isToday ? 'text-blue-500' : 'text-slate-500 print:text-black'}`}>
                  {date.getDate()}
                </span>
                
                <div className="flex flex-col gap-0.5 sm:gap-1 overflow-hidden">
                  {whoIsOff.map((off, oIdx) => (
                    <div 
                      key={oIdx} 
                      className={`text-[8px] sm:text-[9px] px-1 sm:px-2 py-1 rounded border-l-2 font-bold uppercase truncate flex items-center gap-1 shadow-sm
                        ${off.type === 'regular' ? 'bg-orange-500/10 text-orange-400 border-orange-500 print-bg-regular print-text' : 
                          off.type === 'vacation' ? 'bg-blue-500/10 text-blue-400 border-blue-500 print-bg-vacation print-text' : 
                          'bg-teal-500/10 text-teal-400 border-teal-500 print-bg-extra print-text'}
                      `}
                    >
                      {off.role.toLowerCase().includes('eletricista') ? <Zap className="w-2 sm:w-2.5 h-2 sm:h-2.5 flex-shrink-0" /> : <Wrench className="w-2 sm:w-2.5 h-2 sm:h-2.5 flex-shrink-0" />}
                      <span className="truncate">{formatDisplayName(off.name)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="md:hidden no-print h-20">
        <BottomMenu />
      </div>
    </div>
  );
};

export default PrintableCalendarPage;