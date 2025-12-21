
import { User, DrawLog, InventoryItem, Prize, PrizeType } from '../types';
import { COST_PER_DRAW, PRIZE_POOL } from '../constants';

const KEYS = {
  USER: 'epe_user',
  LOGS: 'epe_logs',
  POINTS_DB: 'epe_points_db', // { "Name": Points }
  CUSTOM_LOGO: 'epe_custom_logo'
};

// --- Points Database Management ---

export const getPointsDB = (): Record<string, number> => {
    const data = localStorage.getItem(KEYS.POINTS_DB);
    return data ? JSON.parse(data) : {};
};

const savePointsDB = (db: Record<string, number>) => {
    localStorage.setItem(KEYS.POINTS_DB, JSON.stringify(db));
};

export const importPointsData = (data: {name: string, points: number}[]) => {
    const db = getPointsDB();
    data.forEach(item => {
        // Normalize name: trim whitespace
        const cleanName = item.name.trim();
        if (cleanName) {
            db[cleanName] = Number(item.points);
        }
    });
    savePointsDB(db);
    
    // Also update current logged in user if applicable
    const currentUser = getUser();
    if (currentUser && db[currentUser.name] !== undefined) {
        currentUser.points = db[currentUser.name];
        localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
    }
};

// --- User Management ---

// Initial state for a new user
export const initializeUser = (name: string): User => {
  const pointsDB = getPointsDB();
  const initialPoints = pointsDB[name] || 0;

  const newUser: User = {
    name,
    points: initialPoints,
    inventory: [],
    fragments: {}
  };
  localStorage.setItem(KEYS.USER, JSON.stringify(newUser));
  return newUser;
};

export const getUser = (): User | null => {
  const data = localStorage.getItem(KEYS.USER);
  if (!data) return null;
  
  const user = JSON.parse(data);
  // Always sync points with DB on get to ensure consistency
  const pointsDB = getPointsDB();
  if (pointsDB[user.name] !== undefined) {
      user.points = pointsDB[user.name];
  }
  return user;
};

export const saveCustomLogo = (base64Data: string) => {
    localStorage.setItem(KEYS.CUSTOM_LOGO, base64Data);
}

export const getCustomLogo = (): string | null => {
    return localStorage.getItem(KEYS.CUSTOM_LOGO);
}

export const getLogs = (): DrawLog[] => {
  const data = localStorage.getItem(KEYS.LOGS);
  return data ? JSON.parse(data) : [];
};

export const redeemLog = (logId: string): DrawLog[] => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].redeemedAt = Date.now();
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
  }
  return logs;
};

export const performDraw = (user: User): { result: Prize, updatedUser: User } | null => {
  if (user.points < COST_PER_DRAW) return null;

  // 1. Determine Prize
  const rand = Math.random() * 100;
  let cumulative = 0;
  let selectedPrize: Prize | undefined;

  for (const prize of PRIZE_POOL) {
    cumulative += prize.probability;
    if (rand <= cumulative) {
      selectedPrize = prize;
      break;
    }
  }

  if (!selectedPrize) selectedPrize = PRIZE_POOL[0]; // Fallback

  // 2. Update User State
  const updatedUser = { ...user };
  updatedUser.points -= COST_PER_DRAW;

  // Handle immediate rewards
  if (selectedPrize.type === PrizeType.POINT) {
    updatedUser.points += selectedPrize.value;
  }
  
  // Handle inventory & fragments
  if (selectedPrize.type !== PrizeType.EMPTY && selectedPrize.type !== PrizeType.POINT) {
     const newItem: InventoryItem = {
         prizeId: selectedPrize.id,
         prizeName: selectedPrize.name,
         obtainedAt: Date.now(),
         isRedeemed: false
     };
     updatedUser.inventory.push(newItem);

     if (selectedPrize.type === PrizeType.FRAGMENT && selectedPrize.fragmentId) {
         updatedUser.fragments[selectedPrize.fragmentId] = (updatedUser.fragments[selectedPrize.fragmentId] || 0) + 1;
     }
  }

  // 3. Save User
  localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));
  
  // 4. Update Central Points DB
  const db = getPointsDB();
  db[updatedUser.name] = updatedUser.points;
  savePointsDB(db);

  // 5. Create Log
  const newLog: DrawLog = {
    id: Date.now().toString(),
    userName: user.name,
    prizeName: selectedPrize.name,
    prizeType: selectedPrize.type,
    timestamp: Date.now()
  };
  
  const currentLogs = getLogs();
  currentLogs.unshift(newLog); // Add to top
  localStorage.setItem(KEYS.LOGS, JSON.stringify(currentLogs));

  return { result: selectedPrize, updatedUser };
};

export const resetSystem = () => {
    localStorage.clear();
    window.location.reload();
}
