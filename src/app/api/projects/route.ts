import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { successResponse, errorResponse } from '@/lib/api';
import { z } from 'zod';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().optional(),
  language: z.enum(['python', 'javascript', 'java', 'cpp', 'csharp', 'ruby', 'go', 'rust', 'typescript', 'php']).default('javascript'),
});

// GET /api/projects - Get all projects for current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    // Get projects owned by user
    const ownedProjects = await db.project.findMany({
      where: { ownerId: user.id },
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
        documents: {
          select: { id: true, filename: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get projects shared with user
    const sharedMemberships = await db.projectMember.findMany({
      where: { userId: user.id, role: { not: 'owner' } },
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
            documents: {
              select: { id: true, filename: true },
            },
          },
        },
      },
    });

    const sharedProjects = sharedMemberships.map((m) => m.project);

    return successResponse({
      owned: ownedProjects,
      shared: sharedProjects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return errorResponse('Failed to get projects', 500);
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return errorResponse('Not authenticated', 401);
    }

    const body = await request.json();
    const { title, description, language } = createProjectSchema.parse(body);

    // Create project
    const project = await db.project.create({
      data: {
        title,
        description,
        language,
        ownerId: user.id,
        members: {
          create: {
            userId: user.id,
            role: 'owner',
          },
        },
        documents: {
          create: {
            filename: `main${getExtension(language)}`,
            language,
            content: getStarterCode(language),
          },
        },
      },
      include: {
        owner: {
          select: { id: true, displayName: true, avatarColor: true },
        },
        documents: true,
      },
    });

    return successResponse(project, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.errors[0].message, 400);
    }
    console.error('Create project error:', error);
    return errorResponse('Failed to create project', 500);
  }
}

function getExtension(language: string): string {
  const extensions: Record<string, string> = {
    python: '.py',
    javascript: '.js',
    java: '.java',
    cpp: '.cpp',
    csharp: '.cs',
    ruby: '.rb',
    go: '.go',
    rust: '.rs',
    typescript: '.ts',
    php: '.php',
  };
  return extensions[language] || '.txt';
}

function getStarterCode(language: string): string {
  const starters: Record<string, string> = {
    python: '# Welcome to CodeSync!\n# Start coding here...\n\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n',
    javascript: '// Welcome to CodeSync!\n// Start coding here...\n\nfunction main() {\n  console.log("Hello, World!");\n}\n\nmain();\n',
    typescript: '// Welcome to CodeSync!\n// Start coding here...\n\nfunction main(): void {\n  console.log("Hello, World!");\n}\n\nmain();\n',
    java: '// Welcome to CodeSync!\n// Start coding here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n',
    cpp: '// Welcome to CodeSync!\n// Start coding here...\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}\n',
    csharp: '// Welcome to CodeSync!\n// Start coding here...\n\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n',
    ruby: '# Welcome to CodeSync!\n# Start coding here...\n\ndef main\n  puts "Hello, World!"\nend\n\nmain\n',
    go: '// Welcome to CodeSync!\n// Start coding here...\n\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n',
    rust: '// Welcome to CodeSync!\n// Start coding here...\n\nfn main() {\n    println!("Hello, World!");\n}\n',
    php: '<?php\n// Welcome to CodeSync!\n// Start coding here...\n\necho "Hello, World!";\n',
  };
  return starters[language] || '// Start coding here...\n';
}
