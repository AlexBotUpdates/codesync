import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

const updateDocumentSchema = z.object({
  filename: z.string().min(1).max(255).optional(),
  content: z.string().optional(),
  language: z.enum(['python', 'javascript', 'java', 'cpp', 'csharp', 'ruby', 'go', 'rust', 'typescript', 'php']).optional(),
});

// GET /api/documents/[id] - Get a specific document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const document = await db.document.findUnique({
      where: { id },
      include: {
        project: {
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
          },
        },
        lastEditedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    if (!document) {
      return errorResponse('Document not found', 404);
    }

    // Check if user has access to project
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: document.projectId, userId: user.id } },
    });

    if (!membership && !document.project.isPublic) {
      return errorResponse('Access denied', 403);
    }

    return successResponse({
      ...document,
      userRole: membership?.role || (document.project.isPublic ? 'viewer' : null),
    });
  } catch (error) {
    console.error('Get document error:', error);
    return errorResponse('Failed to get document', 500);
  }
}

// PUT /api/documents/[id] - Update a document
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const document = await db.document.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!document) {
      return errorResponse('Document not found', 404);
    }

    // Check if user has access
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: document.projectId, userId: user.id } },
    });

    if (!membership) {
      return errorResponse('Access denied', 403);
    }

    const body = await request.json();
    const updates = updateDocumentSchema.parse(body);

    // Check if user can edit
    if (membership.role === 'viewer' && updates.content !== undefined) {
      return errorResponse('Viewers cannot edit documents', 403);
    }

    const updatedDocument = await db.document.update({
      where: { id },
      data: {
        ...updates,
        lastEditedById: user.id,
      },
      include: {
        lastEditedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    // Create revision if content changed
    if (updates.content !== undefined && updates.content !== document.content) {
      const latestRevision = await db.revision.findFirst({
        where: { documentId: id },
        orderBy: { revisionNumber: 'desc' },
      });

      await db.revision.create({
        data: {
          documentId: id,
          revisionNumber: (latestRevision?.revisionNumber || 0) + 1,
          content: updates.content,
          changedById: user.id,
          changeSummary: 'Auto-saved',
        },
      });
    }

    return successResponse(updatedDocument);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Update document error:', error);
    return errorResponse('Failed to update document', 500);
  }
}

// DELETE /api/documents/[id] - Delete a document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const document = await db.document.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!document) {
      return errorResponse('Document not found', 404);
    }

    // Check if user is owner or editor
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: document.projectId, userId: user.id } },
    });

    if (!membership || membership.role === 'viewer') {
      return errorResponse('Only owners and editors can delete documents', 403);
    }

    await db.document.delete({
      where: { id },
    });

    return successResponse({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    return errorResponse('Failed to delete document', 500);
  }
}
