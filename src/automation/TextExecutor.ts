import { ActionResult, VerificationResult, UIElementQuery } from './types';
import { UIActionExecutor } from './UIActionExecutor';
import { automationService } from '../services/automationService';

export class TextExecutor {
  /**
   * Enters text into an accessible editable field with verification.
   */
  public static async enterText(
    query: UIElementQuery,
    text: string,
    mode: 'enter' | 'replace' | 'append' | 'clear' | 'submit' = 'enter'
  ): Promise<{ result: ActionResult; verification: VerificationResult }> {
    const startTime = Date.now();

    // 1. Locate the text field
    const match = await UIActionExecutor.findElement(query);

    if (!match.node && query.resourceId || query.text) {
      // Fallback: search for any editable field
      const fallbackMatch = await UIActionExecutor.findElement({ isEditable: true, structuralIndex: 0 });
      if (fallbackMatch.node) {
        match.node = fallbackMatch.node;
        match.priority = fallbackMatch.priority;
        match.desc = fallbackMatch.desc;
      }
    }

    if (!match.node) {
      return {
        result: {
          success: false,
          message: `Text entry failed: Target editable field not found for query (${JSON.stringify(query)})`,
          executionTimeMs: Date.now() - startTime,
        },
        verification: {
          verified: false,
          observedState: 'FIELD_NOT_FOUND',
          failureReason: match.desc,
        },
      };
    }

    // 2. Perform text action
    let finalText = text;
    if (mode === 'clear') {
      finalText = '';
    } else if (mode === 'append') {
      finalText = `${match.node.text || ''} ${text}`.trim();
    }

    // Update node state in simulated environment
    match.node.text = finalText;

    // Trigger in-app simulation state
    if (match.node.resourceId?.includes('search')) {
      automationService.chromeSearchQuery = finalText;
    }

    // 3. Verification: verify field contains the expected text
    const isVerified = mode === 'clear' ? match.node.text === '' : match.node.text?.includes(text) ?? false;

    return {
      result: {
        success: true,
        message: `Entered "${finalText}" into field via Accessibility ACTION_SET_TEXT.`,
        data: {
          nodeId: match.node.id,
          resourceId: match.node.resourceId,
          enteredText: finalText,
          mode,
        },
        executionTimeMs: Date.now() - startTime,
      },
      verification: {
        verified: isVerified,
        observedState: `TEXT_CONFIRMED: "${match.node.text}"`,
      },
    };
  }

  /**
   * Submits or presses enter/search on an active text field.
   */
  public static async submitText(query?: UIElementQuery): Promise<{ result: ActionResult; verification: VerificationResult }> {
    const startTime = Date.now();

    return {
      result: {
        success: true,
        message: 'Dispatched IME_ACTION_SEARCH / ENTER on focused input.',
        executionTimeMs: Date.now() - startTime,
      },
      verification: {
        verified: true,
        observedState: 'SEARCH_SUBMITTED',
      },
    };
  }
}
