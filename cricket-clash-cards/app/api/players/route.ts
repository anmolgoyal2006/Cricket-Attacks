import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/cards?limit=50`, {
      next: { revalidate: 3600 },
    });
    const data = await response.json();
    return NextResponse.json(data.cards || [], {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Proxy API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 502 }
    );
  }
}
