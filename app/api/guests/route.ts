import { NextResponse } from 'next/server';
import { fetchAllGuests } from '@/lib/airtable';

export async function GET() {
  try {
    if (!process.env.AIRTABLE_PAT) {
      return NextResponse.json(
        { error: 'Airtable PAT not configured' },
        { status: 500 }
      );
    }

    const guests = await fetchAllGuests();
    return NextResponse.json({ guests });
  } catch (error) {
    console.error('Error fetching guests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch guests' },
      { status: 500 }
    );
  }
}
