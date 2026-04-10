import type { UserCard, Card } from './types';

const STORAGE_KEY = 'pokemon-tracker-user-cards';

export function loadUserCardsLocal(): UserCard[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserCard[];
  } catch {
    return null;
  }
}

export function saveUserCardsLocal(cards: UserCard[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

export function addUserCard(cards: UserCard[], card: UserCard): UserCard[] {
  const updated = [...cards, card];
  saveUserCardsLocal(updated);
  return updated;
}

export function updateUserCard(cards: UserCard[], updated: UserCard): UserCard[] {
  const result = cards.map((c) => (c.id === updated.id ? updated : c));
  saveUserCardsLocal(result);
  return result;
}

export function deleteUserCard(cards: UserCard[], id: string): UserCard[] {
  const result = cards.filter((c) => c.id !== id);
  saveUserCardsLocal(result);
  return result;
}

export function generateId(): string {
  return `uc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function getAvailableVariants(card: Card): string[] {
  if (!card.tcgplayer?.prices) return ['normal'];
  return Object.keys(card.tcgplayer.prices);
}
