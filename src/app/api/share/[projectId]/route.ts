import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

type RouteParams = { params: Promise<{ projectId: string }> };

const addMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['editor', 'viewer']),
});

// GET /api/share/[projectId] - Get project members
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { projectId } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Check if user has access
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!membership) {
      return errorResponse('Access denied', 403);
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        owner: {
          select: { id: true, displayName: true, avatarColor: true, email: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarColor: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    return successResponse({
      project,
      userRole: membership.role,
    });
  } catch (error) {
    console.error('Get project members error:', error);
    return errorResponse('Failed to get project members', 500);
  }
}

// POST /api/share/[projectId] - Add a member to project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { projectId } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Check if user is owner
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!membership || membership.role !== 'owner') {
      return errorResponse('Only the owner can add members', 403);
    }

    const body = await request.json();
    const { email, role } = addMemberSchema.parse(body);

    // Find user by email
    const userToAdd = await db.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!userToAdd) {
      return errorResponse('User not found', 404);
    }

    // Check if already a member
    const existingMembership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: userToAdd.id } },
    });

    if (existingMembership) {
      return errorResponse('User is already a member', 400);
    }

    // Add member
    const newMembership = await db.projectMember.create({
      data: {
        projectId,
        userId: userToAdd.id,
        role,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatarColor: true, email: true },
        },
      },
    });

    return successResponse(newMembership, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Add member error:', error);
    return errorResponse('Failed to add member', 500);
  }
}

// DELETE /api/share/[projectId]?userId=xxx - Remove a member
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { projectId } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const userIdToRemove = searchParams.get('userId');

    if (!userIdToRemove) {
      return errorResponse('User ID is required', 400);
    }

    // Check if user is owner or removing themselves
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!membership) {
      return errorResponse('Access denied', 403);
    }

    if (membership.role !== 'owner' && userIdToRemove !== user.id) {
      return errorResponse('Only the owner can remove other members', 403);
    }

    // Cannot remove owner
    const membershipToRemove = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: userIdToRemove } },
    });

    if (!membershipToRemove) {
      return errorResponse('Membership not found', 404);
    }

    if (membershipToRemove.role === 'owner') {
      return errorResponse('Cannot remove the owner', 400);
    }

    await db.projectMember.delete({
      where: { id: membershipToRemove.id },
    });

    return successResponse({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove member error:', error);
    return errorResponse('Failed to remove member', 500);
  }
}

// PUT /api/share/[projectId] - Update member role
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { projectId } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Check if user is owner
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!membership || membership.role !== 'owner') {
      return errorResponse('Only the owner can update member roles', 403);
    }

    const body = await request.json();
    const { userId, role } = z.object({
      userId: z.string(),
      role: z.enum(['editor', 'viewer']),
    }).parse(body);

    const membershipToUpdate = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!membershipToUpdate) {
      return errorResponse('Membership not found', 404);
    }

    if (membershipToUpdate.role === 'owner') {
      return errorResponse('Cannot change owner role', 400);
    }

    const updatedMembership = await db.projectMember.update({
      where: { id: membershipToUpdate.id },
      data: { role },
      include: {
        user: {
          select: { id: true, displayName: true, avatarColor: true, email: true },
        },
      },
    });

    return successResponse(updatedMembership);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Update member role error:', error);
    return errorResponse('Failed to update member role', 500);
  }
}
