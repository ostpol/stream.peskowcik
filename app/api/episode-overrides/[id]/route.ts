import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';
import { deleteEpisodeOverride, getEpisodeOverrideById, upsertEpisodeOverride } from '@/lib/episodes';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid override ID' }, { status: 400 });
  }

  const override = getEpisodeOverrideById(id);
  if (!override) {
    return NextResponse.json({ error: 'Override not found' }, { status: 404 });
  }

  return NextResponse.json(override);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid override ID' }, { status: 400 });
  }

  try {
    const existing = getEpisodeOverrideById(id);
    if (!existing) {
      return NextResponse.json({ error: 'Override not found' }, { status: 404 });
    }

    const body = await request.json();
    const updated = upsertEpisodeOverride(existing.url_website, {
      base64_id: existing.base64_id,
      custom_title: body.custom_title ?? existing.custom_title,
      custom_description: body.custom_description ?? existing.custom_description,
      custom_language: body.custom_language ?? existing.custom_language,
      available_until: body.available_until ?? existing.available_until,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating episode override:', error);
    return NextResponse.json(
      { error: 'Failed to update episode override' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = getAdminFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ error: 'Invalid override ID' }, { status: 400 });
  }

  const deleted = deleteEpisodeOverride(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Override not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
