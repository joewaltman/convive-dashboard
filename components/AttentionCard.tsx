'use client';

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { AttentionQueueItem } from '@/lib/types';

interface AttentionCardProps {
  item: AttentionQueueItem;
  onRoute: (guestId: number, status: string) => Promise<void>;
  onUnpause: (guestId: number) => Promise<void>;
  onViewGuest?: (guestId: string) => void;
}

export default function AttentionCard({ item, onRoute, onUnpause, onViewGuest }: AttentionCardProps) {
  const [routing, setRouting] = useState<string | null>(null);
  const [unpausing, setUnpausing] = useState(false);

  const { guest, lastActivityAt } = item;

  const fullName = [guest.fields['First Name'], guest.fields['Last Name']].filter(Boolean).join(' ') || 'Unknown';
  const ageRange = guest.fields['Age Range'] || '';
  const curiousAbout = guest.fields['Curious About'] || '';
  const funnelStage = guest.fields['Funnel Stage'] || '';
  const sequencePaused = guest.fields['Sequence Paused'] || false;
  const sequenceStep = guest.fields['Sequence Step'];

  const timeAgo = lastActivityAt
    ? formatDistanceToNow(new Date(lastActivityAt), { addSuffix: true })
    : '';

  const handleRoute = useCallback(async (status: string) => {
    setRouting(status);
    try {
      await onRoute(parseInt(guest.id, 10), status);
    } catch (error) {
      console.error('Error routing guest:', error);
    } finally {
      setRouting(null);
    }
  }, [guest.id, onRoute]);

  const handleUnpause = useCallback(async () => {
    setUnpausing(true);
    try {
      await onUnpause(parseInt(guest.id, 10));
    } catch (error) {
      console.error('Error unpausing sequence:', error);
    } finally {
      setUnpausing(false);
    }
  }, [guest.id, onUnpause]);

  const handleViewGuest = useCallback(() => {
    onViewGuest?.(guest.id);
  }, [guest.id, onViewGuest]);

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={handleViewGuest}
              className="font-medium text-gray-900 hover:underline truncate"
            >
              {fullName}
            </button>
            {ageRange && (
              <span className="text-sm text-gray-500">{ageRange}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            {funnelStage && (
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {funnelStage}
              </span>
            )}
            {sequenceStep != null && (
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">
                Step {sequenceStep}/4
              </span>
            )}
            {sequencePaused && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">
                Paused
              </span>
            )}
            {timeAgo && <span>{timeAgo}</span>}
          </div>
        </div>
      </div>

      {curiousAbout && (
        <div className="mb-3 text-sm text-gray-600">
          <span className="text-xs text-gray-500 block mb-1">Curious about:</span>
          <span className="line-clamp-2">{curiousAbout}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleRoute('green')}
          disabled={routing !== null || unpausing}
          className="px-3 py-1.5 text-xs font-medium text-white bg-green-500 rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {routing === 'green' ? 'Routing...' : 'Mark Green'}
        </button>

        <button
          onClick={() => handleRoute('yellow')}
          disabled={routing !== null || unpausing}
          className="px-3 py-1.5 text-xs font-medium text-yellow-700 bg-yellow-100 rounded hover:bg-yellow-200 disabled:opacity-50 transition-colors"
        >
          {routing === 'yellow' ? 'Routing...' : 'Mark Yellow'}
        </button>

        <button
          onClick={() => handleRoute('deprioritized')}
          disabled={routing !== null || unpausing}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {routing === 'deprioritized' ? 'Routing...' : 'Deprioritize'}
        </button>

        {sequencePaused && (
          <button
            onClick={handleUnpause}
            disabled={routing !== null || unpausing}
            className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
          >
            {unpausing ? 'Unpausing...' : 'Unpause'}
          </button>
        )}
      </div>
    </div>
  );
}
