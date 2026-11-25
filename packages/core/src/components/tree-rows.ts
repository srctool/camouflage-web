/** A node of a `camo-tree`. `children: null` is a leaf; `[]` is loaded and empty; `hasChildren` with no children is not loaded yet. */
export interface CamoTreeNode {
  key: string;
  label: string;
  /** The name of a registered icon, or `[open, closed]` names for a node that has children. */
  icon?: string | readonly [string, string] | null;
  children?: readonly CamoTreeNode[] | null;
  hasChildren?: boolean;
}

/** One visible row: the node, how deep it is, and its place among its siblings ("2 of 5"). */
export interface TreeRow {
  node: CamoTreeNode;
  level: number;
  index: number;
  size: number;
  parent: string | null;
  /** The node has children, or can load them. */
  expandable: boolean;
  expanded: boolean;
}

/** The nodes that are visible now, in order: every root, and the children of each expanded node. Stale keys are ignored. Pure. */
export function flattenTree(
  roots: readonly CamoTreeNode[],
  expanded: ReadonlySet<string>,
): TreeRow[] {
  const rows: TreeRow[] = [];
  const walk = (nodes: readonly CamoTreeNode[], level: number, parent: string | null): void => {
    nodes.forEach((node, index) => {
      const expandable = (node.children ?? null) !== null || node.hasChildren === true;
      const open = expandable && expanded.has(node.key);
      rows.push({ node, level, index, size: nodes.length, parent, expandable, expanded: open });
      if (open && node.children) walk(node.children, level + 1, node.key);
    });
  };
  walk(roots, 1, null);
  return rows;
}
