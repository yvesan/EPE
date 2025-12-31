import React, { useState, useEffect, useRef } from 'react';
import { Prize, User, DrawRecord, PrizeType, Rarity } from './types';
import { PRIZE_POOL, COST_PER_DRAW } from './constants';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { DatabaseSetupGuide } from './components/DatabaseSetupGuide';

// --- Helper: Connection Status Banner ---
const ConnectionStatus = () => {
    if (isSupabaseConfigured) return null;
    return (
        <div className="fixed top-0 left-0 w-full bg-red-600/90 backdrop-blur text-white text-xs md:text-sm font-bold text-center py-2 z-[100] border-b border-red-400 shadow-lg">
            ⚠️ 警告：数据库未连接。当前为【单机演示模式】。
            <span className="hidden md:inline"> 学员端的抽奖数据无法传送到工作人员后台。请按教程配置 Supabase 和 Vercel。</span>
        </div>
    );
};

// --- Sub-Components ---

// 1. Login Component
interface LoginProps {
  onLogin: (name: string) => void;
  isAdminMode: boolean;
  toggleAdmin: () => void;
  loading: boolean;
}

const LoginForm: React.FC<LoginProps> = ({ onLogin, isAdminMode, toggleAdmin, loading }) => {
  const [name, setName] = useState('');
  const [isStaffLogin, setIsStaffLogin] = useState(false);
  const [password, setPassword] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  const handleStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'EPE2026') {
        toggleAdmin();
    } else {
        alert("密码错误！");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-epe-black via-epe-dark to-purple-900 pt-16">
      <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-epe-purple shadow-2xl w-full max-w-md relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-epe-blue to-epe-purple"></div>
        
        <div className="text-center mb-8">
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-epe-blue to-epe-purple mb-2 drop-shadow-lg">EPE</h1>
            <p className="text-gray-400 text-xs tracking-[0.3em] uppercase border-b border-gray-700 pb-4">Elite Performance Equipment</p>
            <h2 className="text-2xl font-bold mt-6 text-white flex items-center justify-center gap-2">
                {isStaffLogin ? '🛡️ 工作人员通道' : '⚡ 盲盒抽奖系统'}
            </h2>
        </div>

        {!isStaffLogin ? (
            <form onSubmit={handleStudentSubmit} className="space-y-6">
            <div>
                <label className="block text-epe-blue text-sm font-bold mb-2 uppercase tracking-wider">学员姓名</label>
                <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-800/50 border border-gray-600 text-white text-lg focus:outline-none focus:border-epe-blue focus:ring-1 focus:ring-epe-blue transition-all placeholder-gray-500"
                placeholder="请输入您的姓名"
                required
                />
            </div>
            <button
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-epe-purple to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold py-4 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95 text-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {loading ? '正在查询数据...' : '🚀 进入系统'}
            </button>
            </form>
        ) : (
            <form onSubmit={handleStaffSubmit} className="space-y-6">
            <div>
                <label className="block text-red-400 text-sm font-bold mb-2 uppercase tracking-wider">管理员密码</label>
                <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 rounded-lg bg-gray-800/50 border border-red-500 text-white text-lg focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400 transition-all placeholder-gray-600"
                placeholder="请输入密码"
                autoFocus
                required
                />
            </div>
            <button
                type="submit"
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-4 rounded-lg shadow-lg transform transition hover:scale-[1.02] active:scale-95 text-lg"
            >
                🔓 验证身份
            </button>
            </form>
        )}
        
        <div className="mt-8 text-center">
            <button 
                type="button"
                onClick={() => {
                    setIsStaffLogin(!isStaffLogin);
                    setPassword('');
                }} 
                className="text-xs text-gray-500 hover:text-white underline cursor-pointer px-4 py-2 transition-colors"
            >
                {isStaffLogin ? '← 返回学员登录' : '工作人员入口 (需密码)'}
            </button>
        </div>
      </div>
    </div>
  );
};

