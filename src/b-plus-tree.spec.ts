import { BPlusTree, BPlusTreeNode, BPlusTreeLeafNode, BPlusTreeInternalNode } from './b-plus-tree';

const compareFunc = (n1: number, n2: number) => {
  if (n1 < n2) {
    return -1;
  }
  if (n1 === n2) {
    return 0;
  }

  return 1;
};

const bPlusTreeOrder = 4;

describe('bPlusTree', () => {
  let bTree: BPlusTree<number>;

  /**
   * Scenarios:
   *  - Insert no split
   *  - Insert cause splitting leaf, splitting node
   *  - Delete cause rotating right leaf
   *  - Delete cause rotating left leaf
   *  - Delete cause merging leaf, merging node
   */
  describe('When initialized with data [1->10]', () => {
    beforeEach(() => {
      bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, generateSequenceArray(10));
    });

    /**
     * - Init
     */
    describe('Given init state', () => {
      it('Then should have data [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', () => {
        const expectContent = `
          --- 0: (4,6,9)
          --- 1: (1,2,3) (4,5) (6,7,8) (9,10)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });
    });

    /**
     * - Insert no split
     * (9, 10)[insert 11]=> (9, 10, 11)
     */
    describe('Given init state, insert 11', () => {
      it('Then should insert with no split', () => {
        bTree.insert(11);

        const expectContent = `
          --- 0: (4,6,9)
          --- 1: (1,2,3) (4,5) (6,7,8) (9,10,11)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      });
    });

    /**
     * - Insert cause splitting leaf, split node
     *
     * (9,10,11) [insert 12]=> (9,10,11,12) [split leaf]=> (9,10) 11 (11,12)
     * (4,6,9) [insert 11]=> (4,6,9,11) [split node]=> (4,6) 9 (11)
     */
    describe('Given init state, insert 11, 12', () => {
      it('Then should split leaf, split node', () => {
        bTree.insert(11);
        bTree.insert(12);

        const expectContent = `
          --- 0: (9)
          --- 1: (4,6) (11)
          --- 2: (1,2,3) (4,5) (6,7,8) (9,10) (11,12)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
      });
    });

    /**
     * - Delete cause rotating right leaf
     *
     * (1,2,3) 4 (4,5) [delete 5]=> (1,2,3) 4 (4) [rotate right leaf]=> (1,2) 3 (3,4)
     */
    describe('Given init state, insert 11, 12, delete 5', () => {
      it('Then should rotate right leaf', () => {
        bTree.insert(11);
        bTree.insert(12);
        bTree.delete(5);

        const expectContent = `
          --- 0: (9)
          --- 1: (3,6) (11)
          --- 2: (1,2) (3,4) (6,7,8) (9,10) (11,12)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12]);
      });
    });

    /**
     * - Delete cause rotating left leaf
     *
     * (3,4) 6 (6,7,8) [delete 3]=> (4) 6 (6,7,8) [rotate left leaf]=> (4,6) 7 (7,8)
     */
    describe('Given init state, insert 11, 12, delete 5, 3', () => {
      it('Then should rotate left leaf', () => {
        bTree.insert(11);
        bTree.insert(12);
        bTree.delete(5);
        bTree.delete(3);

        const expectContent = `
          --- 0: (9)
          --- 1: (3,7) (11)
          --- 2: (1,2) (4,6) (7,8) (9,10) (11,12)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 4, 6, 7, 8, 9, 10, 11, 12]);
      });
    });

    /**
     * - Delete cause merging leaf, merging node
     *
     * (1,2) 3 (4,6) [delete 2]=> (1) 3 (4,6) [merge leaf]=> (1,4,6)
     * (3,7) 9 (11) [delete 3]=> (7) 9 (11) [merge node]=> (7,9,11)
     * (9) [delete 9]=> () (tree's height decrease)
     */
    describe('Given init state, insert 11, 12, delete 5, 3, 2', () => {
      it('Then should merge leaf, merge node', () => {
        bTree.insert(11);
        bTree.insert(12);
        bTree.delete(5);
        bTree.delete(3);
        bTree.delete(2);

        const expectContent = `
          --- 0: (7,9,11)
          --- 1: (1,4,6) (7,8) (9,10) (11,12)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 4, 6, 7, 8, 9, 10, 11, 12]);
      });
    });
  });

  /**
   * Scenarios:
   *  - Delete cause merging leaf, merging node
   *  - Delete cause merging leaf, rotating right node
   *  - Delete cause merging leaf, rotating left node
   */
  describe('When initialized with data [1->16]', () => {
    beforeEach(() => {
      bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, generateSequenceArray(16));
    });

    /**
     * - Init
     */
    describe('Given init data', () => {
      it('Then should have data [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]', () => {
        const expectContent = `
          --- 0: (7,13)
          --- 1: (3,5) (9,11) (15)
          --- 2: (1,2) (3,4) (5,6) (7,8) (9,10) (11,12) (13,14) (15,16)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      });
    });

    /**
     * - Delete cause merging leaf, merging node
     *
     * (1,2) 3 (3,4) [delete 1]=> (2) 3 (3,4) [merge leaf]=> (2,3,4)
     * (3,5) 7 (9,11) [delete 3]=> (5) 7 (9,11) [merge node]=> (5,7,9,11)
     * (7,13) [delete 7]=> (13)
     */
    describe('Given init data, delete 1', () => {
      it('Then should merge leaf, merge node', () => {
        bTree.delete(1);

        const expectContent = `
          --- 0: (13)
          --- 1: (5,7,9,11) (15)
          --- 2: (2,3,4) (5,6) (7,8) (9,10) (11,12) (13,14) (15,16)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]);
      });
    });

    /**
     * - Delete cause merging leaf, rotating right node
     *
     * (13,14) 15 (15,16) [delete 16]=> (13,14) 15 (15) [merge leaf]=> (13,14,15)
     * (5,7,9,11) 13 (15) [delete 15]=> (5,7,9,11) 13 () [rotate right node]=> (5,7,9) 11 (13)
     */
    describe('Given init data, delete 1, 16', () => {
      it('Then should merge leaf, rotate right node', () => {
        bTree.delete(1);
        bTree.delete(16);

        const expectContent = `
          --- 0: (11)
          --- 1: (5,7,9) (13)
          --- 2: (2,3,4) (5,6) (7,8) (9,10) (11,12) (13,14,15)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      });
    });

    /**
     * Init state:
     *   --- 0: (7,13)
     *   --- 1: (3,5) (9,11) (15)
     *   --- 2: (1,2) (3,4) (5,6) (7,8) (9,10) (11,12) (13,14) (15,16)
     *
     * - Delete cause merging leaf, merging node
     *
     * (13,14) 15 (15,16) [delete 15]=> (13,14) 15 (16) [merge leaf]=> (13,14,16)
     * (9,11) 13 (15) [delete 15]=> (9,11) 13 () [merge node]=> (9,11,13)
     * (7,13) [delete 13]=> (7)
     */
    describe('Given init data, delete 15', () => {
      it('Then should merge leaf, merge node', () => {
        bTree.delete(15);

        const expectContent = `
          --- 0: (7)
          --- 1: (3,5) (9,11,13)
          --- 2: (1,2) (3,4) (5,6) (7,8) (9,10) (11,12) (13,14,16)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]);
      });
    });

    /**
     * - Delete cause merging leaf, rotating left node
     *
     * (1,2) 3 (3,4) [delete 4]=> (1,2) 3 (3) [merge leaf]=> (1,2,3)
     * (3,5) 7 (9,11,13) [delete 3]=> (5) 7 (9,11,13) [rotate left node]=> (5,7) 9 (11,13)
     */
    describe('Given init data, delete 15, 4', () => {
      it('Then should merge leaf, rotate left node', () => {
        bTree.delete(15);
        bTree.delete(4);

        const expectContent = `
          --- 0: (9)
          --- 1: (5,7) (11,13)
          --- 2: (1,2,3) (5,6) (7,8) (9,10) (11,12) (13,14,16)
        `;

        expect(normalizeTreeContent(bTree.dump())).toBe(normalizeTreeContent(expectContent));
        checkBPlusTree(bTree, [1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16]);
      });
    });
  });

  /**
   * Delete test
   */

  it('should delete some from [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', () => {
    const array = generateSequenceArray(10);
    bTree = new BPlusTree<number>(4, compareFunc, array);

    bTree.delete(3);
    bTree.delete(7);
    bTree.delete(1);

    checkBPlusTree(bTree, [2, 4, 5, 6, 8, 9, 10]);
  });

  it('should insert, delete multiple time from [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', () => {
    const array = generateSequenceArray(10);
    bTree = new BPlusTree<number>(4, compareFunc, array);

    bTree.insert(15);
    bTree.insert(20);
    bTree.delete(3);
    bTree.delete(7);
    bTree.delete(1);

    checkBPlusTree(bTree, [2, 4, 5, 6, 8, 9, 10, 15, 20]);

    bTree.insert(16);
    bTree.insert(17);
    bTree.delete(15);
    bTree.insert(1);

    checkBPlusTree(bTree, [1, 2, 4, 5, 6, 8, 9, 10, 16, 17, 20]);
  });

  it('should delete all data 100', () => {
    const array = generateSequenceArray(99);
    bTree = new BPlusTree<number>(4, compareFunc, array);

    bTree.insert(100);

    for (let i = 2; i <= 100; i++) {
      bTree.delete(i);
    }

    checkBPlusTree(bTree, [1]);

    bTree.delete(1);

    checkBPlusTree(bTree, []);
  });

  it('should insert, delete multiple large amount data', () => {
    const origin = generateSequenceArray(20000);
    bTree = new BPlusTree<number>(4, compareFunc, origin);

    const array = [...origin];
    const toDelete = array.splice(600, 8000);
    for (let i = 0; i < toDelete.length; i++) {
      bTree.delete(toDelete[i]);
    }

    checkBPlusTree(bTree, array);

    // insert deleted items in reverse order
    for (let i = toDelete.length - 1; i >= 0; i--) {
      bTree.insert(toDelete[i]);
    }

    checkBPlusTree(bTree, origin);

    // delete all
    for (let i = 0; i < origin.length; i++) {
      bTree.delete(origin[i]);
    }

    checkBPlusTree(bTree, []);

    // restore all
    for (let i = origin.length - 1; i >= 0; i--) {
      bTree.insert(origin[i]);
    }

    checkBPlusTree(bTree, origin);
  });
});

function normalizeTreeContent(s: string): string {
  return s.replace(/(\s)*\n(\s)*/g, '\n').trim();
}

/**
 * generate from 1 -> n
 * @param n
 */
function generateSequenceArray(n: number): number[] {
  const array = [];
  for (let i = 0; i < n; i++) {
    array.push(i + 1);
  }

  return array;
}

/**
 * Shuffles array in place. ES6 version
 * @param {Array} a items An array containing the items.
 */
function shuffle(a: number[]): number[] {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// check BPlusTree of number, increase order
function checkBPlusTree(tree: BPlusTree<number>, elements: number[]) {
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
