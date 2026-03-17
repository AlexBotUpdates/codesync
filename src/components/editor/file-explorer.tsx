'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, FileText, Folder, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Document } from '@/types';

type TreeNode =
  | { type: 'folder'; name: string; path: string; children: TreeNode[] }
  | { type: 'file'; name: string; path: string; doc: Document };

function buildTree(documents: Document[]): TreeNode[] {
  const root: { children: Map<string, any> } = { children: new Map() };

  for (const doc of documents) {
    const parts = (doc.filename || 'untitled').split('/').filter(Boolean);
    let cursor = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]!;
      const isLeaf = i === parts.length - 1;
      if (!cursor.children.has(part)) {
        cursor.children.set(part, isLeaf ? { type: 'file', doc } : { type: 'folder', children: new Map() });
      } else if (isLeaf) {
        // If a file with same name exists, prefer the latest document reference.
        cursor.children.set(part, { type: 'file', doc });
      }
      const next = cursor.children.get(part);
      if (next?.type === 'folder') cursor = next;
    }
  }

  const toNodes = (map: Map<string, any>, basePath: string): TreeNode[] => {
    const folders: TreeNode[] = [];
    const files: TreeNode[] = [];

    for (const [name, val] of map.entries()) {
      const path = basePath ? `${basePath}/${name}` : name;
      if (val.type === 'folder') {
        folders.push({
          type: 'folder',
          name,
          path,
          children: toNodes(val.children as Map<string, any>, path),
        });
      } else {
        files.push({
          type: 'file',
          name,
          path,
          doc: val.doc as Document,
        });
      }
    }

    const byName = (a: TreeNode, b: TreeNode) => a.name.localeCompare(b.name);
    return [...folders.sort(byName), ...files.sort(byName)];
  };

  return toNodes(root.children, '');
}

export function FileExplorer({
  documents,
  currentDocumentId,
  canEdit,
  onSelectDocument,
  onCreateDocument,
}: {
  documents: Document[];
  currentDocumentId: string | null;
  canEdit: boolean;
  onSelectDocument: (doc: Document) => void;
  onCreateDocument: () => void;
}) {
  const tree = useMemo(() => buildTree(documents), [documents]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (path: string) => {
    setExpanded((prev) => ({ ...prev, [path]: !(prev[path] ?? true) }));
  };

  const renderNode = (node: TreeNode, depth: number) => {
    const indent = { paddingLeft: `${8 + depth * 12}px` };

    if (node.type === 'folder') {
      const isOpen = expanded[node.path] ?? true;
      return (
        <div key={node.path}>
          <button
            type="button"
            onClick={() => toggle(node.path)}
            className="flex w-full items-center gap-2 py-1.5 pr-2 text-sm text-muted-foreground hover:text-foreground"
            style={indent}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            <Folder className="h-4 w-4" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && <div>{node.children.map((c) => renderNode(c, depth + 1))}</div>}
        </div>
      );
    }

    const isActive = currentDocumentId === node.doc.id;
    return (
      <button
        key={node.doc.id}
        type="button"
        onClick={() => onSelectDocument(node.doc)}
        className={cn(
          'flex w-full items-center gap-2 rounded-md py-1.5 pr-2 text-sm transition-colors',
          isActive ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
        )}
        style={indent}
      >
        <FileText className="h-4 w-4" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-xs font-semibold tracking-wide text-muted-foreground">EXPLORER</div>
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateDocument} title="New File">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-2">
        {documents.length === 0 ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">
            No files yet.
            {canEdit && (
              <button type="button" className="ml-1 underline" onClick={onCreateDocument}>
                Create one
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-0.5 px-1">{tree.map((n) => renderNode(n, 0))}</div>
        )}
      </ScrollArea>
    </div>
  );
}

