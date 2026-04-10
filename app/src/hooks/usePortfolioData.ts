import { useState, useEffect } from 'react';
import type { Card, UserCard, PriceSnapshot, PortfolioRow } from '@/lib/types';
import {
  loadUserCards,
  loadLatestPrices,
  loadPriceSnapshot,
} from '@/lib/data-loader';
import { loadUserCardsLocal } from '@/lib/card-store';
import { fetchCardsByIds } from '@/lib/pokemon-api';
import { buildPortfolioRows } from '@/lib/price-utils';

interface PortfolioData {
  rows: PortfolioRow[];
  cards: Card[];
  userCards: UserCard[];
  setUserCards: (cards: UserCard[]) => void;
  latestPrices: PriceSnapshot | null;
  loading: boolean;
  error: string | null;
  lastSynced: string | null;
}

export function usePortfolioData(): PortfolioData {
  const [cards, setCards] = useState<Card[]>([]);
  const [userCards, setUserCards] = useState<UserCard[]>([]);
  const [latestPrices, setLatestPrices] = useState<PriceSnapshot | null>(null);
  const [dayAgoPrices, setDayAgoPrices] = useState<PriceSnapshot | null>(null);
  const [weekAgoPrices, setWeekAgoPrices] = useState<PriceSnapshot | null>(null);
  const [monthAgoPrices, setMonthAgoPrices] = useState<PriceSnapshot | null>(null);
  const [yearAgoPrices, setYearAgoPrices] = useState<PriceSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [userCardsData, latestData] = await Promise.all([
          loadUserCards(),
          loadLatestPrices(),
        ]);

        // Prefer localStorage user cards, fallback to JSON file
        const localCards = loadUserCardsLocal();
        const resolvedUserCards = localCards ?? userCardsData;
        setUserCards(resolvedUserCards);
        setLatestPrices(latestData);

        // Fetch card data from pokemontcg.io API based on user's card IDs
        const uniqueCardIds = [...new Set(resolvedUserCards.map((uc) => uc.cardId))];
        if (uniqueCardIds.length > 0) {
          const cardsData = await fetchCardsByIds(uniqueCardIds);
          setCards(cardsData);
        }

        // Load historical snapshots in parallel
        const today = new Date();
        const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
        const addDays = (d: Date, n: number) => {
          const r = new Date(d);
          r.setDate(r.getDate() + n);
          return r;
        };

        const [dayAgo, weekAgo, monthAgo, yearAgo] = await Promise.all([
          loadPriceSnapshot(fmtDate(addDays(today, -1))),
          loadPriceSnapshot(fmtDate(addDays(today, -7))),
          loadPriceSnapshot(fmtDate(addDays(today, -30))),
          loadPriceSnapshot(fmtDate(addDays(today, -365))),
        ]);

        setDayAgoPrices(dayAgo);
        setWeekAgoPrices(weekAgo);
        setMonthAgoPrices(monthAgo);
        setYearAgoPrices(yearAgo);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const rows = buildPortfolioRows(
    userCards,
    cards,
    latestPrices,
    dayAgoPrices,
    weekAgoPrices,
    monthAgoPrices,
    yearAgoPrices,
  );

  return {
    rows,
    cards,
    userCards,
    setUserCards,
    latestPrices,
    loading,
    error,
    lastSynced: latestPrices?.syncedAt ?? null,
  };
}
