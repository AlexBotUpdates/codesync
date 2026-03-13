'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectStore, useEditorStore, useAuthStore } from '@/stores';
import { ActivityPanel } from '@/components/editor/activity-panel';
import { VersionHistory } from '@/components/editor/version-history';
import { SettingsPanel } from '@/components/editor/settings-panel';
import { ShareModal } from '@/components/editor/share-modal';
import { SUPPORTED_LANGUAGES, getInitials, getLanguageExtension } from '@/lib/utils';
import type { Project, Document, ProjectMember, Language, Role } from '@/types';
import { 
  Share2, 
  Download, 
  Plus, 
  Code, 
  History, 
  Settings, 
  Activity,
  FileText,
  Loader2,
  Save,
  ArrowLeft,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { jsPDF } from 'jspdf';

// Dynamically import Monaco editor to avoid SSR issues
const CodeEditor = dynamic(
  () => import('@/components/editor/code-editor').then((mod) => mod.CodeEditor),
  { 
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading editor...</span>
        </div>
      </div>
    ),
  }
);

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { user } = useAuthStore();
  const { setCurrentProject, currentProject } = useProjectStore();
  const { 
    documents, 
    currentDocument, 
    setDocuments, 
    setCurrentDocument, 
    addDocument,
    collaborators,
    addActivity,
  } = useEditorStore();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('activity');
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  // Fetch project data
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 404) {
            toast.error('Project not found');
            router.push('/dashboard');
            return;
          }
          throw new Error('Failed to load project');
        }

        const data = await response.json();
        const project: Project & { userRole: Role | null; members: ProjectMember[] } = data.data;
        
        setCurrentProject(project);
        setProjectName(project.title);
        setMembers(project.members || []);
        setUserRole(project.userRole);
        setDocuments(project.documents || []);
        
        // Set first document as current
        if (project.documents && project.documents.length > 0) {
          setCurrentDocument(project.documents[0]);
        }

        // Add initial activity
        addActivity({
          id: `loaded-${Date.now()}`,
          action: 'created',
          details: 'Document loaded',
          userId: user?.id || '',
          userName: user?.displayName || 'You',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Failed to fetch project:', error);
        toast.error('Failed to load project');
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user, router, setCurrentProject, setDocuments, setCurrentDocument, addActivity]);

  // Update project name
  const handleUpdateProjectName = async (newName: string) => {
    if (!newName.trim() || newName === currentProject?.title) return;

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newName.trim() }),
      });

      if (response.ok) {
        setProjectName(newName.trim());
        toast.success('Project name updated');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update project name');
      }
    } catch (error) {
      toast.error('Failed to update project name');
    }
  };

  // Create new document
  const handleCreateDocument = async () => {
    if (!userRole || userRole === 'viewer') {
      toast.error('You do not have permission to create documents');
      return;
    }

    setIsCreatingDoc(true);
    try {
      const language = currentProject?.language || 'javascript';
      const extension = getLanguageExtension(language);
      const filename = `untitled${extension}`;

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          filename,
          language,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        addDocument(data.data);
        setCurrentDocument(data.data);
        toast.success('Document created');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to create document');
      }
    } catch (error) {
      toast.error('Failed to create document');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Handle document change
  const handleDocumentChange = async (content: string) => {
    if (!currentDocument || userRole === 'viewer') return;

    try {
      await fetch(`/api/documents/${currentDocument.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  };

  // Manual save
  const handleSave = async () => {
    if (!currentDocument || userRole === 'viewer') return;

    setIsSaving(true);
    try {
      // Create revision
      const response = await fetch('/api/revisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: currentDocument.id,
          changeSummary: 'Manual save',
        }),
      });

      if (response.ok) {
        toast.success('Version saved');
        addActivity({
          id: `save-${Date.now()}`,
          action: 'version_saved',
          details: 'Version saved manually',
          userId: user?.id || '',
          userName: user?.displayName || 'You',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      toast.error('Failed to save version');
    } finally {
      setIsSaving(false);
    }
  };

  // Export to PDF
  const handleExportPDF = async () => {
    if (!currentDocument) return;

    try {
      const doc = new jsPDF();
      const lines = currentDocument.content.split('\n');
      let y = 20;
      const lineHeight = 5;
      const pageHeight = 280;

      // Add title
      doc.setFontSize(16);
      doc.text(currentDocument.filename, 20, y);
      y += 10;

      // Add content
      doc.setFontSize(10);
      doc.setFont('courier', 'normal');
      
      lines.forEach((line) => {
        if (y > pageHeight) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += lineHeight;
      });

      doc.save(`${currentDocument.filename}.pdf`);
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.error('Failed to export PDF');
    }
  };

  // Handle member changes
  const handleRefreshMembers = async () => {
    try {
      const response = await fetch(`/api/share/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data.project.members || []);
      }
    } catch (error) {
      console.error('Failed to refresh members:', error);
    }
  };

  const handleMemberRemoved = (userId: string) => {
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  };

  const handleRoleChanged = (userId: string, role: Role) => {
    setMembers((prev) =>
      prev.map((m) => (m.userId === userId ? { ...m, role } : m))
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <span className="text-muted-foreground">Loading editor...</span>
        </div>
      </div>
    );
  }

  const canEdit = userRole === 'owner' || userRole === 'editor';
  const isOwner = userRole === 'owner';

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {/* Left: Back + Project Name */}
        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push('/dashboard')}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Back to Dashboard</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" className="h-6" />

          {isEditingName ? (
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => {
                handleUpdateProjectName(projectName);
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleUpdateProjectName(projectName);
                  setIsEditingName(false);
                }
                if (e.key === 'Escape') {
                  setProjectName(currentProject?.title || '');
                  setIsEditingName(false);
                }
              }}
              className="w-48 h-8"
              autoFocus
            />
          ) : (
            <h1
              className={cn(
                'text-lg font-semibold',
                isOwner && 'cursor-pointer hover:underline'
              )}
              onClick={() => isOwner && setIsEditingName(true)}
            >
              {projectName}
            </h1>
          )}
        </div>

        {/* Center: Language Selector + File Tabs */}
        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <Select
            value={currentProject?.language || 'javascript'}
            onValueChange={(value) => {
              // Update project language
              if (isOwner) {
                fetch(`/api/projects/${projectId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ language: value as Language }),
                }).then(() => {
                  toast.success('Language updated');
                });
              }
            }}
            disabled={!isOwner}
          >
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6" />

          {/* File Tabs */}
          <div className="flex items-center gap-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => setCurrentDocument(doc)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  currentDocument?.id === doc.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 hover:bg-muted'
                )}
              >
                <FileText className="h-3 w-3" />
                {doc.filename}
              </button>
            ))}
            
            {canEdit && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={handleCreateDocument}
                      disabled={isCreatingDoc}
                    >
                      {isCreatingDoc ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>New File</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        {/* Right: Collaborators + Actions */}
        <div className="flex items-center gap-3">
          {/* Collaborator Avatars */}
          <div className="flex items-center -space-x-2">
            {members.slice(0, 4).map((member) => (
              <TooltipProvider key={member.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar
                      className="h-7 w-7 border-2 border-background"
                      style={{ backgroundColor: member.user?.avatarColor }}
                    >
                      <AvatarFallback className="text-[10px] text-white">
                        {getInitials(member.user?.displayName || 'User')}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    {member.user?.displayName} ({member.role})
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            {members.length > 4 && (
              <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{members.length - 4}
              </div>
            )}
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsShareModalOpen(true)}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPDF}
            disabled={!currentDocument}
          >
            <Download className="h-4 w-4 mr-1" />
            Export PDF
          </Button>

          {canEdit && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Area (70%) */}
        <div className="w-[70%] border-r">
          {currentDocument ? (
            <CodeEditor
              documentId={currentDocument.id}
              initialContent={currentDocument.content}
              language={currentDocument.language}
              filename={currentDocument.filename}
              onChange={handleDocumentChange}
              onSave={handleSave}
              readOnly={userRole === 'viewer'}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/50" />
                <p className="mt-4 text-lg text-muted-foreground">No document selected</p>
                {canEdit && (
                  <Button className="mt-4" onClick={handleCreateDocument}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Document
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar (30%) */}
        <div className="w-[30%] flex flex-col">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="flex-1 flex flex-col">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent px-4">
              <TabsTrigger
                value="activity"
                className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Activity className="h-3.5 w-3.5" />
                Activity
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <History className="h-3.5 w-3.5" />
                Versions
              </TabsTrigger>
              <TabsTrigger
                value="settings"
                className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Settings className="h-3.5 w-3.5" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
              <ActivityPanel />
            </TabsContent>

            <TabsContent value="versions" className="flex-1 m-0 overflow-hidden">
              {currentDocument ? (
                <VersionHistory
                  documentId={currentDocument.id}
                  onRestore={(content) => {
                    handleDocumentChange(content);
                    toast.success('Version restored');
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a document to view versions
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
              {currentDocument ? (
                <SettingsPanel
                  documentId={currentDocument.id}
                  projectId={projectId}
                  filename={currentDocument.filename}
                  language={currentDocument.language}
                  isPublic={currentProject?.isPublic || false}
                  userRole={userRole}
                  onFilenameChange={(filename) => {
                    const updated = { ...currentDocument, filename };
                    setCurrentDocument(updated);
                  }}
                  onLanguageChange={(language) => {
                    const updated = { ...currentDocument, language };
                    setCurrentDocument(updated);
                  }}
                  onVisibilityChange={(isPublic) => {
                    if (currentProject) {
                      setCurrentProject({ ...currentProject, isPublic });
                    }
                  }}
                  onDelete={() => {
                    setCurrentDocument(null);
                    router.push('/dashboard');
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a document to view settings
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        projectId={projectId}
        projectName={projectName}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        members={members}
        isPublic={currentProject?.isPublic || false}
        onMemberAdded={handleRefreshMembers}
        onMemberRemoved={handleMemberRemoved}
        onRoleChanged={handleRoleChanged}
      />
    </div>
  );
}
