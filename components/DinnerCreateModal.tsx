'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import type { DinnerFields, Host } from '@/lib/types';
import { DEFAULT_START_TIME, DEFAULT_GUEST_COUNT } from '@/lib/constants';

// Generate dinner name in format {mon}{dd}_{firstname}
function generateDinnerName(date: string, hostFirstName: string): string {
  // Parse date string directly to avoid timezone issues
  // date format is "YYYY-MM-DD"
  const [, month, day] = date.split('-').map(Number);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const monthStr = months[month - 1]; // month is 1-indexed from the string
  const dayStr = String(day).padStart(2, '0');
  const name = hostFirstName.toLowerCase();
  return `${monthStr}${dayStr}_${name}`;
}

interface DinnerCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (fields: Partial<DinnerFields>) => Promise<void>;
  hosts: Host[];
}

export default function DinnerCreateModal({ isOpen, onClose, onCreate, hosts }: DinnerCreateModalProps) {
  const [fields, setFields] = useState<Partial<DinnerFields>>({
    'Dinner Date': format(new Date(), 'yyyy-MM-dd'),
    'Start Time': DEFAULT_START_TIME,
    'Guest Count': DEFAULT_GUEST_COUNT,
  });
  const [selectedHostId, setSelectedHostId] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [useAutoName, setUseAutoName] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get selected host
  const selectedHost = useMemo(() => {
    return hosts.find(h => h.id === selectedHostId) || null;
  }, [hosts, selectedHostId]);

  // Auto-generate dinner name
  const autoName = useMemo(() => {
    if (!fields['Dinner Date'] || !selectedHost) return '';
    const hostFirstName = selectedHost.fields['First Name'] || '';
    return generateDinnerName(fields['Dinner Date'], hostFirstName);
  }, [fields['Dinner Date'], selectedHost]);

  // Auto-fill location from host address
  useEffect(() => {
    if (selectedHost?.fields['Address']) {
      setFields(prev => ({
        ...prev,
        'Location': selectedHost.fields['Address'],
      }));
    }
  }, [selectedHost]);

  const handleChange = useCallback((field: keyof DinnerFields, value: unknown) => {
    setFields(prev => ({ ...prev, [field]: value }));
    setError(null);
  }, []);

  const handleHostChange = useCallback((hostId: string) => {
    setSelectedHostId(hostId);
    if (hostId) {
      setFields(prev => ({
        ...prev,
        'Host ID': parseInt(hostId),
      }));
    } else {
      setFields(prev => {
        const { 'Host ID': _, ...rest } = prev;
        return rest;
      });
    }
    setError(null);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fields['Dinner Date']) {
      setError('Dinner date is required');
      return;
    }

    setIsCreating(true);
    setError(null);

    const finalName = useAutoName ? autoName : customName;

    try {
      await onCreate({
        ...fields,
        'Dinner Name': finalName || `Dinner on ${fields['Dinner Date']}`,
      });

      // Reset form
      setFields({
        'Dinner Date': format(new Date(), 'yyyy-MM-dd'),
        'Start Time': DEFAULT_START_TIME,
        'Guest Count': DEFAULT_GUEST_COUNT,
      });
      setSelectedHostId('');
      setCustomName('');
      setUseAutoName(true);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create dinner');
    } finally {
      setIsCreating(false);
    }
  }, [fields, useAutoName, autoName, customName, onCreate, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFields({
        'Dinner Date': format(new Date(), 'yyyy-MM-dd'),
        'Start Time': DEFAULT_START_TIME,
        'Guest Count': DEFAULT_GUEST_COUNT,
      });
      setSelectedHostId('');
      setCustomName('');
      setUseAutoName(true);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const activeHosts = hosts.filter(h => h.fields['Active'] !== false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Schedule New Dinner</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={String(fields['Dinner Date'] || '')}
                  onChange={(e) => handleChange('Dinner Date', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={String(fields['Start Time'] || DEFAULT_START_TIME)}
                  onChange={(e) => handleChange('Start Time', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
                />
              </div>
            </div>

            {/* Host */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Host</label>
              <select
                value={selectedHostId}
                onChange={(e) => handleHostChange(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
              >
                <option value="">Select a host...</option>
                {activeHosts.map(host => (
                  <option key={host.id} value={host.id}>
                    {host.fields['First Name']} {host.fields['Last Name']}
                    {host.fields['City'] ? ` (${host.fields['City']})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Dinner Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dinner Name
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="radio"
                    checked={useAutoName}
                    onChange={() => setUseAutoName(true)}
                    className="text-terracotta focus:ring-terracotta"
                  />
                  Auto-generate: {autoName || '(select date and host)'}
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="radio"
                    checked={!useAutoName}
                    onChange={() => setUseAutoName(false)}
                    className="text-terracotta focus:ring-terracotta"
                  />
                  Custom name
                </label>
                {!useAutoName && (
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter dinner name..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
                  />
                )}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={String(fields['Location'] || '')}
                onChange={(e) => handleChange('Location', e.target.value)}
                placeholder="Enter location or auto-filled from host..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
              />
            </div>

            {/* Guest Count & Menu */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Guest Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={Number(fields['Guest Count']) || DEFAULT_GUEST_COUNT}
                  onChange={(e) => handleChange('Guest Count', parseInt(e.target.value) || DEFAULT_GUEST_COUNT)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Menu</label>
                <input
                  type="text"
                  value={String(fields['Menu'] || '')}
                  onChange={(e) => handleChange('Menu', e.target.value)}
                  placeholder="e.g., Italian, BBQ..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={String(fields['Notes'] || '')}
                onChange={(e) => handleChange('Notes', e.target.value)}
                rows={3}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creating...' : 'Create Dinner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
