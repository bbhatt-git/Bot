import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Terminal as TerminalIcon, Shield, Search, Cpu, Save } from 'lucide-react';
import Terminal from './components/Terminal';
import VulnerabilityCard from './components/VulnerabilityCard';
import StatsPanel from './components/StatsPanel';
import { LogEntry, LogLevel, Vulnerability, ScanStats, AgentConfig } from './types';
import { analyzeTargetForSimulation, analyzeCodeSnippet } from './services/geminiService';
import { GoogleGenAI } from '@google/genai';

// Initialize GenAI client purely to check API key presence
const API_KEY_AVAILABLE = !!process.env.API_KEY;

export default function App() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [targetUrl, setTargetUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'TERMINAL' | 'DAST' | 'CODE_LAB'>('TERMINAL');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeAnalysis, setCodeAnalysis] = useState('');
  const [stats, setStats] = useState<ScanStats>({
    pagesCrawled: 0,
    formsDetected: 0,
    vulnsFound: 0,
    durationSeconds: 0
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Stats timer
  useEffect(() => {
    // Fixed: Cannot find namespace 'NodeJS'. Used ReturnType<typeof setInterval> instead.
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
    setLogs(prev => [...prev, newLog]);
  };

  const startScan = useCallback(async () => {
    if (!targetUrl) {
      addLog(LogLevel.ERROR, 'Target URL is required.', 'CORE');
      return;
    }
    if (!API_KEY_AVAILABLE) {
       // Fixed: Argument of type '"SYSTEM"' is not assignable to parameter of type '"CRAWLER" | "DAST" | "FORM_BOT" | "CORE"'. Changed to 'CORE'.
       addLog(LogLevel.ERROR, 'API_KEY not found in environment.', 'CORE');
       return;
    }

    setIsScanning(true);
    setLogs([]);
    setVulnerabilities([]);
    setStats({ pagesCrawled: 0, formsDetected: 0, vulnsFound: 0, durationSeconds: 0 });
    
    addLog(LogLevel.SYSTEM, `Initializing Sentinel Agent v2.4`, 'CORE');
    addLog(LogLevel.INFO, `Target acquired: ${targetUrl}`, 'CORE');
    addLog(LogLevel.INFO, `Loading stealth modules (puppeteer-extra-plugin-stealth)...`, 'CRAWLER');

    try {
      // Step 1: Simulate Initial Connection
      await new Promise(r => setTimeout(r, 800));
      addLog(LogLevel.SUCCESS, `Headless Browser Launched (PID: ${Math.floor(Math.random() * 9000) + 1000})`, 'CRAWLER');
      
      // Step 2: Use Gemini to hallucinate the specific crawl steps for this domain
      const steps = 4;
      for (let i = 0; i < steps; i++) {
        if (!isScanning && i > 0) break; // Break if stopped

        // Fetch simulated data from Gemini based on the target
        const simData = await analyzeTargetForSimulation(targetUrl);
        
        // Process Logs
        simData.logs.forEach((log, idx) => {
           setTimeout(() => {
             addLog(log.level as LogLevel, log.message, log.module as any);
             if (log.module === 'CRAWLER') setStats(s => ({...s, pagesCrawled: s.pagesCrawled + 1}));
             if (log.module === 'FORM_BOT') setStats(s => ({...s, formsDetected: s.formsDetected + 1}));
           }, idx * 200);
        });

        // Process Vulnerabilities
        if (simData.vulnerabilities.length > 0) {
            simData.vulnerabilities.forEach(v => {
                 setVulnerabilities(prev => {
                     // Dedup
                     if (prev.find(p => p.type === v.type)) return prev;
                     
                     addLog(LogLevel.WARN, `VULNERABILITY DETECTED: ${v.type}`, 'DAST');
                     setStats(s => ({...s, vulnsFound: s.vulnsFound + 1}));
                     return [...prev, { ...v, id: Math.random().toString(36) }];
                 });
            });
        }

        await new Promise(r => setTimeout(r, 4000)); // Wait before next batch of simulated steps
      }

      addLog(LogLevel.SUCCESS, 'Scan Complete. Generating Report...', 'CORE');

    } catch (e) {
      addLog(LogLevel.ERROR, 'Agent connection severed unexpectedly.', 'CORE');
    } finally {
      setIsScanning(false);
    }
  }, [targetUrl, isScanning]);

  const stopScan = () => {
    setIsScanning(false);
    addLog(LogLevel.WARN, 'Manual Override: Scan Aborted.', 'CORE');
  };

  const analyzeCode = async () => {
      if(!codeSnippet) return;
      setCodeAnalysis("Analyzing...");
      const result = await analyzeCodeSnippet(codeSnippet);
      setCodeAnalysis(result);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans">
      {/* Navbar */}
      <header className="h-16 border-b border-slate-800 flex items-center px-6 justify-between bg-black/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <div className="bg-green-500/10 p-2 rounded-full border border-green-500/20">
            <Cpu className="text-green-500" size={20} />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            SENTINEL <span className="text-green-500 text-xs font-mono ml-2">v2.4.1</span>
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
           {!API_KEY_AVAILABLE && (
               <div className="text-xs bg-red-900/50 text-red-200 px-3 py-1 rounded border border-red-500/50">
                   MISSING API_KEY
               </div>
           )}
          <div className="text-xs text-slate-500 font-mono">
             MEM: {Math.floor(Math.random() * 40 + 20)}% | NET: SECURE
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col">
        
        {/* Input Bar */}
        <div className="max-w-4xl mx-auto w-full mb-6">
            <div className="flex space-x-2">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-slate-500 group-focus-within:text-green-500 transition-colors" />
                    </div>
                    <input
                        type="text"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        placeholder="Enter Target URL (e.g. https://vulnerable-app.com)"
                        disabled={isScanning}
                        className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-md leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-all"
                    />
                </div>
                {isScanning ? (
                    <button
                        onClick={stopScan}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                        <Square className="mr-2 h-4 w-4 fill-current" /> STOP
                    </button>
                ) : (
                    <button
                        onClick={startScan}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                        disabled={!targetUrl}
                    >
                        <Play className="mr-2 h-4 w-4 fill-current" /> ENGAGE
                    </button>
                )}
            </div>
        </div>

        <StatsPanel stats={stats} isScanning={isScanning} />

        {/* Dashboard Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Sidebar / Tabs */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-2">
              <button 
                onClick={() => setActiveTab('TERMINAL')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${activeTab === 'TERMINAL' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <TerminalIcon size={18} />
                <span className="font-medium text-sm">Live Terminal</span>
              </button>
              <button 
                onClick={() => setActiveTab('DAST')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${activeTab === 'DAST' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Shield size={18} />
                <span className="font-medium text-sm">Findings & Reports</span>
                {vulnerabilities.length > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{vulnerabilities.length}</span>
                )}
              </button>
              <button 
                onClick={() => setActiveTab('CODE_LAB')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-all ${activeTab === 'CODE_LAB' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'text-slate-400 hover:bg-white/5'}`}
              >
                <Save size={18} />
                <span className="font-medium text-sm">Code Analysis Lab</span>
              </button>
            </div>

            {/* Simulated Proxy Config */}
            <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 text-xs font-mono text-slate-500">
                <div className="mb-2 uppercase tracking-wider text-slate-600">Proxy Rotation</div>
                <div className="flex items-center justify-between mb-1">
                    <span>Status:</span>
                    <span className="text-green-500">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                    <span>Current IP:</span>
                    <span className="text-slate-300">192.168.X.X</span>
                </div>
                <div className="flex items-center justify-between">
                    <span>Rotation:</span>
                    <span className="text-slate-300">Every 45s</span>
                </div>
            </div>
          </div>

          {/* Main Viewport */}
          <div className="lg:col-span-9 bg-slate-900/20 border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[500px] lg:h-auto">
            
            {activeTab === 'TERMINAL' && (
                <Terminal logs={logs} />
            )}

            {activeTab === 'DAST' && (
                <div className="h-full overflow-y-auto p-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center">
                        <Shield className="mr-2 text-green-500" /> Security Audit Report
                    </h2>
                    {vulnerabilities.length === 0 ? (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                            <Shield size={48} className="mb-4 opacity-20" />
                            <p>No vulnerabilities detected yet.</p>
                            <p className="text-xs mt-2">Start a scan to begin heuristic analysis.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {vulnerabilities.map((v) => (
                                <VulnerabilityCard key={v.id} vuln={v} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'CODE_LAB' && (
                <div className="h-full flex flex-col p-4 space-y-4">
                    <div className="flex-1 flex flex-col">
                        <label className="text-xs text-slate-400 mb-2 uppercase font-bold">Paste Source Code (PHP, JS, Python)</label>
                        <textarea 
                            className="flex-1 bg-black/50 border border-slate-700 rounded p-3 font-mono text-sm text-green-300 focus:outline-none focus:border-green-500 resize-none"
                            placeholder="// Paste suspicious code here..."
                            value={codeSnippet}
                            onChange={(e) => setCodeSnippet(e.target.value)}
                        />
                    </div>
                    <button 
                        onClick={analyzeCode}
                        className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded text-sm font-medium border border-slate-600"
                    >
                        Run Static Analysis
                    </button>
                    <div className="flex-1 bg-slate-900/80 border border-slate-800 rounded p-4 overflow-y-auto">
                        <label className="text-xs text-slate-500 mb-2 block uppercase font-bold">Analysis Output</label>
                        <div className="prose prose-invert prose-sm">
                           {codeAnalysis ? <div className="whitespace-pre-wrap font-mono text-sm">{codeAnalysis}</div> : <span className="text-slate-600 italic">Waiting for input...</span>}
                        </div>
                    </div>
                </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}