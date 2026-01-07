
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Terminal as TerminalIcon, Shield, Search, Cpu, Save, Map } from 'lucide-react';
import Terminal from './components/Terminal';
import VulnerabilityCard from './components/VulnerabilityCard';
import StatsPanel from './components/StatsPanel';
import CrawlMap from './components/CrawlMap';
import { LogEntry, LogLevel, Vulnerability, ScanStats, CrawlNode } from './types';
import { analyzeTargetForSimulation, analyzeCodeSnippet } from './services/geminiService';

const API_KEY_AVAILABLE = !!process.env.API_KEY;

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [crawlNodes, setCrawlNodes] = useState<CrawlNode[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'DAST' | 'CODE_LAB' | 'TOPOLOGY'>('TERMINAL');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeAnalysis, setCodeAnalysis] = useState('');
  const [stats, setStats] = useState<ScanStats>({
    pagesCrawled: 0,
    formsDetected: 0,
    vulnsFound: 0,
    durationSeconds: 0
  });

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isScanning) {
      interval = setInterval(() => {
        setStats(prev => ({ ...prev, durationSeconds: prev.durationSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScanning]);

  const addLog = (level: LogLevel, message: string, module: 'CRAWLER' | 'DAST' | 'FORM_BOT' | 'CORE') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
      module
    };
    setLogs(prev => [...prev.slice(-49), newLog]);
  };

  // Fixed the "Cannot find name 'analyzeCode'" error by implementing the function
  const analyzeCode = async () => {
    if (!codeSnippet.trim()) return;
    setCodeAnalysis("Initializing Static Analysis Engine...");
    try {
      const result = await analyzeCodeSnippet(codeSnippet);
      setCodeAnalysis(result);
    } catch (error) {
      setCodeAnalysis("Analysis failed. Check logs.");
    }
  };

  const startScan = useCallback(async () => {
    if (!targetUrl) return;
    if (!API_KEY_AVAILABLE) {
       addLog(LogLevel.ERROR, 'API_KEY not found in environment.', 'CORE');
       return;
    }

    setIsScanning(true);
    setLogs([]);
    setVulnerabilities([]);
    setCrawlNodes([]);
    setStats({ pagesCrawled: 0, formsDetected: 0, vulnsFound: 0, durationSeconds: 0 });
    
    addLog(LogLevel.SYSTEM, `Initializing Sentinel Agent v2.4`, 'CORE');
    addLog(LogLevel.INFO, `Target acquired: ${targetUrl}`, 'CORE');

    try {
      await new Promise(r => setTimeout(r, 800));
      
      // Seed root node
      const rootNode: CrawlNode = { id: 'root', url: '/', status: 'visited', depth: 0 };
      setCrawlNodes([rootNode]);

      for (let i = 0; i < 5; i++) {
        if (!isScanning) break;

        // Visual "Working" indicator
        addLog(LogLevel.INFO, `Deep-scanning path segment ${i+1}...`, 'CRAWLER');
        
        const simData = await analyzeTargetForSimulation(targetUrl);
        
        // Add Simulated URLs to Topology
        const newPaths = ['/api/v1', '/login', '/dashboard', '/settings', '/search', '/assets/js', '/.env', '/config.php'];
        const path = newPaths[Math.floor(Math.random() * newPaths.length)] + `?id=${Math.floor(Math.random() * 100)}`;
        
        setCrawlNodes(prev => [
            ...prev, 
            { 
              id: Math.random().toString(), 
              url: path, 
              status: simData.vulnerabilities.length > 0 ? 'vuln' : 'visited', 
              depth: i + 1 
            }
        ]);

        simData.logs.forEach((log, idx) => {
           setTimeout(() => {
             addLog(log.level as LogLevel, log.message, log.module as any);
             if (log.module === 'CRAWLER') setStats(s => ({...s, pagesCrawled: s.pagesCrawled + 1}));
             if (log.module === 'FORM_BOT') setStats(s => ({...s, formsDetected: s.formsDetected + 1}));
           }, idx * 150);
        });

        if (simData.vulnerabilities.length > 0) {
            simData.vulnerabilities.forEach(v => {
                 setVulnerabilities(prev => {
                     if (prev.find(p => p.type === v.type)) return prev;
                     addLog(LogLevel.WARN, `ALERT: Found ${v.type} at ${v.location}`, 'DAST');
                     setStats(s => ({...s, vulnsFound: s.vulnsFound + 1}));
                     return [...prev, { ...v, id: Math.random().toString(36) }];
                 });
            });
        }

        await new Promise(r => setTimeout(r, 3000));
      }

      addLog(LogLevel.SUCCESS, 'Mission Parameters Met. Finalizing data...', 'CORE');
    } catch (e) {
      addLog(LogLevel.ERROR, 'Simulation error: check console.', 'CORE');
    } finally {
      setIsScanning(false);
    }
  }, [targetUrl, isScanning]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500/10 p-2 rounded-full border border-green-500/20">
            <Cpu className="text-green-500" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">
            Sentinel <span className="text-green-500 text-[10px] ml-1">Kernel_v2.4</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-[10px] text-slate-500 font-mono hidden sm:block">
             Uptime: {stats.durationSeconds}s | Threads: 128 | Latency: 14ms
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col max-w-[1600px] mx-auto w-full space-y-6">
        
        {/* URL Input */}
        <div className="w-full">
            <div className="flex space-x-2">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                        <Search size={16} />
                    </div>
                    <input
                        type="text"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="Target URI..."
                        disabled={isScanning}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded bg-slate-900/50 text-slate-300 placeholder-slate-600 focus:outline-none focus:border-green-500/50 sm:text-sm transition-all"
                    />
                </div>
                <button
                    onClick={isScanning ? () => setIsScanning(false) : startScan}
                    disabled={!targetUrl && !isScanning}
                    className={`inline-flex items-center px-8 py-3 rounded text-sm font-bold transition-all ${isScanning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700 disabled:opacity-30'}`}
                >
                    {isScanning ? <Square size={16} className="mr-2" /> : <Play size={16} className="mr-2" />}
                    {isScanning ? 'ABORT' : 'INITIATE'}
                </button>
            </div>
        </div>

        <StatsPanel stats={stats} isScanning={isScanning} />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          {/* Navigation */}
          <div className="lg:col-span-2 space-y-2">
            {[
              { id: 'TERMINAL', icon: TerminalIcon, label: 'Live Logs' },
              { id: 'TOPOLOGY', icon: Map, label: 'Site Map' },
              { id: 'DAST', icon: Shield, label: 'Findings', badge: vulnerabilities.length },
              { id: 'CODE_LAB', icon: Save, label: 'SAST Lab' }
            ].map((tab) => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded border transition-all text-sm ${activeTab === tab.id ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'text-slate-500 border-transparent hover:border-slate-800 hover:text-slate-300'}`}
              >
                <tab.icon size={16} />
                <span className="font-semibold">{tab.label}</span>
                {tab.badge ? <span className="ml-auto bg-red-600 text-white text-[10px] px-1.5 rounded-full">{tab.badge}</span> : null}
              </button>
            ))}

            <div className="pt-6 mt-6 border-t border-slate-900">
                <div className="text-[10px] text-slate-600 uppercase mb-2 font-bold tracking-tighter">System Output</div>
                <div className="space-y-1">
                    <div className="h-1 w-full bg-slate-900 rounded-full overflow-hidden">
                        <div className={`h-full bg-green-500 ${isScanning ? 'animate-pulse' : 'w-0'}`} style={{width: isScanning ? '70%' : '0%'}}></div>
                    </div>
                    <div className="text-[9px] text-slate-700 font-mono">Kernel Load: High</div>
                </div>
            </div>
          </div>

          {/* Dynamic Viewport */}
          <div className="lg:col-span-10 min-h-[500px] flex flex-col space-y-4">
            <div className="flex-1 bg-black/20 border border-slate-800 rounded-lg overflow-hidden relative">
              {activeTab === 'TERMINAL' && <Terminal logs={logs} />}
              {activeTab === 'TOPOLOGY' && <CrawlMap nodes={crawlNodes} isScanning={isScanning} />}
              {activeTab === 'DAST' && (
                  <div className="p-6 h-full overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4">
                      {vulnerabilities.map(v => <VulnerabilityCard key={v.id} vuln={v} />)}
                      {vulnerabilities.length === 0 && (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-600 border border-dashed border-slate-800 rounded italic">
                          No active vulnerabilities in current buffer.
                        </div>
                      )}
                    </div>
                  </div>
              )}
              {activeTab === 'CODE_LAB' && (
                <div className="h-full flex flex-col p-6 space-y-4">
                  <textarea 
                    className="flex-1 bg-black/40 border border-slate-800 rounded p-4 font-mono text-xs text-green-300 focus:outline-none focus:border-green-500/50 resize-none"
                    placeholder="// Source for Static Analysis..."
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                  />
                  <button onClick={analyzeCode} className="bg-slate-800 py-3 text-sm font-bold hover:bg-slate-700 border border-slate-700 rounded transition-colors">START SAST SCAN</button>
                  <div className="h-48 bg-slate-900/50 border border-slate-800 rounded p-4 overflow-y-auto font-mono text-xs text-slate-400 whitespace-pre-wrap">
                    {codeAnalysis || 'SAST Idle.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
