/**
 * LoopProtection
 * Safeguards automation execution against:
 * - Maximum action count (e.g. 25 per execution chain)
 * - Maximum total execution time (e.g. 60 seconds)
 * - Infinite loop detection (repeating cycles of identical actions)
 * - Recursive automation protection (A calls B calls A)
 */

import { Action } from './types';

export class LoopProtection {
  private maxActions: number;
  private maxDurationMs: number;
  private maxIdenticalConsecutiveActions: number;

  private actionFingerprints: string[] = [];
  private executionStartTime: number = 0;
  private activeCallStack: Set<string> = new Set();

  constructor(
    maxActions: number = 25,
    maxDurationMs: number = 60000,
    maxIdenticalConsecutiveActions: number = 3
  ) {
    this.maxActions = maxActions;
    this.maxDurationMs = maxDurationMs;
    this.maxIdenticalConsecutiveActions = maxIdenticalConsecutiveActions;
  }

  public reset(automationId?: string): void {
    this.actionFingerprints = [];
    this.executionStartTime = Date.now();
    if (automationId) {
      this.activeCallStack.clear();
      this.activeCallStack.add(automationId);
    }
  }

  /**
   * Checks whether executing this automation introduces recursive cycles
   */
  public checkRecursion(automationId: string): { safe: boolean; reason?: string } {
    if (this.activeCallStack.has(automationId)) {
      return {
        safe: false,
        reason: `Recursive automation loop detected: "${automationId}" was already in active execution stack.`,
      };
    }
    this.activeCallStack.add(automationId);
    return { safe: true };
  }

  /**
   * Evaluates before each action execution.
   */
  public validateNextAction(action: Action, currentCount: number): { safe: boolean; reason?: string } {
    // 1. Max action count check
    if (currentCount >= this.maxActions) {
      return {
        safe: false,
        reason: `Exceeded maximum allowable action threshold of ${this.maxActions} steps. Execution halted to prevent runaway loops.`,
      };
    }

    // 2. Max execution duration check
    const elapsed = Date.now() - this.executionStartTime;
    if (elapsed > this.maxDurationMs) {
      return {
        safe: false,
        reason: `Automation exceeded maximum duration limit of ${this.maxDurationMs / 1000}s (elapsed: ${(elapsed / 1000).toFixed(1)}s).`,
      };
    }

    // 3. Repeated identical action detection
    const fingerprint = `${action.actionType}:${action.title}:${JSON.stringify(action.parameters)}`;
    this.actionFingerprints.push(fingerprint);

    const len = this.actionFingerprints.length;
    if (len >= this.maxIdenticalConsecutiveActions) {
      const recent = this.actionFingerprints.slice(-this.maxIdenticalConsecutiveActions);
      const allIdentical = recent.every((fp) => fp === fingerprint);
      if (allIdentical) {
        return {
          safe: false,
          reason: `Loop detected: identical action ("${action.title}") executed ${this.maxIdenticalConsecutiveActions} times in succession without state progression.`,
        };
      }
    }

    return { safe: true };
  }
}
