import Fuse from 'fuse.js';
import type { Card } from './types';

let fuseInstance: Fuse<Card> | null = null;

export function initCardSearch(cards: Card[]): void {
  fuseInstance = new Fuse(cards, {
    keys: [
      { name: 'name', weight: 2 },
      { name: 'set.name', weight: 1 },
      { name: 'number', weight: 0.5 },
      { name: 'id', weight: 0.5 },
    ],
    threshold: 0.3,
    includeScore: true,
  });
}

export function searchCards(query: string, limit = 10): Card[] {
  if (!fuseInstance || !query.trim()) return [];
  return fuseInstance
    .search(query, { limit })
    .map((r) => r.item);
}
