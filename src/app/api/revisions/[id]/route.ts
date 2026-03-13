import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/revisions/[id] - Get a specific revision
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const revision = await db.revision.findUnique({
      where: { id },
      include: {
        document: {
          include: { project: true },
        },
        changedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    if (!revision) {
      return errorResponse('Revision not found', 404);
    }

    // Check if user has access
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: revision.document.projectId, userId: user.id } },
    });

    if (!membership && !revision.document.project.isPublic) {
      return errorResponse('Access denied', 403);
    }

    return successResponse(revision);
  } catch (error) {
    console.error('Get revision error:', error);
    return errorResponse('Failed to get revision', 500);
  }
}

// POST /api/revisions/[id] - Restore a revision
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const revision = await db.revision.findUnique({
      where: { id },
      include: { document: true },
    });

    if (!revision) {
      return errorResponse('Revision not found', 404);
    }

    // Check if user can edit
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: revision.document.projectId, userId: user.id } },
    });

    if (!membership || membership.role === 'viewer') {
      return errorResponse('Only editors can restore revisions', 403);
    }

    // Update document content
    await db.document.update({
      where: { id: revision.documentId },
      data: {
        content: revision.content,
        lastEditedById: user.id,
      },
    });

    // Create a new revision for the restore
    const latestRevision = await db.revision.findFirst({
      where: { documentId: revision.documentId },
      orderBy: { revisionNumber: 'desc' },
    });

    const newRevision = await db.revision.create({
      data: {
        documentId: revision.documentId,
        revisionNumber: (latestRevision?.revisionNumber || 0) + 1,
        content: revision.content,
        changedById: user.id,
        changeSummary: `Restored from revision #${revision.revisionNumber}`,
      },
      include: {
        changedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    return successResponse(newRevision);
  } catch (error) {
    console.error('Restore revision error:', error);
    return errorResponse('Failed to restore revision', 500);
  }
}
