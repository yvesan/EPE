
import { User, DrawLog, InventoryItem, Prize, PrizeType } from '../types';
import { COST_PER_DRAW, PRIZE_POOL } from '../constants';

const KEYS = {
  USER: 'epe_user',
  LOGS: 'epe_logs',
  POINTS_DB: 'epe_points_db',
  CUSTOM_LOGO: 'epe_custom_logo',
  CLOUD_ID: 'epe_cloud_sync_id' // 新增：用于存储云端 JSON 库 ID
};

// --- Cloud Sync Helpers ---
// 使用 npoint.io 作为一个简单的免费 JSON 存储方案，无需后端即可实现同步
const CLOUD_API_BASE = 'https://api.npoint.io/';

export const setCloudId = (id: string) => localStorage.setItem(KEYS.CLOUD_ID, id);
export const getCloudId = () => localStorage.getItem(KEYS.CLOUD_ID);

// 新增：申请一个新的云端 ID
export const createCloudBin = async (): Promise<string | null> => {
    try {
        const initialData = {
            pointsDB: {},
            logs: [],
            customLogo: null,
            updatedAt: Date.now(),
            readme: "Created by EPE Card Pack App"
        };
        
        // 修复：添加 Content-Type 头，否则 npoint 可能返回 HTML 错误页
        const response = await fetch(CLOUD_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(initialData)
        });
        
        if (!response.ok) {
            console.error("Failed to create bin, status:", response.status);
            return null;
        }

        const data = await response.json();
        // npoint returns { "id": "..." }
        if (data && data.id) {
            return data.id;
        }
        return null;
    } catch (e) {
        console.error("Failed to create cloud bin", e);
        return null;
    }
};

export const syncFromCloud = async (): Promise<boolean> => {
    const cloudId = getCloudId();
    if (!cloudId) return false;
    try {
        const response = await fetch(`${CLOUD_API_BASE}${cloudId}`);
        // 修复：必须检查 response.ok，否则 404 页面会导致 json 解析失败
        if (!response.ok) {
            console.warn("Cloud ID not found or network error");
            return false;
        }

        const cloudData = await response.json();
        
        // 简单的验证，确保数据格式正确
        if (typeof cloudData !== 'object') return false;

        if (cloudData.pointsDB) localStorage.setItem(KEYS.POINTS_DB, JSON.stringify(cloudData.pointsDB));
        if (cloudData.logs) localStorage.setItem(KEYS.LOGS, JSON.stringify(cloudData.logs));
        if (cloudData.customLogo) localStorage.setItem(KEYS.CUSTOM_LOGO, cloudData.customLogo);
        
        return true;
    } catch (e) {
        console.error("Cloud pull failed", e);
        return false;
    }
};

export const pushToCloud = async (): Promise<boolean> => {
    const cloudId = getCloudId();
    if (!cloudId) return false;
    try {
        const data = {
            pointsDB: getPointsDB(),
            logs: getLogs(),
            customLogo: localStorage.getItem(KEYS.CUSTOM_LOGO),
            updatedAt: Date.now()
        };
        const response = await fetch(`${CLOUD_API_BASE}${cloudId}`, {
            method: 'POST', // npoint uses POST to update specific bin
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        return response.ok;
    } catch (e) {
        console.error("Cloud push failed", e);
        return false;
    }
};

// --- Points Database Management ---

export const getPointsDB = (): Record<string, number> => {
    const data = localStorage.getItem(KEYS.POINTS_DB);
    return data ? JSON.parse(data) : {};
};

const savePointsDB = (db: Record<string, number>) => {
    localStorage.setItem(KEYS.POINTS_DB, JSON.stringify(db));
};

export const importPointsData = async (data: {name: string, points: number}[]) => {
    const db = getPointsDB();
    data.forEach(item => {
        const cleanName = item.name.trim();
        if (cleanName) {
            db[cleanName] = Number(item.points);
        }
    });
    savePointsDB(db);
    
    // 导入后自动尝试同步到云端
    await pushToCloud();
    
    const currentUser = getUser();
    if (currentUser && db[currentUser.name] !== undefined) {
        currentUser.points = db[currentUser.name];
        localStorage.setItem(KEYS.USER, JSON.stringify(currentUser));
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

export const getLogs = (): DrawLog[] => {
  const data = localStorage.getItem(KEYS.LOGS);
  return data ? JSON.parse(data) : [];
};

export const redeemLog = async (logId: string): Promise<DrawLog[]> => {
  const logs = getLogs();
  const index = logs.findIndex(l => l.id === logId);
  if (index !== -1) {
    logs[index].redeemedAt = Date.now();
    localStorage.setItem(KEYS.LOGS, JSON.stringify(logs));
    await pushToCloud(); // 核销后也同步云端
  }
  return logs;
};

export const performDraw = async (user: User): Promise<{ result: Prize, updatedUser: User } | null> => {
  if (user.points < COST_PER_DRAW) return null;

  // 抽奖前先尝试静默拉取一次最新积分，防止积分被管理员更新后不一致
  await syncFromCloud();
  const freshDB = getPointsDB();
  const freshPoints = freshDB[user.name] ?? user.points;
  
  if (freshPoints < COST_PER_DRAW) return null;

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

  const updatedUser = { ...user, points: freshPoints };
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
  }

  localStorage.setItem(KEYS.USER, JSON.stringify(updatedUser));
  
  // 更新数据库
  const db = getPointsDB();
  db[updatedUser.name] = updatedUser.points;
  savePointsDB(db);

  // 记录日志
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

  // 核心：抽奖完立即推送云端，确保所有人可见
  await pushToCloud();

  return { result: selectedPrize, updatedUser };
};

export const resetSystem = () => {
    localStorage.clear();
    window.location.reload();
}
