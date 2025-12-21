
import React, { useEffect, useState } from 'react';
import { getLogs, resetSystem, getPointsDB, redeemLog } from '../services/storage';
import { DrawLog, PrizeType } from '../types';
import { PRIZE_POOL } from '../constants';
import { Download, Trash2, CheckCircle, Clock, XCircle } from 'lucide-react';

// Declaration for xlsx library loaded via CDN
declare const XLSX: any;

export const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<DrawLog[]>([]);
  const [pointsDB, setPointsDB] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<'logs' | 'probs' | 'users'>('logs');

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
    // 立即更新状态以提供即时反馈
    const updatedLogs = redeemLog(logId);
    setLogs([...updatedLogs]); // 使用展开运算符确保 React 检测到数组引用变化
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
        
        // Generate filename with timestamp
        const date = new Date().toISOString().slice(0,10);
        XLSX.writeFile(wb, `EPE_积分明细_${date}.xlsx`);
    } catch (e) {
        console.error("Export failed", e);
        alert("导出失败，请检查浏览器兼容性");
    }
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
        <div className="flex bg-gray-800 border-b-2 border-black overflow-x-auto">
            <button 
                onClick={() => setActiveTab('logs')}
                className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'logs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
                抽奖记录与核销
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'users' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
                学员积分档案
            </button>
            <button 
                onClick={() => setActiveTab('probs')}
                className={`flex-1 py-4 px-6 font-bold text-sm tracking-widest uppercase transition-all ${activeTab === 'probs' ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
            >
                奖池概率配置
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-comic-pattern">
            {activeTab === 'logs' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6 bg-white border-2 border-black p-4 shadow-comic">
                        <div className="flex items-center gap-4">
                            <span className="font-tech text-black">TOTAL DRAWS: <span className="text-epe-pink text-2xl">{logs.length}</span></span>
                        </div>
                        <button 
                            onClick={() => { if(confirm('⚠️ 警告：这将删除所有学员积分和中奖记录！\n确定要重置吗？')) resetSystem(); }}
                            className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-red-600 flex items-center gap-2 transition-colors uppercase italic"
                        >
                            <Trash2 size={14} />
                            RESET SYSTEM DATA
                        </button>
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
                                            <td className="p-4">
                                                <div className="font-black text-lg text-black">{log.userName}</div>
                                            </td>
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
                                                            <div className="flex flex-col items-center text-green-600 bg-white border-2 border-green-600 px-4 py-2 shadow-[4px_4px_0_0_#16a34a] animate-in zoom-in duration-300">
                                                                <div className="flex items-center gap-2 font-black text-sm uppercase italic">
                                                                    <CheckCircle size={18} />
                                                                    核销完成
                                                                </div>
                                                                <span className="text-[10px] mt-1 font-mono bg-green-600 text-white px-1">
                                                                    {new Date(log.redeemedAt!).toLocaleString([], {month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleRedeem(log.id)}
                                                                className="group bg-epe-neon hover:bg-white text-black text-xs font-black py-2 px-6 border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center gap-2 uppercase italic"
                                                            >
                                                                <div className="w-2 h-2 bg-black rounded-full group-hover:animate-ping" />
                                                                点击核销奖品
                                                            </button>
                                                        )
                                                    ) : (
                                                        <div className="flex items-center gap-1 text-gray-400 font-bold italic text-xs uppercase">
                                                            <XCircle size={14} />
                                                            无需核销
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {logs.length === 0 && (
                        <div className="text-center py-20 bg-white border-2 border-black border-dashed">
                             <p className="font-comic text-3xl text-gray-300">SYSTEM EMPTY // 暂无数据</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'users' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center mb-6 bg-white border-2 border-black p-5 shadow-comic">
                        <div>
                            <h3 className="text-black font-black text-xl italic uppercase tracking-tighter">Database: Points Registry</h3>
                            <p className="text-xs text-gray-500 font-bold">已录入总人数: {Object.keys(pointsDB).length}</p>
                        </div>
                        <button 
                            onClick={handleExportExcel}
                            className="bg-black text-white px-6 py-3 font-tech italic hover:bg-epe-neon hover:text-black transition-all shadow-comic active:translate-y-1 flex items-center gap-2"
                        >
                            <Download size={18} />
                            EXPORT TO EXCEL
                        </button>
                    </div>

                    <div className="bg-white border-2 border-black shadow-comic overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[400px]">
                            <thead className="bg-black text-white font-tech uppercase sticky top-0">
                                <tr>
                                    <th className="p-4 border-b-2 border-black">#</th>
                                    <th className="p-4 border-b-2 border-black">学员姓名</th>
                                    <th className="p-4 border-b-2 border-black text-right">剩余积分 (PT)</th>
                                </tr>
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

            {activeTab === 'probs' && (
                <div className="bg-white border-2 border-black shadow-comic overflow-hidden overflow-x-auto">
                     <table className="w-full text-left text-sm min-w-[500px]">
                        <thead className="bg-black text-white font-tech uppercase">
                            <tr>
                                <th className="p-4 border-b-2 border-black">奖项名称</th>
                                <th className="p-4 border-b-2 border-black">类别</th>
                                <th className="p-4 border-b-2 border-black text-right">中奖概率</th>
                            </tr>
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
                            <tr className="bg-gray-100 font-black border-t-4 border-black italic uppercase">
                                <td colSpan={2} className="p-4 text-black">TOTAL PROBABILITY / 总概率</td>
                                <td className="p-4 text-right text-black">100.00%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
