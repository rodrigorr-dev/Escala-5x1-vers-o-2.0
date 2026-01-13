import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

interface NavBarProps {
  title: string;
  rightAction?: React.ReactNode;
  onBack?: () => void;
  showBack?: boolean;
}

export const NavBar: React.FC<NavBarProps> = ({ title, rightAction, onBack, showBack = true }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      // Se não houver histórico anterior seguro, volta para o calendário
      if (window.history.length <= 1) {
        navigate('/calendar');
      } else {
        navigate(-1);
      }
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-5 bg-[#0f172a] sticky top-0 z-50 shadow-sm shadow-[#1e293b]/20 transition-colors duration-300">
      <div className="flex items-center w-10">
        {showBack && (
          <button onClick={handleBack} className="p-2 -ml-2 hover:bg-slate-800 rounded-full transition-colors group">
            <ChevronLeft className="w-6 h-6 text-white group-active:scale-90 transition-transform" />
          </button>
        )}
      </div>
      <h1 className="text-xl font-bold text-white absolute left-1/2 transform -translate-x-1/2 whitespace-nowrap">
        {title}
      </h1>
      <div className="flex items-center justify-end w-10">
        {rightAction}
      </div>
    </div>
  );
};