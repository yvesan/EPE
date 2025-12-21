import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Prize, PrizeType, DrawLog } from './types';
import { initializeUser, getUser, performDraw, importPointsData, getLogs } from './services/storage';
import { CardPack } from './components/CardPack';
import { COST_PER_DRAW, FRAGMENTS_NEEDED, FRAGMENT_DEFINITIONS } from './constants';
import { AdminPanel } from './components/AdminPanel';
import { User as UserIcon, Settings, Trophy, Wallet, RefreshCw, LogOut, Zap, Gift, Plus, Lock, X, Clock, ArrowUpDown, FileSpreadsheet, Upload } from 'lucide-react';

// Declaration for xlsx library loaded via CDN
declare const XLSX: any;

// --- Shared Components ---

const ComicButton = ({ onClick, disabled, children, color = 'neon', className = '' }: any) => {
    const baseClass = "relative px-8 py-3 font-comic text-2xl tracking-wider transform transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed select-none";
    const colors: any = {
        neon: "bg-epe-neon text-black border-2 border-black shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]",
        gold: "bg-epe-gold text-black border-2 border-black shadow-comic hover:shadow-comic-hover hover:translate-x-[2px] hover:translate-y-[2px]",
        dark: "bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700",
        red: "bg-epe-pink text-white border-2 border-black shadow-comic hover:shadow-comic-hover"
    };

    return (
        <button onClick={onClick} disabled={disabled} className={`${baseClass} ${colors[color]} -skew-x-12 ${className}`}>
            <span className="block skew-x-12">{children}</span>
        </button>
    );
};

const SpeedLines = () => (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[50%] left-[50%] w-[200vmax] h-[200vmax] bg-comic-burst opacity-10 animate-spin-slow origin-center"></div>
    </div>
);

// --- Modals ---

interface RechargeModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

