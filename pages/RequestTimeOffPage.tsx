import React, { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Calendar, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RequestTimeOffPage: React.FC = () => {
  const navigate = useNavigate();

  const employeeNames = [
      'Adriano Pinto',
      'Alan Pereira',
      'Antonio Marcos',
      'Valci Jacinto',
      'Manuel Gonçalves',
      'Mário de Souza',
      'Mauro Luiz'
  ];

  const [employee, setEmployee] = useState(employeeNames[0]);
  const [type, setType] = useState('Férias');
  // Updated default dates to 2025
  const [startDate, setStartDate] = useState('2025-02-10');
  const [endDate, setEndDate] = useState('2025-02-24');
  const [totalDays, setTotalDays] = useState(0);

  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
      setTotalDays(diffDays > 0 ? diffDays : 0);
    }
  }, [startDate, endDate]);

  const handleSubmit = () => {
    // Logic to submit
    console.log({ employee, type, startDate, endDate });
    navigate('/calendar');
  };

  return (
    <div className="flex flex-col h-full bg-[#0f172a] text-white">
      <NavBar 
        title="Solicitar Folga" 
        onBack={() => navigate('/calendar')}
        rightAction={<div className="w-6"></div>}
      />

      <div className="flex-1 px-4 pt-4 space-y-6">
        
        {/* Employee Select */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm">Funcionário</label>
          <div className="relative">
            <select
              value={employee}
              onChange={(e) => setEmployee(e.target.value)}
              className="w-full bg-[#1e293b] text-white px-4 py-3.5 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-700"
            >
              {employeeNames.map(name => (
                  <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <ChevronsUpDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
          </div>
        </div>

        {/* Request Type */}
        <div className="space-y-2">
          <label className="text-slate-400 text-sm">Tipo de Solicitação</label>
          <div className="grid grid-cols-3 gap-0 bg-[#1e293b] rounded-xl p-1 border border-slate-700">
            {['Férias', 'Folga', 'Licença'].map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`py-2 text-sm font-medium rounded-lg transition-all ${
                  type === t 
                    ? 'bg-[#2a384e] text-white shadow-sm' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dates Row */}
        <div className="space-y-2">
             <label className="text-slate-400 text-sm">Período</label>
            <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
                <span className="text-xs text-slate-500">Data de Início</span>
                <div className="relative">
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-[#1e293b] text-white pl-10 pr-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-700 text-sm"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
            </div>

            <div className="space-y-1">
                <span className="text-xs text-slate-500">Data de Fim</span>
                <div className="relative">
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-[#1e293b] text-white pl-10 pr-3 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 border border-slate-700 text-sm"
                />
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                </div>
            </div>
            </div>
        </div>

        {/* Total Days */}
        <div className="bg-[#1e293b] p-4 rounded-xl flex justify-between items-center border border-slate-700">
          <span className="text-white font-medium">Total de dias</span>
          <span className="text-white font-bold text-lg">{totalDays} dias</span>
        </div>

      </div>

      {/* Submit Button */}
      <div className="p-6 bg-[#0f172a] mt-auto">
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98] transform"
        >
          Enviar Solicitação
        </button>
      </div>
    </div>
  );
};

export default RequestTimeOffPage;