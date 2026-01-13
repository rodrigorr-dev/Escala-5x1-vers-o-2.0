export enum EmployeeStatus {
  AVAILABLE = 'Disponível',
  VACATION = 'De Férias',
  DAY_OFF = 'De Folga',
  LEAVE = 'Licença',
  EXTRA_WORK = 'Trabalho Extra',
  EXTRA_OFF = 'Folga Extra'
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  avatar: string;
  status: EmployeeStatus;
}

export interface LeaveRequest {
  id: string;
  type: 'Férias' | 'Folga' | 'Outros';
  startDate: string; // ISO Date
  endDate?: string;
  status: 'approved' | 'pending' | 'rejected';
}

export enum CalendarViewType {
  MONTH = 'Mês',
  WEEK = 'Semana'
}

export interface CalendarEvent {
  date: number; // Day of month
  type: 'Férias' | 'Folga' | 'Outros';
  employeeName?: string;
  isStart?: boolean;
  span?: number;
}

export interface ScheduleOverride {
  id: string; // unique ID for deletion/management
  date: string; // ISO string YYYY-MM-DD
  employeeName: string;
  type: 'emergency_work' | 'extra_day_off';
  note?: string;
}