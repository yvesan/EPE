
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Prize, PrizeType } from './types';
import { initializeUser, getUser, performDraw, importPointsData, syncFromCloud, getCloudId, getPointsDB } from './services/storage';
import { playClick, playConfirm, playOpen, playWin } from './services/audio';
import { COST_PER_DRAW } from './constants';
import { AdminPanel } from './components/AdminPanel';
import { CardPack } from './components/CardPack';
import { LogOut, Settings, Trophy, Wallet, User as UserIcon, History, Gift, Zap, Cloud, Database, RefreshCw, ChevronRight, Star, XCircle, Upload, FileSpreadsheet, Download, Sparkles } from 'lucide-react';

// Declare XLSX globally since it is loaded via script tag in index.html
declare const XLSX: any;

// --- Styled Components (Anime Style) ---

const BackgroundEffects = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dark base */}
        <div className="absolute inset-0 bg-anime-dark" />
        {/* Blue Dots Pattern */}
        <div className="absolute inset-0 bg-comic-dots bg-[size:20px_20px] opacity-10" />
        {/* Speed Lines Overlay */}
        <div className="absolute inset-0 bg-comic-speed opacity-20" />
        {/* Central Glow */}
        <div className="absolute top-1/2 left-1/2 w-[150%] h-[150%] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,_rgba(56,182,255,0.15),_transparent_70%)]" />
    </div>
);

// --- Views ---

const WelcomeView = ({ inputName, setInputName, handleLogin, setShowLeaderboard }: any) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, y: -50 }}
    className="relative z-20 w-full max-w-md px-4"
  >
    {/* Decorative Elements */}
    <div className="absolute -top-10 -right-10 text-anime-orange opacity-20 animate-pulse hidden md:block">
        <Zap size={100} fill="currentColor" />
    </div>

    {/* Main Container - Skewed Tech Style */}
    <div className="bg-anime-card/90 backdrop-blur-md border-l-4 border-r-4 border-anime-blue p-8 relative overflow-hidden transform md:-skew-x-3 shadow-neon-blue">
        {/* Top Label */}
        <div className="absolute top-0 left-0 bg-anime-blue text-anime-dark text-xs font-black px-4 py-1 skew-x-3">
            VER 3.1 SYSTEM ONLINE
        </div>

        <div className="mb-10 text-center relative z-10 md:skew-x-3">
            <h1 className="font-comic text-7xl text-transparent bg-clip-text bg-gradient-to-b from-white to-anime-blue drop-shadow-[2px_2px_0_#000] mb-2">
                EPE
            </h1>
            <h2 className="text-2xl font-tech text-white uppercase tracking-wider italic flex justify-center items-center gap-2">
                <span className="text-anime-orange">箐英</span>体能综合馆
            </h2>
            <div className="mt-4 flex justify-center gap-1">
                <div className="w-16 h-2 bg-anime-blue skew-x-12" />
                <div className="w-4 h-2 bg-anime-orange skew-x-12" />
                <div className="w-2 h-2 bg-white skew-x-12" />
            </div>
        </div>

        <form onSubmit={(e) => { playConfirm(); handleLogin(e); }} className="space-y-6 md:skew-x-3">
            <div className="space-y-2">
                <label className="text-xs font-bold text-anime-blue uppercase tracking-widest flex items-center gap-2">
                    <UserIcon size={14} /> 训练师代号 / ID
                </label>
                <div className="relative group">
                    <input 
                        type="text" 
                        value={inputName} 
                        onChange={(e) => setInputName(e.target.value)}
                        className="w-full bg-anime-dark border-2 border-anime-blue/50 p-4 font-bold text-xl text-white focus:outline-none focus:border-anime-orange focus:shadow-neon-orange transition-all placeholder:text-gray-600 skew-x-0"
                        placeholder="ENTER YOUR NAME"
                        required
                    />
                </div>
            </div>
            
            <button 
                type="submit"
                onClick={() => playClick()}
                className="w-full group relative h-16 overflow-hidden transform transition-all active:scale-95"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-anime-orange to-red-600 -skew-x-12 group-hover:skew-x-12 transition-transform duration-300" />
                <div className="relative z-10 w-full h-full flex items-center justify-center gap-3">
                    <span className="font-tech text-2xl text-white italic tracking-widest uppercase">启动链接 / START</span>
                    <ChevronRight className="text-white animate-pulse" />
                </div>
            </button>
        </form>

        <div className="mt-8 pt-6 flex justify-center md:skew-x-3">
            <button 
                onClick={() => { playClick(); setShowLeaderboard(true); }}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-anime-blue transition-colors uppercase tracking-widest group border-b border-dashed border-gray-600 pb-1 hover:border-anime-blue"
            >
                <Trophy size={14} className="group-hover:text-anime-yellow transition-colors" />
                查看全服战力榜 / LEADERBOARD
            </button>
        </div>
    </div>
  </motion.div>
);

