'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { CreateProjectModal } from '@/components/project/create-project-modal';
import { FileExplorer } from '@/components/editor/file-explorer';
import { useEditorStore, useProjectStore, useAuthStore } from '@/stores';
import { useRouter, usePathname } from 'next/navigation';
import type { Project, Language } from '@/types';
import { cn } from '@/lib/utils';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addProject } = useProjectStore();
  const { documents, currentDocument, setCurrentDocument } = useEditorStore();
  const { isLoading } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const isEditorRoute = pathname.startsWith('/editor/');

  // Handle create project
  const handleCreateProject = async (data: { title: string; description: string; language: Language }) => {
    setIsCreating(true);
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create project');
      }

      addProject(result.data);
      setCreateModalOpen(false);
      router.push(`/editor/${result.data.id}`);
    } catch (error) {
      console.error('Create project error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  // Handle selecting a project from sidebar
  const handleSelectProject = (project: Project) => {
    router.push(`/editor/${project.id}`);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // If not authenticated, the dashboard page will handle redirect
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {isEditorRoute ? (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <aside
            className={cn(
              'fixed inset-y-0 left-0 z-50 w-64 transform border-r bg-background transition-transform duration-300 ease-in-out md:relative md:z-0 md:translate-x-0',
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <FileExplorer
              documents={documents}
              currentDocumentId={currentDocument?.id ?? null}
              canEdit={false}
              onSelectDocument={setCurrentDocument}
              onCreateDocument={() => {}}
            />
          </aside>
        </>
      ) : (
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewProject={() => setCreateModalOpen(true)}
          onSelectProject={handleSelectProject}
        />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          showMenuButton={true}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}
