import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Pencil, Calendar, Clock, Cake, Briefcase, Zap, Wrench, Plus, Trash2, X } from 'lucide-react';
import { NavBar } from '../components/NavBar';
import { Employee, EmployeeStatus, ScheduleOverride } from '../types';
import { loadOverrides, loadVacations, saveVacations, EmployeeTimeOff, isDateInRange, TimeOffRecord } from '../services/storage';

interface ExtendedEmployee extends Employee {
  referenceDate: Date; // Base date for 5x1 calculation (December 2025 based)
  birthday: string;
}

const EmployeeDetailsPage: React.FC = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'history' | 'data'>('history');
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [newVacationStart, setNewVacationStart] = useState('');
  const [newVacationDays, setNewVacationDays] = useState('30');
  const [newVacationType, setNewVacationType] = useState<'vacation' | 'leave'>('vacation');
  
  // Overrides State
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);
  const [allVacations, setAllVacations] = useState<EmployeeTimeOff[]>([]);

  useEffect(() => {
    const fetch = async () => {
        const [overridesData, vacationsData] = await Promise.all([
            loadOverrides(),
            loadVacations()
        ]);
        setOverrides(overridesData);
        setAllVacations(vacationsData);
    };
    fetch();
  }, []);

  // Employee data with 5x1 reference dates and birthdays
  const employees: ExtendedEmployee[] = [
    {
      id: '1',
      name: 'Adriano Pinto',
      role: 'Eletricista',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 3), // 03/12/2025
      birthday: '13/abr'
    },
    {
      id: '2',
      name: 'Alan Pereira',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.DAY_OFF,
      referenceDate: new Date(2025, 11, 6), // 06/12/2025
      birthday: '02/ago'
    },
    {
      id: '3',
      name: 'Antonio Marcos',
      role: 'Eletricista',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 2), // 02/12/2025
      birthday: '09/nov'
    },
    {
      id: '4',
      name: 'Valci Jacinto',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.VACATION,
      referenceDate: new Date(2025, 11, 1), // 01/12/2025
      birthday: '29/jul'
    },
    {
      id: '5',
      name: 'Manuel Gonçalves',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 5), // 05/12/2025
      birthday: '25/nov'
    },
    {
      id: '6',
      name: 'Mário de Souza',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 4), // 04/12/2025
      birthday: '02/set'
    },
    {
      id: '7',
      name: 'Mauro Luiz',
      role: 'Eletricista',
      avatar: '',
      status: EmployeeStatus.LEAVE,
      referenceDate: new Date(2025, 11, 1), // 01/12/2025
      birthday: '06/mai'
    }
  ];

  const employeeBase = employees.find(e => e.id === id) || employees[0];
  
  // Get vacations for this specific employee from storage
  const empVacations = allVacations.find(v => v.employeeId === employeeBase.id)?.vacations || [];

  // Logic to calculate TRUE current status (including Overrides and Vacations)
  const calculateCurrentStatus = (emp: ExtendedEmployee): EmployeeStatus => {
     const today = new Date();
     today.setHours(0,0,0,0);
     const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

     // 0. Overrides
     const override = overrides.find(o => o.date === dateStr && o.employeeName === emp.name);
     if (override) {
         if (override.type === 'emergency_work') return EmployeeStatus.EXTRA_WORK;
         if (override.type === 'extra_day_off') return EmployeeStatus.EXTRA_OFF;
     }

     // 1. Vacations/Leaves (from storage)
     const timeOff = empVacations.find(v => isDateInRange(today, v.start, v.end));
     if (timeOff) {
         return timeOff.type === 'leave' ? EmployeeStatus.LEAVE : EmployeeStatus.VACATION;
     }

     // 2. Regular Logic (5x1)
     const ref = new Date(emp.referenceDate);
     ref.setHours(0,0,0,0);
     const diffDays = Math.round((today.getTime() - ref.getTime()) / (1000 * 3600 * 24));
     const cyclePos = ((diffDays % 6) + 6) % 6;
     
     if (cyclePos === 0) return EmployeeStatus.DAY_OFF;
     return EmployeeStatus.AVAILABLE; // Default to Available if not off
  };

  const handleAddVacation = async () => {
    if (!newVacationStart || !newVacationDays) return;
    
    const start = new Date(newVacationStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + parseInt(newVacationDays) - 1);
    
    const endStr = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

    const newRecord: TimeOffRecord = {
        start: newVacationStart,
        end: endStr,
        type: newVacationType
    };
    
    const updatedAllVacations = [...allVacations];
    const empIndex = updatedAllVacations.findIndex(v => v.employeeId === employeeBase.id);
    
    if (empIndex >= 0) {
        updatedAllVacations[empIndex].vacations.push(newRecord);
    } else {
        updatedAllVacations.push({
            employeeId: employeeBase.id,
            vacations: [newRecord]
        });
    }
    
    setAllVacations(updatedAllVacations);
    await saveVacations(updatedAllVacations);
    setShowVacationModal(false);
    setNewVacationStart('');
  };

  const handleRemoveVacation = async (index: number) => {
    const updatedAllVacations = [...allVacations];
    const empIndex = updatedAllVacations.findIndex(v => v.employeeId === employeeBase.id);
    
    if (empIndex >= 0) {
        updatedAllVacations[empIndex].vacations.splice(index, 1);
        setAllVacations(updatedAllVacations);
        await saveVacations(updatedAllVacations);
    }
  };

  const currentStatus = calculateCurrentStatus(employeeBase);
  const employee = { ...employeeBase, status: currentStatus, vacations: empVacations };

  // Logic to calculate Next Day Off and Previous Days Off based on 5x1
  const calculateSchedule = (refDate: Date) => {
    // Current date simulation (using today, but could be fixed to 2025 if needed)
    const today = new Date(); 
    today.setHours(0, 0, 0, 0);

    const ref = new Date(refDate);
    ref.setHours(0, 0, 0, 0);

    // Calculate the difference in days
    const diffTime = today.getTime() - ref.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // In a 6-day cycle (5 work + 1 off), the remainder tells us position
    // We need to handle negative remainders correctly for JS modulo
    const cyclePos = ((diffDays % 6) + 6) % 6; 

    // Days until next off (if cyclePos is 0, today is off, next is in 6 days)
    const daysUntilNext = cyclePos === 0 ? 6 : (6 - cyclePos);
    
    // Calculate dates
    const nextOff = new Date(today);
    nextOff.setDate(today.getDate() + daysUntilNext);

    const lastOff = new Date(today);
    // If today is off (0), last off was today. If not, it was 'daysSinceLast' ago.
    // Requirement says "Two previous". If today is off, that counts as one?
    // Let's assume strict "Previous" means before today if today isn't off, or today if it is.
    
    let offset1 = cyclePos === 0 ? 0 : cyclePos;
    lastOff.setDate(today.getDate() - offset1);

    const secondLastOff = new Date(lastOff);
    secondLastOff.setDate(lastOff.getDate() - 6);

    // If today is a day off, we might want to show Today as "Current" and the previous one.
    // Or just show strictly previous. Let's show: Next, Last, 2nd Last.
    
    // Note: If today is a day off, "Next" is 6 days from now. "Last" is Today.
    // If today is work, "Next" is soon. "Last" was recent.

    return {
      next: nextOff,
      previous: [lastOff, secondLastOff]
    };
  };

  const schedule = calculateSchedule(employee.referenceDate);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  };
  
  const getRelativeLabel = (date: Date) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(date);
    target.setHours(0,0,0,0);
    
    const diff = (target.getTime() - today.getTime()) / (1000 * 3600 * 24);
    
    if (diff === 0) return 'Hoje';
    if (diff === 1) return 'Amanhã';
    if (diff === -1) return 'Ontem';
    return '';
  }

  const renderRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('eletricista')) {
      return (
        <div className="w-full h-full bg-yellow-900/30 flex items-center justify-center">
          <Zap className="w-16 h-16 text-yellow-400" />
        </div>
      );
    }
    return (
      <div className="w-full h-full bg-indigo-900/30 flex items-center justify-center">
        <Wrench className="w-16 h-16 text-indigo-400" />
      </div>
    );
  };
  
  const getStatusColor = (status: EmployeeStatus) => {
      switch (status) {
          case EmployeeStatus.AVAILABLE: return 'text-green-400';
          case EmployeeStatus.VACATION: return 'text-blue-400';
          case EmployeeStatus.DAY_OFF: return 'text-orange-400';
          case EmployeeStatus.EXTRA_WORK: return 'text-purple-400';
          case EmployeeStatus.EXTRA_OFF: return 'text-teal-400';
          default: return 'text-slate-400';
      }
  };

  const getStatusLabel = (status: EmployeeStatus) => {
      switch (status) {
          case EmployeeStatus.AVAILABLE: return 'Trabalhando';
          case EmployeeStatus.VACATION: return 'Férias';
          case EmployeeStatus.DAY_OFF: return 'De Folga';
          case EmployeeStatus.EXTRA_WORK: return 'Trabalho Extra';
          case EmployeeStatus.EXTRA_OFF: return 'Folga Extra';
          default: return status;
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white">
      <NavBar 
        title="Detalhes" 
        rightAction={
            <button>
                <Pencil className="w-5 h-5 text-white" />
            </button>
        }
      />

      {/* Profile Section */}
      <div className="flex flex-col items-center mt-6 mb-8">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#1e293b] mb-4 shadow-xl relative group">
          {renderRoleIcon(employee.role)}
        </div>
        <h2 className="text-2xl font-bold">{employee.name}</h2>
        <p className="text-slate-400">{employee.role}</p>
        <p className={`mt-3 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#1e293b] ${getStatusColor(currentStatus)}`}>
            {getStatusLabel(currentStatus)}
        </p>
      </div>

      {/* Toggle Segment */}
      <div className="px-4 mb-6">
        <div className="bg-[#1e293b] rounded-xl flex overflow-hidden p-1">
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'history' ? 'bg-[#2a384e] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Histórico (Escala)
          </button>
          <button 
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'data' ? 'bg-[#2a384e] text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            Dados
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 overflow-y-auto pb-20">
        
        {activeTab === 'history' && (
            <div className="space-y-4">
                 <h3 className="text-sm font-medium text-slate-400 px-1">Próxima Folga</h3>
                 {/* Next Day Off */}
                 <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/40 to-[#1e293b] rounded-xl border border-blue-800/50">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-900/50 rounded-lg flex items-center justify-center text-blue-400">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-white text-sm">{formatDate(schedule.next)}</h4>
                                {getRelativeLabel(schedule.next) && (
                                    <span className="text-[10px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded uppercase">
                                        {getRelativeLabel(schedule.next)}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-400 text-xs mt-0.5">Escala 5x1</p>
                        </div>
                    </div>
                </div>

                <h3 className="text-sm font-medium text-slate-400 px-1 mt-6">Folgas Recentes</h3>
                
                {/* Previous Day Off 1 */}
                <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-xl border border-slate-800 opacity-80">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-slate-500">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="font-medium text-slate-300 text-sm">{formatDate(schedule.previous[0])}</h4>
                                {getRelativeLabel(schedule.previous[0]) && (
                                    <span className="text-[10px] font-bold bg-orange-500 text-white px-1.5 py-0.5 rounded uppercase">
                                        {getRelativeLabel(schedule.previous[0])}
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 text-xs mt-0.5">Concluído</p>
                        </div>
                    </div>
                </div>

                {/* Previous Day Off 2 */}
                <div className="flex items-center justify-between p-4 bg-[#1e293b] rounded-xl border border-slate-800 opacity-60">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#0f172a] rounded-lg flex items-center justify-center text-slate-600">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-400 text-sm">{formatDate(schedule.previous[1])}</h4>
                            <p className="text-slate-600 text-xs mt-0.5">Concluído</p>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'data' && (
            <div className="space-y-4 animate-in fade-in zoom-in duration-300">
                 <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">Informações Pessoais</h3>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-pink-900/30 flex items-center justify-center">
                                <Cake className="w-5 h-5 text-pink-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Aniversário</p>
                                <p className="text-white font-medium">{employee.birthday}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                                <Briefcase className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Função</p>
                                <p className="text-white font-medium">{employee.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-400">Escala de Trabalho</p>
                                <p className="text-white font-medium">5x1 (Rotativo)</p>
                            </div>
                        </div>
                    </div>
                 </div>

                 {/* Vacation Section */}
                 <div className="bg-[#1e293b] rounded-xl p-5 border border-slate-800">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Férias</h3>
                        <button 
                            onClick={() => setShowVacationModal(true)}
                            className="text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                    
                    {empVacations.length === 0 ? (
                        <p className="text-slate-500 text-sm italic">Nenhuma férias programada.</p>
                    ) : (
                        <div className="space-y-3">
                            {empVacations.map((v, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-[#0f172a] rounded-lg border border-slate-800/50">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${v.type === 'leave' ? 'bg-indigo-900/30' : 'bg-blue-900/30'} flex items-center justify-center`}>
                                            <Calendar className={`w-4 h-4 ${v.type === 'leave' ? 'text-indigo-400' : 'text-blue-400'}`} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">
                                                {v.start.split('-').reverse().join('/')} - {v.end.split('-').reverse().join('/')}
                                            </p>
                                            <p className="text-[10px] text-slate-500 uppercase">
                                                {v.type === 'leave' ? 'Licença' : 'Férias'} • {Math.round((new Date(v.end + 'T00:00:00').getTime() - new Date(v.start + 'T00:00:00').getTime()) / (1000 * 3600 * 24)) + 1} dias
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleRemoveVacation(idx)}
                                        className="text-slate-600 hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                  </div>
            </div>
        )}

      </div>

      {/* Vacation Modal */}
      {showVacationModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-[#1e293b] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold">Programar Ausência</h3>
                      <button onClick={() => setShowVacationModal(false)} className="text-slate-400 hover:text-white">
                          <X className="w-6 h-6" />
                      </button>
                  </div>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Tipo</label>
                          <div className="grid grid-cols-2 gap-2 bg-[#0f172a] p-1 rounded-xl border border-slate-700">
                              <button 
                                onClick={() => setNewVacationType('vacation')}
                                className={`py-2 text-xs font-bold rounded-lg transition-all ${newVacationType === 'vacation' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
                              >
                                  Férias
                              </button>
                              <button 
                                onClick={() => setNewVacationType('leave')}
                                className={`py-2 text-xs font-bold rounded-lg transition-all ${newVacationType === 'leave' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
                              >
                                  Licença
                              </button>
                          </div>
                      </div>

                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Data de Início</label>
                          <input 
                            type="date" 
                            value={newVacationStart}
                            onChange={(e) => setNewVacationStart(e.target.value)}
                            className="w-full bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                          />
                      </div>
                      
                      <div>
                          <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5 ml-1">Quantidade de Dias</label>
                          <div className="flex items-center gap-3">
                              <input 
                                type="number" 
                                value={newVacationDays}
                                onChange={(e) => setNewVacationDays(e.target.value)}
                                min="1"
                                max="90"
                                className="flex-1 bg-[#0f172a] border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                              />
                              <div className="flex gap-2">
                                  {[15, 20, 30].map(d => (
                                      <button 
                                        key={d}
                                        onClick={() => setNewVacationDays(d.toString())}
                                        className={`px-3 py-3 rounded-xl border text-xs font-bold transition-all ${newVacationDays === d.toString() ? 'bg-blue-600 border-blue-500 text-white' : 'bg-[#0f172a] border-slate-700 text-slate-400'}`}
                                      >
                                          {d}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                      
                      <div className="pt-4">
                          <button 
                            onClick={handleAddVacation}
                            disabled={!newVacationStart}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all active:scale-95"
                          >
                              Confirmar Férias
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default EmployeeDetailsPage;