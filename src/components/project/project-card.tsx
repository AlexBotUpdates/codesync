'use client';

import { MoreVertical, Edit, Trash2, Share2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onShare: (project: Project) => void;
}

const languageColors: Record<string, string> = {
  javascript: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400',
  typescript: 'bg-blue-500/20 text-blue-700 dark:text-blue-400',
  python: 'bg-green-500/20 text-green-700 dark:text-green-400',
  java: 'bg-red-500/20 text-red-700 dark:text-red-400',
  cpp: 'bg-purple-500/20 text-purple-700 dark:text-purple-400',
  csharp: 'bg-violet-500/20 text-violet-700 dark:text-violet-400',
  ruby: 'bg-rose-500/20 text-rose-700 dark:text-rose-400',
  go: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400',
  rust: 'bg-orange-500/20 text-orange-700 dark:text-orange-400',
  php: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-400',
};

function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return then.toLocaleDateString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProjectCard({ project, onEdit, onDelete, onShare }: ProjectCardProps) {
  const members = project.members || [];
  const displayMembers = members.slice(0, 4);
  const remainingCount = members.length - 4;

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold line-clamp-1">
            {project.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(project)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onShare(project)}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(project)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {project.description || 'No description provided'}
        </p>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={languageColors[project.language] || ''}
          >
            {project.language}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(project.updatedAt)}
          </span>
        </div>

        <div className="flex items-center">
          {displayMembers.map((member, index) => (
            <Avatar
              key={member.id}
              className={cn(
                'h-6 w-6 border-2 border-background',
                index > 0 ? '-ml-2' : ''
              )}
            >
              <AvatarFallback
                style={{ backgroundColor: member.user?.avatarColor || '#6366f1' }}
                className="text-[10px] text-white font-medium"
              >
                {member.user?.displayName ? getInitials(member.user.displayName) : '?'}
              </AvatarFallback>
            </Avatar>
          ))}
          {remainingCount > 0 && (
            <Avatar className="h-6 w-6 border-2 border-background -ml-2">
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                +{remainingCount}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
