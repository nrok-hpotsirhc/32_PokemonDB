import type {
  Card,
  UserCard,
  PriceSnapshot,
  PortfolioRow,
  CardVariant,
  CardPrices,
} from './types';
import { getCardmarketPrice } from './types';

/** Get market price from a snapshot – prefers Cardmarket, falls back to TCGPlayer */
export function getMarketPrice(
  snapshot: PriceSnapshot | null,
  cardId: string,
  variant: CardVariant,
): number | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  if (!entry) return null;

  // Prefer Cardmarket (EUR, European market)
  if (entry.cardmarket?.prices) {
    const cm = entry.cardmarket.prices;
    if (variant === 'reverseHolofoil') {
      return cm.reverseHoloTrend ?? cm.reverseHoloSell ?? null;
    }
    return cm.trendPrice ?? cm.averageSellPrice ?? null;
  }

  // Fallback to TCGPlayer
  if (entry.tcgplayer?.prices) {
    const variantPrices = entry.tcgplayer.prices[variant] as CardPrices | undefined;
    return variantPrices?.market ?? null;
  }

  return null;
}

export function getCurrency(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string {
  if (!snapshot) return 'EUR';
  const entry = snapshot.prices[cardId];
  if (entry?.cardmarket) return entry.cardmarket.currency ?? 'EUR';
  return entry?.tcgplayer?.currency ?? 'EUR';
}

export function getSourceUrl(
  snapshot: PriceSnapshot | null,
  cardId: string,
): string | null {
  if (!snapshot) return null;
  const entry = snapshot.prices[cardId];
  if (entry?.cardmarket) return entry.cardmarket.url ?? null;
  return entry?.tcgplayer?.url ?? null;
}

export function calcPctChange(
  current: number | null,
  previous: number | null,
): number | null {
  if (current == null || previous == null || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function buildPortfolioRows(
  userCards: UserCard[],
  cards: Card[],
  latestPrices: PriceSnapshot | null,
  dayAgoPrices: PriceSnapshot | null,
  weekAgoPrices: PriceSnapshot | null,
  monthAgoPrices: PriceSnapshot | null,
  yearAgoPrices: PriceSnapshot | null,
): PortfolioRow[] {
  const cardMap = new Map(cards.map((c) => [c.id, c]));

  return userCards
    .map((uc): PortfolioRow | null => {
      const card = cardMap.get(uc.cardId);
      if (!card) return null;

      // Use snapshot price if available, otherwise fall back to card's live Cardmarket price
      const currentPrice = getMarketPrice(latestPrices, uc.cardId, uc.variant)
        ?? getCardmarketPrice(card, uc.variant);
      const priceDayAgo = getMarketPrice(dayAgoPrices, uc.cardId, uc.variant);
      const priceWeekAgo = getMarketPrice(weekAgoPrices, uc.cardId, uc.variant);
      const priceMonthAgo = getMarketPrice(monthAgoPrices, uc.cardId, uc.variant);
      const priceYearAgo = getMarketPrice(yearAgoPrices, uc.cardId, uc.variant);

      // If current from live API, use card's cardmarket URL
      const sourceUrl = getSourceUrl(latestPrices, uc.cardId)
        ?? card.cardmarket?.url ?? null;

      return {
        userCard: uc,
        card,
        currentPrice,
        currency: getCurrency(latestPrices, uc.cardId),
        sourceUrl,
        priceDayAgo,
        priceWeekAgo,
        priceMonthAgo,
        priceYearAgo,
        changeDayPct: calcPctChange(currentPrice, priceDayAgo),
        changeWeekPct: calcPctChange(currentPrice, priceWeekAgo),
        changeMonthPct: calcPctChange(currentPrice, priceMonthAgo),
        changeYearPct: calcPctChange(currentPrice, priceYearAgo),
      };
    })
    .filter((row): row is PortfolioRow => row !== null);
}

export function formatCurrency(value: number | null, currency: string): string {
  if (value == null) return 'N/A';
  const locale = currency === 'EUR' ? 'de-DE' : 'en-US';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatPct(value: number | null): string {
  if (value == null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function totalPortfolioValue(rows: PortfolioRow[]): number {
  return rows.reduce((sum, r) => {
    if (r.currentPrice == null) return sum;
    return sum + r.currentPrice * r.userCard.quantity;
  }, 0);
}
