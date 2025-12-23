import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, getAdminFromRequest, getSessionCookieName } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = getAdminFromRequest(request);
  if (session) {
    clearAdminSession(session.token);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(0),
    path: '/',
  });
  return response;
}
