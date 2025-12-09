import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users } from 'lucide-react';

export const BottomMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="absolute bottom-0 left-0 w-full bg-[#1e293b] border-t border-slate-800 flex justify-around items-center h-16 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <button
        onClick={() => navigate('/calendar')}
        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
          isActive('/calendar') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-xs font-medium">Calendário</span>
      </button>

      <button
        onClick={() => navigate('/employees')}
        className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
          isActive('/employees') ? 'text-blue-500' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-xs font-medium">Equipe</span>
      </button>
    </div>
  );
};
