import { BPlusTreeLeafNode, BPlusTreeInternalNode, BPlusTree, BPlusTreeNode } from './b-plus-tree';

/**
 * Compare function
 *
 * @param n1
 * @param n2
 */
export function compareFunc(n1: number, n2: number) {
  if (n1 < n2) {
    return -1;
  }
  if (n1 === n2) {
    return 0;
  }

  return 1;
}

/**
 * Normalize tree content
 *
 * @param s
 */
export function normalizeTreeContent(s: string): string {
  return s.replace(/(\s)*\n(\s)*/g, '\n').trim();
}

/**
 * Generate array from 1 -> n
 *
 * @param n
 */
export function generateSequenceArray(n: number): number[] {
  const array = [];
  for (let i = 0; i < n; i++) {
    array.push(i + 1);
  }

  return array;
}

/**
 * Shuffles array in place. ES6 version
 *
 * @param {Array} a items An array containing the items.
 */
export function shuffle(a: number[]): number[] {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// check BPlusTree of number, increase order
export function checkBPlusTree(tree: BPlusTree<number>, elements: number[]) {
  const root = tree.root;
  expect(root.parent).toBeNull();

  if (elements.length === 0) {
    // empty tree
    expect(root.data.length).toBe(0);
    expect(root.isLeaf).toBe(true);
    return;
  }

  // check BPlusTree internal structure
  const firstLeaf = tree.firstLeaf;
  let nodes = [root];
  while (nodes.length) {
    const reachedLeaf = nodes[0].isLeaf;
    let nextNodes: BPlusTreeNode<number>[] = [];

    nodes.forEach(node => {
      expect(node.data.length).toBeGreaterThanOrEqual(1);
      if (reachedLeaf) {
        expect(node.isLeaf).toBe(true);
      } else if (node instanceof BPlusTreeInternalNode) {
        expect(node.children.length).toBe(node.data.length + 1);
      }

      // node's data in increase order
      for (let i = 1; i < node.data.length; i++) {
        expect(node.data[i]).toBeGreaterThanOrEqual(node.data[i - 1]);
      }

      if (!reachedLeaf && node instanceof BPlusTreeInternalNode) {
        node.children.forEach((child, index) => {
          // children's parent is this node
          expect(child.parent).toBe(node);
          if (index > 0) {
            // right child data is greater than or equal separator
            expect(child.data[0]).toBeGreaterThanOrEqual(node.data[index - 1]);
          }

          if (index < node.data.length) {
            // left child data is less than separator
            expect(child.data[child.data.length - 1]).toBeLessThan(node.data[index]);
          }
        });

        nextNodes = nextNodes.concat(node.children);
      }
    });

    // go to next height level
    nodes = nextNodes;
  }

  // check data
  let data: number[] = [];
  let leaf: BPlusTreeLeafNode<number> | null = firstLeaf;
  while (leaf) {
    data = data.concat(leaf.data);
    leaf = leaf.nextNode;
  }

  expect(data).toEqual(elements);
}
