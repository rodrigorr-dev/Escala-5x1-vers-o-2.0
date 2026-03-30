import React, { useState, useEffect } from 'react';
import { NavBar } from '../components/NavBar';
import { Calendar, ChevronsUpDown, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadVacations, saveVacations, TimeOffRecord } from '../services/storage';

const RequestTimeOffPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const employeeMapping: { [key: string]: string } = {
      'Adriano Pinto': '1',
      'Alan Pereira': '2',
      'Antonio Marcos': '3',
      'Valci Jacinto': '4',
      'Manuel Gonçalves': '5',
      'Mário de Souza': '6',
      'Mauro Luiz': '7'
  };

  const employeeNames = Object.keys(employeeMapping);

  const [employee, setEmployee] = useState(employeeNames[0]);
  const [type, setType] = useState('Férias');
  // Updated default dates to 2026
  const [startDate, setStartDate] = useState('2026-03-30');
  const [endDate, setEndDate] = useState('2026-04-13');
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

  const handleSubmit = async () => {
    const employeeId = employeeMapping[employee];
    if (!employeeId) return;

    const allTimeOff = await loadVacations();
    const updatedAllTimeOff = [...allTimeOff];
    const empIdx = updatedAllTimeOff.findIndex(v => v.employeeId === employeeId);

    const newRecord: TimeOffRecord = {
        start: startDate,
        end: endDate,
        type: type === 'Férias' ? 'vacation' : type === 'Licença' ? 'leave' : 'day_off'
    };

    if (empIdx >= 0) {
        updatedAllTimeOff[empIdx].vacations.push(newRecord);
    } else {
        updatedAllTimeOff.push({
            employeeId,
            vacations: [newRecord]
        });
    }

    await saveVacations(updatedAllTimeOff);
    setIsSubmitted(true);
    setTimeout(() => {
        navigate('/calendar');
    }, 2000);
  };

  if (isSubmitted) {
      return (
          <div className="flex flex-col items-center justify-center h-full bg-[#0f172a] text-white p-6 text-center">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Solicitação Enviada!</h2>
              <p className="text-slate-400">Sua solicitação de {type.toLowerCase()} foi registrada com sucesso.</p>
              <p className="text-slate-500 text-sm mt-8">Redirecionando para o calendário...</p>
          </div>
      );
  }

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