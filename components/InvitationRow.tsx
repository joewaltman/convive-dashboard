'use client';

import { useState, useCallback } from 'react';
import type { Invitation, InvitationResponse } from '@/lib/types';
import { INVITATION_RESPONSE_OPTIONS } from '@/lib/constants';

interface InvitationRowProps {
  invitation: Invitation;
  onResponseChange: (id: number, response: InvitationResponse) => Promise<void>;
}

export default function InvitationRow({ invitation, onResponseChange }: InvitationRowProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleResponseChange = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const response: InvitationResponse = value === '' ? null : value as InvitationResponse;

    setIsUpdating(true);
    try {
      await onResponseChange(invitation.id, response);
    } finally {
      setIsUpdating(false);
    }
  }, [invitation.id, onResponseChange]);

  const currentOption = INVITATION_RESPONSE_OPTIONS.find(
    opt => opt.value === invitation.response
  ) || INVITATION_RESPONSE_OPTIONS[3]; // Default to "No Response"

  return (
    <div className="flex items-center gap-4 py-3 px-4 border-b border-gray-100 last:border-b-0">
      {/* Guest Name */}
      <div className="flex-1 min-w-0">
        <a
          href={`/?guest=${invitation.guestId}`}
          className="font-medium text-gray-900 hover:text-terracotta hover:underline"
        >
          {invitation.guestName}
        </a>
        {invitation.phone && (
          <p className="text-xs text-gray-500 mt-0.5">{invitation.phone}</p>
        )}
      </div>

      {/* Response Dropdown */}
      <div className="shrink-0 w-36">
        <select
          value={invitation.response || ''}
          onChange={handleResponseChange}
          disabled={isUpdating}
          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta disabled:opacity-50"
          style={{
            backgroundColor: `${currentOption.color}15`,
            borderColor: currentOption.color,
          }}
        >
          {INVITATION_RESPONSE_OPTIONS.map(option => (
            <option key={option.label} value={option.value || ''}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Invite Sent Date */}
      <div className="shrink-0 w-24 text-right">
        {invitation.inviteSentDate ? (
          <span className="text-xs text-gray-500">
            Sent {invitation.inviteSentDate}
          </span>
        ) : (
          <span className="text-xs text-gray-400">Not sent</span>
        )}
      </div>

      {/* Notes indicator */}
      {invitation.notes && (
        <div className="shrink-0" title={invitation.notes}>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        </div>
      )}
    </div>
  );
}
