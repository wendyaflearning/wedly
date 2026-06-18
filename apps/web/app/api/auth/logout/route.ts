import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/logout`, {
    method: 'POST',
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.delete('jwt_token');
  return response;
}
