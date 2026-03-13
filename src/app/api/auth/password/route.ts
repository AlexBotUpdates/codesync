import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser, verifyPassword, hashPassword } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

    // Get user with password hash
    const userWithPassword = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, passwordHash: true },
    });

    if (!userWithPassword || !userWithPassword.passwordHash) {
      return errorResponse('Account has no password set', 400);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, userWithPassword.passwordHash);

    if (!isValid) {
      return errorResponse('Current password is incorrect', 400);
    }

    // Hash new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    return successResponse({ message: 'Password changed successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Change password error:', error);
    return errorResponse('Failed to change password', 500);
  }
}
