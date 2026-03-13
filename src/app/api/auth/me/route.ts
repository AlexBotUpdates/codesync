import { successResponse, errorResponse } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    return successResponse(user);
  } catch (error) {
    console.error('Get current user error:', error);
    return errorResponse('Failed to get user', 500);
  }
}
