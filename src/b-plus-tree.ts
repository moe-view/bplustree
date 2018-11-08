export abstract class BPlusTreeNode<T> {
  data: T[];
  parent: BPlusTreeInternalNode<T> | null = null;
  owner: BPlusTree<T>;

  abstract get isLeaf(): boolean;

  constructor(owner: BPlusTree<T>, data: T[] = []) {
    this.owner = owner;
    this.data = data;
  }

  abstract exist(value: T): boolean;
  abstract insert(value: T): void;
  abstract delete(value: T): boolean;

  get isRoot(): boolean {
    return this.parent === null;
  }

  splitIfNeeded(): void {
    // max data length: order - 1
    const order = this.owner.order;
    if (this.data.length < order) {
      // no need to split
      return;
    }

    // TODO use floor, also need update test cases
    const middleIndex = Math.ceil(this.data.length / 2);
    const middleData = this.data[middleIndex];

    // create new node from right part
    // not include middle data if internal node
    const newNodeData = this.data.splice(middleIndex);
    let newNode: BPlusTreeInternalNode<T> | BPlusTreeLeafNode<T>;
    if (!this.isLeaf && this instanceof BPlusTreeInternalNode) {
      // internal node
      // remove middle data from new node
      newNodeData.shift();
      const newNodeChildren = this.children.splice(middleIndex + 1);
      newNode = new BPlusTreeInternalNode<T>(this.owner, newNodeData, newNodeChildren);
      // update children new parent
      for (let i = 0; i < newNodeChildren.length; i++) {
        newNodeChildren[i].parent = newNode;
      }
    } else {
      newNode = new BPlusTreeLeafNode<T>(this.owner, newNodeData);
      // TODO type fix
      // update link
      newNode.nextNode = (this as any).nextNode;
      (this as any).nextNode = newNode;
    }

    // update parent
    this.addToParent(middleData, newNode);

    // attemp split all affected part
    this.splitIfNeeded();
    newNode.splitIfNeeded();
    if (this.parent) {
      this.parent.splitIfNeeded();
    }
  }

  rebalancingIfNeed(): void {
    if (this.isRoot && !this.isLeaf && this.data.length === 0 && this instanceof BPlusTreeInternalNode && this.children.length === 1) {
      // need to remove this root, update owner new root, own's height 1 down
      this.children[0].parent = null;
      this.owner.updateRoot();
    }
    // min data length: owner's nodeMinLength
    const nodeMinLength = this.owner.nodeMinLength;
    if (this.isRoot || this.data.length >= nodeMinLength) {
      // no need to rebalancing
      return;
    }

    const [leftSibling, rightSibling, index] = this.getLeftRightSibling();

    if (leftSibling && leftSibling.data.length > nodeMinLength) {
      // rotate right for leaf
      this.rotateRight(leftSibling, index - 1);
    } else if (rightSibling && rightSibling.data.length > nodeMinLength) {
      // rotate left leaf
      this.rotateLeft(rightSibling, index);
    } else {
      // merge with left or right sibling
      if (leftSibling) {
        // merge with left sibling
        leftSibling.mergeRight(this, index - 1);
      } else if (rightSibling) {
        // merge with right sibling
        this.mergeRight(rightSibling, index);
      } else {
        throw new Error('can not merge leaf, both left and right sibling not exist');
      }
    }
  }

  protected abstract rotateRight(leftSibling: BPlusTreeNode<T>, index: number): void;
  protected abstract rotateLeft(rightSibling: BPlusTreeNode<T>, index: number): void;
  protected abstract mergeRight(rightSibling: BPlusTreeNode<T>, index: number): void;

  /**
   * @param middleData
   * @param newNode middleData's right node
   */
  protected addToParent(middleData: T, newNode: BPlusTreeNode<T>) {
    if (this.parent) {
      newNode.parent = this.parent;
      this.parent.insertPurely(middleData, newNode);
    } else {
      // parent not exist => create new root
      const newRoot = new BPlusTreeInternalNode<T>(this.owner, [middleData], [this, newNode]);

      // current parent
      this.parent = newRoot;

      // new node parent
      newNode.parent = newRoot;

      // update btree with new root
      this.owner.updateRoot();
    }
  }

  // find index location where value < data[index] for the first time
  protected getLocation(value: T): number {
    const compareFunc = this.owner.compareFunc;
    let index = 0;
    while (index < this.data.length && compareFunc(value, this.data[index]) >= 0) { index++; }

    return index;
  }

  protected getLeftRightSibling(): [BPlusTreeNode<T> | null, BPlusTreeNode<T> | null, number] {
    // root have no sibling
    if (this.parent === null) {
      return [null, null, -1];
    }

    // this node position in parent's children
    let index = 0;
    for (; index < this.parent.children.length; index++) {
      if (this.parent.children[index] === this) { break; }
    }

    // if not found, abnormal case -> tree is wrong
    if (index >= this.parent.children.length) {
      throw new Error('this node\'s parent\'s children not contain this');
    }

    return [this.parent.children[index - 1] || null, this.parent.children[index + 1] || null, index];
  }
}

