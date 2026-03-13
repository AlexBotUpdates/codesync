'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import type { Revision } from '@/types';
import { 
  GitCommit, 
  Eye, 
  RotateCcw, 
  Clock, 
  ChevronRight,
  FileCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VersionHistoryProps {
  documentId: string;
  onRestore?: (content: string) => void;
  className?: string;
}

export function VersionHistory({ documentId, onRestore, className }: VersionHistoryProps) {
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRevision, setSelectedRevision] = useState<Revision | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);

  // Fetch revisions
  useEffect(() => {
    const fetchRevisions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/revisions?documentId=${documentId}`);
        if (response.ok) {
          const data = await response.json();
          setRevisions(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch revisions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (documentId) {
      fetchRevisions();
    }
  }, [documentId]);

  const handleView = (revision: Revision) => {
    setSelectedRevision(revision);
    setIsViewDialogOpen(true);
  };

  const handleRestoreClick = (revision: Revision) => {
    setSelectedRevision(revision);
    setIsRestoreDialogOpen(true);
  };

  const handleConfirmRestore = async () => {
    if (!selectedRevision) return;

    try {
      // Update document content
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: selectedRevision.content }),
      });

      if (response.ok) {
        onRestore?.(selectedRevision.content);
        setIsRestoreDialogOpen(false);
        setSelectedRevision(null);
      }
    } catch (error) {
      console.error('Failed to restore revision:', error);
    }
  };

  if (isLoading) {
    return (
      <div className={cn('flex h-full items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span className="text-sm text-muted-foreground">Loading versions...</span>
        </div>
      </div>
    );
  }

  if (revisions.length === 0) {
    return (
      <div className={cn('flex h-full flex-col', className)}>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
              <GitCommit className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No versions yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Save versions to track changes
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex h-full flex-col', className)}>
      {/* Version List */}
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {revisions.map((revision, index) => (
            <div
              key={revision.id}
              className={cn(
                'group flex items-start gap-3 rounded-lg p-2 transition-colors',
                'hover:bg-muted/50',
                index === 0 && 'bg-muted/30'
              )}
            >
              {/* Version Number */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <span className="text-xs font-semibold">#{revision.revisionNumber}</span>
              </div>

              {/* Version Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {revision.changeSummary || `Version ${revision.revisionNumber}`}
                  </span>
                  {index === 0 && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                      Current
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(revision.createdAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => handleView(revision)}
                  title="View revision"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                {index !== 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRestoreClick(revision)}
                    title="Restore this version"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="h-5 w-5" />
              Version #{selectedRevision?.revisionNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden rounded-lg border bg-muted/30">
            <ScrollArea className="h-[50vh]">
              <pre className="p-4 text-sm font-mono whitespace-pre-wrap break-all">
                {selectedRevision?.content}
              </pre>
            </ScrollArea>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            {selectedRevision && revisions[0]?.id !== selectedRevision.id && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleRestoreClick(selectedRevision);
              }}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to restore to Version #{selectedRevision?.revisionNumber}?
              This will create a new version with the restored content.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmRestore}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
