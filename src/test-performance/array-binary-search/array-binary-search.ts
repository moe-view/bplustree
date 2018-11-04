/**
 * Array binary search implementation for comparing perfermance with B+tree
 */
export class ArrayBinarySearch {
  values: number[];
  constructor(values: number[]) {
    this.values = values;
  }

  insert(value: number) {
    // tìm vị trí phần tử đầu tiên lớn hơn hoặc bằng ${value}
    const pos = this.binarySearchPosition(value, 0, this.values.length);
    // chèn value vào vị trí này
    this.values.splice(pos, 0, value);
  }

  delete(value: number) {
    // tìm vị trí phần tử đầu tiên lớn hơn hoặc bằng ${value}
    const pos = this.binarySearchPosition(value, 0, this.values.length);
    // xóa vị trí này nếu tìm thấy
    if (this.values[pos] === value) {
      this.values.splice(pos, 1);
    }
  }

  private binarySearchPosition(value: number, firstIndex: number, lastIndex: number): number {
    if (firstIndex === lastIndex) {
      return firstIndex;
    }

    const middleIndex = Math.floor((firstIndex + lastIndex) / 2);
    if (this.values[middleIndex] === value) {
      return middleIndex;
    }

    return this.values[middleIndex] < value
      ? this.binarySearchPosition(value, middleIndex + 1, lastIndex)
      : this.binarySearchPosition(value, firstIndex, middleIndex);
  }
}
