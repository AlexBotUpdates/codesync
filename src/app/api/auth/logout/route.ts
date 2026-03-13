import { successResponse } from '@/lib/api';
import { clearAuthCookie } from '@/lib/auth';

export async function POST() {
  await clearAuthCookie();
  return successResponse({ message: 'Logged out successfully' });
}
