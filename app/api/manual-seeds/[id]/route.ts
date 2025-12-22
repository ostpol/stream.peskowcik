import { NextRequest, NextResponse } from 'next/server';
import { deleteManualSeed, updateManualSeed } from '@/lib/manual-seeds';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const body = await request.json();
    const { kind, value, custom_title, custom_description, custom_date } = body;

    if (!kind || !value) {
      return NextResponse.json({ error: 'kind and value are required' }, { status: 400 });
    }

    if (kind !== 'base64' && kind !== 'url') {
      return NextResponse.json({ error: 'kind must be base64 or url' }, { status: 400 });
    }

    const seed = await updateManualSeed(id, {
      kind,
      value: value.trim(),
      custom_title: custom_title?.trim() || null,
      custom_description: custom_description?.trim() || null,
      custom_date: custom_date || null,
    });

    if (!seed) {
      return NextResponse.json({ error: 'Manual seed not found' }, { status: 404 });
    }

    return NextResponse.json(seed);
  } catch (error) {
    console.error('Error updating manual seed:', error);
    return NextResponse.json({ error: 'Failed to update manual seed' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = Number(params.id);
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }

    const deleted = await deleteManualSeed(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Manual seed not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting manual seed:', error);
    return NextResponse.json({ error: 'Failed to delete manual seed' }, { status: 500 });
  }
}
