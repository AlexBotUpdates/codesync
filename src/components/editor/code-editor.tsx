'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { useThemeStore, useEditorStore, useAuthStore } from '@/stores';
import { useCollaboration } from '@/hooks/useCollaboration';
import type { Language, Operation } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';

interface CodeEditorProps {
  documentId: string;
  initialContent?: string;
  language: Language;
  filename?: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
  readOnly?: boolean;
  className?: string;
}

const LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  javascript: 'javascript',
  java: 'java',
  cpp: 'cpp',
  csharp: 'csharp',
  ruby: 'ruby',
  go: 'go',
  rust: 'rust',
  typescript: 'typescript',
  php: 'php',
};

export function CodeEditor({
  documentId,
  initialContent = '',
  language,
  filename = 'untitled',
  onChange,
  onSave,
  readOnly = false,
  className,
}: CodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof import('monaco-editor') | null>(null);
  const decorationsRef = useRef<string[]>([]);
  const [localContent, setLocalContent] = useState(initialContent);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { theme } = useThemeStore();
  const { collaborators, typingUsers } = useEditorStore();
  const { user } = useAuthStore();

  const {
    isConnected,
    sendCursorPosition,
    sendCodeChange,
    sendTypingIndicator,
  } = useCollaboration({
    documentId,
    enabled: !readOnly,
  });

  // Handle incoming code changes from other users
  useEffect(() => {
    const handleRemoteCodeChange = (event: CustomEvent<{ userId: string; operation: Operation }>) => {
      const { operation } = event.detail;
      
      if (!editorRef.current || !monacoRef.current) return;

      const model = editorRef.current.getModel();
      if (!model) return;

      const currentValue = model.getValue();
      let newValue = currentValue;

      switch (operation.type) {
        case 'insert':
          if (operation.text) {
            newValue = currentValue.slice(0, operation.position) + operation.text + currentValue.slice(operation.position);
          }
          break;
        case 'delete':
          if (operation.length) {
            newValue = currentValue.slice(0, operation.position) + currentValue.slice(operation.position + operation.length);
          }
          break;
        case 'retain':
          break;
      }

      if (newValue !== currentValue) {
        const position = editorRef.current.getPosition();
        model.setValue(newValue);
        if (position) {
          editorRef.current.setPosition(position);
        }
      }
    };

    window.addEventListener('collaboration:code_change', handleRemoteCodeChange as EventListener);
    return () => {
      window.removeEventListener('collaboration:code_change', handleRemoteCodeChange as EventListener);
    };
  }, []);

  // Update collaborator cursor decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;

    const newDecorations: editor.IModelDeltaDecoration[] = collaborators
      .filter((c) => c.cursor && c.userId !== user?.id)
      .map((c) => ({
        range: new monacoRef.current!.Range(
          c.cursor!.lineNumber,
          c.cursor!.columnNumber,
          c.cursor!.lineNumber,
          c.cursor!.columnNumber + 1
        ),
        options: {
          className: 'remote-cursor',
          beforeContentClassName: 'remote-cursor-line',
          hoverMessage: { value: c.displayName },
        },
      }));

    decorationsRef.current = editorRef.current.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );
  }, [collaborators, user?.id]);

  // Handle editor mount
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Register custom theme
    monaco.editor.defineTheme('codesync-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1a1a2e',
        'editor.foreground': '#e4e4e7',
        'editorLineNumber.foreground': '#52525b',
        'editorLineNumber.activeForeground': '#a1a1aa',
        'editor.selectionBackground': '#3f3f46',
        'editor.lineHighlightBackground': '#27272a',
        'editorCursor.foreground': '#60a5fa',
      },
    });

    monaco.editor.defineTheme('codesync-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#18181b',
        'editorLineNumber.foreground': '#a1a1aa',
        'editorLineNumber.activeForeground': '#52525b',
        'editor.selectionBackground': '#e4e4e7',
        'editor.lineHighlightBackground': '#fafafa',
        'editorCursor.foreground': '#2563eb',
      },
    });

    // Apply theme
    const editorTheme = theme === 'dark' ? 'codesync-dark' : 'codesync-light';
    monaco.editor.setTheme(editorTheme);

    // Add keyboard shortcuts
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const value = editor.getValue();
      onSave?.(value);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => {
      editor.trigger('keyboard', 'undo', null);
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => {
      editor.trigger('keyboard', 'redo', null);
    });

    // Cursor position tracking
    editor.onDidChangeCursorPosition((e) => {
      sendCursorPosition(e.position.lineNumber, e.position.column);
    });

    // Focus editor
    editor.focus();
  };

  // Handle content change
  const handleContentChange: OnChange = (value) => {
    const newValue = value || '';
    setLocalContent(newValue);
    onChange?.(newValue);

    // Send typing indicator
    if (!readOnly) {
      sendTypingIndicator(true);
      sendCodeChange({
        type: 'insert',
        position: 0,
        text: newValue,
        length: newValue.length,
      });

      // Clear typing indicator after 1 second of no typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingIndicator(false);
      }, 1000);
    }
  };

  // Theme change
  useEffect(() => {
    if (monacoRef.current) {
      const editorTheme = theme === 'dark' ? 'codesync-dark' : 'codesync-light';
      monacoRef.current.editor.setTheme(editorTheme);
    }
  }, [theme]);

  // Cleanup typing timeout
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const monacoLanguage = LANGUAGE_MAP[language] || 'plaintext';
  const editorTheme = theme === 'dark' ? 'codesync-dark' : 'vs';

  return (
    <div className={cn('relative h-full w-full', className)}>
      {/* Connection Status */}
      {!readOnly && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
          {/* Typing Indicators */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-1 rounded-md bg-muted/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur-sm">
              <span className="animate-pulse">●</span>
              <span>
                {typingUsers.length === 1
                  ? 'Someone is typing...'
                  : `${typingUsers.length} people are typing...`}
              </span>
            </div>
          )}
          
          {/* Connection Status */}
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs backdrop-blur-sm',
              isConnected
                ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                : 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full', isConnected ? 'bg-green-500' : 'bg-yellow-500')} />
            {isConnected ? 'Connected' : 'Connecting...'}
          </div>
        </div>
      )}

      {/* Collaborator Cursors Legend */}
      {collaborators.length > 0 && (
        <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1">
          {collaborators.slice(0, 5).map((collaborator) => (
            <Avatar
              key={collaborator.userId}
              className="h-6 w-6 border-2 border-background"
              style={{ backgroundColor: collaborator.avatarColor }}
            >
              <AvatarFallback className="text-[10px] text-white">
                {getInitials(collaborator.displayName)}
              </AvatarFallback>
            </Avatar>
          ))}
          {collaborators.length > 5 && (
            <span className="text-xs text-muted-foreground">
              +{collaborators.length - 5}
            </span>
          )}
        </div>
      )}

      {/* Monaco Editor */}
      <Editor
        height="100%"
        language={monacoLanguage}
        value={localContent}
        theme={editorTheme}
        onChange={handleContentChange}
        onMount={handleEditorMount}
        options={{
          fontSize: 14,
          fontFamily: 'var(--font-geist-mono), JetBrains Mono, Consolas, monospace',
          lineNumbers: 'on',
          minimap: { enabled: true },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          readOnly,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          padding: { top: 16, bottom: 16 },
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
          suggest: {
            showKeywords: true,
            showSnippets: true,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <span className="text-sm text-muted-foreground">Loading editor...</span>
            </div>
          </div>
        }
      />
    </div>
  );
}
