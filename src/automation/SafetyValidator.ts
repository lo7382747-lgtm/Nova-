/**
 * SafetyValidator & Risk Classifier
 * Classifies actions and plans into LOW_RISK, MEDIUM_RISK, and HIGH_RISK.
 * Enforces confirmation policies and prevents unauthorized destructive actions.
 */

import { Action, ActionType, RiskLevel } from './types';

export interface SafetyCheckResult {
  allowed: boolean;
  riskLevel: RiskLevel;
  requiresUserConfirmation: boolean;
  reasons: string[];
}

export class SafetyValidator {
  private static highRiskKeywords = [
    'delete',
    'wipe',
    'format',
    'uninstall',
    'transfer',
    'bank',
    'pay',
    'wallet',
    'crypto',
    'password',
    'credential',
    'factory_reset',
    'revoke',
  ];

  private static mediumRiskKeywords = [
    'call',
    'sms',
    'send_message',
    'share',
    'setting',
    'brightness',
    'volume_mute',
  ];

  /**
   * Evaluates the risk level of an individual action.
   */
  public static classifyActionRisk(action: Action): RiskLevel {
    const title = action.title.toLowerCase();
    const paramsStr = JSON.stringify(action.parameters).toLowerCase();

    // Check High Risk first
    if (
      SafetyValidator.highRiskKeywords.some(
        (kw) => title.includes(kw) || paramsStr.includes(kw)
      )
    ) {
      return RiskLevel.HIGH_RISK;
    }

    // Communication actions
    if (action.actionType === ActionType.COMMUNICATION_ACTION) {
      if (action.parameters.operation === 'call') {
        return RiskLevel.MEDIUM_RISK;
      }
      if (action.parameters.operation === 'send_sms') {
        return RiskLevel.MEDIUM_RISK;
      }
    }

    // Medium Risk keywords
    if (
      SafetyValidator.mediumRiskKeywords.some(
        (kw) => title.includes(kw) || paramsStr.includes(kw)
      )
    ) {
      return RiskLevel.MEDIUM_RISK;
    }

    if (action.actionType === ActionType.SYSTEM_ACTION) {
      return RiskLevel.MEDIUM_RISK;
    }

    // Standard UI and Media actions are Low Risk
    return RiskLevel.LOW_RISK;
  }

  /**
   * Validates a complete automation plan or array of actions against safety rules
   */
  public static validatePlanSafety(
    actions: Action[],
    userConfirmationGranted: boolean = false,
    policy: 'always' | 'on_high_risk' | 'never' = 'on_high_risk'
  ): SafetyCheckResult {
    let highestRisk = RiskLevel.LOW_RISK;
    const reasons: string[] = [];

    for (const action of actions) {
      const risk = this.classifyActionRisk(action);
      if (risk === RiskLevel.HIGH_RISK) {
        highestRisk = RiskLevel.HIGH_RISK;
        reasons.push(`Action "${action.title}" involves potentially irreversible or sensitive operations.`);
      } else if (risk === RiskLevel.MEDIUM_RISK && highestRisk !== RiskLevel.HIGH_RISK) {
        highestRisk = RiskLevel.MEDIUM_RISK;
      }
    }

    const requiresConfirmation =
      policy === 'always' ||
      (policy === 'on_high_risk' && highestRisk === RiskLevel.HIGH_RISK);

    if (requiresConfirmation && !userConfirmationGranted) {
      return {
        allowed: false,
        riskLevel: highestRisk,
        requiresUserConfirmation: true,
        reasons,
      };
    }

    return {
      allowed: true,
      riskLevel: highestRisk,
      requiresUserConfirmation: false,
      reasons,
    };
  }
}
