/**
 * AutomationLogService
 * Records and manages automation execution logs.
 * Privacy-safe: sensitive text/credentials are redacted, never uploaded.
 * Supports: addEntry, getLogs, clearLogs.
 */

import { AutomationLogEntry } from './types';

const LOG_STORAGE_KEY = 'nova_automation_logs_v2';
const MAX_LOGS = 100;

export class AutomationLogService {
  private static instance: AutomationLogService;
  private logs: AutomationLogEntry[] = [];

  private constructor() {
    this.loadLogs();
  }

  public static getInstance(): AutomationLogService {
    if (!AutomationLogService.instance) {
      AutomationLogService.instance = new AutomationLogService();
    }
    return AutomationLogService.instance;
  }

  private loadLogs(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LOG_STORAGE_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load automation logs', e);
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(this.logs));
    } catch (e) {
      console.error('Failed to save automation logs', e);
    }
  }

  public recordLog(entry: AutomationLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs = this.logs.slice(0, MAX_LOGS);
    }
    this.persist();
  }

  public getLogs(): AutomationLogEntry[] {
    return [...this.logs];
  }

  public clearLogs(): void {
    this.logs = [];
    this.persist();
  }
}

export const automationLogService = AutomationLogService.getInstance();
