'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { SUPPORTED_LANGUAGES, getLanguageExtension } from '@/lib/utils';
import type { Language } from '@/types';
import { 
  Settings, 
  FileText, 
  Code, 
  Lock, 
  Link2, 
  Globe, 
  Trash2,
  Save
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface SettingsPanelProps {
  documentId: string;
  projectId: string;
  filename: string;
  language: Language;
  isPublic: boolean;
  userRole?: 'owner' | 'editor' | 'viewer' | null;
  onFilenameChange?: (filename: string) => void;
  onLanguageChange?: (language: Language) => void;
  onVisibilityChange?: (isPublic: boolean) => void;
  onDelete?: () => void;
  className?: string;
}

type VisibilityOption = 'private' | 'link' | 'public';

export function SettingsPanel({
  documentId,
  projectId,
  filename,
  language,
  isPublic,
  userRole,
  onFilenameChange,
  onLanguageChange,
  onVisibilityChange,
  onDelete,
  className,
}: SettingsPanelProps) {
  const [localFilename, setLocalFilename] = useState(filename);
  const [localLanguage, setLocalLanguage] = useState<Language>(language);
  const [visibility, setVisibility] = useState<VisibilityOption>(
    isPublic ? 'public' : 'link'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = userRole === 'owner';
  const canEdit = userRole === 'owner' || userRole === 'editor';

  const handleSaveFilename = async () => {
    if (!canEdit || localFilename === filename) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: localFilename }),
      });

      if (response.ok) {
        onFilenameChange?.(localFilename);
        toast.success('Filename updated');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update filename');
        setLocalFilename(filename);
      }
    } catch (error) {
      toast.error('Failed to update filename');
      setLocalFilename(filename);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = async (newLanguage: Language) => {
    if (!canEdit) return;
    
    setLocalLanguage(newLanguage);
    
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: newLanguage }),
      });

      if (response.ok) {
        onLanguageChange?.(newLanguage);
        toast.success('Language updated');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update language');
        setLocalLanguage(language);
      }
    } catch (error) {
      toast.error('Failed to update language');
      setLocalLanguage(language);
    }
  };

  const handleVisibilityChange = async (newVisibility: VisibilityOption) => {
    if (!isOwner) return;

    setVisibility(newVisibility);
    const newIsPublic = newVisibility === 'public';
    
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: newIsPublic }),
      });

      if (response.ok) {
        onVisibilityChange?.(newIsPublic);
        toast.success(`Project is now ${newIsPublic ? 'public' : 'private'}`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update visibility');
        setVisibility(isPublic ? 'public' : 'link');
      }
    } catch (error) {
      toast.error('Failed to update visibility');
      setVisibility(isPublic ? 'public' : 'link');
    }
  };

  const handleDelete = async () => {
    if (!canEdit) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onDelete?.();
        toast.success('Document deleted');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete document');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <div className={cn('flex h-full flex-col p-4 space-y-6', className)}>
      {/* File Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">File Settings</h3>
        </div>

        {/* Filename */}
        <div className="space-y-2">
          <Label htmlFor="filename">Filename</Label>
          <div className="flex gap-2">
            <Input
              id="filename"
              value={localFilename}
              onChange={(e) => setLocalFilename(e.target.value)}
              disabled={!canEdit}
              placeholder="Enter filename"
              className="flex-1"
            />
            {canEdit && localFilename !== filename && (
              <Button
                size="icon"
                variant="outline"
                onClick={handleSaveFilename}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <Select
            value={localLanguage}
            onValueChange={(value) => handleLanguageChange(value as Language)}
            disabled={!canEdit}
          >
            <SelectTrigger id="language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label} ({lang.extension})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator />

      {/* Sharing Settings */}
      {isOwner && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Sharing Settings</h3>
          </div>

          <div className="space-y-3">
            {/* Private */}
            <div 
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer',
                visibility === 'private' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
              onClick={() => handleVisibilityChange('private')}
            >
              <div className="flex items-center gap-3">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Private</p>
                  <p className="text-xs text-muted-foreground">
                    Only members can access
                  </p>
                </div>
              </div>
              <div className={cn(
                'h-4 w-4 rounded-full border-2',
                visibility === 'private' && 'bg-primary border-primary'
              )} />
            </div>

            {/* Link */}
            <div 
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer',
                visibility === 'link' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
              onClick={() => handleVisibilityChange('link')}
            >
              <div className="flex items-center gap-3">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Link Access</p>
                  <p className="text-xs text-muted-foreground">
                    Anyone with link can view
                  </p>
                </div>
              </div>
              <div className={cn(
                'h-4 w-4 rounded-full border-2',
                visibility === 'link' && 'bg-primary border-primary'
              )} />
            </div>

            {/* Public */}
            <div 
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer',
                visibility === 'public' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              )}
              onClick={() => handleVisibilityChange('public')}
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Public</p>
                  <p className="text-xs text-muted-foreground">
                    Visible to everyone
                  </p>
                </div>
              </div>
              <div className={cn(
                'h-4 w-4 rounded-full border-2',
                visibility === 'public' && 'bg-primary border-primary'
              )} />
            </div>
          </div>
        </div>
      )}

      <Separator />

      {/* Danger Zone */}
      {canEdit && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <h3 className="text-sm font-semibold text-destructive">Danger Zone</h3>
          </div>

          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete File
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete &quot;{filename}&quot;? This action cannot be undone
              and all versions will be lost.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
