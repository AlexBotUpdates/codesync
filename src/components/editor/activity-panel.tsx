'use client';

import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/stores';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { 
  UserPlus, 
  UserMinus, 
  Edit3, 
  Save, 
  FileText,
  GitBranch
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActivityPanelProps {
  className?: string;
}

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  joined: <UserPlus className="h-3.5 w-3.5 text-green-500" />,
  left: <UserMinus className="h-3.5 w-3.5 text-muted-foreground" />,
  edit: <Edit3 className="h-3.5 w-3.5 text-blue-500" />,
  version_saved: <Save className="h-3.5 w-3.5 text-purple-500" />,
  created: <FileText className="h-3.5 w-3.5 text-cyan-500" />,
  restore: <GitBranch className="h-3.5 w-3.5 text-orange-500" />,
};

const ACTIVITY_LABELS: Record<string, string> = {
  joined: 'Joined',
  left: 'Left',
  edit: 'Edited',
  version_saved: 'Saved version',
  created: 'Created',
  restore: 'Restored',
};

export function ActivityPanel({ className }: ActivityPanelProps) {
  const { activityLog } = useEditorStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest activity
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activityLog]);

  if (activityLog.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Activity will appear here as you collaborate
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="space-y-1 p-2">
          {activityLog.map((activity) => (
            <div
              key={activity.id}
              className={cn(
                'group flex items-start gap-3 rounded-lg p-2 transition-colors',
                'hover:bg-muted/50'
              )}
            >
              {/* User Avatar */}
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback 
                  className="text-[10px] text-white"
                  style={{ 
                    backgroundColor: activity.userName ? 
                      getAvatarColorFromName(activity.userName) : 
                      'hsl(var(--muted-foreground))'
                  }}
                >
                  {getInitials(activity.userName)}
                </AvatarFallback>
              </Avatar>

              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">
                    {activity.userName}
                  </span>
                  {ACTIVITY_ICONS[activity.action]}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.details || ACTIVITY_LABELS[activity.action] || activity.action}
                </p>
              </div>

              {/* Timestamp */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px] text-muted-foreground">
                  {formatRelativeTime(activity.timestamp)}
                </span>
                <Badge 
                  variant="secondary" 
                  className="text-[10px] px-1.5 py-0 h-4"
                >
                  {ACTIVITY_LABELS[activity.action] || activity.action}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper function to generate a consistent color from a name
function getAvatarColorFromName(name: string): string {
  const colors = [
    '#ef4444', // red
    '#f97316', // orange
    '#f59e0b', // amber
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#14b8a6', // teal
    '#06b6d4', // cyan
    '#0ea5e9', // sky
    '#3b82f6', // blue
    '#6366f1', // indigo
    '#8b5cf6', // violet
    '#a855f7', // purple
    '#d946ef', // fuchsia
    '#ec4899', // pink
    '#f43f5e', // rose
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
