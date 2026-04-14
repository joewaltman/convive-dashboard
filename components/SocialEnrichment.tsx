'use client';

import { useState } from 'react';

interface SocialSummary {
  inferred_role: string;
  industries: string[];
  interests: string[];
  conversational_vibe: string;
  guest_note: string;
  curiosity_signals: string;
  source_url: string;
  source_platform: 'linkedin' | 'instagram';
  enriched_at: string;
}

interface SocialEnrichmentProps {
  guestId: string;
  existingSummary?: SocialSummary | null;
}

type EnrichmentState = 'idle' | 'scraping' | 'extracting' | 'complete' | 'error';

export default function SocialEnrichment({ guestId, existingSummary }: SocialEnrichmentProps) {
  const [url, setUrl] = useState('');
  const [state, setState] = useState<EnrichmentState>('idle');
  const [result, setResult] = useState<SocialSummary | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunEnrichment = async () => {
    if (!url.trim()) return;

    setError(null);
    setState('scraping');

    try {
      const response = await fetch(`/api/guests/${guestId}/social-summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to run enrichment');
      }

      setState('extracting');
      const data = await response.json();
      setResult(data.result);
      setState('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState('error');
    }
  };

  const handleSave = async () => {
    if (!result) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/guests/${guestId}/social-summary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ socialSummary: result }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save');
      }

      // Refresh the page to show the saved data
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    setResult(null);
    setUrl('');
    setState('idle');
    setError(null);
  };

  // Show existing summary
  if (existingSummary && state === 'idle' && !result) {
    return (
      <div className="space-y-4">
        <SummaryCard summary={existingSummary} />
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Run new enrichment to replace existing data:</p>
          <div className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="LinkedIn or Instagram URL"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
            />
            <button
              onClick={handleRunEnrichment}
              disabled={!url.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Run Enrichment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading states
  if (state === 'scraping' || state === 'extracting') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-terracotta border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-gray-600">
            {state === 'scraping' ? 'Scraping profile data...' : 'Extracting insights with Claude...'}
          </p>
        </div>
      </div>
    );
  }

  // Show result with save/discard options
  if (state === 'complete' && result) {
    return (
      <div className="space-y-4">
        <SummaryCard summary={result} />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save to Profile'}
          </button>
          <button
            onClick={handleDiscard}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Discard
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // Default idle state with input
  return (
    <div className="space-y-3">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="LinkedIn or Instagram URL"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-terracotta focus:border-terracotta"
        />
        <button
          onClick={handleRunEnrichment}
          disabled={!url.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-terracotta rounded-lg hover:bg-terracotta-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Run Enrichment
        </button>
      </div>
      <p className="text-xs text-gray-500">
        Paste a LinkedIn or Instagram profile URL to extract guest insights.
      </p>
    </div>
  );
}

function SummaryCard({ summary }: { summary: SocialSummary }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {summary.source_platform === 'linkedin' ? 'LinkedIn' : 'Instagram'} Profile
        </span>
        <span className="text-xs text-gray-400">
          {new Date(summary.enriched_at).toLocaleDateString()}
        </span>
      </div>

      <SummaryField label="Role" value={summary.inferred_role} />
      <SummaryField label="Industries" value={summary.industries.join(', ')} />
      <SummaryField label="Interests" value={summary.interests.join(', ')} />
      <SummaryField label="Conversational Vibe" value={summary.conversational_vibe} />
      <SummaryField label="Guest Note" value={summary.guest_note} />
      <SummaryField label="Curiosity Signals" value={summary.curiosity_signals} />

      <a
        href={summary.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-xs text-terracotta hover:underline"
      >
        View original profile
      </a>
    </div>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  if (!value) return null;

  return (
    <div>
      <dt className="text-xs font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 mt-0.5">{value}</dd>
    </div>
  );
}
