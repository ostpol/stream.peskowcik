import { NextRequest, NextResponse } from 'next/server';
import { getLanguageRuleById, updateLanguageRule, deleteLanguageRule } from '@/lib/language-rules';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid language rule ID' },
        { status: 400 }
      );
    }
    
    const rule = await getLanguageRuleById(id);
    if (!rule) {
      return NextResponse.json(
        { error: 'Language rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(rule);
  } catch (error) {
    console.error('Error fetching language rule:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language rule' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid language rule ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const updates: {
      pattern?: string;
      language?: string;
      priority?: number;
      is_active?: boolean;
    } = {};
    
    if ('pattern' in body) updates.pattern = body.pattern;
    if ('language' in body) updates.language = body.language;
    if ('priority' in body) updates.priority = body.priority;
    if ('is_active' in body) updates.is_active = body.is_active;
    
    const updated = await updateLanguageRule(id, updates);
    if (!updated) {
      return NextResponse.json(
        { error: 'Language rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating language rule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update language rule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid language rule ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteLanguageRule(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Language rule not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting language rule:', error);
    return NextResponse.json(
      { error: 'Failed to delete language rule' },
      { status: 500 }
    );
  }
}

