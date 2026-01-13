import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sun, Moon } from 'lucide-react';
import CalendarPage from './pages/CalendarPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';
import RequestTimeOffPage from './pages/RequestTimeOffPage';
import PrintableCalendarPage from './pages/PrintableCalendarPage';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen flex justify-center bg-[#020617] text-slate-50 transition-colors duration-300">
      <div className="w-full max-w-full md:max-w-4xl bg-[#0f172a] min-h-screen relative shadow-2xl overflow-hidden flex flex-col print:overflow-visible">
        {/* Botão de Tema - Posicionado no canto inferior esquerdo para não atrapalhar a navegação */}
        <button 
          onClick={() => setIsDark(!isDark)}
          className="fixed bottom-24 left-4 z-[60] p-3 rounded-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-all border border-blue-500/30 backdrop-blur-md no-print shadow-lg active:scale-90"
          title={isDark ? "Mudar para Tema Claro" : "Mudar para Tema Escuro"}
        >
          {isDark ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
        </button>
        
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/employees" element={<EmployeeListPage />} />
          <Route path="/employee/:id" element={<EmployeeDetailsPage />} />
          <Route path="/request" element={<RequestTimeOffPage />} />
          <Route path="/print" element={<PrintableCalendarPage />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;