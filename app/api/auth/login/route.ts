import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdmin, createAdminSession, getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const admin = authenticateAdmin(username, password);
    if (!admin) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const session = createAdminSession(admin.id!);
    const response = NextResponse.json({ success: true, user: { username: admin.username } });
    response.cookies.set(getSessionCookieName(), session.token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      expires: session.expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}
