'use client';

import { Folder, Share2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores';
import type { Project } from '@/types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onSelectProject?: (project: Project) => void;
}

export function Sidebar({ isOpen, onClose, onNewProject, onSelectProject }: SidebarProps) {
  const { projects, sharedProjects } = useProjectStore();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:relative md:z-0 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Mobile close button */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <span className="font-semibold">Menu</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* New Project Button */}
          <div className="p-4">
            <Button
              className="w-full"
              onClick={() => {
                onNewProject();
                onClose();
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>

          {/* Scrollable content */}
          <ScrollArea className="flex-1 px-2">
            {/* Your Projects */}
            <div className="mb-6">
              <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
                <Folder className="h-4 w-4" />
                Your Projects
              </div>
              <div className="space-y-1">
                {projects.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    No projects yet
                  </p>
                ) : (
                  projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onSelectProject?.(project);
                        onClose();
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{project.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.language}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Shared With Me */}
            <div className="mb-6">
              <div className="flex items-center gap-2 px-2 py-2 text-sm font-medium text-muted-foreground">
                <Share2 className="h-4 w-4" />
                Shared With Me
              </div>
              <div className="space-y-1">
                {sharedProjects.length === 0 ? (
                  <p className="px-2 py-4 text-sm text-muted-foreground">
                    No shared projects
                  </p>
                ) : (
                  sharedProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => {
                        onSelectProject?.(project);
                        onClose();
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate">{project.title}</span>
                        <span className="ml-auto text-xs text-muted-foreground">
                          {project.language}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