/**
 * Leaf node
 */
export class BPlusTreeLeafNode<T> extends BPlusTreeNode<T> {
  nextNode: BPlusTreeLeafNode<T> | null = null;

  get isLeaf(): boolean {
    return true;
  }

  exist(value: T): boolean {
    const index = this.getLocation(value);
    const compareFunc = this.owner.compareFunc;
    if (compareFunc(value, this.data[index - 1]) === 0) {
      return true;
    }

    return false;
  }

  insert(value: T): void {
    this.insertPurely(value);
    this.splitIfNeeded();
  }

  insertPurely(value: T): void {
    // find appropriate position
    const index = this.getLocation(value);

    // insert
    if (index >= this.data.length) {
      this.data.push(value);
    } else {
      this.data.splice(index, 0, value);
    }
  }

  delete(value: T): boolean {
    const index = this.getLocation(value) - 1;
    const compareFunc = this.owner.compareFunc;
    if (compareFunc(value, this.data[index]) === 0) {
      // remove data from leaf
      this.data.splice(index, 1);
      // rebalancing if needed
      this.rebalancingIfNeed();

      return true;
    }

    return false;
  }

  /**
   *
   * @param leftSibling
   * @param index parent position of separator
   */
  protected rotateRight(leftSibling: BPlusTreeNode<T>, index: number) {
    if (!this.parent || !this.isLeaf) {
      return;
    }

    // rotate right leaf:
    //  - move last data of left node to current node first data
    //  - assign separator = moved element

    // move data
    const movedData = leftSibling.data.splice(-1, 1)[0];
    this.data.unshift(movedData);

    // update separator
    this.parent.data[index] = movedData;
  }

  protected rotateLeft(rightSibling: BPlusTreeNode<T>, index: number) {
    if (!this.parent || !this.isLeaf) {
      return;
    }
    // rotate left leaf:
    //  - move first element of right node to current node last
    //  - assign separator = right node new first element

    // move data
    const movedData = rightSibling.data.shift();
    if (movedData) { this.data.push(movedData); }

    // update separator
    this.parent.data[index] = rightSibling.data[0];
  }

  protected mergeRight(rightNode: BPlusTreeNode<T>, index: number) {
    if (!this.parent || !this.isLeaf || !rightNode.isLeaf || !(rightNode instanceof BPlusTreeLeafNode)) {
      return;
    }

    // merge right:
    //  - move all right node's data to current data
    //  - update link to skip right node
    //  - remove parent separator
    //  - remove rightNode from parent (index + 1)
    //  - release rightNode data ?
    //  - call rebalancingIfNeed on parent recursively
    this.data = this.data.concat(rightNode.data);
    this.nextNode = rightNode.nextNode;
    this.parent.data.splice(index, 1);
    this.parent.children.splice(index + 1, 1);

    this.parent.rebalancingIfNeed();
  }
}

/**
 * Internal node
 */
export class BPlusTreeInternalNode<T> extends BPlusTreeNode<T> {
  children: BPlusTreeNode<T>[];

  get isLeaf(): boolean {
    return false;
  }

  constructor(owner: BPlusTree<T>, data: T[] = [], children: BPlusTreeNode<T>[] = []) {
    super(owner, data);
    this.children = children;
  }

  exist(value: T): boolean {
    const index = this.getLocation(value);

    return this.children[index].exist(value);
  }

  insert(value: T): void {
    const index = this.getLocation(value);
    this.children[index].insert(value);
  }

  /**
   * @param value
   * @param child value's right node
   */
  insertPurely(value: T, child: BPlusTreeNode<T>): void {
    // find appropriate position
    const index = this.getLocation(value);

    // insert
    if (index >= this.data.length) {
      this.data.push(value);
      this.children.push(child);
    } else {
      this.data.splice(index, 0, value);
      this.children.splice(index + 1, 0, child);
    }
  }

  delete(value: T): boolean {
    const index = this.getLocation(value);
    // abnormal case
    if (!this.children[index]) {
      throw new Error('Tree structure is wrong');
    }

    // traverse down appropriate branch
    return this.children[index].delete(value);
  }

