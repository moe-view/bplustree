# Bplustree typescript
## Usage
```ts
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
const bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, [1,2,3,4,5,6]);

bTree.insert(7);
bTree.insert(8);
bTree.delete(1);
bTree.delete(2);
```
## Test
```
yarn test
```
## Demo
[B+tree visualization](https://visual-algo.firebaseapp.com/)