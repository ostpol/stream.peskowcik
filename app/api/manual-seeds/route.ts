import { NextRequest, NextResponse } from 'next/server';
import { createManualSeed, getAllManualSeeds } from '@/lib/manual-seeds';

export async function GET() {
  try {
    const seeds = await getAllManualSeeds();
    return NextResponse.json(seeds);
  } catch (error) {
    console.error('Error fetching manual seeds:', error);
    return NextResponse.json({ error: 'Failed to fetch manual seeds' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { kind, value, custom_title, custom_description, custom_date, custom_language, available_until } = body;

    if (!kind || !value) {
      return NextResponse.json({ error: 'kind and value are required' }, { status: 400 });
    }

    if (kind !== 'base64' && kind !== 'url') {
      return NextResponse.json({ error: 'kind must be base64 or url' }, { status: 400 });
    }

    const seed = await createManualSeed({
      kind,
      value: value.trim(),
      custom_title: custom_title?.trim() || null,
      custom_description: custom_description?.trim() || null,
      custom_date: custom_date || null,
      custom_language: custom_language?.trim() || null,
      available_until: available_until || null,
    });

    return NextResponse.json(seed, { status: 201 });
  } catch (error) {
    console.error('Error creating manual seed:', error);
    return NextResponse.json({ error: 'Failed to create manual seed' }, { status: 500 });
  }
}
