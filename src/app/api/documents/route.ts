import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const createDocumentSchema = z.object({
  projectId: z.string(),
  filename: z.string().min(1, 'Filename is required').max(255),
  language: z.enum(['python', 'javascript', 'java', 'cpp', 'csharp', 'ruby', 'go', 'rust', 'typescript', 'php']).optional(),
});

// POST /api/documents - Create a new document
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const { projectId, filename, language } = createDocumentSchema.parse(body);

    // Check if user has access to project
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });

    if (!membership) {
      return errorResponse('Access denied', 403);
    }

    // Check if user can edit
    if (membership.role === 'viewer') {
      return errorResponse('Viewers cannot create documents', 403);
    }

    // Determine language from filename if not specified
    const docLanguage = language || getLanguageFromFilename(filename);

    const document = await db.document.create({
      data: {
        filename,
        language: docLanguage,
        projectId,
        lastEditedById: user.id,
      },
      include: {
        lastEditedBy: {
          select: { id: true, displayName: true, avatarColor: true },
        },
      },
    });

    return successResponse(document, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Create document error:', error);
    return errorResponse('Failed to create document', 500);
  }
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    py: 'python',
    js: 'javascript',
    ts: 'typescript',
    java: 'java',
    cpp: 'cpp',
    c: 'cpp',
    cs: 'csharp',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    php: 'php',
  };
  return languageMap[ext || ''] || 'javascript';
}
