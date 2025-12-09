import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import CalendarPage from './pages/CalendarPage';
import EmployeeListPage from './pages/EmployeeListPage';
import EmployeeDetailsPage from './pages/EmployeeDetailsPage';
import RequestTimeOffPage from './pages/RequestTimeOffPage';

// Simple Layout Wrapper to center on desktop and simulate mobile view
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen flex justify-center bg-black/20">
      <div className="w-full max-w-md bg-[#0f172a] min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
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
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;