import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const createRevisionSchema = z.object({
  documentId: z.string(),
  changeSummary: z.string().optional(),
});

// GET /api/revisions?documentId=xxx - Get revisions for a document
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return errorResponse('Document ID is required', 400);
    }

    // Check if user has access to document
    const document = await db.document.findUnique({
      where: { id: documentId },
      include: { project: true },
    });

    if (!document) {
      return errorResponse('Document not found', 404);
    }

    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: document.projectId, userId: user.id } },
    });

    if (!membership && !document.project.isPublic) {
      return errorResponse('Access denied', 403);
    }

    const revisions = await db.revision.findMany({
      where: { documentId },
      include: {
        changedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
      orderBy: { revisionNumber: 'desc' },
      take: 50,
    });

    return successResponse(revisions);
  } catch (error) {
    console.error('Get revisions error:', error);
    return errorResponse('Failed to get revisions', 500);
  }
}

// POST /api/revisions - Create a new revision (manual save)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const { documentId, changeSummary } = createRevisionSchema.parse(body);

    // Get current document
    const document = await db.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      return errorResponse('Document not found', 404);
    }

    // Check if user can edit
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: document.projectId, userId: user.id } },
    });

    if (!membership || membership.role === 'viewer') {
      return errorResponse('Only editors can save revisions', 403);
    }

    // Get latest revision number
    const latestRevision = await db.revision.findFirst({
      where: { documentId },
      orderBy: { revisionNumber: 'desc' },
    });

    const revision = await db.revision.create({
      data: {
        documentId,
        revisionNumber: (latestRevision?.revisionNumber || 0) + 1,
        content: document.content,
        changedById: user.id,
        changeSummary: changeSummary || 'Manual save',
      },
      include: {
        changedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    return successResponse(revision, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Create revision error:', error);
    return errorResponse('Failed to create revision', 500);
  }
}
