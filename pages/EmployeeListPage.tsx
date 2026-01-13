import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Zap, Wrench } from 'lucide-react';
import { Employee, EmployeeStatus, ScheduleOverride } from '../types';
import { BottomMenu } from '../components/BottomMenu';
import { loadOverrides } from '../services/storage';

interface ExtendedEmployee extends Employee {
  referenceDate: Date;
  vacations?: { start: Date; end: Date }[];
}

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [today] = useState(new Date());
  const [overrides, setOverrides] = useState<ScheduleOverride[]>([]);

  useEffect(() => {
    const fetch = async () => {
        const data = await loadOverrides();
        setOverrides(data);
    };
    fetch();
  }, []);

  const employeesConfig: ExtendedEmployee[] = [
    { id: '1', name: 'Adriano Pinto', role: 'Eletricista Senior', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 3) },
    { id: '2', name: 'Alan Pereira', role: 'Mecânico de Manutenção', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 6) },
    { id: '3', name: 'Antonio Marcos', role: 'Eletricista', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 2) },
    { id: '4', name: 'Valci Jacinto', role: 'Líder Mecânico', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 1) },
    { id: '5', name: 'Manuel Gonçalves', role: 'Mecânico Auxiliar', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 5), vacations: [{ start: new Date(2025, 11, 22), end: new Date(2026, 0, 10) }] },
    { id: '6', name: 'Mário de Souza', role: 'Mecânico Industrial', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 4) },
    { id: '7', name: 'Mauro Luiz', role: 'Técnico Eletricista', avatar: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=150&h=150&fit=crop', status: EmployeeStatus.AVAILABLE, referenceDate: new Date(2025, 11, 1) }
  ];

  const getCalculatedStatus = (emp: ExtendedEmployee): EmployeeStatus => {
    const checkDate = new Date(today);
    checkDate.setHours(0,0,0,0);
    const dateStr = checkDate.toISOString().split('T')[0];
    const override = overrides.find(o => o.date === dateStr && o.employeeName === emp.name);
    if (override) {
        if (override.type === 'emergency_work') return EmployeeStatus.EXTRA_WORK;
        if (override.type === 'extra_day_off') return EmployeeStatus.EXTRA_OFF;
    }
    if (emp.vacations) {
      const isOnVacation = emp.vacations.some(v => {
        const start = new Date(v.start).setHours(0,0,0,0);
        const end = new Date(v.end).setHours(0,0,0,0);
        return checkDate.getTime() >= start && checkDate.getTime() <= end;
      });
      if (isOnVacation) return EmployeeStatus.VACATION;
    }
    const ref = new Date(emp.referenceDate);
    ref.setHours(0,0,0,0);
    const diffDays = Math.round((checkDate.getTime() - ref.getTime()) / (1000 * 3600 * 24));
    if ((((diffDays % 6) + 6) % 6) === 0) return EmployeeStatus.DAY_OFF;
    return EmployeeStatus.AVAILABLE;
  };

  const filteredEmployees = employeesConfig.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusDot = (status: EmployeeStatus) => {
     switch (status) {
      case EmployeeStatus.AVAILABLE: return 'bg-green-400';
      case EmployeeStatus.VACATION: return 'bg-blue-400';
      case EmployeeStatus.DAY_OFF: return 'bg-orange-400';
      case EmployeeStatus.EXTRA_WORK: return 'bg-purple-500';
      case EmployeeStatus.EXTRA_OFF: return 'bg-teal-400';
      default: return 'bg-gray-400';
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white relative">
        <div className="flex items-center justify-between px-6 py-8 bg-[#0f172a] sticky top-0 z-30">
           <div>
             <h1 className="text-3xl font-bold text-white">Equipe Técnica</h1>
             <p className="text-slate-400 text-sm mt-1">Status em tempo real</p>
           </div>
           <button onClick={() => navigate('/request')} className="bg-blue-600 p-3 rounded-xl hover:bg-blue-700 transition-all shadow-lg"><Plus className="w-6 h-6 text-white" /></button>
        </div>
      <div className="px-6 mb-6">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-blue-500 transition-colors" />
          <input type="text" placeholder="Nome ou cargo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-[#1e293b] text-white pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-800 placeholder-slate-500 transition-all" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-3">
        {filteredEmployees.map((emp) => {
          const currentStatus = getCalculatedStatus(emp);
          return (
            <div key={emp.id} onClick={() => navigate(`/employee/${emp.id}`)} className="flex items-center justify-between p-4 rounded-2xl bg-[#1e293b]/40 border border-transparent hover:border-slate-700 hover:bg-[#1e293b] transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-700 shadow-md">
                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-[#1e293b] ${getStatusDot(currentStatus)}`}></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 group-hover:text-white">{emp.name}</h3>
                  <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{emp.role}</p>
                </div>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest ${currentStatus === EmployeeStatus.AVAILABLE ? 'bg-green-500/10 text-green-400' : currentStatus === EmployeeStatus.DAY_OFF ? 'bg-orange-500/10 text-orange-400' : currentStatus === EmployeeStatus.VACATION ? 'bg-blue-500/10 text-blue-400' : currentStatus === EmployeeStatus.EXTRA_WORK ? 'bg-purple-500/10 text-purple-400' : 'bg-teal-500/10 text-teal-400'}`}>{currentStatus}</div>
            </div>
          );
        })}
      </div>
      <BottomMenu />
    </div>
  );
};

export default EmployeeListPage;