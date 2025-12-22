import { NextResponse } from 'next/server';
import { clearAllEpisodes } from '@/lib/episodes';

export async function DELETE() {
  try {
    const deletedCount = await clearAllEpisodes();
    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount,
      message: `Deleted ${deletedCount} episode(s)`
    });
  } catch (error) {
    console.error('Error clearing episodes:', error);
    return NextResponse.json(
      { error: 'Failed to clear episodes' },
      { status: 500 }
    );
  }
}

