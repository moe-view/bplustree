import { BPlusTree } from './b-plus-tree';
import { checkBPlusTree, generateSequenceArray, normalizeTreeContent, compareFunc } from './b-plus-tree-test.util';

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
    bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, array);

    bTree.delete(3);
    bTree.delete(7);
    bTree.delete(1);

    checkBPlusTree(bTree, [2, 4, 5, 6, 8, 9, 10]);
  });

  it('should insert, delete multiple time from [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]', () => {
    const array = generateSequenceArray(10);
    bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, array);

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
    bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, array);

    bTree.insert(100);

    for (let i = 2; i <= 100; i++) {
      bTree.delete(i);
    }

    checkBPlusTree(bTree, [1]);

    bTree.delete(1);

    checkBPlusTree(bTree, []);
  });

  it('should insert, delete multiple large amount data', () => {
    const origin = generateSequenceArray(5000);
    bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, origin);

    const array = [...origin];
    const toDelete = array.splice(600, 800);
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

  it('should check exist', () => {
    const origin = generateSequenceArray(20);
    bTree = new BPlusTree<number>(4, compareFunc, origin);

    expect(bTree.exist(20)).toBe(true);
    expect(bTree.exist(21)).toBe(false);
  });

  it('should not be affected when delete not exist element', () => {
    const origin = generateSequenceArray(20);
    bTree = new BPlusTree<number>(4, compareFunc, origin);

    bTree.delete(100);
    checkBPlusTree(bTree, origin);
  });
});
