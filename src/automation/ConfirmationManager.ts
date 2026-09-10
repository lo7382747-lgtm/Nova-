/**
 * ConfirmationManager
 * Manages explicit user confirmations for MEDIUM and HIGH risk automation requests.
 * Prompts user via UI dialog or audio prompt before allowing execution.
 */

import { Action, RiskLevel } from './types';

export interface PendingConfirmation {
  id: string;
  automationName: string;
  action: Action;
  riskLevel: RiskLevel;
  reason: string;
  timestamp: number;
  resolve: (confirmed: boolean) => void;
}

export class ConfirmationManager {
  private static instance: ConfirmationManager;

  private pendingRequests: PendingConfirmation[] = [];
  private listeners: ((pending: PendingConfirmation[]) => void)[] = [];

  public static getInstance(): ConfirmationManager {
    if (!ConfirmationManager.instance) {
      ConfirmationManager.instance = new ConfirmationManager();
    }
    return ConfirmationManager.instance;
  }

  public getPendingRequests(): PendingConfirmation[] {
    return [...this.pendingRequests];
  }

  public subscribe(listener: (pending: PendingConfirmation[]) => void): () => void {
    this.listeners.push(listener);
    listener(this.getPendingRequests());
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    const list = this.getPendingRequests();
    this.listeners.forEach((l) => l(list));
  }

  /**
   * Requests explicit user confirmation for a sensitive action.
   * Returns a promise that resolves to true (approved) or false (denied).
   */
  public requestConfirmation(
    automationName: string,
    action: Action,
    riskLevel: RiskLevel,
    reason: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const confirmationId = `conf_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const item: PendingConfirmation = {
        id: confirmationId,
        automationName,
        action,
        riskLevel,
        reason,
        timestamp: Date.now(),
        resolve,
      };

      this.pendingRequests.push(item);
      this.notify();
    });
  }

  public respond(confirmationId: string, confirmed: boolean): void {
    const idx = this.pendingRequests.findIndex((p) => p.id === confirmationId);
    if (idx !== -1) {
      const [req] = this.pendingRequests.splice(idx, 1);
      this.notify();
      req.resolve(confirmed);
    }
  }

  public cancelAll(): void {
    for (const req of this.pendingRequests) {
      req.resolve(false);
    }
    this.pendingRequests = [];
    this.notify();
  }
}

export const confirmationManager = ConfirmationManager.getInstance();
