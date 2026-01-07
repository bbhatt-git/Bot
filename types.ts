export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  SUCCESS = 'SUCCESS',
  SYSTEM = 'SYSTEM'
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  module: 'CRAWLER' | 'DAST' | 'FORM_BOT' | 'CORE';
}

export interface Vulnerability {
  id: string;
  type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location: string;
  payload_used?: string;
}

export interface ScanStats {
  pagesCrawled: number;
  formsDetected: number;
  vulnsFound: number;
  durationSeconds: number;
}

export interface AgentConfig {
  targetUrl: string;
  depth: number;
  stealthMode: boolean;
  aggressiveScan: boolean;
}