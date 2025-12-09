import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Zap, Wrench } from 'lucide-react';
import { Employee, EmployeeStatus } from '../types';
import { BottomMenu } from '../components/BottomMenu';

interface ExtendedEmployee extends Employee {
  referenceDate: Date; // 5x1 base date
  vacations?: { start: Date; end: Date }[];
}

const EmployeeListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  // We use a state for "today" to ensure hydration consistency, though new Date() works directly too
  const [today] = useState(new Date());

  // Configuration matched with CalendarPage to ensure consistency
  const employeesConfig: ExtendedEmployee[] = [
    {
      id: '1',
      name: 'Adriano Pinto',
      role: 'Eletricista',
      avatar: '', // Unused
      status: EmployeeStatus.AVAILABLE, // Default, will be overwritten by calc
      referenceDate: new Date(2025, 11, 3) // 03/12/2025
    },
    {
      id: '2',
      name: 'Alan Pereira',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 6) // 06/12/2025
    },
    {
      id: '3',
      name: 'Antonio Marcos',
      role: 'Eletricista',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 2) // 02/12/2025
    },
    {
      id: '4',
      name: 'Valci Jacinto',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 1) // 01/12/2025
    },
    {
      id: '5',
      name: 'Manuel Gonçalves',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 5), // 05/12/2025
      vacations: [
        { start: new Date(2025, 11, 22), end: new Date(2026, 0, 10) }
      ]
    },
    {
      id: '6',
      name: 'Mário de Souza',
      role: 'Mecânico',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 4) // 04/12/2025
    },
    {
      id: '7',
      name: 'Mauro Luiz',
      role: 'Eletricista',
      avatar: '',
      status: EmployeeStatus.AVAILABLE,
      referenceDate: new Date(2025, 11, 1) // 01/12/2025
    }
  ];

  // Logic to determine current status
  const getCalculatedStatus = (emp: ExtendedEmployee): EmployeeStatus => {
    const checkDate = new Date(today);
    checkDate.setHours(0,0,0,0);

    // 1. Check Vacation
    if (emp.vacations) {
      const isOnVacation = emp.vacations.some(v => {
        const start = new Date(v.start).setHours(0,0,0,0);
        const end = new Date(v.end).setHours(0,0,0,0);
        return checkDate.getTime() >= start && checkDate.getTime() <= end;
      });
      if (isOnVacation) return EmployeeStatus.VACATION;
    }

    // 2. Check 5x1 Day Off
    const ref = new Date(emp.referenceDate);
    ref.setHours(0,0,0,0);
    
    const diffTime = checkDate.getTime() - ref.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    
    // Modulo logic for 6 day cycle
    const cyclePos = ((diffDays % 6) + 6) % 6;
    
    if (cyclePos === 0) {
      return EmployeeStatus.DAY_OFF;
    }

    // 3. Otherwise Available (Working)
    return EmployeeStatus.AVAILABLE;
  };

  const filteredEmployees = employeesConfig.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusDot = (status: EmployeeStatus) => {
     switch (status) {
      case EmployeeStatus.AVAILABLE: return 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]';
      case EmployeeStatus.VACATION: return 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]';
      case EmployeeStatus.DAY_OFF: return 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]';
      default: return 'bg-gray-400';
    }
  }

  const getStatusText = (status: EmployeeStatus) => {
    switch (status) {
      case EmployeeStatus.AVAILABLE: return 'Trabalhando'; // More intuitive than "Disponível" for 5x1
      case EmployeeStatus.VACATION: return 'Férias';
      case EmployeeStatus.DAY_OFF: return 'Folga';
      default: return status;
    }
  }

  const renderRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('eletricista')) {
      return (
        <div className="w-14 h-14 rounded-full bg-yellow-900/30 flex items-center justify-center border border-yellow-700/50 group-hover:border-yellow-500 transition-colors">
          <Zap className="w-7 h-7 text-yellow-400" />
        </div>
      );
    }
    return (
      <div className="w-14 h-14 rounded-full bg-indigo-900/30 flex items-center justify-center border border-indigo-700/50 group-hover:border-indigo-500 transition-colors">
        <Wrench className="w-7 h-7 text-indigo-400" />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white relative">
        <div className="flex items-center justify-between px-4 py-6 bg-[#0f172a] sticky top-0 z-30">
           <h1 className="text-3xl font-bold text-white">Funcionários</h1>
           <button 
             onClick={() => navigate('/request')}
             className="bg-blue-600 p-1 rounded-full hover:bg-blue-700 transition-colors"
           >
             <Plus className="w-5 h-5 text-white" />
           </button>
        </div>

      {/* Search Bar */}
      <div className="px-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar funcionário..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1e293b] text-white pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-4">
        {filteredEmployees.map((emp) => {
          const currentStatus = getCalculatedStatus(emp);
          
          return (
            <div
              key={emp.id}
              onClick={() => navigate(`/employee/${emp.id}`)}
              className="flex items-center justify-between p-2 rounded-xl active:bg-[#1e293b] transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  {renderRoleIcon(emp.role)}
                  {/* Status Indicator on Icon Container */}
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0f172a] ${getStatusDot(currentStatus)}`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{emp.name}</h3>
                  <p className="text-slate-400 text-sm">{emp.role}</p>
                </div>
              </div>

              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e293b]`}>
                  <span className={`text-xs font-bold uppercase tracking-wide ${
                      currentStatus === EmployeeStatus.AVAILABLE ? 'text-green-400' :
                      currentStatus === EmployeeStatus.DAY_OFF ? 'text-orange-400' :
                      currentStatus === EmployeeStatus.VACATION ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                      {getStatusText(currentStatus)}
                  </span>
              </div>
            </div>
          );
        })}
      </div>

      <BottomMenu />
    </div>
  );
};

export default EmployeeListPage;