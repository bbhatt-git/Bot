import React from 'react';
import { ScanStats } from '../types';
import { Activity, Bug, Globe, Lock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  stats: ScanStats;
  isScanning: boolean;
}

const StatsPanel: React.FC<Props> = ({ stats, isScanning }) => {
  const data = [
    { name: 'Secure', value: 100 - (stats.vulnsFound * 5) },
    { name: 'Critical', value: stats.vulnsFound * 5 },
  ];

  const COLORS = ['#334155', '#ef4444'];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded flex items-center justify-between">
        <div>
          <div className="text-slate-500 text-xs uppercase">Target Status</div>
          <div className={`text-xl font-bold ${isScanning ? 'text-green-500 animate-pulse' : 'text-slate-200'}`}>
            {isScanning ? 'LIVE' : 'IDLE'}
          </div>
        </div>
        <Activity className={isScanning ? 'text-green-500' : 'text-slate-600'} />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded flex items-center justify-between">
        <div>
          <div className="text-slate-500 text-xs uppercase">Pages Mapped</div>
          <div className="text-xl font-bold text-blue-400">{stats.pagesCrawled}</div>
        </div>
        <Globe className="text-blue-500/50" />
      </div>

      <div className="bg-slate-900/50 border border-slate-800 p-4 rounded flex items-center justify-between">
        <div>
          <div className="text-slate-500 text-xs uppercase">Vulns Detected</div>
          <div className="text-xl font-bold text-red-400">{stats.vulnsFound}</div>
        </div>
        <Bug className="text-red-500/50" />
      </div>

       <div className="bg-slate-900/50 border border-slate-800 p-2 rounded flex items-center justify-center relative">
          <ResponsiveContainer width="100%" height={60}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={15}
                outerRadius={25}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#333' }}
                itemStyle={{ color: '#fff' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <Lock size={12} className="absolute text-slate-500" />
      </div>
    </div>
  );
};

export default StatsPanel;