
import { User, DrawLog, InventoryItem, Prize, PrizeType } from '../types';
import { COST_PER_DRAW, PRIZE_POOL } from '../constants';

const KEYS = {
  USER: 'epe_user',
  LOGS: 'epe_logs',
  POINTS_DB: 'epe_points_db',
  CUSTOM_LOGO: 'epe_custom_logo',
  CLOUD_ID: 'epe_cloud_sync_id'
};

// --- Cloud Sync Helpers ---
// 切换到 JSONBlob，它支持匿名 PUT 更新，且我们添加了防缓存机制
// JSONBlob 的 API 格式为 https://jsonblob.com/api/jsonBlob/<ID>
const CLOUD_API_BASE = 'https://jsonblob.com/api/jsonBlob';

export const setCloudId = (id: string) => localStorage.setItem(KEYS.CLOUD_ID, id);
export const getCloudId = () => localStorage.getItem(KEYS.CLOUD_ID);

// 辅助函数：带超时的 fetch，防止网络卡死
const fetchWithTimeout = async (resource: string, options: RequestInit = {}) => {
  const { timeout = 8000 } = options as any;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
      const response = await fetch(resource, {
        ...options,
        signal: controller.signal  
      });
      clearTimeout(id);
      return response;
  } catch (error) {
      clearTimeout(id);
      throw error;
  }
};

// 新增：申请一个新的云端 ID (使用 JSONBlob)
export const createCloudBin = async (): Promise<string | null> => {
    try {
        const initialData = {
            pointsDB: {},
            logs: [],
            updatedAt: Date.now(),
            readme: "EPE App Sync Data - Do not delete"
        };
        
        console.log("Attempting to create bin...");
        const response = await fetchWithTimeout(CLOUD_API_BASE, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(initialData)
        });
        
        if (!response.ok) {
            console.error("Create failed:", response.status, response.statusText);
            return null;
        }

        // JSONBlob 在 Location 头中返回新资源的 URL
        // 某些浏览器/网络环境下可能暴露 Location 头受限，但通常 JSONBlob 支持
        const location = response.headers.get('Location');
        if (location) {
            const parts = location.split('/');
            const newId = parts[parts.length - 1];
            console.log("Bin created successfully:", newId);
            return newId;
        }
        return null;
    } catch (e) {
        console.error("Network error creating bin:", e);
        return null;
    }
};

export const syncFromCloud = async (): Promise<{success: boolean, message: string}> => {
    const cloudId = getCloudId();
    if (!cloudId) return { success: false, message: "请先设置 Cloud ID" };

    try {
        // CRITICAL FIX: 添加 timestamp 防止浏览器缓存 GET 请求
        // 这是解决“无法同步”的关键，确保每次都拿最新数据
        const url = `${CLOUD_API_BASE}/${cloudId}?t=${Date.now()}`;
        
        console.log(`Pulling from: ${url}`);
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) {
            if (response.status === 404) return { success: false, message: "ID 不存在 (404) - 请检查ID是否复制正确" };
            return { success: false, message: `服务器错误 (${response.status})` };
        }

        const cloudData = await response.json();
        
        if (typeof cloudData !== 'object') {
            return { success: false, message: "数据格式错误" };
        }

        // 覆盖本地数据
        if (cloudData.pointsDB) localStorage.setItem(KEYS.POINTS_DB, JSON.stringify(cloudData.pointsDB));
        if (cloudData.logs) localStorage.setItem(KEYS.LOGS, JSON.stringify(cloudData.logs));
        
        return { success: true, message: "同步成功 (已更新本地)" };
    } catch (e) {
        console.error("Pull failed:", e);
        return { success: false, message: "网络连接失败 (请检查网络)" };
    }
};

export const pushToCloud = async (): Promise<{success: boolean, message: string}> => {
    const cloudId = getCloudId();
    if (!cloudId) return { success: false, message: "请先设置 Cloud ID" };

    try {
        const data = {
            pointsDB: getPointsDB(),
            logs: getLogs(),
            updatedAt: Date.now(),
            clientVersion: "3.1"
        };

        const url = `${CLOUD_API_BASE}/${cloudId}`;
        console.log(`Pushing to: ${url}`);

        // JSONBlob 使用 PUT 更新
        const response = await fetchWithTimeout(url, {
            method: 'PUT', 
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
             return { success: false, message: `上传被拒绝 (${response.status})` };
        }

        return { success: true, message: "上传成功 (云端已更新)" };
    } catch (e) {
        console.error("Push failed:", e);
        return { success: false, message: "网络连接失败" };
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

  // 抽奖前强制同步一次，确保积分最新
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

  // 抽奖完立即推送
  await pushToCloud();

  return { result: selectedPrize, updatedUser };
};

export const resetSystem = () => {
    localStorage.clear();
    window.location.reload();
}
