'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getInitials } from '@/lib/utils';
import type { ProjectMember, Role } from '@/types';
import { 
  Share2, 
  Copy, 
  Mail, 
  UserPlus, 
  Crown, 
  Edit3, 
  Eye,
  Trash2,
  Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

interface ShareModalProps {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  members: ProjectMember[];
  isPublic: boolean;
  onMemberAdded?: () => void;
  onMemberRemoved?: (userId: string) => void;
  onRoleChanged?: (userId: string, role: Role) => void;
}

const ROLE_CONFIG: Record<Role, { label: string; icon: React.ReactNode; color: string }> = {
  owner: {
    label: 'Owner',
    icon: <Crown className="h-3 w-3" />,
    color: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
  },
  editor: {
    label: 'Editor',
    icon: <Edit3 className="h-3 w-3" />,
    color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
  },
  viewer: {
    label: 'Viewer',
    icon: <Eye className="h-3 w-3" />,
    color: 'bg-gray-500/20 text-gray-600 dark:text-gray-400',
  },
};

export function ShareModal({
  projectId,
  projectName,
  isOpen,
  onClose,
  members,
  isPublic,
  onMemberAdded,
  onMemberRemoved,
  onRoleChanged,
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role>('viewer');
  const [isAdding, setIsAdding] = useState(false);
  const [copied, setCopied] = useState(false);

  const projectUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/editor/${projectId}`
    : '';

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast.success('Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  // Add member by email
  const handleAddMember = async () => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setIsAdding(true);
    try {
      const response = await fetch(`/api/share/${projectId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          role: selectedRole,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Member added successfully');
        setEmail('');
        onMemberAdded?.();
      } else {
        toast.error(data.error || 'Failed to add member');
      }
    } catch (error) {
      toast.error('Failed to add member');
    } finally {
      setIsAdding(false);
    }
  };

  // Remove member
  const handleRemoveMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/share/${projectId}?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Member removed');
        onMemberRemoved?.(userId);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove member');
      }
    } catch (error) {
      toast.error('Failed to remove member');
    }
  };

  // Change member role
  const handleRoleChange = async (userId: string, role: Role) => {
    try {
      const response = await fetch(`/api/share/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      });

      if (response.ok) {
        toast.success('Role updated');
        onRoleChanged?.(userId, role);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to update role');
      }
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share &quot;{projectName}&quot;
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* QR Code Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="rounded-lg border bg-white p-4">
              <QRCodeSVG
                value={projectUrl}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Scan QR code to open project
            </p>
          </div>

          <Separator />

          {/* Copy Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Project Link</label>
            <div className="flex gap-2">
              <Input
                value={projectUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Add Member */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Member by Email</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                  className="pl-9"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddMember();
                    }
                  }}
                />
              </div>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={isAdding}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Member List */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Members ({members.length})
            </label>
            <ScrollArea className="h-48">
              <div className="space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback
                          className="text-xs text-white"
                          style={{
                            backgroundColor: member.user?.avatarColor || '#6366f1',
                          }}
                        >
                          {getInitials(member.user?.displayName || 'User')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.user?.displayName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {member.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {member.role === 'owner' ? (
                        <Badge className={cn('gap-1', ROLE_CONFIG.owner.color)}>
                          <Crown className="h-3 w-3" />
                          Owner
                        </Badge>
                      ) : (
                        <>
                          <Select
                            value={member.role}
                            onValueChange={(v) => handleRoleChange(member.userId, v as Role)}
                          >
                            <SelectTrigger className="h-7 w-24">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="editor">Editor</SelectItem>
                              <SelectItem value="viewer">Viewer</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveMember(member.userId)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
