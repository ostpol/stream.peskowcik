import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { getAllEpisodeOverrides, upsertEpisodeOverride } from '@/lib/episodes';
import { extractBase64Id } from '@/lib/api-client';

export async function GET(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const overrides = getAllEpisodeOverrides();
    return NextResponse.json(overrides);
  } catch (error) {
    console.error('Error fetching episode overrides:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode overrides' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { url_website, ...rest } = body;

    if (!url_website) {
      return NextResponse.json({ error: 'url_website is required' }, { status: 400 });
    }

    const base64_id = rest.base64_id || extractBase64Id(url_website);

    const override = upsertEpisodeOverride(url_website, {
      ...rest,
      base64_id,
    });

    return NextResponse.json(override, { status: 201 });
  } catch (error) {
    console.error('Error creating episode override:', error);
    return NextResponse.json(
      { error: 'Failed to create episode override' },
      { status: 500 }
    );
  }
}
