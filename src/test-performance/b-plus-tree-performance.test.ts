import { generateSequenceArray, compareFunc } from '../b-plus-tree-test.util';
import { BPlusTree } from '../b-plus-tree';
import { ArrayBinarySearch } from './array-binary-search/array-binary-search';

const bPlusTreeOrder = 4;

function insertTime(set: ArrayBinarySearch | BPlusTree<number>, insertValues: number[]): number {
  const startTime = Date.now();
  for (let i = 0; i < insertValues.length; i++) {
    set.insert(insertValues[i]);
  }

  return Date.now() - startTime;
}

function deleteTime(set: ArrayBinarySearch | BPlusTree<number>, deleteValues: number[]): number {
  const startTime = Date.now();
  for (let i = 0; i < deleteValues.length; i++) {
    set.delete(deleteValues[i]);
  }

  return Date.now() - startTime;
}

function test(initLength: number, insertDeleteLength: number) {
  const origin = generateSequenceArray(initLength);
  const bTree = new BPlusTree<number>(bPlusTreeOrder, compareFunc, origin.slice());

  const insertValues = [];
  for (let i = 0; i < insertDeleteLength; i++) {
    const randomValue = Math.floor(Math.random() * (insertDeleteLength + 1));
    insertValues.push(randomValue);
  }

  console.log('\n================== B+tree Test =================\n');
  console.log('insertTime: ', insertTime(bTree, insertValues));
  console.log('deleteTime: ', deleteTime(bTree, insertValues));

  const abs = new ArrayBinarySearch(origin.slice());

  console.log('\n================== Array Binary Search Test =================\n');
  console.log('insertTime: ', insertTime(abs, insertValues));
  console.log('deleteTime: ', deleteTime(abs, insertValues));
}

test(50000, 20000);
