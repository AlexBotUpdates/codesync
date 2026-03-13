import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Project, Document, Collaborator } from '@/types';

// Auth Store
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false });
        if (typeof window !== 'undefined') {
          document.cookie = 'auth-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        }
      },
    }),
    {
      name: 'codesync-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

// Project Store
interface ProjectStore {
  projects: Project[];
  sharedProjects: Project[];
  currentProject: Project | null;
  setProjects: (projects: Project[]) => void;
  setSharedProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  removeProject: (id: string) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  sharedProjects: [],
  currentProject: null,
  setProjects: (projects) => set({ projects }),
  setSharedProjects: (sharedProjects) => set({ sharedProjects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
  updateProject: (id, updates) =>
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject,
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      currentProject: state.currentProject?.id === id ? null : state.currentProject,
    })),
}));

// Editor Store
interface EditorStore {
  documents: Document[];
  currentDocument: Document | null;
  collaborators: Collaborator[];
  isTyping: boolean;
  typingUsers: string[];
  activityLog: Array<{
    id: string;
    action: string;
    details?: string;
    userId: string;
    userName: string;
    timestamp: Date;
  }>;
  setDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  addDocument: (document: Document) => void;
  updateDocument: (id: string, updates: Partial<Document>) => void;
  removeDocument: (id: string) => void;
  setCollaborators: (collaborators: Collaborator[]) => void;
  addCollaborator: (collaborator: Collaborator) => void;
  removeCollaborator: (userId: string) => void;
  updateCollaboratorCursor: (userId: string, lineNumber: number, columnNumber: number) => void;
  setTyping: (isTyping: boolean) => void;
  setTypingUser: (userId: string, isTyping: boolean) => void;
  addActivity: (activity: EditorStore['activityLog'][0]) => void;
  clearActivityLog: () => void;
}

export const useEditorStore = create<EditorStore>((set) => ({
  documents: [],
  currentDocument: null,
  collaborators: [],
  isTyping: false,
  typingUsers: [],
  activityLog: [],
  setDocuments: (documents) => set({ documents }),
  setCurrentDocument: (currentDocument) => set({ currentDocument }),
  addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (id, updates) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...updates } : d)),
      currentDocument: state.currentDocument?.id === id ? { ...state.currentDocument, ...updates } : state.currentDocument,
    })),
  removeDocument: (id) =>
    set((state) => ({
      documents: state.documents.filter((d) => d.id !== id),
      currentDocument: state.currentDocument?.id === id ? null : state.currentDocument,
    })),
  setCollaborators: (collaborators) => set({ collaborators }),
  addCollaborator: (collaborator) =>
    set((state) => ({
      collaborators: [...state.collaborators.filter((c) => c.userId !== collaborator.userId), collaborator],
    })),
  removeCollaborator: (userId) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.userId !== userId),
    })),
  updateCollaboratorCursor: (userId, lineNumber, columnNumber) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.userId === userId ? { ...c, cursor: { lineNumber, columnNumber } } : c
      ),
    })),
  setTyping: (isTyping) => set({ isTyping }),
  setTypingUser: (userId, isTyping) =>
    set((state) => ({
      typingUsers: isTyping
        ? [...state.typingUsers.filter((id) => id !== userId), userId]
        : state.typingUsers.filter((id) => id !== userId),
    })),
  addActivity: (activity) =>
    set((state) => ({
      activityLog: [activity, ...state.activityLog].slice(0, 50),
    })),
  clearActivityLog: () => set({ activityLog: [] }),
}));

// Theme Store
interface ThemeStore {
  theme: 'light' | 'dark' | 'system';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'codesync-theme',
    }
  )
);
