import React, { useEffect, useRef } from 'react';
import { LogEntry, LogLevel } from '../types';

interface TerminalProps {
  logs: LogEntry[];
}

const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getColor = (level: LogLevel) => {
    switch (level) {
      case LogLevel.INFO: return 'text-blue-400';
      case LogLevel.WARN: return 'text-yellow-400';
      case LogLevel.ERROR: return 'text-red-500';
      case LogLevel.SUCCESS: return 'text-green-400';
      case LogLevel.SYSTEM: return 'text-purple-400';
      default: return 'text-gray-300';
    }
  };

  return (
    <div className="bg-black/90 border border-gray-800 rounded-md font-mono text-xs sm:text-sm h-full flex flex-col shadow-2xl overflow-hidden relative">
      {/* Terminal Header */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
          <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
        </div>
        <div className="text-gray-500 text-xs tracking-widest uppercase">sentinel_daemon_v2.4.1</div>
      </div>

      {/* Terminal Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        
        {logs.length === 0 && (
          <div className="text-gray-600 animate-pulse">Waiting for target acquisition...</div>
        )}

        {logs.map((log) => (
          <div key={log.id} className="flex space-x-3 hover:bg-gray-900/50 p-0.5 rounded transition-colors">
            <span className="text-gray-600 shrink-0">[{log.timestamp}]</span>
            <span className={`font-bold w-20 shrink-0 ${getColor(log.level)}`}>{log.module}</span>
            <span className="text-gray-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default Terminal;