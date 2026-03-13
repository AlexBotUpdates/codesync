'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useEditorStore, useAuthStore } from '@/stores';
import type { Collaborator, Operation } from '@/types';

interface UseCollaborationOptions {
  documentId: string | null;
  enabled?: boolean;
}

interface CursorPositionEvent {
  userId: string;
  lineNumber: number;
  columnNumber: number;
  displayName: string;
  avatarColor: string;
}

interface CodeChangeEvent {
  userId: string;
  operation: Operation;
}

interface UserJoinedEvent {
  userId: string;
  displayName: string;
  avatarColor: string;
  timestamp: Date;
}

interface UserLeftEvent {
  userId: string;
  displayName: string;
}

interface VersionSavedEvent {
  versionNumber: number;
  userId: string;
  timestamp: Date;
  changeSummary?: string;
}

interface TypingIndicatorEvent {
  userId: string;
  displayName: string;
  isTyping: boolean;
}

export function useCollaboration({ documentId, enabled = true }: UseCollaborationOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const { user } = useAuthStore();
  const {
    setCollaborators,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorCursor,
    setTypingUser,
    addActivity,
  } = useEditorStore();

  // Connect to WebSocket server
  useEffect(() => {
    if (!enabled || !documentId || !user) {
      return;
    }

    const socketUrl = `/?XTransformPort=3003`;
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
      
      // Join the document room
      socket.emit('connect_to_document', {
        documentId,
        userId: user.id,
        displayName: user.displayName,
        avatarColor: user.avatarColor,
        sessionToken: `session-${Date.now()}`,
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      setConnectionError(error.message);
      setIsConnected(false);
    });

    // User joined event
    socket.on('user_joined', (data: UserJoinedEvent) => {
      const newCollaborator: Collaborator = {
        userId: data.userId,
        displayName: data.displayName,
        avatarColor: data.avatarColor,
        isTyping: false,
      };
      addCollaborator(newCollaborator);
      addActivity({
        id: `joined-${data.userId}-${Date.now()}`,
        action: 'joined',
        details: `${data.displayName} joined the document`,
        userId: data.userId,
        userName: data.displayName,
        timestamp: new Date(data.timestamp),
      });
    });

    // User left event
    socket.on('user_left', (data: UserLeftEvent) => {
      removeCollaborator(data.userId);
      setTypingUser(data.userId, false);
      addActivity({
        id: `left-${data.userId}-${Date.now()}`,
        action: 'left',
        details: `${data.displayName} left the document`,
        userId: data.userId,
        userName: data.displayName,
        timestamp: new Date(),
      });
    });

    // Cursor position update
    socket.on('cursor_position_update', (data: CursorPositionEvent) => {
      updateCollaboratorCursor(data.userId, data.lineNumber, data.columnNumber);
    });

    // Code change from another user
    socket.on('code_change_received', (data: CodeChangeEvent) => {
      // This will be handled by the editor component
      // We dispatch a custom event for the editor to handle
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('collaboration:code_change', {
          detail: data,
        }));
      }
    });

    // Typing indicator
    socket.on('typing_indicator_update', (data: TypingIndicatorEvent) => {
      setTypingUser(data.userId, data.isTyping);
    });

    // Version saved
    socket.on('version_saved', (data: VersionSavedEvent) => {
      addActivity({
        id: `version-${data.versionNumber}-${Date.now()}`,
        action: 'version_saved',
        details: `Version #${data.versionNumber} saved${data.changeSummary ? `: ${data.changeSummary}` : ''}`,
        userId: data.userId,
        userName: 'System',
        timestamp: new Date(data.timestamp),
      });
    });

    // Cleanup on unmount
    return () => {
      if (socket.connected) {
        socket.emit('disconnect_from_document', {
          documentId,
          userId: user.id,
        });
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setCollaborators([]);
    };
  }, [enabled, documentId, user, setCollaborators, addCollaborator, removeCollaborator, updateCollaboratorCursor, setTypingUser, addActivity]);

  // Send cursor position
  const sendCursorPosition = useCallback((lineNumber: number, columnNumber: number) => {
    if (socketRef.current?.connected && documentId && user) {
      socketRef.current.emit('cursor_move', {
        documentId,
        userId: user.id,
        lineNumber,
        columnNumber,
      });
    }
  }, [documentId, user]);

  // Send code change
  const sendCodeChange = useCallback((operation: Operation) => {
    if (socketRef.current?.connected && documentId && user) {
      socketRef.current.emit('code_change', {
        documentId,
        userId: user.id,
        operation,
      });
    }
  }, [documentId, user]);

  // Save version
  const saveVersion = useCallback((changeSummary?: string) => {
    if (socketRef.current?.connected && documentId && user) {
      socketRef.current.emit('save_version', {
        documentId,
        userId: user.id,
        changeSummary,
      });
    }
  }, [documentId, user]);

  // Send typing indicator
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (socketRef.current?.connected && documentId && user) {
      socketRef.current.emit('typing_indicator', {
        documentId,
        userId: user.id,
        isTyping,
      });
    }
  }, [documentId, user]);

  // Send full content change (for non-operational updates)
  const sendFullContent = useCallback((content: string) => {
    if (socketRef.current?.connected && documentId && user) {
      socketRef.current.emit('code_change', {
        documentId,
        userId: user.id,
        operation: {
          type: 'insert',
          position: 0,
          text: content,
          length: content.length,
        },
      });
    }
  }, [documentId, user]);

  return {
    isConnected,
    connectionError,
    sendCursorPosition,
    sendCodeChange,
    sendFullContent,
    saveVersion,
    sendTypingIndicator,
    socket: socketRef.current,
  };
}
