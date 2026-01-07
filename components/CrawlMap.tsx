import React from 'react';
import { CrawlNode } from '../types';
import { Network } from 'lucide-react';

interface Props {
  nodes: CrawlNode[];
  isScanning: boolean;
}

const CrawlMap: React.FC<Props> = ({ nodes, isScanning }) => {
  return (
    <div className="bg-black/40 border border-slate-800 rounded-lg p-4 h-full flex flex-col relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center">
          <Network size={14} className="mr-2 text-green-500" /> Site Topology (BFS)
        </h3>
        <span className="text-[10px] font-mono text-slate-600">{nodes.length} nodes indexed</span>
      </div>

      <div className="flex-1 relative flex flex-wrap gap-2 content-start overflow-y-auto">
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-700 italic text-sm">
            Topology empty. Engaged target to map.
          </div>
        )}
        
        {nodes.map((node) => (
          <div 
            key={node.id}
            className={`
              text-[10px] px-2 py-1 rounded border font-mono transition-all duration-500 animate-in fade-in zoom-in
              ${node.status === 'vuln' ? 'bg-red-500/20 border-red-500 text-red-400' : 
                node.status === 'visited' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 
                'bg-slate-800/50 border-slate-700 text-slate-500'}
            `}
          >
            {node.url}
          </div>
        ))}

        {isScanning && (
          <div className="w-4 h-4 rounded-full bg-green-500 animate-ping absolute bottom-4 right-4 opacity-50"></div>
        )}
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
    </div>
  );
};

export default CrawlMap;