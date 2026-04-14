'use client';

import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import type { AttentionQueueItem } from '@/lib/types';
import ApproveModal from './ApproveModal';

interface AttentionCardProps {
  item: AttentionQueueItem;
  onApprove: (guestId: number, message: string) => Promise<void>;
  onArchive: (guestId: number) => Promise<void>;
  onReject: (guestId: number) => Promise<void>;
  onViewGuest?: (guestId: string) => void;
}

export default function AttentionCard({ item, onApprove, onArchive, onReject, onViewGuest }: AttentionCardProps) {
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const { guest, lastInboundAt, lastInboundMessage } = item;

  const fullName = [guest.fields['First Name'], guest.fields['Last Name']].filter(Boolean).join(' ') || 'Unknown';
  const firstName = guest.fields['First Name'] || 'Guest';
  const ageRange = guest.fields['Age Range'] || '';

  const timeAgo = lastInboundAt
    ? formatDistanceToNow(new Date(lastInboundAt), { addSuffix: true })
    : '';

  const handleApprove = useCallback(async (message: string) => {
    await onApprove(parseInt(guest.id, 10), message);
  }, [guest.id, onApprove]);

  const handleArchive = useCallback(async () => {
    setArchiving(true);
    try {
      await onArchive(parseInt(guest.id, 10));
    } catch (error) {
      console.error('Error archiving guest:', error);
      setArchiving(false);
    }
  }, [guest.id, onArchive]);

  const handleReject = useCallback(async () => {
    setRejecting(true);
    try {
      await onReject(parseInt(guest.id, 10));
    } catch (error) {
      console.error('Error rejecting guest:', error);
      setRejecting(false);
    }
  }, [guest.id, onReject]);

  const handleViewGuest = useCallback(() => {
    onViewGuest?.(guest.id);
  }, [guest.id, onViewGuest]);

  const isProcessing = archiving || rejecting;

  return (
    <>
      <div className={`p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${isProcessing ? 'opacity-50' : ''}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={handleViewGuest}
                className="font-medium text-terracotta hover:underline truncate text-left"
              >
                {fullName}
              </button>
              {ageRange && (
                <span className="text-sm text-gray-500">{ageRange}</span>
              )}
            </div>
            {timeAgo && (
              <div className="text-xs text-gray-500">
                {timeAgo}
              </div>
            )}
          </div>
        </div>

        {lastInboundMessage && (
          <div className="mb-3 p-2 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 line-clamp-3">
              {lastInboundMessage}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowApproveModal(true)}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-medium text-white bg-terracotta rounded hover:bg-terracotta-dark disabled:opacity-50 transition-colors"
          >
            Approve
          </button>

          <button
            onClick={handleArchive}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            {archiving ? 'Archiving...' : 'Archive'}
          </button>

          <button
            onClick={handleReject}
            disabled={isProcessing}
            className="px-3 py-1.5 text-xs font-medium text-gray-500 bg-gray-50 rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            {rejecting ? 'Rejecting...' : 'Reject'}
          </button>
        </div>
      </div>

      {showApproveModal && (
        <ApproveModal
          guestId={guest.id}
          guestName={firstName}
          onClose={() => setShowApproveModal(false)}
          onSend={handleApprove}
        />
      )}
    </>
  );
}
