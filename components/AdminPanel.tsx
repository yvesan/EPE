
import React, { useEffect, useState } from 'react';
import { getLogs, resetSystem, getPointsDB, redeemLog, exportFullSystemData, importFullSystemData } from '../services/storage';
import { DrawLog, PrizeType } from '../types';
import { PRIZE_POOL } from '../constants';
import { Download, Trash2, CheckCircle, Clock, XCircle, Database, UploadCloud, Info } from 'lucide-react';

declare const XLSX: any;

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<DrawLog[]>([]);
  const [pointsDB, setPointsDB] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'logs' | 'probs' | 'users' | 'system'>('logs');

  useEffect(() => {
    setLogs(getLogs());
    setPointsDB(getPointsDB());
  }, []);

  const getTypeColor = (type: PrizeType) => {
    switch(type) {
      case PrizeType.CASH: return 'text-green-400';
      case PrizeType.FRAGMENT: return 'text-epe-gold';
      case PrizeType.PHYSICAL: return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeName = (type: PrizeType) => {
    switch(type) {
      case PrizeType.EMPTY: return '未中奖';
      case PrizeType.POINT: return '积分';
      case PrizeType.CASH: return '现金红包';
      case PrizeType.COUPON: return '代金券';
      case PrizeType.PHYSICAL: return '实物奖品';
      case PrizeType.FRAGMENT: return '传说碎片';
      default: return type;
    }
  };

  const handleRedeem = (logId: string) => {
    const updatedLogs = redeemLog(logId);
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
        XLSX.utils.book_append_sheet(wb, ws, "积分明细");
        const date = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `EPE_积分明细_${date}.xlsx`);
    } catch (e) {
        console.error("Export failed", e);
        alert("导出失败");
    }
  };

  const handleRestoreSystem = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (evt) => {
          const content = evt.target?.result as string;
          if (importFullSystemData(content)) {
              alert("系统数据已完全恢复！页面即将刷新。");
              window.location.reload();
          } else {
              alert("恢复失败，请确保使用正确的 .json 备份文件。");
          }
      };
      reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-900 w-full max-w-6xl h-[85vh] rounded-2xl border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b-4 border-black flex justify-between items-center bg-epe-yellow">
          <h2 className="text-2xl font-black font-tech text-black tracking-tighter italic">EPE ADMIN SYSTEM // 后台管理</h2>
          <button onClick={onClose} className="bg-black text-white px-4 py-2 font-comic hover:bg-gray-800 transition-colors">CLOSE [X]</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-800 border-b-2 border-black overflow-x-auto shrink-0">
            <button onClick={() => setActiveTab('logs')} className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'logs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                抽奖记录与核销
            </button>
            <button onClick={() => setActiveTab('users')} className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                学员积分档案
            </button>
            <button onClick={() => setActiveTab('probs')} className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'probs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                奖池概率
            </button>
            <button onClick={() => setActiveTab('system')} className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'system' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                系统同步
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-comic-pattern">
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6 bg-white border-2 border-black p-4 shadow-comic">
                        <div className="flex items-center gap-4">
                            <span className="font-tech text-black uppercase">Draw Logs: <span className="text-epe-pink text-2xl">{logs.length}</span></span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 italic">
                            <Info size={14} /> 所有中奖历史均被永久保存，除非手动重置系统
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-none overflow-hidden border-2 border-black shadow-comic overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[700px]">
                            <thead className="bg-black text-white font-tech uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="p-4 border-b-2 border-black">时间戳</th>
                                    <th className="p-4 border-b-2 border-black">中奖人</th>
                                    <th className="p-4 border-b-2 border-black">奖品明细</th>
                                    <th className="p-4 border-b-2 border-black text-center">状态管理</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {logs.map((log) => {
                                    const needsRedemption = log.prizeType !== PrizeType.EMPTY && log.prizeType !== PrizeType.POINT;
                                    const isRedeemed = !!log.redeemedAt;
                                    return (
                                        <tr key={log.id} className={`transition-colors ${isRedeemed ? 'bg-green-50' : 'hover:bg-yellow-50'}`}>
                                            <td className="p-4 text-gray-500 font-mono">
                                                <div className="font-bold text-black">{new Date(log.timestamp).toLocaleDateString()}</div>
                                                <div className="text-xs">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            </td>
                                            <td className="p-4"><div className="font-black text-lg text-black">{log.userName}</div></td>
                                            <td className="p-4 font-medium">
                                                <span className={`text-xs px-2 py-0.5 rounded border border-current mb-1 inline-block ${getTypeColor(log.prizeType)}`}>
                                                    {getTypeName(log.prizeType)}
                                                </span>
                                                <div className="text-black font-bold text-base">{log.prizeName}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-center justify-center min-h-[60px]">
                                                    {needsRedemption ? (
                                                        isRedeemed ? (
                                                            <div className="flex flex-col items-center text-green-600 bg-white border-2 border-green-600 px-4 py-2 shadow-[4px_4px_0_0_#16a34a]">
                                                                <div className="flex items-center gap-2 font-black text-sm uppercase italic">
                                                                    <CheckCircle size={18} /> 核销完成
                                                                </div>
                                                                <span className="text-[10px] mt-1 font-mono bg-green-600 text-white px-1">
                                                                    {new Date(log.redeemedAt!).toLocaleString([], {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <button onClick={() => handleRedeem(log.id)} className="group bg-epe-neon hover:bg-white text-black text-xs font-black py-2 px-6 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 uppercase italic">
                                                                点击核销奖品
                                                            </button>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-gray-400 font-bold italic text-xs uppercase"><XCircle size={14} /> 无需核销</div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6 bg-white border-2 border-black p-5 shadow-comic">
                        <div>
                            <h3 className="text-black font-black text-xl italic uppercase tracking-tighter">Points Registry / 积分档案</h3>
                            <p className="text-xs text-gray-500 font-bold">同步新 Excel 时，历史中奖记录不受影响</p>
                        </div>
                        <button onClick={handleExportExcel} className="bg-black text-white px-6 py-3 font-tech italic hover:bg-epe-neon hover:text-black transition-all shadow-comic active:translate-y-1 flex items-center gap-2">
                            <Download size={18} /> EXPORT EXCEL
                        </button>
                    </div>
                    <div className="bg-white border-2 border-black shadow-comic overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[400px]">
                            <thead className="bg-black text-white font-tech uppercase">
                                <tr><th className="p-4 border-b-2 border-black">#</th><th className="p-4 border-b-2 border-black">学员姓名</th><th className="p-4 border-b-2 border-black text-right">剩余积分 (PT)</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Object.entries(pointsDB).map(([name, points], idx) => (
                                    <tr key={name} className="hover:bg-yellow-50 transition-colors">
                                        <td className="p-4 text-gray-400 font-mono w-20">{idx + 1}</td>
                                        <td className="p-4 text-black font-black text-lg">{name}</td>
                                        <td className="p-4 text-right font-tech text-xl text-epe-pink">{points} <span className="text-xs text-black">PT</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'system' && (
                <div className="max-w-2xl mx-auto space-y-8 py-10">
                    <div className="bg-white border-4 border-black p-8 shadow-comic-lg">
                        <h3 className="text-black font-comic text-3xl mb-4 italic flex items-center gap-3">
                            <Database className="text-epe-pink" /> 跨设备数据同步
                        </h3>
                        <p className="text-gray-600 text-sm mb-6 font-bold leading-relaxed">
                            注意：由于这是离线 Web 应用，您的数据存储在当前浏览器的缓存中。<br/>
                            如果您想在其他电脑或浏览器上看到相同的数据（包括中奖历史和核销状态），请通过下方功能进行导出与导入。
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-tech text-black uppercase text-sm">Step 1: 导出全量备份</h4>
                                <button onClick={exportFullSystemData} className="w-full bg-black text-white p-4 font-comic text-xl hover:bg-gray-800 transition-all flex flex-col items-center justify-center gap-2 border-2 border-black shadow-comic">
                                    <Download size={24} />
                                    <span>DOWNLOAD BACKUP</span>
                                    <span className="text-[10px] opacity-50 font-sans">(.json 系统镜像)</span>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-tech text-black uppercase text-sm">Step 2: 恢复/导入备份</h4>
                                <div className="relative">
                                    <input type="file" accept=".json" onChange={handleRestoreSystem} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                    <button className="w-full bg-epe-neon text-black p-4 font-comic text-xl hover:bg-white transition-all flex flex-col items-center justify-center gap-2 border-2 border-black shadow-comic">
                                        <UploadCloud size={24} />
                                        <span>RESTORE SYSTEM</span>
                                        <span className="text-[10px] opacity-50 font-sans">(上传备份文件)</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-red-50 border-4 border-red-600 p-8 shadow-comic">
                        <h3 className="text-red-600 font-comic text-3xl mb-4 italic flex items-center gap-3">
                            <Trash2 /> 危险区域 / DANGER ZONE
                        </h3>
                        <p className="text-red-800 text-sm mb-6 font-bold">
                            重置系统将抹除所有学员信息、当前积分以及全部中奖记录。此操作不可撤销，请务必先进行备份。
                        </p>
                        <button onClick={() => { if(confirm('⚠️ 警告：这将永久删除所有记录！\n确定要清空系统吗？')) resetSystem(); }} className="bg-red-600 text-white px-8 py-3 font-tech italic hover:bg-black transition-all">
                            RESET ENTIRE SYSTEM
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'probs' && (
                <div className="bg-white border-2 border-black shadow-comic overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[500px]">
                        <thead className="bg-black text-white font-tech uppercase">
                            <tr><th className="p-4 border-b-2 border-black">奖项名称</th><th className="p-4 border-b-2 border-black">类别</th><th className="p-4 border-b-2 border-black text-right">中奖概率</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {PRIZE_POOL.map((prize) => (
                                <tr key={prize.id} className="hover:bg-yellow-50 transition-colors">
                                    <td className="p-4 flex items-center gap-2 text-black font-bold">
                                        {prize.isRare && <span className="text-[10px] bg-epe-pink text-white px-2 py-0.5 font-black uppercase italic shadow-sm">RARE</span>}
                                        {prize.name}
                                    </td>
                                    <td className="p-4 text-gray-500 font-bold uppercase text-xs italic">{getTypeName(prize.type)}</td>
                                    <td className="p-4 text-right font-tech text-lg text-black">{prize.probability.toFixed(2)}%</td>
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