  protected rotateRight(leftSibling: BPlusTreeNode<T>, index: number): void {
    if (!this.parent || this.isLeaf || !(leftSibling instanceof BPlusTreeInternalNode)) {
      return;
    }

    // rotate right internal node:
    //  - move last child (other node) of left node to current node first child
    //  - move separator to current node first data
    //  - assign separator = left node last data, also remove that left node last data

    const lastChildOfLeft = leftSibling.children.splice(-1, 1)[0];
    this.children.unshift(lastChildOfLeft);
    lastChildOfLeft.parent = this;

    this.data.unshift(this.parent.data[index]);

    this.parent.data[index] = leftSibling.data.splice(-1, 1)[0];
  }

  protected rotateLeft(rightSibling: BPlusTreeNode<T>, index: number): void {
    if (!this.parent || this.isLeaf || !(rightSibling instanceof BPlusTreeInternalNode)) {
      return;
    }

    // rotate left internal node:
    //  - move first child (other node) of right node to current node last child
    //  - move separator to current node last data
    //  - assign separator = right node first data
    //  - remove right node first data

    const firstChildOfRight = rightSibling.children.shift();
    if (!firstChildOfRight) {
      throw new Error('cannot rotate left because right sibling has no child');
    }
    firstChildOfRight.parent = this;
    this.children.push(firstChildOfRight);

    this.data.push(this.parent.data[index]);

    this.parent.data[index] = rightSibling.data[0];
    rightSibling.data.shift();
  }

  protected mergeRight(rightNode: BPlusTreeNode<T>, index: number): void {
    if (!this.parent || this.isLeaf || !(rightNode instanceof BPlusTreeInternalNode)) {
      return;
    }

    // merge right:
    //  - current data + separator + rightNode data
    //  - current children + rightNode children
    //  - update right node's children parent
    //  - remove parent separator
    //  - remove rightNode from parent (index + 1)
    //  - release rightNode data ?
    //  - call rebalancingIfNeed on parent recursively
    this.data = this.data.concat([this.parent.data[index]], rightNode.data);
    rightNode.children.forEach((child) => (child.parent = this));
    this.children = this.children.concat(rightNode.children);
    this.parent.data.splice(index, 1);
    this.parent.children.splice(index + 1, 1);

    this.parent.rebalancingIfNeed();
  }
}

export class BPlusTree<T> implements Iterable<T> {
  readonly compareFunc: (t1: T, t2: T) => -1 | 0 | 1;
  readonly order: number;
  readonly nodeMinLength: number;

  firstLeaf: BPlusTreeLeafNode<T>;
  root: BPlusTreeNode<T>;

  constructor(order: number, compareFunc: (t1: T, t2: T) => -1 | 0 | 1, data: T[] = []) {
    this.order = order;
    this.nodeMinLength = Math.floor(order / 2);
    this.compareFunc = compareFunc;
    this.root = this.firstLeaf = new BPlusTreeLeafNode<T>(this, data.slice());
    this.root.splitIfNeeded();
  }

  [Symbol.iterator](): Iterator<T> {
    let item: BPlusTreeLeafNode<T> | null = this.firstLeaf;
    let index = 0;

    return {
      next(): IteratorResult<T> {
        if (!item || !item.data.length) {
          return {
            done: true,
            // workaround for passing type check
            value: null!,
          };
        }

        const value = item.data[index];
        index++;

        if (index >= item.data.length) {
          // go next leaf
          item = item.nextNode;
          index = 0;
        }

        return {
          done: false,
          value,
        };
      },
    };
  }

  updateRoot() {
    // go up
    while (this.root.parent) { this.root = this.root.parent; }

    // go down if this root empty data and has 1 child
    if (this.root instanceof BPlusTreeInternalNode && !this.root.isLeaf && this.root.data.length === 0 && this.root.children.length === 1) {
      this.root = this.root.children[0];
    }
  }

  exist(value: T): boolean {
    return this.root.exist(value);
  }

  insert(value: T): void {
    this.root.insert(value);
  }

  delete(value: T): boolean {
    return this.root.delete(value);
  }

  iterate(callback: (value: T) => any) {
    let leaf: BPlusTreeLeafNode<T> | null = this.firstLeaf;
    let shouldStop = false;
    while (leaf) {
      const data = leaf.data;
      for (let i = 0; i < data.length; i++) {
        shouldStop = callback(data[i]) === false;
        if (shouldStop) {
          break;
        }
      }

      if (shouldStop) {
        break;
      }

      leaf = leaf.nextNode;
    }
  }

  // return all contents of tree in visual string format, useful in debug
  dump(): string {
    let content = '';
    let children = [this.root];
    let height = 0;
    while (children.length) {
      let nextChildren: BPlusTreeNode<T>[] = [];
      let line = '';
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        line += '(' + child.data.join(',') + ')' + ' ';
        if (child instanceof BPlusTreeInternalNode && !child.isLeaf) {
          nextChildren = nextChildren.concat(child.children);
        }
      }

      content += `--- ${height}: ${line}\n`;

      children = nextChildren;
      height++;
    }

    return content;
  }
}
