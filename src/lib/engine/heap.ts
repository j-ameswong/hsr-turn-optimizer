/**
 * Min-heap of PendingTurn entries, ordered by av (action value).
 * Uses lazy deletion: stale entries (wrong generation) are skipped on pop.
 */

import type { PendingTurn } from './types';

export class TurnHeap {
  private data: PendingTurn[] = [];

  get size(): number {
    return this.data.length;
  }

  push(turn: PendingTurn): void {
    this.data.push(turn);
    this.bubbleUp(this.data.length - 1);
  }

  /** Returns the minimum AV entry, skipping stale entries from lazy deletion. */
  pop(generationMap: Map<string, number>): PendingTurn | undefined {
    while (this.data.length > 0) {
      this.swap(0, this.data.length - 1);
      const top = this.data.pop()!;
      this.sinkDown(0);

      const currentGen = generationMap.get(top.actorId) ?? 0;
      if (top.generation === currentGen) {
        return top;
      }
      // stale entry — skip and try next
    }
    return undefined;
  }

  peek(generationMap: Map<string, number>): PendingTurn | undefined {
    // Drain stale entries from the top
    while (this.data.length > 0) {
      const top = this.data[0];
      const currentGen = generationMap.get(top.actorId) ?? 0;
      if (top.generation === currentGen) return top;
      // stale — remove
      this.swap(0, this.data.length - 1);
      this.data.pop();
      this.sinkDown(0);
    }
    return undefined;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].av <= this.data[i].av) break;
      this.swap(parent, i);
      i = parent;
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].av < this.data[smallest].av) smallest = l;
      if (r < n && this.data[r].av < this.data[smallest].av) smallest = r;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp = this.data[a];
    this.data[a] = this.data[b];
    this.data[b] = tmp;
  }
}
