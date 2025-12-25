
import React, { useEffect, useState } from 'react';
import { getLogs, resetSystem, getPointsDB, redeemLog, getCloudId, setCloudId, syncFromCloud, pushToCloud } from '../services/storage';
import { DrawLog, PrizeType } from '../types';
import { PRIZE_POOL } from '../constants';
// Add History to lucide-react imports to avoid conflict with global History interface
import { Download, Trash2, CheckCircle, Clock, XCircle, Cloud, RefreshCw, Upload, Info, AlertTriangle, Zap, Database, History } from 'lucide-react';

declare const XLSX: any;

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<DrawLog[]>([]);
  const [pointsDB, setPointsDB] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'probs' | 'system'>('logs');
  const [cloudId, setCloudIdState] = useState(getCloudId() || '');
  const [syncLoading, setSyncLoading] = useState(false);

  useEffect(() => {
    setLogs(getLogs());
    setPointsDB(getPointsDB());
  }, []);

  const handleCloudIdSave = () => {
    setCloudId(cloudId);
    alert('ID 已保存! // 云端同步 ID 已就绪！');
  };

  const handleSyncPull = async () => {
      setSyncLoading(true);
      const success = await syncFromCloud();
      setSyncLoading(false);
      if (success) {
          setLogs(getLogs());
          setPointsDB(getPointsDB());
      }
  };

  const handleSyncPush = async () => {
      setSyncLoading(true);
      await pushToCloud();
      setSyncLoading(false);
      alert('推送成功! // 本地数据已覆盖云端！');
  };

  const handleRedeem = async (logId: string) => {
    const updatedLogs = await redeemLog(logId);
    setLogs([...updatedLogs]);
  };

  const handleExportExcel = () => {
    try {
        const data = Object.entries(pointsDB).map(([name, points]) => ({
            "姓名": name,
            "当前积分": points
        }));
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Points_Export");
        XLSX.writeFile(wb, `EPE_ADMIN_DATA_${new Date().toISOString().slice(0,10)}.xlsx`);
    } catch (e) { alert("导出失败"); }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-anime-dark w-full max-w-6xl h-[90vh] border-2 border-anime-blue shadow-neon-blue flex flex-col overflow-hidden relative">
        {/* Decorative Background for Admin */}
        <div className="absolute inset-0 bg-comic-dots opacity-5 pointer-events-none" />

        {/* Header - Comic Style */}
        <div className="p-6 border-b border-anime-blue flex justify-between items-center bg-gray-900/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-anime-blue text-black p-2 -rotate-3">
              <Zap size={24} />
            </div>
            <h2 className="text-3xl font-tech italic text-white tracking-wider uppercase">EPE CORE SYSTEM</h2>
          </div>
          <button 
            onClick={onClose} 
            className="bg-red-600 text-white px-6 py-2 font-tech text-xl border border-red-400 hover:bg-red-500 transition-all active:scale-95"
          >
            EXIT [X]
          </button>
        </div>

        {/* Navigation Tabs - Skewed Blocks */}
        <div className="flex bg-black p-2 gap-2 relative z-10">
            {['logs', 'users', 'probs', 'system'].map((tab) => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)} 
                    className={`flex-1 py-3 px-4 font-tech text-lg tracking-widest uppercase transition-all skew-x-6 border-b-2
                        ${activeTab === tab ? 'bg-anime-blue/20 text-anime-blue border-anime-blue shadow-[0_0_10px_rgba(56,182,255,0.3)]' : 'bg-transparent text-gray-500 border-transparent hover:text-white'}`}
                >
                    <span className="-skew-x-6 block">{tab === 'logs' ? '抽奖记录' : tab === 'users' ? '用户积分' : tab === 'probs' ? '奖池配置' : '云同步'}</span>
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 relative z-10">
            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-800 p-4 border-l-4 border-anime-orange">
                        <div className="flex items-center gap-2 text-white">
                           <History className="text-anime-orange" />
                           <span className="font-mono uppercase">Total Logs: <span className="text-anime-orange text-2xl">{logs.length}</span></span>
                        </div>
                        <button onClick={handleSyncPull} className="bg-anime-blue text-black px-4 py-1 font-bold text-xs uppercase flex items-center gap-2 hover:bg-white">
                           <RefreshCw size={14} className={syncLoading ? 'animate-spin' : ''} /> 刷新数据
                        </button>
                    </div>
                    
                    <div className="bg-gray-900 border border-gray-700 overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[700px] text-gray-300">
                            <thead className="bg-black text-anime-blue font-mono uppercase text-sm">
                                <tr>
                                    <th className="p-4">Time</th>
                                    <th className="p-4">Trainer</th>
                                    <th className="p-4">Item</th>
                                    <th className="p-4 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {logs.map((log) => (
                                    <tr key={log.id} className={`hover:bg-white/5 ${log.redeemedAt ? 'opacity-50' : ''}`}>
                                        <td className="p-4 font-mono text-[10px] text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                        <td className="p-4 font-bold text-white text-lg">{log.userName}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 text-[10px] font-bold uppercase inline-block mb-1 
                                                ${log.prizeType === PrizeType.CASH ? 'bg-anime-orange text-black' : 'bg-gray-700 text-white'}`}>
                                                {log.prizeType}
                                            </span>
                                            <div className="font-bold text-white">{log.prizeName}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center">
                                                {log.redeemedAt ? (
                                                    <div className="flex items-center gap-2 text-green-500 font-bold uppercase">
                                                        <CheckCircle size={20} /> Redeemed
                                                    </div>
                                                ) : (log.prizeType === PrizeType.EMPTY || log.prizeType === PrizeType.POINT) ? (
                                                    <span className="text-gray-600">--</span>
                                                ) : (
                                                    <button onClick={() => handleRedeem(log.id)} className="bg-anime-blue text-black text-xs font-bold px-6 py-2 hover:bg-white transition-all shadow-[0_0_10px_rgba(56,182,255,0.5)]">
                                                        兑换核销
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-end">
                        <div className="bg-anime-orange text-black p-2 skew-x-6 px-8">
                            <h3 className="font-tech text-xl italic uppercase -skew-x-6">TRAINER RANKINGS</h3>
                        </div>
                        <button onClick={handleExportExcel} className="bg-gray-800 text-white px-6 py-2 font-mono text-sm border border-gray-600 hover:border-anime-blue hover:text-anime-blue transition-all">
                            EXPORT .XLSX
                        </button>
                    </div>
                    <div className="bg-gray-900 border border-gray-700">
                        <table className="w-full text-left text-gray-300">
                            <thead className="bg-black text-anime-orange font-mono text-sm uppercase">
                                <tr><th className="p-4">Name</th><th className="p-4 text-right">Points</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {Object.entries(pointsDB).map(([name, points]) => (
                                    <tr key={name} className="hover:bg-white/5">
                                        <td className="p-4 text-white font-bold text-xl uppercase italic">{name}</td>
                                        <td className="p-4 text-right font-mono text-2xl text-anime-blue">{points} <span className="text-xs text-gray-500">PTS</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-2xl mx-auto space-y-10 py-10">
                    <div className="bg-gray-900 border border-anime-blue p-10 relative overflow-hidden">
                         <div className="absolute inset-0 bg-comic-dots opacity-10" />
                        <h3 className="text-white font-tech text-3xl mb-6 flex items-center gap-4 relative z-10">
                            <Cloud className="text-anime-blue" size={40} /> SYNC CENTER
                        </h3>
                        <p className="text-gray-400 text-xs font-bold mb-8 leading-relaxed uppercase tracking-wider relative z-10">
                            Connect multiple devices via Cloud ID.<br/>
                            Powered by NPOINT JSON Storage.
                        </p>

                        <div className="space-y-6 relative z-10">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-anime-blue uppercase">Cloud Source ID</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={cloudId} 
                                        onChange={(e) => setCloudIdState(e.target.value)}
                                        className="flex-1 bg-black border border-gray-600 p-4 font-mono text-lg text-white focus:outline-none focus:border-anime-blue"
                                        placeholder="API ID..."
                                    />
                                    <button onClick={handleCloudIdSave} className="bg-anime-blue text-black px-8 font-bold hover:bg-white">SAVE</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6">
                                <button onClick={handleSyncPull} disabled={!cloudId || syncLoading} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 p-6 flex flex-col items-center gap-2 text-white">
                                    <RefreshCw className={syncLoading ? 'animate-spin text-anime-blue' : ''} size={32} />
                                    <span className="font-tech text-xl">PULL DATA</span>
                                </button>
                                <button onClick={handleSyncPush} disabled={!cloudId || syncLoading} className="bg-anime-blue/20 hover:bg-anime-blue/40 border border-anime-blue p-6 flex flex-col items-center gap-2 text-anime-blue">
                                    <Upload size={32} />
                                    <span className="font-tech text-xl">PUSH DATA</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-900 p-8">
                        <div className="flex items-center gap-4 mb-4">
                           <AlertTriangle className="text-red-500" size={32} />
                           <h4 className="text-red-500 font-tech text-2xl uppercase">DANGER ZONE</h4>
                        </div>
                        <button onClick={() => {if(confirm('确认清除所有数据？')) resetSystem()}} className="bg-red-600 text-white px-8 py-3 font-bold uppercase hover:bg-red-500 w-full">RESET SYSTEM</button>
                    </div>
                </div>
            )}

            {activeTab === 'probs' && (
                <div className="bg-gray-900 border border-gray-700">
                    <table className="w-full text-left text-gray-300">
                        <thead className="bg-black text-white font-mono text-sm uppercase">
                            <tr><th className="p-4">Tier / Name</th><th className="p-4">Type</th><th className="p-4 text-right">Prob</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {PRIZE_POOL.map((prize) => (
                                <tr key={prize.id} className="hover:bg-white/5">
                                    <td className="p-4 flex items-center gap-3 text-white font-bold">
                                        {prize.isRare && <span className="bg-anime-orange text-black text-[10px] px-2 py-0.5 skew-x-12">SSR</span>}
                                        {prize.name}
                                    </td>
                                    <td className="p-4 text-gray-500 font-bold uppercase text-xs">{prize.type}</td>
                                    <td className="p-4 text-right font-mono text-xl text-anime-blue">{prize.probability.toFixed(2)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
