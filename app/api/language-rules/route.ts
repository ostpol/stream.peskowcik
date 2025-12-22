import { NextRequest, NextResponse } from 'next/server';
import { getAllLanguageRulesIncludingInactive, createLanguageRule } from '@/lib/language-rules';

export async function GET() {
  try {
    const rules = await getAllLanguageRulesIncludingInactive();
    return NextResponse.json(rules);
  } catch (error) {
    console.error('Error fetching language rules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch language rules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pattern, language, priority, is_active } = body;
    
    if (!pattern || typeof pattern !== 'string' || pattern.trim().length === 0) {
      return NextResponse.json(
        { error: 'pattern is required and must be a non-empty string' },
        { status: 400 }
      );
    }
    
    if (!language || (language !== 'Obersorbisch' && language !== 'Niedersorbisch')) {
      return NextResponse.json(
        { error: 'language must be either "Obersorbisch" or "Niedersorbisch"' },
        { status: 400 }
      );
    }
    
    const created = await createLanguageRule(
      pattern.trim(),
      language,
      priority ?? 0,
      is_active !== undefined ? is_active : true
    );
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error creating language rule:', error);
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create language rule' },
      { status: 500 }
    );
  }
}

