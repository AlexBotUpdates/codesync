import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

const updateProjectSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  language: z.enum(['python', 'javascript', 'java', 'cpp', 'csharp', 'ruby', 'go', 'rust', 'typescript', 'php']).optional(),
  isPublic: z.boolean().optional(),
});

// GET /api/projects/[id] - Get a specific project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const project = await db.project.findUnique({
      where: { id },
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
        documents: {
          include: {
            lastEditedBy: {
              select: { id: true, displayName: true, avatarColor: true },
            },
          },
          orderBy: { updatedAt: 'desc' },
        },
      },
    });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    // Check if user has access
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });

    if (!membership && !project.isPublic) {
      return errorResponse('Access denied', 403);
    }

    return successResponse({
      ...project,
      userRole: membership?.role || (project.isPublic ? 'viewer' : null),
    });
  } catch (error) {
    console.error('Get project error:', error);
    return errorResponse('Failed to get project', 500);
  }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Check if user is owner
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: user.id } },
    });

    if (!membership || membership.role !== 'owner') {
      return errorResponse('Only the owner can update the project', 403);
    }

    const body = await request.json();
    const updates = updateProjectSchema.parse(body);

    const project = await db.project.update({
      where: { id },
      data: updates,
      include: {
        owner: {
          select: { id: true, displayName: true, avatarColor: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, displayName: true, avatarColor: true },
            },
          },
        },
        documents: true,
      },
    });

    return successResponse(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Update project error:', error);
    return errorResponse('Failed to update project', 500);
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Check if user is owner
    const project = await db.project.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!project) {
      return errorResponse('Project not found', 404);
    }

    if (project.ownerId !== user.id) {
      return errorResponse('Only the owner can delete the project', 403);
    }

    await db.project.delete({
      where: { id },
    });

    return successResponse({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return errorResponse('Failed to delete project', 500);
  }
}
