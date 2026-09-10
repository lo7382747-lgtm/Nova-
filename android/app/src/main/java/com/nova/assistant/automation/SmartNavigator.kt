package com.nova.assistant.automation

import android.view.accessibility.AccessibilityNodeInfo

data class NodeMatch(
    val node: AccessibilityNodeInfo?,
    val priority: Int,
    val description: String,
    val confidence: Float
)

/**
 * SmartNavigator
 * Priority-driven AccessibilityNodeInfo search engine.
 */
object SmartNavigator {

    fun findElement(root: AccessibilityNodeInfo?, query: UIElementQuery): NodeMatch {
        if (root == null) {
            return NodeMatch(null, 0, "Root node is null", 0f)
        }

        val flatNodes = mutableListOf<AccessibilityNodeInfo>()
        flattenTree(root, flatNodes)

        // 1. Resource ID (Highest Priority)
        if (!query.resourceId.isNullOrBlank()) {
            val targetId = query.resourceId.trim()
            val match = flatNodes.firstOrNull { node ->
                val resId = node.viewIdResourceName
                resId != null && (resId == targetId || resId.endsWith("/$targetId") || resId.endsWith(":id/$targetId"))
            }
            if (match != null) {
                return NodeMatch(match, 1, "Matched Resource ID: ${match.viewIdResourceName}", 1.0f)
            }
        }

        // 2. Content Description
        if (!query.contentDescription.isNullOrBlank()) {
            val targetDesc = query.contentDescription.trim().lowercase()
            val match = flatNodes.firstOrNull { node ->
                node.contentDescription?.toString()?.trim()?.lowercase() == targetDesc
            }
            if (match != null) {
                return NodeMatch(match, 2, "Matched Content Description: ${match.contentDescription}", 0.95f)
            }
        }

        // 3. Exact Visible Text
        if (!query.text.isNullOrBlank()) {
            val targetText = query.text
            val match = flatNodes.firstOrNull { node ->
                node.text?.toString() == targetText
            }
            if (match != null) {
                return NodeMatch(match, 3, "Matched Exact Visible Text: ${match.text}", 0.9f)
            }

            // 4. Normalized Text (lowercase & trimmed)
            val normalizedTarget = targetText.trim().lowercase()
            val normMatch = flatNodes.firstOrNull { node ->
                node.text?.toString()?.trim()?.lowercase() == normalizedTarget
            }
            if (normMatch != null) {
                return NodeMatch(normMatch, 4, "Matched Normalized Text: ${normMatch.text}", 0.85f)
            }

            // 5. Partial Text
            val partialMatch = flatNodes.firstOrNull { node ->
                val txt = node.text?.toString()?.lowercase() ?: ""
                val desc = node.contentDescription?.toString()?.lowercase() ?: ""
                txt.contains(normalizedTarget) || desc.contains(normalizedTarget)
            }
            if (partialMatch != null) {
                return NodeMatch(partialMatch, 5, "Matched Partial Text: ${partialMatch.text ?: partialMatch.contentDescription}", 0.75f)
            }
        }

        // 6. Safe Structural Matching
        if (query.isClickable == true || query.isEditable == true) {
            val candidates = flatNodes.filter { node ->
                if (query.isClickable == true && !node.isClickable) return@filter false
                if (query.isEditable == true && !node.isEditable) return@filter false
                true
            }
            val index = query.structuralIndex ?: 0
            if (index in candidates.indices) {
                val match = candidates[index]
                return NodeMatch(match, 6, "Matched Structural Candidate #$index (${match.className})", 0.6f)
            }
        }

        return NodeMatch(null, 0, "No matching node found", 0f)
    }

    private fun flattenTree(node: AccessibilityNodeInfo?, list: MutableList<AccessibilityNodeInfo>) {
        if (node == null) return
        list.add(node)
        for (i in 0 until node.childCount) {
            flattenTree(node.getChild(i), list)
        }
    }
}
