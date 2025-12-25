
import React, { useEffect, useState } from 'react';
import { getLogs, resetSystem, getPointsDB, redeemLog, getCloudId, setCloudId, syncFromCloud, pushToCloud, createCloudBin } from '../services/storage';
import { DrawLog, PrizeType } from '../types';
import { PRIZE_POOL } from '../constants';
import { CheckCircle, Cloud, RefreshCw, Upload, AlertTriangle, Zap, History, Plus, ExternalLink, Activity, Save, HelpCircle, Copy, Edit3 } from 'lucide-react';

declare const XLSX: any;

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<DrawLog[]>([]);
  const [pointsDB, setPointsDB] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'logs' | 'users' | 'probs' | 'system'>('logs');
  const [cloudId, setCloudIdState] = useState(getCloudId() || '');
  const [syncStatus, setSyncStatus] = useState<{loading: boolean, msg: string, type: 'idle'|'success'|'error'}>({
      loading: false, msg: '', type: 'idle'
  });
  // 默认展开手动指南，方便用户查看
  const [showManualGuide, setShowManualGuide] = useState(true);

  useEffect(() => {
    setLogs(getLogs());
    setPointsDB(getPointsDB());
  }, []);

  const handleCloudIdSave = () => {
    // 自动清理 ID 中的无关字符（比如用户如果不小心复制了整个 URL）
    let cleanedId = cloudId.trim();
    if (cleanedId.includes('/')) {
        const parts = cleanedId.split('/');
        cleanedId = parts[parts.length - 1];
    }
    setCloudId(cleanedId);
    setCloudIdState(cleanedId);
    setSyncStatus({ loading: false, msg: 'ID 已保存! 请尝试 PUSH 或 PULL', type: 'success' });
  };

  const handleGenerateId = async () => {
      setSyncStatus({ loading: true, msg: '正在尝试连接 JSONBlob...', type: 'idle' });
      const newId = await createCloudBin();
      
      if (newId) {
          setCloudIdState(newId);
          setCloudId(newId);
          const pushRes = await pushToCloud(); 
          if (pushRes.success) {
             setSyncStatus({ loading: false, msg: `成功! ID: ${newId} (已初始化)`, type: 'success' });
             setShowManualGuide(false); // 成功了就折叠指南
          } else {
             setSyncStatus({ loading: false, msg: `ID生成成功但上传失败: ${pushRes.message}`, type: 'error' });
          }
      } else {
          setSyncStatus({ loading: false, msg: '网络拦截 (CORS Error)。请使用下方的【手动方法】，100%成功！', type: 'error' });
          setShowManualGuide(true); // 失败了务必展开指南
      }
  };

  const handleSyncPull = async () => {
      if (!cloudId) { alert("请先输入 Cloud ID"); return; }
      setSyncStatus({ loading: true, msg: '正在下载...', type: 'idle' });
      const res = await syncFromCloud();
      setSyncStatus({ loading: false, msg: res.message, type: res.success ? 'success' : 'error' });
      
      if (res.success) {
          setLogs(getLogs());
          setPointsDB(getPointsDB());
      }
  };

  const handleSyncPush = async () => {
      if (!cloudId) { alert("请先输入 Cloud ID"); return; }
      setSyncStatus({ loading: true, msg: '正在上传...', type: 'idle' });
      const res = await pushToCloud();
      setSyncStatus({ loading: false, msg: res.message, type: res.success ? 'success' : 'error' });
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
        <div className="absolute inset-0 bg-comic-dots opacity-5 pointer-events-none" />

        {/* Header */}
        <div className="p-6 border-b border-anime-blue flex justify-between items-center bg-gray-900/50 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-anime-blue text-black p-2 -rotate-3">
              <Zap size={24} />
            </div>
            <h2 className="text-3xl font-tech italic text-white tracking-wider uppercase">EPE CORE SYSTEM</h2>
          </div>
          <button onClick={onClose} className="bg-red-600 text-white px-6 py-2 font-tech text-xl hover:bg-red-500">EXIT [X]</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-black p-2 gap-2 relative z-10">
            {['logs', 'users', 'probs', 'system'].map((tab) => (
                <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab as any)} 
                    className={`flex-1 py-3 px-4 font-tech text-lg tracking-widest uppercase transition-all border-b-2
                        ${activeTab === tab ? 'bg-anime-blue/20 text-anime-blue border-anime-blue' : 'text-gray-500 border-transparent'}`}
                >
                    {tab === 'logs' ? '抽奖记录' : tab === 'users' ? '用户积分' : tab === 'probs' ? '奖池配置' : '云同步设置'}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 relative z-10">
            {activeTab === 'logs' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center bg-gray-800 p-4 border-l-4 border-anime-orange">
                        <div className="flex items-center gap-2 text-white">
                           <History className="text-anime-orange" />
                           <span className="font-mono uppercase">Total Logs: <span className="text-anime-orange text-2xl">{logs.length}</span></span>
                        </div>
                        <button onClick={handleSyncPull} className="bg-anime-blue text-black px-4 py-1 font-bold text-xs uppercase flex items-center gap-2 hover:bg-white">
                           <RefreshCw size={14} className={syncStatus.loading ? 'animate-spin' : ''} /> 刷新数据
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
                                                    <button onClick={() => handleRedeem(log.id)} className="bg-anime-blue text-black text-xs font-bold px-6 py-2 hover:bg-white">
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
                        <div className="bg-anime-orange text-black p-2 px-8">
                            <h3 className="font-tech text-xl italic uppercase">TRAINER RANKINGS</h3>
                        </div>
                        <button onClick={handleExportExcel} className="bg-gray-800 text-white px-6 py-2 font-mono text-sm border border-gray-600 hover:border-anime-blue">
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
                <div className="max-w-2xl mx-auto space-y-8 py-6">
                    <div className="bg-gray-900 border border-anime-blue p-8 relative overflow-hidden">
                        <div className="absolute inset-0 bg-comic-dots opacity-10" />
                        <h3 className="text-white font-tech text-3xl mb-6 flex items-center gap-4 relative z-10">
                            <Cloud className="text-anime-blue" size={40} /> 云端同步 (SYNC)
                        </h3>
                        
                        {/* Status Bar */}
                        <div className={`mb-6 p-4 border flex items-center gap-3 relative z-10 transition-colors duration-300
                            ${syncStatus.type === 'error' ? 'bg-red-900/30 border-red-500 text-red-200' : 
                              syncStatus.type === 'success' ? 'bg-green-900/30 border-green-500 text-green-200' : 
                              'bg-gray-800 border-gray-600 text-gray-400'}`}>
                            {syncStatus.loading ? <RefreshCw className="animate-spin" /> : <Activity />}
                            <span className="font-bold">{syncStatus.msg || '系统就绪 / READY'}</span>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-anime-blue uppercase">Cloud ID (粘贴到这里)</label>
                                <div className="flex gap-4">
                                    <input 
                                        type="text" 
                                        value={cloudId} 
                                        onChange={(e) => setCloudIdState(e.target.value)}
                                        className="flex-1 bg-black border border-gray-600 p-4 font-mono text-lg text-white focus:outline-none focus:border-anime-blue"
                                        placeholder="例如: 1335xxxx-xxxx-xxxx..."
                                    />
                                    <button onClick={handleCloudIdSave} className="bg-gray-800 text-white px-6 font-bold hover:bg-white hover:text-black border border-gray-600 flex items-center gap-2">
                                        <Save size={18} /> 保存 ID
                                    </button>
                                </div>
                                
                                <div className="flex flex-col gap-3 mt-4">
                                    {/* 自动按钮 */}
                                    <button 
                                        onClick={handleGenerateId} 
                                        disabled={syncStatus.loading}
                                        className="bg-gray-800 text-gray-400 border border-dashed border-gray-600 py-3 font-bold flex items-center justify-center gap-2 hover:text-white text-sm"
                                    >
                                        <Plus size={16} /> 尝试自动生成 ID (可能被拦截)
                                    </button>
                                    
                                    <button 
                                        onClick={() => setShowManualGuide(!showManualGuide)}
                                        className="text-xs text-anime-orange hover:text-white flex items-center gap-2 justify-center py-2 underline"
                                    >
                                        <HelpCircle size={14} /> ID 如何获取？点击查看【手动获取教程】
                                    </button>

                                    {showManualGuide && (
                                        <div className="bg-black/80 p-6 border-2 border-anime-blue/50 text-sm text-gray-300 space-y-4 rounded shadow-xl relative animate-in fade-in slide-in-from-top-2">
                                            <h4 className="font-tech text-lg text-white text-center mb-2">手动获取 ID 教程 (100% 成功)</h4>
                                            
                                            <div className="space-y-4">
                                                <div className="flex gap-3">
                                                    <div className="bg-anime-blue text-black font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</div>
                                                    <div>
                                                        点击打开: <a href="https://jsonblob.com/new" target="_blank" className="text-anime-orange font-bold underline text-lg">jsonblob.com/new</a>
                                                        <div className="text-xs text-gray-500 mt-1">会打开一个新的浏览器标签页</div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="bg-anime-blue text-black font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Edit3 size={14} className="text-anime-orange"/>
                                                            <strong className="text-white">关键步骤：激活保存按钮</strong>
                                                        </div>
                                                        如果网页右上角/左上角的 <span className="bg-white text-black px-1 font-bold">Save</span> 按钮是<span className="text-gray-500 font-bold">灰色</span>的，请在页面中间的大输入框里输入一对大括号 <code className="bg-gray-700 text-green-400 px-1">{'{}'}</code>，或者随意敲个空格，按钮就会变亮！
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="bg-anime-blue text-black font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</div>
                                                    <div>
                                                        点击 <span className="bg-white text-black px-1 font-bold">Save</span> 后，查看浏览器地址栏：<br/>
                                                        <code className="bg-gray-800 px-1 py-0.5 text-green-400 block mt-1">jsonblob.com/api/jsonBlob/1335xxxx-xxxx...</code>
                                                        <div className="mt-2 font-bold text-white">复制 URL 最后那串长 ID！</div>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="bg-anime-blue text-black font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">4</div>
                                                    <div>
                                                        回到本页面，粘贴 ID 到上方输入框 → 点击保存 → 点击下方的 <span className="text-anime-blue font-bold">PUSH (上传)</span>。
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-800">
                                <button onClick={handleSyncPull} disabled={!cloudId || syncStatus.loading} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 p-6 flex flex-col items-center gap-2 text-white group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
                                    <RefreshCw className={`text-anime-blue group-hover:rotate-180 transition-transform ${syncStatus.loading ? 'animate-spin' : ''}`} size={32} />
                                    <span className="font-tech text-xl relative z-10">PULL (下载)</span>
                                    <span className="text-xs text-gray-500 relative z-10">其他设备: 填入ID后点此同步数据</span>
                                </button>
                                <button onClick={handleSyncPush} disabled={!cloudId || syncStatus.loading} className="bg-anime-blue/10 hover:bg-anime-blue/30 border border-anime-blue p-6 flex flex-col items-center gap-2 text-anime-blue group relative overflow-hidden">
                                    <div className="absolute inset-0 bg-anime-blue/5 pointer-events-none" />
                                    <Upload className="group-hover:-translate-y-1 transition-transform relative z-10" size={32} />
                                    <span className="font-tech text-xl relative z-10">PUSH (上传)</span>
                                    <span className="text-xs text-anime-blue/70 relative z-10">管理员: 初始化或保存修改</span>
                                </button>
                            </div>
                            
                            <p className="text-[10px] text-gray-500 text-center">
                                * 如果点击 PULL 提示 404，说明 ID 粘贴错误或未先执行 PUSH。
                            </p>
                        </div>
                    </div>

                    <div className="bg-red-900/20 border border-red-900 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <AlertTriangle className="text-red-500" size={24} />
                           <span className="text-red-500 font-bold">重置所有数据 (RESET)</span>
                        </div>
                        <button onClick={() => {if(confirm('确认清除所有数据？此操作不可逆！')) resetSystem()}} className="bg-red-600 text-white px-6 py-2 font-bold hover:bg-red-500">
                            执行重置
                        </button>
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
