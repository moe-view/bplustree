export abstract class BPlusTreeNode<T> {
  data: T[];
  parent: BPlusTreeInternalNode<T> | null = null;
  owner: BPlusTree<T>;

  abstract get isLeaf(): boolean;

  constructor(owner: BPlusTree<T>, data: T[] = []) {
    this.owner = owner;
    this.data = data;
  }

  abstract insert(value: T): void;
  abstract splitIfNeeded(): void;

  isRoot(): boolean {
    return this.parent === null;
  }

  /**
   * 
   * @param middleData 
   * @param newNode middleData's right node
   */
  protected addParent(middleData: T, newNode: BPlusTreeNode<T>) {
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

  // find index location where data[index] > value for the first time
  protected getLocation(value: T): number {
    const compareFunc = this.owner.compareFunc;
    let index = 0;
    while (index < this.data.length && compareFunc(value, this.data[index]) >= 0) { index++; }

    return index;
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

  splitIfNeeded(): void {
    // max data length: order - 1
    const order = this.owner.order;
    if (this.data.length < order) {
      // no need to split
      return;
    }

    const middleIndex = Math.ceil(this.data.length / 2);
    const middleData = this.data[middleIndex];

    // create new node from right part
    // right node include middleData
    const newNodeData = this.data.slice(middleIndex);
    const newNode = new BPlusTreeLeafNode<T>(this.owner, newNodeData);

    // update current node (shorten)
    this.data = this.data.slice(0, middleIndex);

    // update link
    newNode.nextNode = this.nextNode;
    this.nextNode = newNode;

    // update parent
    this.addParent(middleData, newNode);

    // attemp split all affected part
    this.splitIfNeeded();
    newNode.splitIfNeeded();
    if (this.parent) {
      this.parent.splitIfNeeded();
    }
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

  insert(value: T): void {
    const index = this.getLocation(value);
    this.children[index].insert(value);
  }

  /**
   * 
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

  splitIfNeeded(): void {
    // max data length: order
    const order = this.owner.order + 1;
    if (this.data.length < order) {
      // no need to split
      return;
    }

    const middleIndex = Math.ceil(this.data.length / 2);
    const middleData = this.data[middleIndex];

    // TODO use splice
    // create new node from right part
    // not include middle data
    const newNodeData = this.data.slice(middleIndex + 1);
    const newNodeChildren = this.children.slice(middleIndex + 1);
    const newNode = new BPlusTreeInternalNode<T>(this.owner, newNodeData, newNodeChildren);

    // update children new parent
    for (let i = 0; i < newNodeChildren.length; i++) {
      newNodeChildren[i].parent = newNode;
    }

    // update current node (shorten)
    this.data = this.data.slice(0, middleIndex);
    this.children = this.children.slice(0, middleIndex + 1);

    // update parent
    this.addParent(middleData, newNode);

    // attemp split all affected part
    this.splitIfNeeded();
    newNode.splitIfNeeded();
    if (this.parent) {
      this.parent.splitIfNeeded();
    }
  }
}

export class BPlusTree<T> {
  readonly compareFunc: (t1: T, t2: T) => -1 | 0 | 1;
  readonly order: number;
  readonly nodeMinLength: number;

  firstLeaf: BPlusTreeLeafNode<T>;
  root: BPlusTreeNode<T>;

  constructor(order: number, compareFunc: (t1: T, t2: T) => -1 | 0 | 1, data: T[] = []) {
    this.order = order;
    this.nodeMinLength = Math.floor(order / 2);
    this.compareFunc = compareFunc;
    this.root = this.firstLeaf = new BPlusTreeLeafNode<T>(this, data);
    this.root.splitIfNeeded();
  }

  updateRoot() {
    // go up
    while (this.root.parent) { this.root = this.root.parent; }

    // go down if this root empty data and has 1 child
    if (this.root instanceof BPlusTreeInternalNode && !this.root.isLeaf && this.root.data.length === 0 && this.root.children.length === 1) {
      this.root = this.root.children[0];
    }
  }

  insert(value: T) {
    this.root.insert(value);
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

  // apply BFS to print all contents of tree, useful in debug
  dump() {
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

      console.log('-----', height, ':', line);

      children = nextChildren;
      height++;
    }
  }
}