const RechargeModal: React.FC<RechargeModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'password' | 'upload'>('password');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [uploadStatus, setUploadStatus] = useState('');

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'EPE2025') {
            setStep('upload');
            setError('');
        } else {
            setError('密码错误！权限拒绝');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadStatus('Processing...');
        const reader = new FileReader();
        
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                // Read as array of arrays
                const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
                
                // Parse: Assume Row 1 is header (optional), look for Name/Points columns or just use indices 0 and 1
                const parsedData: {name: string, points: number}[] = [];
                
                // Skip header if it looks like a header (non-numeric points)
                let startIndex = 0;
                if (data.length > 0 && isNaN(Number(data[0][1]))) {
                    startIndex = 1;
                }

                for (let i = startIndex; i < data.length; i++) {
                    const row = data[i];
                    if (row.length >= 2 && row[0]) {
                        parsedData.push({
                            name: String(row[0]),
                            points: Number(row[1]) || 0
                        });
                    }
                }

                importPointsData(parsedData);
                setUploadStatus(`成功导入 ${parsedData.length} 条数据！`);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);

            } catch (err) {
                console.error(err);
                setUploadStatus('文件解析失败，请确保格式正确(Excel)。');
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gray-800 border-4 border-epe-neon w-full max-w-md p-6 relative shadow-[0_0_30px_rgba(0,243,255,0.3)]"
            >
                <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-white"><X /></button>
                <h2 className="text-2xl font-comic text-epe-neon mb-6 flex items-center gap-2">
                    <Zap className="fill-current" /> SYSTEM UPDATE
                </h2>

                {step === 'password' ? (
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <p className="text-gray-300 font-tech text-sm">请输入管理员密码以导入积分数据：</p>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                            <input 
                                type="password" 
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-gray-900 border-2 border-gray-600 p-2 pl-10 text-white font-mono focus:border-epe-neon focus:outline-none"
                                placeholder="输入密码..."
                            />
                        </div>
                        {error && <p className="text-epe-pink text-xs font-bold">{error}</p>}
                        <ComicButton color="neon" className="w-full">验证权限</ComicButton>
                    </form>
                ) : (
                    <div className="space-y-4 text-center">
                        <div className="bg-gray-900 border-2 border-dashed border-gray-500 rounded-lg p-8 hover:border-epe-neon transition-colors relative">
                            <input 
                                type="file" 
                                accept=".xlsx, .xls"
                                onChange={handleFileUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <FileSpreadsheet className="mx-auto text-gray-400 mb-2" size={48} />
                            <p className="text-white font-bold">点击上传 Excel 表格</p>
                            <p className="text-xs text-gray-500 mt-2">支持 .xlsx / .xls 格式</p>
                            <p className="text-xs text-gray-500">第一列：姓名 | 第二列：积分</p>
                        </div>
                        {uploadStatus && (
                            <p className={`font-mono text-sm ${uploadStatus.includes('失败') ? 'text-red-500' : 'text-green-400'}`}>
                                {uploadStatus}
                            </p>
                        )}
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const LeaderboardModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [logs, setLogs] = useState<DrawLog[]>([]);
    const [sortField, setSortField] = useState<'timestamp' | 'userName' | 'prizeName'>('timestamp');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        setLogs(getLogs());
    }, []);

    const handleSort = (field: typeof sortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc'); // Default to desc for new field
        }
    };

    const sortedLogs = [...logs].sort((a, b) => {
        let valA: any = a[fieldToKey(sortField)];
        let valB: any = b[fieldToKey(sortField)];

        // Handle string comparison
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
            if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        }

        // Handle number comparison
        return sortDirection === 'asc' ? valA - valB : valB - valA;
    });

    // Helper to map UI sort fields to DrawLog keys
    function fieldToKey(field: string): keyof DrawLog {
        return field as keyof DrawLog;
    }

    const getPrizeStyle = (type: PrizeType) => {
        switch(type) {
            case PrizeType.CASH: return 'text-green-600 font-bold bg-green-50 px-2 py-1 border border-green-200';
            case PrizeType.FRAGMENT: return 'text-amber-600 font-bold bg-amber-50 px-2 py-1 border border-amber-200';
            case PrizeType.PHYSICAL: return 'text-purple-600 font-bold bg-purple-50 px-2 py-1 border border-purple-200';
            case PrizeType.COUPON: return 'text-blue-500 bg-blue-50 px-2 py-1 border border-blue-200';
            case PrizeType.POINT: return 'text-gray-600';
            default: return 'text-gray-400';
        }
    };

    const SortButton = ({ field, label, icon: Icon }: any) => (
        <button 
            onClick={() => handleSort(field)}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-bold border-2 transition-all ${
                sortField === field 
                ? 'bg-epe-neon text-black border-black shadow-[2px_2px_0_0_rgba(0,0,0,1)]' 
                : 'bg-white text-gray-500 border-gray-300 hover:border-black'
            }`}
        >
            <Icon size={14} />
            {label}
            {sortField === field && (
                <ArrowUpDown size={12} className={sortDirection === 'asc' ? 'rotate-180' : ''} />
            )}
        </button>
    );

    return (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white w-full max-w-4xl h-[85vh] flex flex-col border-4 border-black shadow-comic-lg relative"
            >
                {/* Header */}
                <div className="bg-epe-yellow border-b-4 border-black p-4 flex justify-between items-center shrink-0">
                    <h2 className="text-3xl font-comic text-black stroke-white drop-shadow-md">中奖风云榜 TOP LIST</h2>
                    <button onClick={onClose} className="bg-black text-white p-1 hover:bg-gray-800"><X /></button>
                </div>

                {/* Stats & Controls Bar */}
                <div className="bg-gray-100 p-4 border-b-2 border-black flex flex-col md:flex-row justify-between items-center gap-4 z-10 shadow-sm shrink-0">
                     <div className="font-comic text-xl flex items-center gap-2 bg-white p-2 border-2 border-black shadow-[2px_2px_0_0_rgba(0,0,0,0.5)]">
                        <span className="font-tech text-gray-500 text-sm uppercase">总抽奖人次</span>
                        <span className="text-2xl font-black text-epe-pink">{logs.length}</span>
                     </div>
                     
                     <div className="flex items-center gap-2 bg-white p-2 rounded border border-gray-300 w-full md:w-auto overflow-x-auto">
                         <span className="font-bold text-xs text-gray-400 uppercase mr-2 whitespace-nowrap">排序方式:</span>
                         <div className="flex gap-2">
                            <SortButton field="timestamp" label="时间" icon={Clock} />
                            <SortButton field="userName" label="姓名" icon={UserIcon} />
                            <SortButton field="prizeName" label="奖品" icon={Gift} />
                         </div>
                     </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-4 bg-comic-pattern">
                    <div className="bg-white border-2 border-black shadow-comic">
                        <table className="w-full border-collapse">
                            <thead className="bg-black text-white font-tech uppercase text-sm sticky top-0 z-20">
                                <tr>
                                    <th className="p-3 text-left w-24">时间</th>
                                    <th className="p-3 text-left">姓名</th>
                                    <th className="p-3 text-left">奖品</th>
                                </tr>
                            </thead>
                            <tbody className="font-sans text-sm divide-y divide-gray-200">
                                {sortedLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-yellow-50 transition-colors">
                                        <td className="p-3 text-gray-500 font-mono align-middle">
                                            <div className="text-xs">{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div className="font-bold text-gray-800">{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                        <td className="p-3 align-middle">
                                            <div className="font-black text-black text-lg leading-tight">{log.userName}</div>
                                        </td>
                                        <td className="p-3 align-middle">
                                            <span className={`inline-block rounded ${getPrizeStyle(log.prizeType)}`}>
                                                {log.prizeName}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center text-gray-500 font-comic text-xl">NO DATA YET...</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

// --- Views ---

interface WelcomeViewProps {
  inputName: string;
  setInputName: (val: string) => void;
  handleLogin: (e: React.FormEvent) => void;
  setShowLeaderboard: (show: boolean) => void;
}

const WelcomeView: React.FC<WelcomeViewProps> = ({ inputName, setInputName, handleLogin, setShowLeaderboard }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
    className="relative max-w-md w-full p-8 z-10 flex flex-col items-center"
  >
    {/* Leaderboard Button - Fixed Position */}
    <button 
        onClick={() => setShowLeaderboard(true)}
        className="fixed top-4 right-4 z-50 bg-white border-2 border-black px-4 py-2 shadow-comic font-comic text-lg text-black hover:bg-epe-yellow transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
    >
        <Trophy className="text-epe-gold fill-current" /> 
        <span className="hidden md:inline">中奖风云榜</span>
        <span className="md:hidden">榜单</span>
    </button>

    {/* Manga Panel Style Container */}
    <div className="absolute inset-0 bg-white border-4 border-black shadow-comic-lg transform -skew-x-2 z-0"></div>
    
    <div className="relative z-10 text-center w-full flex flex-col items-center pt-6">
        <div className="mb-8 flex flex-col items-center w-full">
            <div className="inline-block bg-epe-pink text-white font-comic text-xl px-4 py-1 border-2 border-black -rotate-2 mb-6 shadow-comic">
                WELCOME TO
            </div>
            
            {/* Anime Style EPE Text */}
            <h1 className="text-9xl font-tech font-black italic tracking-tighter leading-none transform -skew-x-12 select-none relative"
                style={{
                    color: 'white',
                    WebkitTextStroke: '3px black',
                    textShadow: '6px 6px 0px #000, 10px 10px 0px #ff0080' // Black shadow + Pink accent offset
                }}
            >
                EPE
                {/* Decorative element */}
                <span className="absolute -top-4 -right-4 text-3xl text-epe-neon animate-bounce" style={{ textShadow: '2px 2px 0 #000', WebkitTextStroke: '1px black' }}>!</span>
            </h1>

            {/* Subtitle */}
            <h2 className="text-3xl font-tech font-black text-black tracking-wider uppercase italic transform -skew-x-12 mt-4" style={{ textShadow: '2px 2px 0 #00f3ff' }}>
                综合体能馆
            </h2>
            <div className="bg-black text-white px-2 py-0.5 text-xs font-bold tracking-[0.5em] uppercase mt-2 -skew-x-12">
                HYPER GACHA SYSTEM
            </div>
        </div>

      <form onSubmit={handleLogin} className="space-y-6 text-left w-full">
        <div>
            <label className="block font-comic text-xl text-black mb-1">YOUR NAME</label>
            <input 
                type="text" value={inputName} onChange={e => setInputName(e.target.value)}
                className="w-full bg-gray-100 border-2 border-black p-3 font-bold text-black focus:bg-epe-neon/20 focus:outline-none focus:shadow-comic transition-all"
                placeholder="输入姓名..."
            />
        </div>
        <ComicButton onClick={handleLogin} className="w-full mt-4">
            START MISSION
        </ComicButton>
      </form>
    </div>
  </motion.div>
);

interface ShopViewProps {
  user: User | null;
  activeTab: 'pull' | 'collection';
  setActiveTab: (tab: 'pull' | 'collection') => void;
  handleDraw: () => void;
  handleLogout: () => void;
  setShowAdmin: (show: boolean) => void;
  setShowRecharge: (show: boolean) => void;
  isOpening: boolean;
}

const ShopView: React.FC<ShopViewProps> = ({ user, activeTab, setActiveTab, handleDraw, handleLogout, setShowAdmin, setShowRecharge, isOpening }) => (
  <div className="w-full max-w-5xl mx-auto flex flex-col h-full z-10 px-4">
    {/* Manga Header */}
    <div className="flex justify-between items-start mb-8 relative">
       {/* User Badge */}
       <div className="bg-white border-2 border-black p-2 pr-6 shadow-comic flex items-center gap-3 transform -skew-x-12 origin-top-left">
           <div className="w-12 h-12 bg-black skew-x-12 ml-2 flex items-center justify-center border-2 border-epe-neon">
               <UserIcon size={24} className="text-epe-neon" />
           </div>
           <div className="skew-x-12">
               <div className="font-tech text-black text-lg leading-none uppercase">{user?.name}</div>
           </div>
       </div>
       
       {/* Stats & Controls */}
       <div className="flex gap-4 items-center">
          <div className="flex items-center transform skew-x-12 shadow-comic">
            <div className="bg-black text-epe-yellow border-2 border-white border-r-0 px-4 py-2 font-tech text-xl flex items-center gap-2">
                  <span className="-skew-x-12 flex items-center gap-2">
                    <Wallet size={20} />
                    {user?.points} PT
                  </span>
            </div>
            <button 
                onClick={() => setShowRecharge(true)}
                className="bg-epe-neon hover:bg-white text-black border-2 border-black border-l-0 px-2 py-2 flex items-center justify-center transition-colors"
                title="导入积分数据"
            >
                <Plus size={20} className="-skew-x-12" />
            </button>
          </div>

          <button onClick={() => setShowAdmin(true)} className="bg-gray-800 p-2 border-2 border-white text-white hover:bg-gray-700 shadow-comic transition-transform active:translate-y-1">
              <Settings size={20} />
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-epe-pink p-2 border-2 border-black text-white hover:bg-red-600 shadow-comic transition-transform active:translate-y-1 cursor-pointer z-50"
            title="退出登录"
          >
              <LogOut size={20} />
          </button>
       </div>
    </div>

    {/* Navigation Tabs (Comic Style) */}
    <div className="flex justify-center mb-10 space-x-6">
        <button 
          onClick={() => setActiveTab('pull')}
          className={`px-8 py-2 font-comic text-2xl border-2 border-black transition-all transform hover:-translate-y-1 ${activeTab === 'pull' ? 'bg-epe-neon text-black shadow-comic' : 'bg-gray-800 text-gray-400'}`}
        >
          抽卡中心
        </button>
        <button 
          onClick={() => setActiveTab('collection')}
          className={`px-8 py-2 font-comic text-2xl border-2 border-black transition-all transform hover:-translate-y-1 ${activeTab === 'collection' ? 'bg-epe-neon text-black shadow-comic' : 'bg-gray-800 text-gray-400'}`}
        >
          我的卡包
        </button>
    </div>

    <div className="flex-1 flex flex-col items-center justify-center relative min-h-[500px]">
      {activeTab === 'pull' ? (
           <div className="flex flex-col items-center gap-12">
              <div className="relative">
                  {/* Speech Bubble */}
                  <div className="absolute -top-12 -right-16 bg-white text-black font-comic px-4 py-2 rounded-xl border-2 border-black text-xl animate-bounce z-20">
                      Top Prize: ¥100!
                      <div className="absolute bottom-[-8px] left-4 w-4 h-4 bg-white border-r-2 border-b-2 border-black transform rotate-45"></div>
                  </div>
                  
                  <CardPack 
                      onClick={handleDraw} 
                      disabled={user ? user.points < COST_PER_DRAW : true}
                      isOpening={isOpening}
                  />
              </div>

              <div className="text-center">
                  <ComicButton 
                      onClick={handleDraw}
                      disabled={user ? user.points < COST_PER_DRAW : true}
                      color={(user?.points || 0) >= COST_PER_DRAW ? 'neon' : 'dark'}
                  >
                      {isOpening ? 'OPENING...' : 'OPEN PACK'}
                  </ComicButton>
                  <div className="mt-3 font-tech text-gray-400 text-sm tracking-wider">
                      COST: {COST_PER_DRAW} PT / DRAW
                  </div>
                  {(user?.points || 0) < COST_PER_DRAW && (
                      <div className="mt-2 text-epe-pink font-bold animate-pulse">
                          积分不足! 请联系管理员导入数据
                      </div>
                  )}
              </div>
           </div>
      ) : (
          <div className="w-full h-full bg-white/5 backdrop-blur-sm border-2 border-white/20 p-6 rounded-xl overflow-y-auto max-h-[600px] relative">
              <div className="absolute top-0 right-0 bg-epe-yellow text-black font-bold px-4 py-1 font-tech">INVENTORY</div>
              
              {/* Fragments Section */}
              <div className="mb-10">
                  <h3 className="text-epe-neon font-comic text-3xl mb-6 flex items-center gap-2 drop-shadow-md">
                      <Zap size={28} className="fill-current"/> LEGENDARY FRAGMENTS
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {Object.entries(FRAGMENT_DEFINITIONS).map(([fragId, name]) => {
                          const count = user?.fragments[fragId] || 0;
                          const isComplete = count >= FRAGMENTS_NEEDED;
                          return (
                              <div key={fragId} className={`p-4 border-2 border-black ${isComplete ? 'bg-gradient-to-r from-epe-gold to-yellow-300' : 'bg-gray-800'} relative shadow-comic group transition-transform hover:-translate-y-1`}>
                                  <div className="flex justify-between items-start z-10 relative">
                                      <div className={isComplete ? 'text-black' : 'text-white'}>
                                          <div className="font-bold font-tech text-lg mb-1">{name}</div>
                                          <div className="text-xs opacity-70">COLLECT {FRAGMENTS_NEEDED} TO REDEEM</div>
                                      </div>
                                      <div className={`text-4xl font-comic font-bold ${isComplete ? 'text-black' : 'text-epe-neon'}`}>
                                          {count}/{FRAGMENTS_NEEDED}
                                      </div>
                                  </div>
                                  {isComplete && (
                                      <button className="w-full mt-4 bg-black text-white font-comic py-2 uppercase hover:bg-gray-800">
                                          REDEEM REWARD!
                                      </button>
                                  )}
                              </div>
                          )
                      })}
                  </div>
              </div>

              {/* Inventory List */}
              <h3 className="text-white font-comic text-3xl mb-4 flex items-center gap-2">
                  <Gift size={28}/> LOOT HISTORY
              </h3>
              <div className="grid grid-cols-1 gap-3">
                  {user?.inventory.slice().reverse().map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-900 border-l-4 border-epe-neon p-4 shadow-sm hover:bg-gray-800 transition-colors">
                          <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center text-xl">
                                  {item.prizeName.includes('红包') ? '🧧' : item.prizeName.includes('积分') ? '🪙' : '🎁'}
                              </div>
                              <div>
                                  <div className="text-lg font-bold font-sans text-white">{item.prizeName}</div>
                                  <div className="text-xs text-gray-500 font-mono">{new Date(item.obtainedAt).toLocaleString()}</div>
                              </div>
                          </div>
                          {item.isRedeemed ? (
                              <span className="text-xs bg-gray-700 text-gray-400 px-2 py-1 rounded">CLAIMED</span>
                          ) : (
                              <span className="text-xs bg-epe-neon text-black font-bold px-2 py-1 rounded border border-black">NEW</span>
                          )}
                      </div>
                  ))}
                  {user?.inventory.length === 0 && <p className="text-gray-500 text-center py-10 font-comic text-xl">NO LOOT YET...</p>}
              </div>
          </div>
      )}
    </div>
  </div>
);

const getPrizeTypeName = (type: PrizeType) => {
  switch(type) {
    case PrizeType.EMPTY: return 'MISS';
    case PrizeType.POINT: return 'POINTS';
    case PrizeType.CASH: return 'CASH';
    case PrizeType.COUPON: return 'COUPON';
    case PrizeType.PHYSICAL: return 'ITEM';
    case PrizeType.FRAGMENT: return 'FRAGMENT';
    default: return type;
  }
};

interface ResultViewProps {
  currentPrize: Prize | null;
  closeResult: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ currentPrize, closeResult }) => {
  if (!currentPrize) return null;
  
  const isGood = currentPrize.type !== PrizeType.EMPTY && currentPrize.type !== PrizeType.POINT;
  const isRare = currentPrize.isRare;

  return (
      <div className="flex flex-col items-center justify-center h-full z-20 relative">
          
          {/* Background Burst for Rare Items */}
          {isRare && (
              <motion.div 
                  initial={{ scale: 0 }} animate={{ scale: 1.5, rotate: 180 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_30deg,rgba(255,215,0,0.2)_30deg_60deg)] z-[-1]" 
              />
          )}

          <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              className="perspective-1000"
          >
              <div className={`
                  w-80 h-[500px] relative flex flex-col items-center p-2 border-[6px] border-black shadow-[10px_10px_0_0_rgba(0,0,0,1)]
                  ${isRare ? 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-600' : 
                    isGood ? 'bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600' : 
                    'bg-gray-200'}
              `}>
                   {/* Card Frame Design */}
                   <div className="w-full h-full border-2 border-white/50 flex flex-col items-center p-4 relative overflow-hidden">
                       
                       {/* Rarity Stars */}
                       {isRare && (
                           <div className="absolute top-2 left-2 text-yellow-100 flex gap-1">
                               {'★★★★★'.split('').map((s,i) => <span key={i} className="drop-shadow-md">{s}</span>)}
                           </div>
                       )}

                       {/* Image Area Placeholder */}
                       <div className="w-full aspect-square bg-black/20 mt-6 border-2 border-black/50 flex items-center justify-center rounded-sm relative overflow-hidden">
                            {/* Dynamic Icon based on type */}
                            <div className="scale-150 transform transition-transform hover:scale-125 duration-500">
                                {currentPrize.type === PrizeType.CASH && <span className="text-6xl">🧧</span>}
                                {currentPrize.type === PrizeType.POINT && <Wallet size={80} className="text-white" />}
                                {currentPrize.type === PrizeType.PHYSICAL && <Trophy size={80} className="text-white" />}
                                {currentPrize.type === PrizeType.EMPTY && <RefreshCw size={80} className="text-gray-500" />}
                                {currentPrize.type === PrizeType.FRAGMENT && <div className="text-6xl">🧩</div>}
                                {currentPrize.type === PrizeType.COUPON && <div className="text-6xl font-bold text-white border-2 border-white rounded p-2">券</div>}
                            </div>
                            {/* Shine Effect */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent w-[200%] h-[200%] animate-spin-slow opacity-50"></div>
                       </div>

                       {/* Type Label */}
                       <div className="mt-4 bg-black text-white px-3 py-1 font-tech text-xs tracking-widest uppercase skew-x-[-10deg]">
                           {getPrizeTypeName(currentPrize.type)}
                       </div>

                       {/* Name */}
                       <h2 className="text-3xl font-comic text-black mt-2 text-center leading-none drop-shadow-sm stroke-white">
                           {currentPrize.name}
                       </h2>
                       
                       {/* Description */}
                       <div className="mt-auto bg-white/90 border-2 border-black p-2 w-full text-center font-sans text-xs font-bold text-black shadow-comic-hover">
                           {currentPrize.type === PrizeType.EMPTY ? "Don't give up! Try again!" : "Item added to inventory!"}
                       </div>
                   </div>
              </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex gap-4"
          >
              <ComicButton onClick={closeResult} color="red">
                  CONTINUE
              </ComicButton>
          </motion.div>
      </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'welcome' | 'shop' | 'result'>('welcome');
  const [inputName, setInputName] = useState('');
  const [currentPrize, setCurrentPrize] = useState<Prize | null>(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeTab, setActiveTab] = useState<'pull' | 'collection'>('pull');
  
  // Animation States
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    const existing = getUser();
    if (existing) {
      setUser(existing);
      setView('shop');
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputName) return;
    const newUser = initializeUser(inputName);
    setUser(newUser);
    setView('shop');
  };

  const handleLogout = () => {
      // Direct logout for better UX
      setUser(null);
      localStorage.removeItem('epe_user'); 
      setView('welcome');
      setInputName('');
      setActiveTab('pull');
  };

  const handleDraw = () => {
    if (!user || user.points < COST_PER_DRAW) {
      // Trigger recharge modal if points are low
      setShowRecharge(true);
      return;
    }
    
    // 1. Start Opening Animation (CardPack tears)
    setIsOpening(true);
    
    // 2. Wait for tear animation (0.5s shake + 0.4s rip)
    setTimeout(() => {
        // Perform calculation
        const result = performDraw(user);
        if (result) {
            setUser(result.updatedUser);
            setCurrentPrize(result.result);
            // 3. Switch to result view
            setView('result');
            setIsOpening(false); // Reset opening state
        }
    }, 1500);
  };

  const closeResult = () => {
    setCurrentPrize(null);
    setView('shop');
  };

  const handleRechargeSuccess = () => {
      // Refresh user data to show new points
      const updated = getUser();
      if (updated) setUser(updated);
  };

  return (
    <div className="min-h-screen bg-comic-pattern text-white font-sans overflow-hidden flex flex-col relative">
       {/* Global Speed Lines */}
       <SpeedLines />

       {/* Main Content Area */}
       <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
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

       {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
       {showRecharge && <RechargeModal onClose={() => setShowRecharge(false)} onSuccess={handleRechargeSuccess} />}
       {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
};

export default App;