// 2. Admin Component
const AdminPanel: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [activeTab, setActiveTab] = useState<'redeem' | 'users'>('redeem');
    
    // --- Redeem Logic ---
    const [records, setRecords] = useState<DrawRecord[]>([]);
    const [loadingRecords, setLoadingRecords] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // --- Users Logic ---
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [pointsDelta, setPointsDelta] = useState<string>(''); // For inputting +100 or -50

    // Fetch Records
    const fetchRecords = async () => {
        setLoadingRecords(true);
        if (!isSupabaseConfigured || !supabase) {
            setRecords([]);
            setLoadingRecords(false);
            return;
        }
        try {
            const { data, error } = await supabase
                .from('records')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            if (data) {
                const formattedData = data.map((item: any) => ({ ...item, id: String(item.id) }));
                setRecords(formattedData as DrawRecord[]);
            }
        } catch (error: any) {
            alert("读取记录失败: " + error.message);
        } finally {
            setLoadingRecords(false);
        }
    };

    // Fetch Users
    const fetchUsers = async () => {
        setLoadingUsers(true);
        if (!isSupabaseConfigured || !supabase) {
            setUsers([]);
            setLoadingUsers(false);
            return;
        }
        try {
            let query = supabase.from('users').select('*').order('points', { ascending: false });
            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }
            const { data, error } = await query;
            if (error) throw error;
            if (data) setUsers(data as User[]);
        } catch (error: any) {
            alert("读取用户失败: " + error.message);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleRedeem = async (idStr: string) => {
        if (!confirm('确认要核销这个奖品吗？')) return;
        if (isSupabaseConfigured && supabase) {
            setProcessingId(idStr); 
            try {
                const dbId = parseInt(idStr); 
                const { data, error } = await supabase.from('records').update({ is_redeemed: true }).eq('id', dbId).select();
                if (error) alert('❌ 核销失败: ' + error.message);
                else await fetchRecords();
            } catch (e: any) {
                alert('系统错误: ' + e.message);
            } finally {
                setProcessingId(null);
            }
        }
    };

    const handleUpdatePoints = async () => {
        if (!editingUser || !pointsDelta) return;
        const delta = parseInt(pointsDelta);
        if (isNaN(delta)) {
            alert("请输入有效的数字");
            return;
        }

        if (!confirm(`确认要给 ${editingUser.name} ${delta >= 0 ? '增加' : '扣除'} ${Math.abs(delta)} 积分吗？\n\n当前: ${editingUser.points}\n修改后: ${editingUser.points + delta}`)) return;

        if (isSupabaseConfigured && supabase) {
            try {
                // 1. Fetch latest data to avoid race conditions
                const { data: latestUser, error: fetchError } = await supabase.from('users').select('points').eq('id', editingUser.id).single();
                if (fetchError || !latestUser) throw new Error("获取最新数据失败");

                const newTotal = latestUser.points + delta;

                // 2. Update
                const { error: updateError } = await supabase.from('users').update({ points: newTotal }).eq('id', editingUser.id);
                if (updateError) throw updateError;

                alert("✅ 修改成功！");
                setEditingUser(null);
                setPointsDelta('');
                fetchUsers(); // Refresh list
            } catch (e: any) {
                alert("修改失败: " + e.message);
            }
        }
    };

    useEffect(() => {
        if (activeTab === 'redeem') fetchRecords();
        if (activeTab === 'users') fetchUsers();
    }, [activeTab]);

    // Debounce search
    useEffect(() => {
        if (activeTab === 'users') {
            const timer = setTimeout(fetchUsers, 500);
            return () => clearTimeout(timer);
        }
    }, [searchTerm]);

    if (!isSupabaseConfigured) {
        return (
            <div className="min-h-screen bg-gray-900 text-white p-8 pt-20 flex flex-col items-center justify-center">
                <div className="bg-red-500/10 border border-red-500 p-6 rounded-xl max-w-lg text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">无法连接后台</h2>
                    <p className="mb-6 text-gray-300">检测到未配置 Supabase 数据库。</p>
                    <button onClick={onBack} className="bg-gray-700 px-6 py-2 rounded text-white hover:bg-gray-600">返回</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8 pt-16">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-epe-blue">管理后台</h1>
                        <p className="text-gray-400 text-sm mt-1">EPE PERFORMANCE SYSTEM</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-gray-800 p-1 rounded-lg flex">
                            <button 
                                onClick={() => setActiveTab('redeem')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'redeem' ? 'bg-epe-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                🎁 奖品核销
                            </button>
                            <button 
                                onClick={() => setActiveTab('users')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'users' ? 'bg-epe-purple text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                👥 学员管理 (充值)
                            </button>
                        </div>
                        <button onClick={onBack} className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">退出</button>
                    </div>
                </div>

                {activeTab === 'redeem' ? (
                    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-xl border border-gray-700">
                         <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg">核销记录列表</h3>
                            <button onClick={fetchRecords} className="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded">↻ 刷新</button>
                         </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-700 text-gray-300">
                                    <tr>
                                        <th className="p-4 whitespace-nowrap">时间</th>
                                        <th className="p-4 whitespace-nowrap">姓名</th>
                                        <th className="p-4 whitespace-nowrap">奖品内容</th>
                                        <th className="p-4 whitespace-nowrap">状态</th>
                                        <th className="p-4 text-center whitespace-nowrap">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingRecords ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-400 animate-pulse">加载中...</td></tr>
                                    ) : records.length === 0 ? (
                                        <tr><td colSpan={5} className="p-12 text-center text-gray-500">暂无记录</td></tr>
                                    ) : (
                                        records.map(record => (
                                            <tr key={record.id} className="border-b border-gray-700 hover:bg-gray-750 transition-colors">
                                                <td className="p-4 text-sm text-gray-400">{new Date(record.created_at).toLocaleString()}</td>
                                                <td className="p-4 font-medium">{record.user_name}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-epe-gold">{record.prize_name}</span>
                                                    <span className="text-xs text-gray-500 ml-2">({record.prize_type})</span>
                                                </td>
                                                <td className="p-4">
                                                    {record.is_redeemed ? <span className="text-green-400">✓ 已核销</span> : <span className="text-red-400">! 待处理</span>}
                                                </td>
                                                <td className="p-4 text-center">
                                                    {!record.is_redeemed && record.prize_type !== 'EMPTY' && record.prize_type !== 'POINT' && record.prize_type !== 'FRAGMENT' && (
                                                        <button 
                                                            onClick={() => handleRedeem(record.id)}
                                                            disabled={processingId === record.id}
                                                            className="px-3 py-1 bg-epe-blue text-black text-xs font-bold rounded hover:bg-cyan-300"
                                                        >
                                                            {processingId === record.id ? '...' : '核销'}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                         {/* User Management Toolbar */}
                        <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex flex-col md:flex-row justify-between gap-4">
                             <input 
                                type="text" 
                                placeholder="🔍 搜索学员姓名..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-black/30 border border-gray-600 rounded px-4 py-2 text-white focus:border-epe-purple focus:outline-none w-full md:w-64"
                             />
                             <div className="text-sm text-gray-400 flex items-center">
                                 共找到 {users.length} 位学员
                             </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {loadingUsers ? (
                                <div className="col-span-full py-12 text-center text-gray-500">正在获取学员数据...</div>
                            ) : (
                                users.map(u => (
                                    <div key={u.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col justify-between">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-white">{u.name}</h3>
                                                <p className="text-gray-500 text-xs">ID: {u.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-2xl font-bold text-epe-gold">{u.points}</span>
                                                <span className="text-xs text-gray-400">当前积分</span>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-black/20 rounded p-2 mb-4 grid grid-cols-2 gap-2 text-center">
                                             <div>
                                                <span className="block text-xs text-gray-500">500元碎片</span>
                                                <span className="font-mono text-epe-blue">{u.fragment_500}/3</span>
                                             </div>
                                             <div>
                                                <span className="block text-xs text-gray-500">免单碎片</span>
                                                <span className="font-mono text-epe-purple">{u.fragment_free}/3</span>
                                             </div>
                                        </div>

                                        <button 
                                            onClick={() => setEditingUser(u)}
                                            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold transition-colors border border-gray-600 hover:border-gray-500"
                                        >
                                            ✏️ 修改/充值积分
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Points Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
                    <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-600 shadow-2xl">
                        <h3 className="text-xl font-bold mb-1">积分变动: {editingUser.name}</h3>
                        <p className="text-gray-400 text-sm mb-6">当前余额: <span className="text-epe-gold">{editingUser.points}</span></p>
                        
                        <div className="mb-6">
                            <label className="block text-xs uppercase text-gray-500 font-bold mb-2">变动数值 (正数增加，负数扣除)</label>
                            <input 
                                type="number" 
                                autoFocus
                                value={pointsDelta}
                                onChange={(e) => setPointsDelta(e.target.value)}
                                placeholder="例如: 100 或 -30"
                                className="w-full bg-black/50 border border-gray-500 rounded px-4 py-3 text-xl text-white focus:border-epe-blue focus:outline-none"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setPointsDelta('100')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs text-green-300">+100</button>
                                <button onClick={() => setPointsDelta('500')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs text-green-300">+500</button>
                                <button onClick={() => setPointsDelta('-30')} className="bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs text-red-300">-30</button>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={() => { setEditingUser(null); setPointsDelta(''); }}
                                className="flex-1 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-bold"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleUpdatePoints}
                                className="flex-1 py-3 bg-epe-blue text-black rounded-lg hover:bg-cyan-400 font-bold shadow-lg"
                            >
                                确认执行
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


// 3. Main Gacha Component
interface GachaProps {
  user: User;
  onLogout: () => void;
  onUpdateUser: (updatedUser: Partial<User>) => void;
}

const GachaMachine: React.FC<GachaProps> = ({ user, onLogout, onUpdateUser }) => {
  const [state, setState] = useState<'IDLE' | 'SHAKING' | 'OPENING' | 'REVEALED'>('IDLE');
  const [prize, setPrize] = useState<Prize | null>(null);
  const [history, setHistory] = useState<DrawRecord[]>([]);

  useEffect(() => {
    const loadHistory = async () => {
        if (!isSupabaseConfigured || !supabase) return;
        const { data } = await supabase
            .from('records')
            .select('*')
            .eq('user_name', user.name)
            .order('created_at', { ascending: false })
            .limit(10);
        if (data) {
             const formatted = data.map((d: any) => ({...d, id: String(d.id)}));
             setHistory(formatted as DrawRecord[]);
        }
    };
    loadHistory();
  }, [user.name]);

  const drawPrize = (): Prize => {
    const rand = Math.random() * 100;
    let cumulative = 0;
    for (const p of PRIZE_POOL) {
      cumulative += p.probability;
      if (rand <= cumulative) return p;
    }
    return PRIZE_POOL[0];
  };

  const handleStart = async () => {
    if (state !== 'IDLE') return;

    if (user.points < COST_PER_DRAW) {
        alert(`积分不足！需要 ${COST_PER_DRAW} 积分，你只有 ${user.points} 积分。`);
        return;
    }
    
    // Optimistic UI Update
    const newPoints = user.points - COST_PER_DRAW;
    onUpdateUser({ points: newPoints });

    setState('SHAKING');

    setTimeout(async () => {
      const result = drawPrize();
      setPrize(result);
      setState('OPENING');
      
      // DB Transaction
      await processDrawTransaction(result, newPoints);
      
      setTimeout(() => {
        setState('REVEALED');
      }, 1000);
    }, 800);
  };

  const processDrawTransaction = async (wonPrize: Prize, pointsAfterDeduction: number) => {
    if (!isSupabaseConfigured || !supabase || !user.id) {
        // Offline Fallback for visual confirmation only
        const tempId = Date.now().toString();
        setHistory(prev => [{
            id: tempId,
            user_name: user.name,
            prize_name: wonPrize.name,
            prize_type: wonPrize.type,
            prize_value: wonPrize.value,
            is_redeemed: false,
            created_at: new Date().toISOString()
        }, ...prev]);
        return;
    }

    const newRecord: Omit<DrawRecord, 'id' | 'created_at'> = {
        user_name: user.name,
        prize_name: wonPrize.name,
        prize_type: wonPrize.type,
        prize_value: wonPrize.value,
        is_redeemed: false,
    };

    let currentF500 = user.fragment_500;
    let currentFFree = user.fragment_free;
    let finalPoints = pointsAfterDeduction;

    if (wonPrize.id === 'p_frag_500') currentF500 += 1;
    if (wonPrize.id === 'p_frag_free') currentFFree += 1;
    if (wonPrize.type === PrizeType.POINT) finalPoints += wonPrize.value;

    // Database Updates
    const { error: recordError } = await supabase.from('records').insert([newRecord]);
    
    if (recordError) {
        alert("⚠️ 严重错误：中奖记录保存失败！可能是网络问题，请截图联系管理员。");
    }

    const { error: userError } = await supabase.from('users').update({
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    }).eq('id', user.id);

    if (userError) {
         console.error("更新积分失败:", userError);
    }

    onUpdateUser({ 
        points: finalPoints,
        fragment_500: currentF500,
        fragment_free: currentFFree
    });
    
    // Refresh History from DB
    const tempId = Date.now().toString();
    setHistory(prev => [{...newRecord, id: tempId, created_at: new Date().toISOString()}, ...prev]);
  };

  const reset = () => {
    setState('IDLE');
    setPrize(null);
  };

  return (
    <div className="min-h-screen bg-epe-black text-white flex flex-col items-center relative overflow-hidden pt-16">
        {/* Top Bar */}
        <div className="w-full p-4 flex justify-between items-center bg-gray-900/50 backdrop-blur z-20 border-b border-gray-800 absolute top-0 mt-8 md:mt-0">
            <div>
                <h2 className="text-xl font-bold">{user.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-epe-gold border border-epe-gold/30 px-2 py-0.5 rounded-full bg-yellow-900/20">
                        💰 积分: {user.points}
                    </span>
                </div>
            </div>
            <div className="flex gap-4">
                <button onClick={onLogout} className="text-sm text-gray-500 hover:text-white">退出</button>
            </div>
        </div>

        {/* Fragment Dashboard */}
        <div className="w-full max-w-4xl p-4 grid grid-cols-2 gap-4 z-20 mt-12 md:mt-12">
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center shadow-lg">
                <span className="text-xs text-gray-400 mb-1 font-bold">500元红包碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-10 rounded transition-all duration-500 border border-black/50 ${i <= user.fragment_500 % 3 && user.fragment_500 > 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 shadow-[0_0_15px_#ffd700] scale-110' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-gold font-mono">{user.fragment_500}/3</span>
            </div>
            <div className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col items-center shadow-lg">
                <span className="text-xs text-gray-400 mb-1 font-bold">季度免单碎片</span>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div key={i} className={`w-8 h-10 rounded transition-all duration-500 border border-black/50 ${i <= user.fragment_free % 3 && user.fragment_free > 0 ? 'bg-gradient-to-br from-purple-400 to-purple-700 shadow-[0_0_15px_#b026ff] scale-110' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
                <span className="text-xs mt-1 text-epe-purple font-mono">{user.fragment_free}/3</span>
            </div>
        </div>

        {/* Main Stage */}
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md relative z-10 p-6">
            
            {/* The Pack */}
            {state !== 'REVEALED' && (
                <div 
                    onClick={handleStart}
                    className={`cursor-pointer relative w-64 h-80 transition-all duration-300 ${state === 'SHAKING' ? 'animate-shake' : 'hover:scale-105 hover:rotate-1'} ${state === 'OPENING' ? 'opacity-0 scale-150' : 'opacity-100'}`}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-gray-800 to-black rounded-xl border-2 border-gray-600 shadow-2xl overflow-hidden flex flex-col items-center justify-center group">
                        {/* EPE Pattern Background */}
                        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px'}}></div>
                        
                        {/* Glossy Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12"></div>
                        
                        <h1 className="text-7xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-epe-gold to-yellow-700 z-10 transform -rotate-12 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">EPE</h1>
                        <div className="mt-4 px-3 py-1 border border-gray-500 rounded text-[10px] text-gray-400 tracking-[0.2em] z-10 bg-black/50 backdrop-blur">LIMITED EDITION</div>
                        
                        <div className={`absolute bottom-6 w-4/5 text-center py-2 rounded-full text-sm font-bold transition-all shadow-lg ${user.points >= COST_PER_DRAW ? 'bg-epe-blue text-black animate-pulse hover:bg-white' : 'bg-gray-700 text-gray-400'}`}>
                            {user.points >= COST_PER_DRAW ? `点击开启 (-${COST_PER_DRAW})` : `积分不足`}
                        </div>
                    </div>
                </div>
            )}

            {/* The Card (Revealed) */}
            {state === 'REVEALED' && prize && (
                <div className="animate-pop w-72 h-[28rem] perspective-1000 relative">
                    <div className={`relative w-full h-full rounded-2xl shadow-2xl overflow-hidden border-[3px] ${prize.type === 'EMPTY' ? 'border-gray-600' : 'border-epe-gold animate-glow'} bg-gray-900 flex flex-col items-center p-0 text-center`}>
                        {/* Card Header Background */}
                        <div className={`absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b ${prize.rarity.replace('bg-', 'from-')} to-gray-900 opacity-60`}></div>
                        
                        <div className="z-10 mt-6 mb-2 w-full px-4 flex justify-between items-start">
                            <span className="text-[10px] text-gray-400 tracking-widest">EPE GACHA</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase ${prize.rarity} shadow-lg`}>
                                {prize.rarity === Rarity.LEGENDARY ? 'LEGENDARY' : prize.rarity === Rarity.RARE ? 'RARE' : prize.rarity === Rarity.UNCOMMON ? 'UNCOMMON' : 'COMMON'}
                            </span>
                        </div>

                        <div className="z-10 flex-1 flex flex-col items-center justify-center w-full px-6">
                            <div className="mb-4 transform scale-150">
                                {prize.type !== 'EMPTY' ? '🎁' : '💨'}
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-wide leading-tight drop-shadow-md">{prize.name}</h2>
                            <p className="text-gray-300 text-sm font-light border-t border-white/10 pt-2 w-full">{prize.description}</p>
                        </div>

                        <div className="z-10 w-full p-6 bg-gray-900/80 backdrop-blur-sm">
                            <button 
                                onClick={reset}
                                className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition shadow-[0_0_15px_rgba(255,255,255,0.3)] uppercase tracking-wider text-sm"
                            >
                                收下奖励
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* History List */}
        <div className="w-full max-w-2xl bg-gray-900/90 backdrop-blur border-t border-gray-700 z-20 h-48 flex flex-col shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
            <div className="p-3 border-b border-gray-700 bg-gray-800 flex justify-between items-center">
                <h3 className="text-gray-300 text-xs font-bold uppercase tracking-wider">近期中奖记录</h3>
                <span className="text-[10px] text-gray-500">仅显示最近10条</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {history.map((rec) => (
                    <div key={rec.id} className="flex justify-between items-center bg-black/40 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors">
                        <span className="text-gray-500 text-xs font-mono">{new Date(rec.created_at).toLocaleTimeString()}</span>
                        <span className={`text-sm font-medium ${rec.prize_type === 'EMPTY' ? 'text-gray-500' : 'text-epe-blue'}`}>
                            {rec.prize_name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded ${rec.is_redeemed ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                           {rec.is_redeemed ? '已核销' : '未领取'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

// --- Main App Logic ---

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // Initial load for fragments if returning user
    const handleLogin = async (name: string) => {
        setLoginLoading(true);
        
        let foundUser: User | null = null;

        if (isSupabaseConfigured && supabase) {
            // Check if user exists in DB
             const { data } = await supabase
                .from('users')
                .select('*')
                .eq('name', name)
                .single();
            
            if (data) {
                // User exists, load their real data
                foundUser = {
                    id: data.id,
                    name: data.name,
                    points: data.points,
                    fragment_500: data.fragment_500,
                    fragment_free: data.fragment_free,
                };
            } else {
                // User does not exist, create new one.
                const { data: newUser, error } = await supabase
                    .from('users')
                    .insert([{ name, points: 300 }]) // Default points for new users
                    .select()
                    .single();
                
                if (newUser && !error) {
                    foundUser = {
                        id: newUser.id,
                        name: newUser.name,
                        points: newUser.points,
                        fragment_500: newUser.fragment_500,
                        fragment_free: newUser.fragment_free,
                    };
                }
            }
        } else {
            // Offline/Demo Mode
            foundUser = {
                id: 0,
                name,
                points: 300, 
                fragment_500: 0,
                fragment_free: 0,
            };
        }

        setUser(foundUser);
        setLoginLoading(false);
    };

    const handleUpdateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <>
            <ConnectionStatus />
            {!isSupabaseConfigured && <DatabaseSetupGuide />}
            
            {isAdmin ? (
                <AdminPanel onBack={() => setIsAdmin(false)} />
            ) : !user ? (
                <LoginForm 
                    onLogin={handleLogin} 
                    isAdminMode={isAdmin} 
                    toggleAdmin={() => setIsAdmin(true)}
                    loading={loginLoading}
                />
            ) : (
                <GachaMachine 
                    user={user} 
                    onLogout={() => setUser(null)}
                    onUpdateUser={handleUpdateUser}
                />
            )}
        </>
    );
};

export default App;
