import { NextResponse } from 'next/server';
import { routeGuest } from '@/lib/attention';
import { ROUTING_STATUS_OPTIONS } from '@/lib/constants';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const guestId = parseInt(id, 10);

    if (isNaN(guestId)) {
      return NextResponse.json(
        { error: 'Invalid guest ID' },
        { status: 400 }
      );
    }

    if (!process.env.DATABASE_PUBLIC_URL && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'DATABASE_URL not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !ROUTING_STATUS_OPTIONS.includes(status)) {
      return NextResponse.json(
        { error: 'Valid routing status is required (green, yellow, red, deprioritized)' },
        { status: 400 }
      );
    }

    await routeGuest(guestId, status);

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Error routing guest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to route guest' },
      { status: 500 }
    );
  }
}
