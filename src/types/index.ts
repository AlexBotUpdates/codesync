// User types
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarColor: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Project types
export type Role = 'owner' | 'editor' | 'viewer';
export type Language = 'python' | 'javascript' | 'java' | 'cpp' | 'csharp' | 'ruby' | 'go' | 'rust' | 'typescript' | 'php';

export interface Project {
  id: string;
  title: string;
  description: string | null;
  language: Language;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  owner?: User;
  members?: ProjectMember[];
  documents?: Document[];
}

export interface ProjectMember {
  id: string;
  role: Role;
  addedAt: Date;
  userId: string;
  projectId: string;
  user?: User;
}

// Document types
export interface Document {
  id: string;
  filename: string;
  content: string;
  language: Language;
  createdAt: Date;
  updatedAt: Date;
  projectId: string;
  lastEditedById: string | null;
  lastEditedBy?: User;
}

// Revision types
export interface Revision {
  id: string;
  revisionNumber: number;
  content: string;
  changeSummary: string | null;
  createdAt: Date;
  documentId: string;
  changedById: string;
  changedBy?: User;
}

// Activity types
export interface Activity {
  id: string;
  action: string;
  details: string | null;
  createdAt: Date;
  documentId: string;
  userId: string;
  user?: User;
}

// Cursor position types
export interface CursorPosition {
  id: string;
  lineNumber: number;
  columnNumber: number;
  updatedAt: Date;
  documentId: string;
  userId: string;
  user?: User;
}

// Active session types
export interface ActiveSession {
  id: string;
  sessionToken: string;
  joinedAt: Date;
  lastHeartbeat: Date;
  documentId: string;
  userId: string;
  user?: User;
}

// WebSocket event types
export interface WSEvents {
  // Client -> Server
  connect_to_document: {
    documentId: string;
    userId: string;
    sessionToken: string;
  };
  cursor_move: {
    documentId: string;
    userId: string;
    lineNumber: number;
    columnNumber: number;
  };
  code_change: {
    documentId: string;
    userId: string;
    operation: Operation;
  };
  save_version: {
    documentId: string;
    userId: string;
    changeSummary?: string;
  };
  typing_indicator: {
    documentId: string;
    userId: string;
    isTyping: boolean;
  };
  disconnect_from_document: {
    documentId: string;
    userId: string;
  };

  // Server -> Client
  user_joined: {
    userId: string;
    displayName: string;
    avatarColor: string;
    timestamp: Date;
  };
  user_left: {
    userId: string;
    displayName: string;
  };
  cursor_position_update: {
    userId: string;
    lineNumber: number;
    columnNumber: number;
    displayName: string;
    avatarColor: string;
  };
  code_change_received: {
    userId: string;
    operation: Operation;
  };
  typing_indicator_update: {
    userId: string;
    displayName: string;
    isTyping: boolean;
  };
  version_saved: {
    versionNumber: number;
    userId: string;
    timestamp: Date;
    changeSummary?: string;
  };
  auto_save_version: {
    versionNumber: number;
    timestamp: Date;
  };
}

// OT Operation types
export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
}

export interface TransformResult {
  transformedOp: Operation;
  transformedOtherOp: Operation;
}

// Collaborator info for UI
export interface Collaborator {
  userId: string;
  displayName: string;
  avatarColor: string;
  cursor?: {
    lineNumber: number;
    columnNumber: number;
  };
  isTyping: boolean;
}
