
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
            // 策略：覆盖更新积分，但不影响其他数据
            db[cleanName] = Number(item.points);
        }
    });
    savePointsDB(db);
    
    // 同步当前登录用户（如果有）
    const currentUser = getUser();
    if (currentUser && db[currentUser.name] !== undefined) {
        currentUser.points = db[currentUser.name];
        localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
    }
};

// --- Full System Sync (For Cross-Device Support) ---

export const exportFullSystemData = () => {
    const data = {
        pointsDB: getPointsDB(),
        logs: getLogs(),
        customLogo: localStorage.getItem(KEYS.CUSTOM_LOGO),
        version: '1.0',
        exportTime: Date.now()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EPE_系统数据全备份_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importFullSystemData = (jsonString: string): boolean => {
    try {
        const data = JSON.parse(jsonString);
        if (!data.pointsDB || !data.logs) throw new Error("无效的备份文件");
        
        localStorage.setItem(KEYS.POINTS_DB, JSON.stringify(data.pointsDB));
        localStorage.setItem(KEYS.LOGS, JSON.stringify(data.logs));
        if (data.customLogo) localStorage.setItem(KEYS.CUSTOM_LOGO, data.customLogo);
        
        return true;
    } catch (e) {
        console.error("Restore failed", e);
        return false;
    }
};

// --- User Management ---

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

  if (!selectedPrize) selectedPrize = PRIZE_POOL[0];

  const updatedUser = { ...user };
  updatedUser.points -= COST_PER_DRAW;

  if (selectedPrize.type === PrizeType.POINT) {
    updatedUser.points += selectedPrize.value;
  }
  
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

  localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));
  
  const db = getPointsDB();
  db[updatedUser.name] = updatedUser.points;
  savePointsDB(db);

  const newLog: DrawLog = {
    id: Date.now().toString(),
    userName: user.name,
    prizeName: selectedPrize.name,
    prizeType: selectedPrize.type,
    timestamp: Date.now()
  };
  
  const currentLogs = getLogs();
  currentLogs.unshift(newLog);
  localStorage.setItem(KEYS.LOGS, JSON.stringify(currentLogs));

  return { result: selectedPrize, updatedUser };
};

export const resetSystem = () => {
    localStorage.clear();
    window.location.reload();
}
