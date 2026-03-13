import { Server } from 'socket.io';
import { createServer } from 'http';

const PORT = 3003;

interface User {
  id: string;
  displayName: string;
  avatarColor: string;
}

interface DocumentSession {
  documentId: string;
  users: Map<string, User>;
  cursors: Map<string, { lineNumber: number; columnNumber: number }>;
  content: string;
  typingUsers: Set<string>;
}

// Store active document sessions
const documentSessions = new Map<string, DocumentSession>();

// Operational Transform functions
interface Operation {
  type: 'insert' | 'delete';
  position: number;
  text?: string;
  length?: number;
}

function transform(op1: Operation, op2: Operation): Operation {
  // Transform op2 based on op1
  if (op1.type === 'insert') {
    if (op2.position >= op1.position) {
      return {
        ...op2,
        position: op2.position + (op1.text?.length || 0),
      };
    }
  } else if (op1.type === 'delete') {
    if (op2.position >= op1.position) {
      const deleteEnd = op1.position + (op1.length || 0);
      if (op2.position >= deleteEnd) {
        return {
          ...op2,
          position: op2.position - (op1.length || 0),
        };
      } else {
        // Overlapping delete - adjust position
        return {
          ...op2,
          position: op1.position,
        };
      }
    }
  }
  return op2;
}

function applyOperation(content: string, op: Operation): string {
  if (op.type === 'insert' && op.text) {
    return content.slice(0, op.position) + op.text + content.slice(op.position);
  } else if (op.type === 'delete') {
    return content.slice(0, op.position) + content.slice(op.position + (op.length || 0));
  }
  return content;
}

// Create HTTP server and Socket.IO
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let currentUser: User | null = null;
  let currentDocumentId: string | null = null;

  // Connect to document
  socket.on('connect_to_document', (data: { documentId: string; userId: string; displayName: string; avatarColor: string; sessionToken: string }) => {
    const { documentId, userId, displayName, avatarColor } = data;
    // Use the user data from the connection
    currentUser = {
      id: userId,
      displayName: displayName || `User-${userId.slice(0, 4)}`,
      avatarColor: avatarColor || '#4ECDC4',
    };
    currentDocumentId = documentId;

    // Get or create document session
    if (!documentSessions.has(documentId)) {
      documentSessions.set(documentId, {
        documentId,
        users: new Map(),
        cursors: new Map(),
        content: '',
        typingUsers: new Set(),
      });
    }

    const session = documentSessions.get(documentId)!;
    session.users.set(user.id, user);

    // Join the room
    socket.join(documentId);

    // Notify others
    socket.to(documentId).emit('user_joined', {
      userId: user.id,
      displayName: user.displayName,
      avatarColor: user.avatarColor,
      timestamp: new Date(),
    });

    // Send current state to the new user
    socket.emit('document_state', {
      content: session.content,
      collaborators: Array.from(session.users.values()).map((u) => ({
        userId: u.id,
        displayName: u.displayName,
        avatarColor: u.avatarColor,
        cursor: session.cursors.get(u.id),
        isTyping: session.typingUsers.has(u.id),
      })),
    });

    console.log(`User ${user.displayName} joined document ${documentId}`);
  });

  // Cursor move
  socket.on('cursor_move', (data: { lineNumber: number; columnNumber: number }) => {
    if (!currentDocumentId || !currentUser) return;

    const session = documentSessions.get(currentDocumentId);
    if (!session) return;

    session.cursors.set(currentUser.id, {
      lineNumber: data.lineNumber,
      columnNumber: data.columnNumber,
    });

    socket.to(currentDocumentId).emit('cursor_position_update', {
      userId: currentUser.id,
      lineNumber: data.lineNumber,
      columnNumber: data.columnNumber,
      displayName: currentUser.displayName,
      avatarColor: currentUser.avatarColor,
    });
  });

  // Code change
  socket.on('code_change', (data: { operation: Operation }) => {
    if (!currentDocumentId || !currentUser) return;

    const session = documentSessions.get(currentDocumentId);
    if (!session) return;

    // Apply operation to content
    session.content = applyOperation(session.content, data.operation);

    // Broadcast to others
    socket.to(currentDocumentId).emit('code_change_received', {
      userId: currentUser.id,
      operation: data.operation,
    });

    // Add activity
    socket.to(currentDocumentId).emit('activity', {
      userId: currentUser.id,
      userName: currentUser.displayName,
      action: 'edited',
      timestamp: new Date(),
    });
  });

  // Typing indicator
  socket.on('typing_indicator', (data: { isTyping: boolean }) => {
    if (!currentDocumentId || !currentUser) return;

    const session = documentSessions.get(currentDocumentId);
    if (!session) return;

    if (data.isTyping) {
      session.typingUsers.add(currentUser.id);
    } else {
      session.typingUsers.delete(currentUser.id);
    }

    socket.to(currentDocumentId).emit('typing_indicator_update', {
      userId: currentUser.id,
      displayName: currentUser.displayName,
      isTyping: data.isTyping,
    });
  });

  // Save version
  socket.on('save_version', (data: { changeSummary?: string }) => {
    if (!currentDocumentId || !currentUser) return;

    io.to(currentDocumentId).emit('version_saved', {
      userId: currentUser.id,
      changeSummary: data.changeSummary,
      timestamp: new Date(),
    });
  });

  // Disconnect
  socket.on('disconnect_from_document', () => {
    if (!currentDocumentId || !currentUser) return;

    const session = documentSessions.get(currentDocumentId);
    if (!session) return;

    session.users.delete(currentUser.id);
    session.cursors.delete(currentUser.id);
    session.typingUsers.delete(currentUser.id);

    socket.leave(currentDocumentId);

    // Notify others
    socket.to(currentDocumentId).emit('user_left', {
      userId: currentUser.id,
      displayName: currentUser.displayName,
    });

    // Clean up empty sessions
    if (session.users.size === 0) {
      documentSessions.delete(currentDocumentId);
    }

    console.log(`User ${currentUser.displayName} left document ${currentDocumentId}`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (currentDocumentId && currentUser) {
      const session = documentSessions.get(currentDocumentId);
      if (session) {
        session.users.delete(currentUser.id);
        session.cursors.delete(currentUser.id);
        session.typingUsers.delete(currentUser.id);

        socket.to(currentDocumentId).emit('user_left', {
          userId: currentUser.id,
          displayName: currentUser.displayName,
        });

        if (session.users.size === 0) {
          documentSessions.delete(currentDocumentId);
        }
      }
    }
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Collaboration service running on port ${PORT}`);
});
