/**
 * DOM Snapshot - Accessibility tree with ref labels
 * Pattern inspired by OpenClaw's accessibility snapshot
 *
 * Generates a compact representation of the page DOM using accessibility tree,
 * with ref labels (ref=e1, ref=e2, etc.) for LLM element targeting.
 */

import type { Page } from 'playwright';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface AccessibilityNode {
  role?: string;
  name?: string;
  value?: string;
  description?: string;
  ref?: string; // e.g., "e1", "e2"
  children?: AccessibilityNode[];
  // Additional properties
  focused?: boolean;
  disabled?: boolean;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean | 'mixed';
  pressed?: boolean | 'mixed';
  level?: number;
  valueMin?: number;
  valueMax?: number;
  autocomplete?: string;
  haspopup?: string;
  invalid?: string;
  orientation?: string;
}

export interface DOMSnapshot {
  url: string;
  title: string;
  tree: AccessibilityNode | null;
  stats: {
    totalNodes: number;
    interactiveNodes: number;
    capturedAt: string;
  };
}

// ─────────────────────────────────────────────────────────────────
// Main Function
// ─────────────────────────────────────────────────────────────────

/**
 * Capture accessibility snapshot with ref labels
 * NOTE: This function is currently disabled as Playwright's accessibility API
 * may not be available in all versions. Will be re-enabled in future updates.
 */
export async function captureAccessibilitySnapshot(
  page: Page,
  options: {
    interestingOnly?: boolean; // Only include interactive/meaningful elements
    maxDepth?: number; // Max tree depth (0 = unlimited)
  } = {}
): Promise<DOMSnapshot> {
  const { interestingOnly = false, maxDepth = 0 } = options;

  // TEMPORARILY DISABLED - accessibility API may not be available
  // const snapshot = await page.accessibility.snapshot({
  //   interestingOnly,
  // });

  // Fallback: return basic snapshot
  const snapshot: any = {
    role: 'WebArea',
    name: await page.title(),
  };

  // Add ref labels
  let refCounter = 0;
  const addRefLabels = (node: any, depth: number = 0): AccessibilityNode | null => {
    if (!node) return null;
    if (maxDepth > 0 && depth > maxDepth) return null;

    const result: AccessibilityNode = {};

    // Basic properties
    if (node.role) result.role = node.role;
    if (node.name) result.name = node.name;
    if (node.value) result.value = node.value;
    if (node.description) result.description = node.description;

    // Add ref for interactive elements
    if (shouldHaveRef(node)) {
      refCounter++;
      result.ref = `e${refCounter}`;
    }

    // State properties
    if (node.focused) result.focused = true;
    if (node.disabled) result.disabled = true;
    if (node.expanded !== undefined) result.expanded = node.expanded;
    if (node.selected !== undefined) result.selected = node.selected;
    if (node.checked !== undefined) result.checked = node.checked;
    if (node.pressed !== undefined) result.pressed = node.pressed;
    if (node.level !== undefined) result.level = node.level;
    if (node.valuemin !== undefined) result.valueMin = node.valuemin;
    if (node.valuemax !== undefined) result.valueMax = node.valuemax;
    if (node.autocomplete) result.autocomplete = node.autocomplete;
    if (node.haspopup) result.haspopup = node.haspopup;
    if (node.invalid) result.invalid = node.invalid;
    if (node.orientation) result.orientation = node.orientation;

    // Process children
    if (node.children && node.children.length > 0) {
      const processedChildren = node.children
        .map((child: any) => addRefLabels(child, depth + 1))
        .filter((child: any) => child !== null);

      if (processedChildren.length > 0) {
        result.children = processedChildren;
      }
    }

    return result;
  };

  const tree = addRefLabels(snapshot);

  // Count nodes
  const stats = {
    totalNodes: refCounter,
    interactiveNodes: countInteractiveNodes(tree),
    capturedAt: new Date().toISOString(),
  };

  return {
    url: page.url(),
    title: await page.title(),
    tree,
    stats,
  };
}

/**
 * Generate a compact text representation of the tree
 * Useful for LLM context
 */
export function snapshotToText(snapshot: DOMSnapshot, maxLength: number = 10000): string {
  const lines: string[] = [];

  const traverse = (node: AccessibilityNode | null, indent: number = 0) => {
    if (!node) return;

    const prefix = '  '.repeat(indent);
    const parts: string[] = [];

    if (node.ref) parts.push(`[${node.ref}]`);
    if (node.role) parts.push(node.role);
    if (node.name) parts.push(`"${node.name}"`);
    if (node.value) parts.push(`= ${node.value}`);

    // Add state indicators
    if (node.focused) parts.push('(focused)');
    if (node.disabled) parts.push('(disabled)');
    if (node.selected) parts.push('(selected)');
    if (node.checked === true) parts.push('(checked)');
    if (node.expanded === true) parts.push('(expanded)');
    if (node.expanded === false) parts.push('(collapsed)');

    if (parts.length > 0) {
      lines.push(prefix + parts.join(' '));
    }

    if (node.children) {
      for (const child of node.children) {
        traverse(child, indent + 1);
      }
    }
  };

  lines.push(`URL: ${snapshot.url}`);
  lines.push(`Title: ${snapshot.title}`);
  lines.push(`Nodes: ${snapshot.stats.totalNodes} (${snapshot.stats.interactiveNodes} interactive)`);
  lines.push('');
  traverse(snapshot.tree);

  const text = lines.join('\n');

  // Truncate if too long
  if (text.length > maxLength) {
    return text.substring(0, maxLength - 100) + '\n\n... (truncated)';
  }

  return text;
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Determine if a node should have a ref label
 * Interactive elements (buttons, links, inputs) should have refs
 */
function shouldHaveRef(node: any): boolean {
  if (!node.role) return false;

  const interactiveRoles = [
    'button',
    'link',
    'textbox',
    'searchbox',
    'combobox',
    'listbox',
    'menu',
    'menuitem',
    'tab',
    'checkbox',
    'radio',
    'switch',
    'slider',
    'spinbutton',
    'option',
    'treeitem',
    'gridcell',
    'row',
    'columnheader',
    'rowheader',
  ];

  return interactiveRoles.includes(node.role.toLowerCase());
}

/**
 * Count interactive nodes in tree
 */
function countInteractiveNodes(node: AccessibilityNode | null): number {
  if (!node) return 0;

  let count = node.ref ? 1 : 0;

  if (node.children) {
    for (const child of node.children) {
      count += countInteractiveNodes(child);
    }
  }

  return count;
}

/**
 * Find a node by ref label
 */
export function findNodeByRef(
  snapshot: DOMSnapshot,
  ref: string
): AccessibilityNode | null {
  const search = (node: AccessibilityNode | null): AccessibilityNode | null => {
    if (!node) return null;
    if (node.ref === ref) return node;

    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }

    return null;
  };

  return search(snapshot.tree);
}
