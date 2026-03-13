'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectCard } from '@/components/project/project-card';
import { CreateProjectModal } from '@/components/project/create-project-modal';
import { useProjectStore, useAuthStore } from '@/stores';
import type { Project, Language } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { projects, sharedProjects, setProjects, setSharedProjects, addProject, removeProject } = useProjectStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  // Load projects on mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data.data.owned || []);
          setSharedProjects(data.data.shared || []);
        }
      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setIsLoadingProjects(false);
      }
    };

    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, setProjects, setSharedProjects]);

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

  // Handle edit project
  const handleEditProject = (project: Project) => {
    router.push(`/editor/${project.id}`);
  };

  // Handle delete project
  const handleDeleteProject = async (project: Project) => {
    if (!confirm(`Are you sure you want to delete \"${project.title}\"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete project');
      }

      removeProject(project.id);
    } catch (error) {
      console.error('Delete project error:', error);
    }
  };

  // Handle share project
  const handleShareProject = (project: Project) => {
    router.push(`/share/${project.id}`);
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state
  if (isLoading || isLoadingProjects) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 px-4 md:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage your projects and start collaborating
        </p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Button>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 && sharedProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Plus className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">No projects yet</h3>
          <p className="mt-2 text-sm text-muted-foreground max-w-xs">
            Get started by creating your first project and invite your team to collaborate.
          </p>
          <Button className="mt-4" onClick={() => setCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Project
          </Button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Your Projects Section */}
          {filteredProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Your Projects</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onShare={handleShareProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Shared With Me Section */}
          {sharedProjects.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Shared With Me</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {sharedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
                    onShare={handleShareProject}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state for search */}
          {searchQuery && filteredProjects.length === 0 && projects.length > 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No projects found matching &quot;{searchQuery}&quot;
              </p>
            </div>
          )}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onSubmit={handleCreateProject}
        isLoading={isCreating}
      />
    </div>
  );
}
