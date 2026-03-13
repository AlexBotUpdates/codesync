'use client';

import { Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeSyncLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function CodeSyncLogo({ className, showText = true, size = 'md' }: CodeSyncLogoProps) {
  const sizes = {
    sm: { icon: 'h-5 w-5', text: 'text-lg' },
    md: { icon: 'h-7 w-7', text: 'text-xl' },
    lg: { icon: 'h-9 w-9', text: 'text-2xl' },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-md rounded-full" />
        <Code2 className={cn(sizes[size].icon, 'relative text-primary')} strokeWidth={2.5} />
      </div>
      {showText && (
        <span className={cn(sizes[size].text, 'font-bold tracking-tight')}>
          <span className="text-foreground">Code</span>
          <span className="text-primary">Sync</span>
        </span>
      )}
    </div>
  );
}
