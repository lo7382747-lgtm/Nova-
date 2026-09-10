import { AccessibilityNodeInfo, UIElementQuery } from './types';

export interface SmartMatchResult {
  node: AccessibilityNodeInfo | null;
  matchPriority: number; // 1 to 6
  matchDescription: string;
  confidence: number; // 0.0 to 1.0
}

export class SmartNavigator {
  /**
   * Intelligently finds a UI element in an accessibility node hierarchy using priority matching:
   * 1. Resource ID
   * 2. Content description
   * 3. Exact visible text
   * 4. Normalized text
   * 5. Partial text
   * 6. Safe structural matching
   */
  public static findElement(
    root: AccessibilityNodeInfo,
    query: UIElementQuery
  ): SmartMatchResult {
    const flatNodes = this.flattenTree(root);

    // 1. Match by Resource ID (Highest priority)
    if (query.resourceId) {
      const targetId = query.resourceId.trim();
      const node = flatNodes.find(
        (n) => n.resourceId && (n.resourceId === targetId || n.resourceId.endsWith(`/${targetId}`) || n.resourceId.endsWith(`:id/${targetId}`))
      );
      if (node) {
        return {
          node,
          matchPriority: 1,
          matchDescription: `Matched Resource ID: "${node.resourceId}"`,
          confidence: 1.0,
        };
      }
    }

    // 2. Match by Content Description
    if (query.contentDescription) {
      const targetDesc = query.contentDescription.trim().toLowerCase();
      const node = flatNodes.find(
        (n) => n.contentDescription && n.contentDescription.trim().toLowerCase() === targetDesc
      );
      if (node) {
        return {
          node,
          matchPriority: 2,
          matchDescription: `Matched Content Description: "${node.contentDescription}"`,
          confidence: 0.95,
        };
      }
    }

    // 3. Match by Exact Visible Text
    if (query.text) {
      const targetText = query.text;
      const node = flatNodes.find((n) => n.text === targetText);
      if (node) {
        return {
          node,
          matchPriority: 3,
          matchDescription: `Matched Exact Visible Text: "${node.text}"`,
          confidence: 0.9,
        };
      }

      // 4. Match by Normalized Text (trimmed & case-insensitive)
      const normalizedTarget = targetText.trim().toLowerCase();
      const normNode = flatNodes.find(
        (n) => n.text && n.text.trim().toLowerCase() === normalizedTarget
      );
      if (normNode) {
        return {
          node: normNode,
          matchPriority: 4,
          matchDescription: `Matched Normalized Text: "${normNode.text}"`,
          confidence: 0.85,
        };
      }

      // 5. Match by Partial Text
      const partialNode = flatNodes.find(
        (n) =>
          (n.text && n.text.toLowerCase().includes(normalizedTarget)) ||
          (n.contentDescription && n.contentDescription.toLowerCase().includes(normalizedTarget))
      );
      if (partialNode) {
        return {
          node: partialNode,
          matchPriority: 5,
          matchDescription: `Matched Partial Text: "${partialNode.text || partialNode.contentDescription}"`,
          confidence: 0.75,
        };
      }
    }

    // 6. Safe Structural Matching (e.g. nth clickable or editable element)
    if (query.isClickable || query.isEditable) {
      const candidates = flatNodes.filter((n) => {
        if (query.isClickable && !n.clickable) return false;
        if (query.isEditable && !n.editable) return false;
        return true;
      });

      const idx = query.structuralIndex ?? 0;
      if (candidates[idx]) {
        return {
          node: candidates[idx],
          matchPriority: 6,
          matchDescription: `Matched Structural Candidate #${idx} (${candidates[idx].className || 'node'})`,
          confidence: 0.6,
        };
      }
    }

    return {
      node: null,
      matchPriority: 0,
      matchDescription: 'No matching node found in accessible hierarchy',
      confidence: 0.0,
    };
  }

  /**
   * Flattens a recursive accessibility tree into a 1D array for evaluation.
   */
  public static flattenTree(root: AccessibilityNodeInfo): AccessibilityNodeInfo[] {
    const results: AccessibilityNodeInfo[] = [];
    const traverse = (node: AccessibilityNodeInfo) => {
      if (!node) return;
      results.push(node);
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };
    traverse(root);
    return results;
  }
}
