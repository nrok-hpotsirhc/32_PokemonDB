import { read, utils, writeFile } from 'xlsx';
import type { UserCard, Condition, CardVariant, Card, GradingService } from './types';
import { getCardmarketPrice } from './types';
import { generateId } from './card-store';

interface ImportRow {
  addedAt?: string | number | Date;
  cardId?: string;
  name?: string;
  setCode?: string;
  setName?: string;
  number?: string;
  rarity?: string;
  owner?: string;
  condition?: string;
  variant?: string;
  quantity?: number;
  currentPrice?: number;
  currentPriceCurrency?: string;
  purchasePrice?: number;
  purchaseCurrency?: string;
  purchaseDate?: string;
  gradingService?: string;
  gradingScore?: number;
  notes?: string;
  sourceUrl?: string;
  imageUrl?: string;
}

export interface ImportResult {
  success: UserCard[];
  errors: { row: number; message: string }[];
}

const CARDMARKET_CURRENCY = 'EUR';

function createExportFilename(): string {
  const isoDate = new Date().toISOString().split('T')[0];
  return `pokemon-collection-${isoDate}.xlsx`;
}

function getSetCode(card?: Card): string {
  return card?.set.ptcgoCode ?? card?.set.id?.toUpperCase() ?? '';
}

const VALID_VARIANTS: CardVariant[] = [
  'holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil', '1stEditionNormal',
];

const IMPORT_TEMPLATE_FIELDS = [
  'cardId',
  'name',
  'setCode',
  'setName',
  'number',
  'rarity',
  'owner',
  'condition',
  'variant',
  'quantity',
  'purchasePrice',
  'purchaseCurrency',
  'purchaseDate',
  'gradingService',
  'gradingScore',
  'notes',
  'addedAt',
] as const;

function normalizeText(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.trim().replace(',', '.');
    if (normalized.length === 0) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function normalizeDate(value: unknown): string | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = utils.format_cell({ t: 'n', v: value, z: 'yyyy-mm-dd' });
    return parsed || undefined;
  }
  return normalizeText(value);
}

function normalizeGradingService(value: unknown): GradingService | undefined {
  const upper = normalizeText(value)?.toUpperCase();
  if (upper === 'PSA' || upper === 'BGS' || upper === 'CGC') return upper;
  return undefined;
}

function createExportRow(userCard: UserCard, card?: Card) {
  const currentPrice = card ? getCardmarketPrice(card, userCard.variant) : null;

  return {
    cardId: userCard.cardId,
    name: card?.name ?? '',
    setCode: getSetCode(card),
    setName: card?.set.name ?? '',
    number: card?.number ?? '',
    rarity: card?.rarity ?? '',
    owner: userCard.owner,
    condition: userCard.condition,
    variant: userCard.variant,
    quantity: userCard.quantity,
    currentPrice: currentPrice ?? '',
    currentPriceCurrency: currentPrice != null ? CARDMARKET_CURRENCY : '',
    purchasePrice: userCard.purchasePrice ?? '',
    purchaseCurrency: userCard.purchaseCurrency ?? '',
    purchaseDate: userCard.purchaseDate ?? '',
    gradingService: userCard.grade?.service ?? '',
    gradingScore: userCard.grade?.score ?? '',
    notes: userCard.notes ?? '',
    addedAt: userCard.addedAt,
    sourceUrl: card?.cardmarket?.url ?? card?.tcgplayer?.url ?? '',
    imageUrl: card?.images.large ?? '',
  };
}

function normalizeCondition(raw: string): Condition | null {
  const upper = raw.toUpperCase().trim();
  const map: Record<string, Condition> = {
    NM: 'NM', 'NEAR MINT': 'NM',
    LP: 'LP', 'LIGHTLY PLAYED': 'LP',
    MP: 'MP', 'MODERATELY PLAYED': 'MP',
    HP: 'HP', 'HEAVILY PLAYED': 'HP',
    DMG: 'DMG', DAMAGED: 'DMG',
  };
  return map[upper] ?? null;
}

