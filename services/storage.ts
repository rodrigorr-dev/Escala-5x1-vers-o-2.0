import { ScheduleOverride } from '../types';

// INSTRUCTIONS FOR CLOUD SYNC:
// 1. Go to https://jsonbin.io and create a free account.
// 2. Create a new Bin with contents: [] (empty array)
// 3. Copy the Bin ID (e.g., 6578...) and Master Key (e.g., $2a$10...).
// 4. Replace the values below to enable cloud sync for all users.

const BIN_ID = 'YOUR_BIN_ID_HERE'; 
const API_KEY = 'YOUR_MASTER_KEY_HERE'; 

const LOCAL_STORAGE_KEY = 'hr_flow_overrides';
const VACATIONS_KEY = 'hr_flow_vacations';

export interface TimeOffRecord {
  start: string;
  end: string;
  type: 'vacation' | 'leave' | 'day_off';
}

export interface EmployeeTimeOff {
  employeeId: string;
  vacations: TimeOffRecord[];
}

export const isDateInRange = (targetDate: Date, startDateStr: string, endDateStr: string) => {
  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);
  const tTime = target.getTime();
  
  // Helper to parse date string as local midnight
  const parseLocal = (dateStr: string) => {
    // Extract YYYY-MM-DD part to ensure we always treat it as local date
    const justDate = dateStr.split('T')[0];
    const d = new Date(justDate + 'T00:00:00');
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const s = parseLocal(startDateStr);
  const e = parseLocal(endDateStr);
  
  return tTime >= s.getTime() && tTime <= e.getTime();
};

export const loadVacations = async (): Promise<EmployeeTimeOff[]> => {
  const local = localStorage.getItem(VACATIONS_KEY);
  return local ? JSON.parse(local) : [];
};

export const saveVacations = async (vacations: EmployeeTimeOff[]) => {
  localStorage.setItem(VACATIONS_KEY, JSON.stringify(vacations));
};

export const loadOverrides = async (): Promise<ScheduleOverride[]> => {
  // Always load from local storage first for immediate UI render
  const local = localStorage.getItem(LOCAL_STORAGE_KEY);
  let data: ScheduleOverride[] = local ? JSON.parse(local) : [];

  // If credentials are default, stick to local storage
  if (BIN_ID === 'YOUR_BIN_ID_HERE') {
    console.warn('JSONBin not configured. Using LocalStorage only.');
    return data;
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}/latest`, {
      headers: {
        'X-Master-Key': API_KEY
      }
    });
    
    if (response.ok) {
      const json = await response.json();
      // JSONBin v3 returns data in 'record' field
      if (Array.isArray(json.record)) {
          data = json.record;
          // Update local storage to match cloud
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      }
    }
  } catch (error) {
    console.error('Error loading from cloud:', error);
  }
  
  return data;
};

export const saveOverrides = async (overrides: ScheduleOverride[]) => {
  // Optimistic update: save locally immediately
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides));

  if (BIN_ID === 'YOUR_BIN_ID_HERE') return;

  try {
    await fetch(`https://api.jsonbin.io/v3/b/${BIN_ID}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': API_KEY
      },
      body: JSON.stringify(overrides)
    });
  } catch (error) {
    console.error('Error saving to cloud:', error);
  }
};
