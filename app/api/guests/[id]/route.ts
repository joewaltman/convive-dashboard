import { NextResponse } from 'next/server';
import { fetchGuest, updateGuest } from '@/lib/airtable';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.AIRTABLE_PAT) {
      return NextResponse.json(
        { error: 'Airtable PAT not configured' },
        { status: 500 }
      );
    }

    const guest = await fetchGuest(id);
    return NextResponse.json(guest);
  } catch (error) {
    console.error('Error fetching guest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch guest' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!process.env.AIRTABLE_PAT) {
      return NextResponse.json(
        { error: 'Airtable PAT not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fields } = body;

    if (!fields || typeof fields !== 'object') {
      return NextResponse.json(
        { error: 'Fields object is required' },
        { status: 400 }
      );
    }

    const updatedGuest = await updateGuest(id, fields);
    return NextResponse.json(updatedGuest);
  } catch (error) {
    console.error('Error updating guest:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update guest' },
      { status: 500 }
    );
  }
}
