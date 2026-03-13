import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(2, 'Display name must be at least 2 characters').max(50),
  avatarColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const { displayName, avatarColor } = updateProfileSchema.parse(body);

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        displayName,
        avatarColor,
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarColor: true,
        createdAt: true,
      },
    });

    return successResponse(updatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', 500);
  }
}