const ShopView = ({ user, activeTab, setActiveTab, handleDraw, handleLogout, setShowAdmin, setShowRecharge, isOpening }: any) => (
  <div className="w-full max-w-6xl flex flex-col h-full relative z-10">
    {/* HUD Header */}
    <header className="w-full bg-anime-card/90 border-b-2 border-anime-blue/30 p-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-anime-blue -skew-x-6 flex items-center justify-center overflow-hidden border-2 border-white shadow-neon-blue">
                <UserIcon className="text-anime-dark skew-x-6" size={28} />
            </div>
            <div className="flex flex-col">
                <h2 className="font-tech text-xl text-white leading-none uppercase italic tracking-wider">{user?.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-24 bg-gray-700 rounded-sm overflow-hidden skew-x-12">
                        <div className="h-full bg-gradient-to-r from-anime-blue to-anime-orange w-[100%] animate-pulse" />
                    </div>
                    <span className="text-[10px] font-mono text-anime-blue">LV. MAX</span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
            <div 
                onClick={() => { playClick(); setShowRecharge(true); }}
                className="flex items-center gap-3 bg-anime-dark px-6 py-2 border border-anime-orange/50 hover:border-anime-orange hover:shadow-neon-orange cursor-pointer transition-all active:scale-95 skew-x-6 group"
            >
                <div className="-skew-x-6 flex items-center gap-3">
                    <Database size={16} className="text-anime-orange group-hover:rotate-180 transition-transform duration-500" />
                    <span className="font-comic text-2xl tracking-widest text-white group-hover:text-anime-orange transition-colors">{user?.points}</span>
                    <span className="text-xs font-bold text-gray-400">PTS</span>
                </div>
            </div>
            <div className="flex gap-2">
                <button onClick={() => { playClick(); setShowAdmin(true); }} className="p-2 text-gray-400 hover:text-anime-blue hover:bg-anime-blue/10 rounded-full transition-all">
                    <Settings size={20} />
                </button>
                <button onClick={() => { playClick(); handleLogout(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
    </header>

    <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto">
        {/* Navigation Tabs - Slanted Style */}
        <div className="flex justify-center mb-10">
            <div className="flex bg-anime-dark/50 p-1 rounded-sm gap-2">
                <button 
                    onClick={() => { playClick(); setActiveTab('pull'); }} 
                    className={`px-8 py-2 font-tech text-lg uppercase tracking-wider transition-all skew-x-12 border-l-4
                        ${activeTab === 'pull' ? 'bg-anime-orange text-white border-white shadow-neon-orange' : 'bg-transparent text-gray-500 hover:text-white border-transparent'}`}
                >
                    <span className="-skew-x-12 block">抽奖补给</span>
                </button>
                <button 
                    onClick={() => { playClick(); setActiveTab('collection'); }} 
                    className={`px-8 py-2 font-tech text-lg uppercase tracking-wider transition-all skew-x-12 border-r-4
                        ${activeTab === 'collection' ? 'bg-anime-blue text-anime-dark border-white shadow-neon-blue' : 'bg-transparent text-gray-500 hover:text-white border-transparent'}`}
                >
                    <span className="-skew-x-12 block">我的仓库</span>
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
            {activeTab === 'pull' ? (
                <motion.div 
                    key="pull"
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }}
                    className="flex-1 flex flex-col items-center justify-center min-h-[400px]"
                >
                    <div className="relative mb-12 group">
                        {/* Background Ring */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-dashed border-anime-blue/20 rounded-full animate-spin-slow pointer-events-none" />
                        
                        <CardPack onClick={handleDraw} disabled={(user?.points || 0) < COST_PER_DRAW} isOpening={isOpening} />
                        
                        {/* Cost Badge */}
                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-anime-dark border-2 border-anime-orange px-8 py-3 shadow-neon-orange flex items-center gap-2 whitespace-nowrap z-20 skew-x-6">
                            <span className="font-bold text-xs text-anime-orange -skew-x-6">消耗 / COST:</span>
                            <span className="font-comic text-3xl text-white -skew-x-6">{COST_PER_DRAW}</span>
                        </div>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-anime-blue/50 text-xs font-mono uppercase tracking-[0.3em] mb-2">System Ready</p>
                        <p className={`text-sm font-bold animate-pulse uppercase tracking-widest ${ (user?.points || 0) < COST_PER_DRAW ? "text-red-500" : "text-anime-blue" }`}>
                            {(user?.points || 0) < COST_PER_DRAW ? ">> 能量不足 <<" : ">> 点击开启补给包 <<"}
                        </p>
                    </div>
                </motion.div>
            ) : (
                <motion.div 
                    key="collection"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                    {user?.inventory.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-600">
                            <Gift size={64} className="mb-4 opacity-20" />
                            <p className="font-tech text-2xl uppercase opacity-50">NO ITEMS FOUND</p>
                            <p className="text-xs">暂无装备，快去抽奖吧</p>
                        </div>
                    ) : (
                        user?.inventory.map((item: any, i: number) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="bg-anime-card border border-anime-blue/30 p-3 hover:border-anime-blue hover:shadow-neon-blue hover:-translate-y-1 transition-all group cursor-default relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-1 bg-anime-blue/10 rounded-bl-lg">
                                    <span className="text-[9px] font-mono text-anime-blue font-bold">#{String(i + 1).padStart(3, '0')}</span>
                                </div>
                                <div className="aspect-square bg-anime-dark/50 border border-gray-700 mb-3 flex items-center justify-center group-hover:border-anime-blue transition-colors">
                                    <Gift size={28} className="text-gray-500 group-hover:text-white transition-colors" />
                                </div>
                                <div className="font-bold text-white text-sm leading-tight uppercase line-clamp-2 min-h-[2.5em] tracking-wide">
                                    {item.prizeName}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-700 flex justify-between items-center">
                                    <span className="text-[8px] font-mono text-gray-500">{new Date(item.obtainedAt).toLocaleDateString()}</span>
                                    <div className={`w-2 h-2 rounded-full ${item.isRedeemed ? 'bg-gray-600' : 'bg-anime-orange animate-pulse'}`} />
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  </div>
);

const ResultView = ({ currentPrize, closeResult }: any) => (
  <motion.div 
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
  >
    <motion.div 
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5 }}
        className="w-full max-w-sm relative"
    >
        {/* Burst Effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] bg-gradient-conic from-anime-blue via-transparent to-anime-orange animate-spin-slow opacity-30 -z-10" />

        <div className="bg-anime-dark border-4 border-anime-orange p-1 shadow-neon-orange transform -rotate-1">
            <div className="border border-white/20 p-6 flex flex-col items-center text-center bg-grid-pattern">
                
                <div className="w-full flex justify-between items-center mb-8 border-b border-gray-700 pb-2">
                    <span className="font-mono text-xs font-bold uppercase tracking-widest text-anime-blue animate-pulse">SYSTEM MSG</span>
                    <span className="font-black text-xs uppercase bg-anime-orange text-black px-2 py-0.5 skew-x-12">
                        {currentPrize?.type === PrizeType.EMPTY ? 'MISS' : 'GET!'}
                    </span>
                </div>

                <div className={`mb-8 relative ${currentPrize?.isRare ? 'animate-bounce' : ''}`}>
                     {/* Glow behind icon */}
                    <div className="absolute inset-0 bg-white blur-3xl opacity-20" />
                    <div className="relative z-10 text-white">
                        {currentPrize?.type === PrizeType.POINT && <Database size={100} className="text-anime-blue drop-shadow-[0_0_15px_rgba(56,182,255,0.8)]" />}
                        {currentPrize?.type === PrizeType.CASH && <Wallet size={100} className="text-anime-orange drop-shadow-[0_0_15px_rgba(255,145,0,0.8)]" />}
                        {currentPrize?.type === PrizeType.PHYSICAL && <Gift size={100} className="text-anime-yellow drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]" />}
                        {currentPrize?.type === PrizeType.EMPTY && <XCircle size={100} className="text-gray-600" />}
                        {currentPrize?.type === PrizeType.COUPON && <Star size={100} className="text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]" />}
                        {currentPrize?.type === PrizeType.FRAGMENT && <Zap size={100} className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]" />}
                    </div>
                </div>

                <h3 className="text-3xl font-tech text-white uppercase leading-none mb-2 tracking-wide drop-shadow-md">
                    {currentPrize?.name}
                </h3>
                
                {currentPrize?.isRare && (
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-black px-4 py-1 uppercase tracking-widest border border-white mb-6 inline-block transform -skew-x-12 shadow-neon-blue">
                        <span className="block skew-x-12">SUPER RARE</span>
                    </div>
                )}

                <p className="text-gray-400 text-xs font-mono mb-8 max-w-[200px] uppercase">
                    {currentPrize?.type === PrizeType.EMPTY ? 'Try Again Next Time' : 'Item added to inventory'}
                </p>

                <button 
                    onClick={() => { playClick(); closeResult(); }}
                    className="w-full bg-white text-black font-tech text-xl py-3 hover:bg-anime-blue hover:text-white transition-all uppercase tracking-widest skew-x-0 hover:-skew-x-3 duration-200"
                >
                    CONFIRM
                </button>
            </div>
        </div>
    </motion.div>
  </motion.div>
);

const RechargeModal = ({ onClose, onSuccess }: any) => {
    const [jsonInput, setJsonInput] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { "name": "张三", "points": 100 },
            { "name": "李四", "points": 500 }
        ]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Points_Template");
        XLSX.writeFile(wb, "EPE_积分导入模版.xlsx");
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: ["name", "points"], range: 1 });
                const validData = data.filter((row: any) => row.name && row.points !== undefined);
                setJsonInput(JSON.stringify(validData, null, 2));
            } catch (err) {
                alert("读取 Excel 失败");
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleImport = async () => {
        try {
            let data;
            if (jsonInput.trim().startsWith('[')) {
                data = JSON.parse(jsonInput);
            } else {
                data = jsonInput.trim().split('\n').map(line => {
                    const parts = line.split(/[\t,]+|\s{2,}/);
                    if (parts.length >= 2) return { name: parts[0].trim(), points: Number(parts[1].trim()) };
                    return null;
                }).filter(Boolean);
            }

            if (Array.isArray(data) && data.length > 0) {
                await importPointsData(data);
                playConfirm();
                alert(`成功导入 ${data.length} 条数据`);
                onSuccess();
                onClose();
            } else { alert('未识别到有效数据'); }
        } catch (e) { alert('格式错误'); }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-anime-dark border-2 border-anime-orange p-8 max-w-xl w-full shadow-neon-orange flex flex-col gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-anime-orange opacity-10 rotate-45 translate-x-10 -translate-y-10" />
                
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                    <h3 className="text-2xl font-tech uppercase flex items-center gap-2 text-white">
                        <FileSpreadsheet className="text-anime-orange" /> 导入积分 / IMPORT
                    </h3>
                    <button onClick={() => { playClick(); onClose(); }}><XCircle size={24} className="text-gray-400 hover:text-red-500" /></button>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={downloadTemplate}
                        className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 py-3 px-4 text-xs flex items-center justify-center gap-2 transition-colors uppercase font-bold text-white"
                    >
                        <Download size={16} /> 下载模版
                    </button>
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 bg-anime-blue/20 hover:bg-anime-blue/40 border border-anime-blue py-3 px-4 text-xs flex items-center justify-center gap-2 transition-colors uppercase font-bold text-anime-blue"
                    >
                        <Upload size={16} /> 上传 Excel
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} />
                </div>

                <textarea 
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full h-40 bg-black/50 border border-gray-700 p-4 font-mono text-xs text-green-400 focus:outline-none focus:border-anime-orange resize-none"
                    placeholder={'支持Excel复制粘贴或JSON格式...\nExample:\nNaruto  100\nSasuke  500'}
                />
                
                <button onClick={handleImport} className="w-full bg-gradient-to-r from-anime-orange to-red-600 text-white py-4 font-tech text-xl uppercase tracking-widest hover:brightness-110 transition-all shadow-lg transform active:scale-95">
                    确认导入数据库 / CONFIRM
                </button>
            </div>
        </div>
    );
};

const LeaderboardModal = ({ onClose }: any) => {
    const [db, setDb] = useState<Record<string, number>>({});
    useEffect(() => { setDb(getPointsDB()); }, []);
    const sorted = Object.entries(db).sort((a, b) => b[1] - a[1]).slice(0, 10);
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="bg-anime-dark border-2 border-anime-blue w-full max-w-md max-h-[80vh] flex flex-col shadow-neon-blue">
                <div className="bg-anime-blue/10 border-b border-anime-blue p-4 flex justify-between items-center">
                    <h3 className="text-xl font-tech uppercase tracking-wider text-anime-blue flex items-center gap-2">
                        <Trophy size={20} /> TOP PLAYERS
                    </h3>
                    <button onClick={() => { playClick(); onClose(); }} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
                </div>
                <div className="overflow-y-auto p-2">
                    {sorted.map(([name, pts], i) => (
                        <div key={name} className="flex items-center justify-between p-4 mb-2 bg-gray-800/50 border-l-2 border-transparent hover:border-anime-orange hover:bg-gray-800 transition-all">
                            <div className="flex items-center gap-4">
                                <span className={`font-tech text-xl italic w-8 ${i < 3 ? 'text-anime-yellow drop-shadow-md' : 'text-gray-600'}`}>#{i+1}</span>
                                <span className="font-bold uppercase truncate max-w-[150px] text-white">{name}</span>
                            </div>
                            <span className="font-mono font-bold text-anime-blue">{pts} PTS</span>
                        </div>
                    ))}
                    {sorted.length === 0 && <div className="p-8 text-center text-gray-500">NO DATA</div>}
                </div>
            </div>
        </div>
    );
};

