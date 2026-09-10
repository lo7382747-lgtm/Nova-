/**
 * RuleEngine
 * Evaluates IF / THEN / ELSE rules with logical operators:
 * AND, OR, NOT, DELAY, REPEAT, STOP.
 * Exposes device state evaluation to the AutomationEngine.
 */

import { DeviceStateSnapshot, RuleCondition } from './types';
import { deviceStateMonitor } from './DeviceStateMonitor';

export interface RuleEvaluationResult {
  satisfied: boolean;
  evaluatedConditions: Array<{
    conditionId: string;
    field: string;
    expected: any;
    actual: any;
    result: boolean;
  }>;
  summary: string;
}

export class RuleEngine {
  private static instance: RuleEngine;

  public static getInstance(): RuleEngine {
    if (!RuleEngine.instance) {
      RuleEngine.instance = new RuleEngine();
    }
    return RuleEngine.instance;
  }

  /**
   * Evaluates an array of conditions using logical operators.
   * Default relation between conditions is AND unless specified.
   */
  public evaluateConditions(
    conditions: RuleCondition[],
    state: DeviceStateSnapshot = deviceStateMonitor.getSnapshot(),
    logicalOperator: 'AND' | 'OR' = 'AND'
  ): RuleEvaluationResult {
    if (!conditions || conditions.length === 0) {
      return {
        satisfied: true,
        evaluatedConditions: [],
        summary: 'No conditions specified (default satisfied)',
      };
    }

    const evaluated = conditions.map((cond) => {
      const actualVal = this.resolveFieldValue(cond.field, state);
      const isMatch = this.compareValues(actualVal, cond.operator, cond.value, cond.secondaryValue);
      return {
        conditionId: cond.id,
        field: cond.field,
        expected: cond.value,
        actual: actualVal,
        result: isMatch,
      };
    });

    let satisfied: boolean;
    if (logicalOperator === 'AND') {
      satisfied = evaluated.every((e) => e.result);
    } else {
      satisfied = evaluated.some((e) => e.result);
    }

    const summary = satisfied
      ? `Conditions satisfied (${evaluated.filter((e) => e.result).length}/${evaluated.length} passed)`
      : `Conditions failed (${evaluated.filter((e) => !e.result).length} unsatisfied)`;

    return {
      satisfied,
      evaluatedConditions: evaluated,
      summary,
    };
  }

  /**
   * Resolves nested field strings like 'device.bluetooth.connected' or 'battery.level'
   */
  public resolveFieldValue(fieldPath: string, state: DeviceStateSnapshot): any {
    const cleanPath = fieldPath.replace(/^(device\.)/, '');
    const parts = cleanPath.split('.');

    let current: any = state;
    for (const part of parts) {
      if (current === undefined || current === null) return undefined;

      // Custom resolvers
      if (part === 'bluetooth_connected_car') {
        return state.bluetooth.connectedDevices.some((d) => d.deviceClass === 'car' || d.name.toLowerCase().includes('car') || d.name.toLowerCase().includes('tesla'));
      }
      if (part === 'bluetooth_device_connected') {
        return state.bluetooth.connectedDevices.length > 0;
      }
      if (part === 'wifi_connected') {
        return state.network.isConnected && state.network.type === 'wifi';
      }

      current = current[part];
    }
    return current;
  }

  /**
   * Compares actual against expected using supported operators.
   */
  public compareValues(actual: any, operator: RuleCondition['operator'], expected: any, secondaryValue?: any): boolean {
    switch (operator) {
      case 'EQUALS':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().trim() === expected.toLowerCase().trim();
        }
        return actual === expected;

      case 'NOT_EQUALS':
        return actual !== expected;

      case 'GREATER_THAN':
        return Number(actual) > Number(expected);

      case 'LESS_THAN':
        return Number(actual) < Number(expected);

      case 'BETWEEN': {
        const num = Number(actual);
        const min = Number(expected);
        const max = Number(secondaryValue);

        // Also support time string comparison e.g. "08:00" between "08:00" and "10:00"
        if (typeof actual === 'string' && actual.includes(':') && typeof expected === 'string' && expected.includes(':')) {
          const [actH, actM] = actual.split(':').map(Number);
          const [minH, minM] = expected.split(':').map(Number);
          const [maxH, maxM] = (secondaryValue || '23:59').split(':').map(Number);

          const actMins = actH * 60 + actM;
          const minMins = minH * 60 + minM;
          const maxMins = maxH * 60 + maxM;
          return actMins >= minMins && actMins <= maxMins;
        }

        return num >= min && num <= max;
      }

      case 'CONTAINS':
        if (Array.isArray(actual)) {
          return actual.some((item) =>
            typeof item === 'object' && item.name
              ? item.name.toLowerCase().includes(String(expected).toLowerCase())
              : String(item).toLowerCase().includes(String(expected).toLowerCase())
          );
        }
        if (typeof actual === 'string') {
          return actual.toLowerCase().includes(String(expected).toLowerCase());
        }
        return false;

      case 'IS_TRUE':
        return Boolean(actual) === true;

      case 'IS_FALSE':
        return Boolean(actual) === false;

      default:
        return actual == expected;
    }
  }
}

export const ruleEngine = RuleEngine.getInstance();