function normalizeVariant(raw: string): CardVariant {
  const lower = raw.toLowerCase().trim();
  if (VALID_VARIANTS.includes(lower as CardVariant)) return lower as CardVariant;
  if (lower.includes('reverse')) return 'reverseHolofoil';
  if (lower.includes('1st') && lower.includes('holo')) return '1stEditionHolofoil';
  if (lower.includes('1st')) return '1stEditionNormal';
  if (lower.includes('holo')) return 'holofoil';
  return 'normal';
}

export function parseExcelFile(buffer: ArrayBuffer): ImportResult {
  const wb = read(buffer, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) return { success: [], errors: [{ row: 0, message: 'No sheet found' }] };

  const rows = utils.sheet_to_json<ImportRow>(wb.Sheets[sheetName]!, {
    raw: false,
    defval: '',
  });
  const success: UserCard[] = [];
  const errors: ImportResult['errors'] = [];

  rows.forEach((row, idx) => {
    const rowNum = idx + 2; // 1-indexed + header

    const cardId = normalizeText(row.cardId);
    const name = normalizeText(row.name);

    if (!cardId && !name) {
      errors.push({ row: rowNum, message: 'Missing cardId or name' });
      return;
    }

    const condition = normalizeCondition(normalizeText(row.condition) ?? 'NM');
    if (!condition) {
      errors.push({ row: rowNum, message: `Invalid condition: ${row.condition}` });
      return;
    }

    const quantity = normalizeNumber(row.quantity);
    const gradingService = normalizeGradingService(row.gradingService);
    const gradingScore = normalizeNumber(row.gradingScore);
    const purchasePrice = normalizeNumber(row.purchasePrice);
    const purchaseCurrency = normalizeText(row.purchaseCurrency);
    const purchaseDate = normalizeDate(row.purchaseDate);
    const addedAt = normalizeDate(row.addedAt) ?? new Date().toISOString();
    const derivedCardId = cardId ?? `${normalizeText(row.setCode) ?? 'unknown'}-${normalizeText(row.number) ?? '0'}`;

    success.push({
      id: generateId(),
      cardId: derivedCardId,
      owner: normalizeText(row.owner) ?? 'default',
      condition,
      variant: normalizeVariant(normalizeText(row.variant) ?? 'normal'),
      quantity: Math.max(1, Math.floor(quantity ?? 1)),
      purchasePrice,
      purchaseCurrency: purchaseCurrency ?? 'EUR',
      purchaseDate,
      notes: normalizeText(row.notes),
      grade: gradingService && gradingScore != null
        ? { service: gradingService, score: gradingScore }
        : undefined,
      addedAt,
    });
  });

  return { success, errors };
}

export function exportToExcel(
  userCards: UserCard[],
  cards: Card[] = [],
  filename = createExportFilename(),
): void {
  const cardMap = new Map(cards.map((card) => [card.id, card]));
  const data = userCards.map((uc) => createExportRow(uc, cardMap.get(uc.cardId)));

  const ws = utils.json_to_sheet(data);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Collection');
  writeFile(wb, filename);
}

export function downloadTemplate(): void {
  const templateRow = {
    cardId: 'base1-4',
    name: 'Charizard',
    setCode: 'BS',
    setName: 'Base',
    number: '4',
    rarity: 'Rare Holo',
    owner: 'default',
    condition: 'NM',
    variant: 'holofoil',
    quantity: 1,
    purchasePrice: 100,
    purchaseCurrency: 'EUR',
    purchaseDate: '2024-01-01',
    gradingService: '',
    gradingScore: '',
    notes: 'Example card',
    addedAt: '2024-01-01T00:00:00.000Z',
  };

  const ws = utils.json_to_sheet([templateRow], {
    header: [...IMPORT_TEMPLATE_FIELDS],
  });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Template');
  writeFile(wb, 'pokemon-import-template.xlsx');
}
