import { AIRTABLE_BASE_ID, AIRTABLE_TABLE_ID, AIRTABLE_API_URL } from './constants';
import type { Guest, AirtableResponse, GuestFields } from './types';

const getHeaders = () => ({
  Authorization: `Bearer ${process.env.AIRTABLE_PAT}`,
  'Content-Type': 'application/json',
});

export async function fetchAllGuests(): Promise<Guest[]> {
  const allRecords: Guest[] = [];
  let offset: string | undefined;

  do {
    const url = new URL(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);
    url.searchParams.set('sort[0][field]', 'Created Time');
    url.searchParams.set('sort[0][direction]', 'desc');
    if (offset) {
      url.searchParams.set('offset', offset);
    }

    const response = await fetch(url.toString(), {
      headers: getHeaders(),
      next: { revalidate: 0 }, // Don't cache in Next.js
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Airtable API error: ${response.status} - ${error}`);
    }

    const data: AirtableResponse = await response.json();
    allRecords.push(...data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

export async function fetchGuest(id: string): Promise<Guest> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`;

  const response = await fetch(url, {
    headers: getHeaders(),
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export async function updateGuest(id: string, fields: Partial<GuestFields>): Promise<Guest> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}/${id}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Airtable API error: ${response.status} - ${error}`);
  }

  return response.json();
}
