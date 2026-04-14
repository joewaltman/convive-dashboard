import { NextResponse } from 'next/server';
import { updateGuest } from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';

type Platform = 'linkedin' | 'instagram';

interface SocialSummary {
  inferred_role: string;
  industries: string[];
  interests: string[];
  conversational_vibe: string;
  guest_note: string;
  curiosity_signals: string;
  source_url: string;
  source_platform: Platform;
  enriched_at: string;
}

function detectPlatform(url: string): Platform | null {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  return null;
}

async function runApifyScraper(url: string, platform: Platform): Promise<unknown> {
  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    throw new Error('APIFY_TOKEN not configured');
  }

  const actorId = platform === 'linkedin'
    ? 'dev_fusion~Linkedin-Profile-Scraper'
    : 'apify~instagram-scraper';

  // Build input based on platform (different actors expect different schemas)
  let input;
  if (platform === 'linkedin') {
    const linkedinCookie = process.env.LINKEDIN_COOKIE;
    if (!linkedinCookie) {
      throw new Error('LINKEDIN_COOKIE not configured - required for LinkedIn scraping');
    }
    input = {
      profileUrls: [url],
      cookie: linkedinCookie,
    };
  } else {
    input = { directUrls: [url], resultsType: 'details' };
  }

  // Start the actor run
  const startResponse = await fetch(
    `https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyToken}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );

  if (!startResponse.ok) {
    const error = await startResponse.text();
    throw new Error(`Failed to start Apify actor: ${error}`);
  }

  const runData = await startResponse.json();
  const runId = runData.data.id;

  // Poll for completion
  const maxAttempts = 60; // 5 minutes max
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

    const statusResponse = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${apifyToken}`
    );

    if (!statusResponse.ok) {
      throw new Error('Failed to check actor run status');
    }

    const statusData = await statusResponse.json();
    const status = statusData.data.status;

    if (status === 'SUCCEEDED') {
      // Get dataset items
      const datasetId = statusData.data.defaultDatasetId;
      const datasetResponse = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyToken}`
      );

      if (!datasetResponse.ok) {
        throw new Error('Failed to fetch dataset');
      }

      const items = await datasetResponse.json();
      return items[0] || null;
    }

    if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
      throw new Error(`Actor run ${status.toLowerCase()}`);
    }
  }

  throw new Error('Actor run timed out');
}

async function extractWithClaude(profileData: unknown): Promise<Omit<SocialSummary, 'source_url' | 'source_platform' | 'enriched_at'>> {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const client = new Anthropic({ apiKey: anthropicKey });

  const prompt = `Extract the following from this social profile and return as JSON:
- inferred_role: their job or what they seem to do
- industries: array of relevant industries/fields
- interests: array of topics they genuinely seem interested in
- conversational_vibe: 1 sentence — are they a seller, an analyst, a connector, etc.
- guest_note: 1 sentence Joe can use when planning a table — what makes them an interesting addition
- curiosity_signals: any evidence they ask questions, explore outside their lane, show intellectual range

Profile data:
${JSON.stringify(profileData, null, 2)}

Return ONLY valid JSON, no markdown.`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const textContent = message.content.find(c => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  try {
    return JSON.parse(textContent.text);
  } catch {
    throw new Error('Failed to parse Claude response as JSON');
  }
}

// POST: Run enrichment (Apify scrape + Claude extraction)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // Validate params exist

    const body = await request.json();
    const { url } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const platform = detectPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { error: 'URL must be a LinkedIn or Instagram profile URL' },
        { status: 400 }
      );
    }

    // Run Apify scraper
    const profileData = await runApifyScraper(url, platform);
    if (!profileData) {
      return NextResponse.json(
        { error: 'No profile data found' },
        { status: 404 }
      );
    }

    // Extract insights with Claude
    const extractedData = await extractWithClaude(profileData);

    const result: SocialSummary = {
      ...extractedData,
      source_url: url,
      source_platform: platform,
      enriched_at: new Date().toISOString(),
    };

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Error running enrichment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run enrichment' },
      { status: 500 }
    );
  }
}

// PATCH: Save enrichment result to guest profile
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.DATABASE_PUBLIC_URL && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_PUBLIC_URL not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { socialSummary } = body;

    if (!socialSummary || typeof socialSummary !== 'object') {
      return NextResponse.json(
        { error: 'socialSummary object is required' },
        { status: 400 }
      );
    }

    const updatedGuest = await updateGuest(id, {
      'Social Summary': socialSummary,
    });

    return NextResponse.json(updatedGuest);
  } catch (error) {
    console.error('Error saving social summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save social summary' },
      { status: 500 }
    );
  }
}