// --- Main App ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'welcome' | 'shop' | 'result'>('welcome');
  const [inputName, setInputName] = useState('');
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'pull' | 'collection'>('pull');
  const [isOpening, setIsOpening] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const init = async () => {
        if (getCloudId()) { await syncFromCloud(); }
        const existing = getUser();
        if (existing) {
          setUser(existing);
          setView('shop');
        }
    };
    init();
  }, []);

  useEffect(() => {
    if (!getCloudId()) return;
    const intervalId = setInterval(async () => {
        if (isOpening) return;
        setIsSyncing(true);
        try {
            const hasChanges = await syncFromCloud();
            const freshUser = getUser();
            if (freshUser && user) {
                if (freshUser.points !== user.points || freshUser.inventory.length !== user.inventory.length) {
                    setUser(freshUser);
                }
            }
        } finally {
            setTimeout(() => setIsSyncing(false), 500);
        }
    }, 3000);
    return () => clearInterval(intervalId);
  }, [user, isOpening]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName) return;
    const newUser = initializeUser(inputName);
    setUser(newUser);
    setView('shop');
  };

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('epe_user'); 
      setView('welcome');
      setInputName('');
      setActiveTab('pull');
  };

  const handleDraw = async () => {
    if (!user || user.points < COST_PER_DRAW) {
      playClick();
      setShowRecharge(true);
      return;
    }
    playOpen();
    setIsOpening(true);
    setTimeout(async () => {
        const result = await performDraw(user);
        if (result) {
            setUser(result.updatedUser);
            setCurrentPrize(result.result);
            playWin();
            setView('result');
            setIsOpening(false);
        } else {
            setIsOpening(false);
            alert("同步错误");
        }
    }, 1800);
  };

  const closeResult = () => {
    setCurrentPrize(null);
    setView('shop');
  };

  const handleRechargeSuccess = () => {
      const updated = getUser();
      if (updated) setUser(updated);
  };

  return (
    <div className="min-h-screen font-sans overflow-hidden flex flex-col items-center justify-center relative bg-anime-dark text-white">
       <BackgroundEffects />
       
       <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-4">
         <AnimatePresence mode="wait">
            {view === 'welcome' && (
                <WelcomeView 
                    key="welcome"
                    inputName={inputName} 
                    setInputName={setInputName} 
                    handleLogin={handleLogin} 
                    setShowLeaderboard={setShowLeaderboard}
                />
            )}
            {view === 'shop' && (
                <ShopView 
                    key="shop"
                    user={user}
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleDraw={handleDraw}
                    handleLogout={handleLogout}
                    setShowAdmin={setShowAdmin}
                    setShowRecharge={setShowRecharge}
                    isOpening={isOpening}
                />
            )}
            {view === 'result' && (
                <ResultView 
                    key="result"
                    currentPrize={currentPrize}
                    closeResult={closeResult}
                />
            )}
         </AnimatePresence>
       </div>
       {showAdmin && <AdminPanel onClose={() => { playClick(); setShowAdmin(false); }} />}
       {showRecharge && <RechargeModal onClose={() => { playClick(); setShowRecharge(false); }} onSuccess={handleRechargeSuccess} />}
       {showLeaderboard && <LeaderboardModal onClose={() => { playClick(); setShowLeaderboard(false); }} />}
       
    </div>
  );
};

export default App;
