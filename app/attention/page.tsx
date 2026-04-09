'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import Sidebar from '@/components/Sidebar';
import AttentionCard from '@/components/AttentionCard';
import type { AttentionQueueData, AttentionQueueItem } from '@/lib/types';
import { ATTENTION_CATEGORIES, COLORS } from '@/lib/constants';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface CategorySectionProps {
  title: string;
  color: string;
  items: AttentionQueueItem[];
  onRoute: (guestId: number, status: string) => Promise<void>;
  onViewGuest: (guestId: string) => void;
}

function CategorySection({ title, color, items, onRoute, onViewGuest }: CategorySectionProps) {
  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <h2 className="text-lg font-semibold text-gray-900">
          {title}
        </h2>
        <span className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <AttentionCard
            key={item.guest.id}
            item={item}
            onRoute={onRoute}
            onViewGuest={onViewGuest}
          />
        ))}
      </div>
    </div>
  );
}

export default function AttentionPage() {
  const router = useRouter();

  const { data, error, isLoading, mutate } = useSWR<AttentionQueueData>(
    '/api/attention',
    fetcher,
    {
      refreshInterval: 60000, // Poll every minute
      revalidateOnFocus: false,
    }
  );

  const handleRoute = useCallback(async (guestId: number, status: string) => {
    const response = await fetch(`/api/guests/${guestId}/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to route guest');
    }

    // Revalidate the queue
    mutate();
  }, [mutate]);

  const handleViewGuest = useCallback((guestId: string) => {
    router.push(`/?guest=${guestId}`);
  }, [router]);

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Needs Attention
            </h1>
            {data && (
              <p className="text-gray-600">
                {data.totalCount} {data.totalCount === 1 ? 'guest' : 'guests'} need attention
              </p>
            )}
          </div>

          {/* Summary Cards */}
          {data && data.totalCount > 0 && (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 mb-8">
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {data.unroutedReply.length}
                </div>
                <div className="text-sm text-red-700">Unrouted Replies</div>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="text-2xl font-bold text-amber-600">
                  {data.needsManualResponse.length}
                </div>
                <div className="text-sm text-amber-700">Need Manual Reply</div>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {data.sequenceCompleteNoResponse.length}
                </div>
                <div className="text-sm text-blue-700">No Response</div>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-100 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {data.yellowNoCall.length}
                </div>
                <div className="text-sm text-purple-700">Call Pending</div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading attention queue...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Failed to load attention queue</div>
            </div>
          )}

          {/* Empty State */}
          {data && data.totalCount === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: `${COLORS.terracotta}20` }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: COLORS.terracotta }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900 mb-1">All caught up!</p>
              <p className="text-gray-500">No guests need attention right now.</p>
            </div>
          )}

          {/* Category Sections */}
          {data && data.totalCount > 0 && (
            <>
              <CategorySection
                title="Replied - Unrouted"
                color={ATTENTION_CATEGORIES.unrouted_reply.color}
                items={data.unroutedReply}
                onRoute={handleRoute}
                onViewGuest={handleViewGuest}
              />
              <CategorySection
                title="Needs Manual Reply"
                color={ATTENTION_CATEGORIES.needs_manual_response.color}
                items={data.needsManualResponse}
                onRoute={handleRoute}
                onViewGuest={handleViewGuest}
              />
              <CategorySection
                title="No Response"
                color={ATTENTION_CATEGORIES.sequence_complete_no_response.color}
                items={data.sequenceCompleteNoResponse}
                onRoute={handleRoute}
                onViewGuest={handleViewGuest}
              />
              <CategorySection
                title="Call Pending"
                color={ATTENTION_CATEGORIES.yellow_no_call.color}
                items={data.yellowNoCall}
                onRoute={handleRoute}
                onViewGuest={handleViewGuest}
              />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
