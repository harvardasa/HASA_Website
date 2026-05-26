import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from './constants';

const DEV_FALLBACK_ADMIN_KEY = 'hasa-admin';

function getAdminKey() {
  const configured = process.env.ADMIN_DASHBOARD_KEY?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== 'production') {
    return DEV_FALLBACK_ADMIN_KEY;
  }

  return '';
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

export function validateAdminKey(inputKey: string) {
  const expected = getAdminKey();
  if (!expected) {
    return false;
  }
  return safeEqual(inputKey, expected);
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value === 'authorized';
}

export function hasAdminSessionFromRequest(request: NextRequest) {
  return request.cookies.get(ADMIN_COOKIE_NAME)?.value === 'authorized';
}
