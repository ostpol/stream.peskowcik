import { NextResponse } from 'next/server';
import { seedManualSeeds } from '@/lib/manual-seeds';

export async function POST() {
  try {
    const result = await seedManualSeeds();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error seeding manual entries:', error);
    return NextResponse.json({ error: 'Failed to seed manual entries' }, { status: 500 });
  }
}
