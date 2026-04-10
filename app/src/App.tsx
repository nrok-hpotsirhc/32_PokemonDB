import { useState, useCallback } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { CardTable } from '@/components/CardTable';
import { Dashboard } from '@/components/Dashboard';
import { CardForm } from '@/components/CardForm';
import { CardDetail } from '@/components/CardDetail';
import { ExcelImport } from '@/components/ExcelImport';
import { OcrScanner } from '@/components/OcrScanner';
import { formatCurrency, totalPortfolioValue } from '@/lib/price-utils';
import { addUserCard, updateUserCard, deleteUserCard } from '@/lib/card-store';
import type { UserCard, Card, PortfolioRow } from '@/lib/types';

type Tab = 'dashboard' | 'portfolio' | 'add' | 'import' | 'scan';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'portfolio', label: 'Portfolio', icon: '🗂️' },
  { id: 'add', label: 'Add Card', icon: '➕' },
  { id: 'import', label: 'Import', icon: '📄' },
  { id: 'scan', label: 'Scan', icon: '📷' },
];

export function App() {
  const { rows, cards, userCards, loading, error, lastSynced, setUserCards } = usePortfolioData();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [detailRow, setDetailRow] = useState<PortfolioRow | null>(null);
  const [editCard, setEditCard] = useState<UserCard | null>(null);

  const total = totalPortfolioValue(rows);
  const currency = rows[0]?.currency ?? 'USD';

  const handleAddCard = useCallback(
    (card: UserCard) => {
      setUserCards(addUserCard(userCards, card));
      setTab('portfolio');
    },
    [userCards, setUserCards],
  );

  const handleUpdateCard = useCallback(
    (card: UserCard) => {
      setUserCards(updateUserCard(userCards, card));
      setEditCard(null);
      setDetailRow(null);
    },
    [userCards, setUserCards],
  );

  const handleDeleteCard = useCallback(
    (id: string) => {
      setUserCards(deleteUserCard(userCards, id));
      setDetailRow(null);
    },
    [userCards, setUserCards],
  );

  const handleImport = useCallback(
    (imported: UserCard[]) => {
      let updated = [...userCards];
      for (const card of imported) {
        updated = addUserCard(updated, card);
      }
      setUserCards(updated);
    },
    [userCards, setUserCards],
  );

  const handleScanDetected = useCallback(
    (card: Card) => {
      // Pre-fill form with detected card – switch to add tab with edit state
      setEditCard({
        id: '',
        cardId: card.id,
        owner: '',
        condition: 'NM',
        variant: 'holofoil',
        quantity: 1,
        addedAt: new Date().toISOString(),
      });
      setTab('add');
    },
    [],
  );

  const handleRowClick = useCallback(
    (row: PortfolioRow) => setDetailRow(row),
    [],
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚡</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Pokémon Card Tracker
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Portfolio value overview
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(total, currency)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {rows.length} cards · {lastSynced
                  ? `synced ${new Date(lastSynced).toLocaleDateString('de-DE')}`
                  : 'no sync data'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto -mb-px">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
                }`}
              >
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading portfolio...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-700 dark:text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {tab === 'dashboard' && <Dashboard rows={rows} />}

            {tab === 'portfolio' && (
              rows.length > 0 ? (
                <CardTable rows={rows} onRowClick={handleRowClick} />
              ) : (
                <EmptyState onAdd={() => setTab('add')} />
              )
            )}

            {tab === 'add' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">
                  {editCard ? 'Edit Card' : 'Add Card to Collection'}
                </h2>
                <CardForm
                  cards={cards}
                  onSubmit={editCard?.id ? handleUpdateCard : handleAddCard}
                  onCancel={() => { setEditCard(null); setTab('portfolio'); }}
                  editCard={editCard}
                />
              </div>
            )}

            {tab === 'import' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Import from Excel/CSV</h2>
                <ExcelImport onImport={handleImport} />
              </div>
            )}

            {tab === 'scan' && (
              <div className="max-w-xl mx-auto">
                <h2 className="text-lg font-semibold mb-4">Scan Card (OCR)</h2>
                <OcrScanner cards={cards} onCardDetected={handleScanDetected} />
              </div>
            )}
          </>
        )}
      </main>

      {/* Card Detail Modal */}
      {detailRow && (
        <CardDetail
          row={detailRow}
          onClose={() => setDetailRow(null)}
          onEdit={() => {
            setEditCard(detailRow.userCard);
            setDetailRow(null);
            setTab('add');
          }}
          onDelete={() => handleDeleteCard(detailRow.userCard.id)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 text-xs text-gray-400 text-center">
          Prices from TCGPlayer via pokemontcg.io · Not affiliated with The Pokémon Company ·
          For personal use only
        </div>
      </footer>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
      <p className="text-lg">No cards in your collection yet.</p>
      <p className="text-sm mt-2">
        <button onClick={onAdd} className="text-blue-600 hover:underline">
          Add a card
        </button>{' '}
        or import an Excel file.
      </p>
    </div>
  );
}
