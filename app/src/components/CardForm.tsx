import { useState, useEffect, useRef } from 'react';
import type { Card, Condition, CardVariant } from '@/lib/types';
import { searchCards, initCardSearch } from '@/lib/card-matcher';
import { generateId, getAvailableVariants } from '@/lib/card-store';
import type { UserCard } from '@/lib/types';

interface CardFormProps {
  cards: Card[];
  onSubmit: (card: UserCard) => void;
  onCancel: () => void;
  editCard?: UserCard | null;
}

export function CardForm({ cards, onSubmit, onCancel, editCard }: CardFormProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [condition, setCondition] = useState<Condition>('NM');
  const [variant, setVariant] = useState<CardVariant>('holofoil');
  const [quantity, setQuantity] = useState(1);
  const [owner, setOwner] = useState('default');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [purchaseCurrency, setPurchaseCurrency] = useState('EUR');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [gradingService, setGradingService] = useState('');
  const [gradingScore, setGradingScore] = useState('');
  const [notes, setNotes] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initCardSearch(cards);
  }, [cards]);

  useEffect(() => {
    if (editCard) {
      const card = cards.find((c) => c.id === editCard.cardId);
      if (card) {
        setSelectedCard(card);
        setQuery(card.name);
      }
      setCondition(editCard.condition);
      setVariant(editCard.variant);
      setQuantity(editCard.quantity);
      setOwner(editCard.owner);
      setPurchasePrice(editCard.purchasePrice?.toString() ?? '');
      setPurchaseCurrency(editCard.purchaseCurrency ?? 'EUR');
      setPurchaseDate(editCard.purchaseDate ?? '');
      setGradingService(editCard.grade?.service ?? '');
      setGradingScore(editCard.grade?.score?.toString() ?? '');
      setNotes(editCard.notes ?? '');
    }
  }, [editCard, cards]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSearch(value: string) {
    setQuery(value);
    if (value.length >= 2) {
      setResults(searchCards(value, 8));
      setShowDropdown(true);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
  }

  function handleSelectCard(card: Card) {
    setSelectedCard(card);
    setQuery(`${card.name} (${card.set.name} #${card.number})`);
    setShowDropdown(false);
    const variants = getAvailableVariants(card);
    if (variants[0]) setVariant(variants[0] as CardVariant);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCard) return;

    const userCard: UserCard = {
      id: editCard?.id ?? generateId(),
      cardId: selectedCard.id,
      owner,
      condition,
      variant,
      quantity: Math.max(1, quantity),
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchaseCurrency: purchaseCurrency || undefined,
      purchaseDate: purchaseDate || undefined,
      notes: notes || undefined,
      grade: gradingService && gradingScore
        ? { service: gradingService as 'PSA' | 'BGS' | 'CGC', score: parseFloat(gradingScore) }
        : undefined,
      addedAt: editCard?.addedAt ?? new Date().toISOString(),
    };

    onSubmit(userCard);
  }

  const availableVariants = selectedCard ? getAvailableVariants(selectedCard) : ['normal'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Card Search */}
      <div className="relative" ref={dropdownRef}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Card *</label>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder="Search by card name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
        {showDropdown && results.length > 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
            {results.map((card) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleSelectCard(card)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-blue-50 text-left"
              >
                <img src={card.images.small} alt="" className="w-8 h-11 object-contain" />
                <div>
                  <div className="text-sm font-medium">{card.name}</div>
                  <div className="text-xs text-gray-500">
                    {card.set.name} · #{card.number} · {card.rarity}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
        {selectedCard && (
          <div className="mt-2 flex items-center gap-3 p-2 bg-blue-50 rounded-lg">
            <img src={selectedCard.images.small} alt="" className="w-12 h-16 object-contain" />
            <div>
              <div className="font-medium text-sm">{selectedCard.name}</div>
              <div className="text-xs text-gray-500">
                {selectedCard.set.name} · #{selectedCard.number} · {selectedCard.rarity}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Row 1: Condition + Variant */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Condition *</label>
          <select
            value={condition}
            onChange={(e) => setCondition(e.target.value as Condition)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="NM">Near Mint</option>
            <option value="LP">Lightly Played</option>
            <option value="MP">Moderately Played</option>
            <option value="HP">Heavily Played</option>
            <option value="DMG">Damaged</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Variant</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as CardVariant)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {availableVariants.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Row 2: Quantity + Owner */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Row 3: Purchase */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price</label>
          <input
            type="number"
            step="0.01"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            value={purchaseCurrency}
            onChange={(e) => setPurchaseCurrency(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
          <input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* Row 4: Grading */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grading Service</label>
          <select
            value={gradingService}
            onChange={(e) => setGradingService(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">None</option>
            <option value="PSA">PSA</option>
            <option value="BGS">BGS / Beckett</option>
            <option value="CGC">CGC</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
          <input
            type="number"
            step="0.5"
            min={1}
            max={10}
            value={gradingScore}
            onChange={(e) => setGradingScore(e.target.value)}
            placeholder="e.g. 9.5"
            disabled={!gradingService}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:bg-gray-100"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
          placeholder="Optional notes..."
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!selectedCard}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {editCard ? 'Update Card' : 'Add Card'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
