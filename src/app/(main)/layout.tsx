'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { CreateProjectModal } from '@/components/project/create-project-modal';
import { useProjectStore, useAuthStore } from '@/stores';
import { useRouter } from 'next/navigation';
import type { Project, Language } from '@/types';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addProject } = useProjectStore();
  const { isLoading } = useAuthStore();
  const router = useRouter();

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
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewProject={() => setCreateModalOpen(true)}
        onSelectProject={handleSelectProject}
      />

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
