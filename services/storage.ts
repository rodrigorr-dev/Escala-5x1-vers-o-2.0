import { ScheduleOverride } from '../types';

// INSTRUCTIONS FOR CLOUD SYNC:
// 1. Go to https://jsonbin.io and create a free account.
// 2. Create a new Bin with contents: [] (empty array)
// 3. Copy the Bin ID (e.g., 6578...) and Master Key (e.g., $2a$10...).
// 4. Replace the values below to enable cloud sync for all users.

const BIN_ID = 'YOUR_BIN_ID_HERE'; 
const API_KEY = 'YOUR_MASTER_KEY_HERE'; 

const LOCAL_STORAGE_KEY = 'hr_flow_overrides';

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
