export class BoundedUndoStack<T> {
  private storage: T[] = [];

  constructor(private maxCapacity: number) {
    if (maxCapacity <= 0) {
      throw new Error("Capacity must be greater than 0");
    }
  }

  push(item: T): void {
    if (this.storage.length >= this.maxCapacity) {
      this.storage.shift(); 
    }

    this.storage.push(item); 
  }

  pop(): T | undefined {
    return this.storage.pop();
  }

  peek(): T | undefined {
    return this.storage[this.storage.length - 1];
  }

  size(): number {
    return this.storage.length;
  }

  isEmpty(): boolean {
    return this.storage.length === 0;
  }
}