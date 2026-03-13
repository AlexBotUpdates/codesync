'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores';
import { Code2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.push('/dashboard');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-8 w-8 text-primary animate-pulse" />
            <span className="text-2xl font-bold">CodeSync</span>
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 items-center px-4 md:px-6">
            <div className="flex items-center gap-2">
              <Code2 className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">CodeSync</span>
            </div>
            <nav className="flex flex-1 items-center justify-end gap-4">
              <button
                onClick={() => router.push('/login')}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign In
              </button>
              <button
                onClick={() => router.push('/signup')}
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Get Started
              </button>
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-medium">
                  <span className="text-primary mr-2">✨</span>
                  Real-time collaboration
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none max-w-3xl">
                  Code Together, <span className="text-primary">Build Faster</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                  CodeSync is a real-time collaborative code editor that lets you and your team 
                  write, edit, and debug code together from anywhere in the world.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 mt-4">
                  <button
                    onClick={() => router.push('/signup')}
                    className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                    Start for Free
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="inline-flex h-11 items-center justify-center rounded-md border bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="w-full py-12 md:py-24 lg:py-32 border-t">
            <div className="container px-4 md:px-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold">Real-time Sync</h3>
                  <p className="text-muted-foreground text-sm">
                    See changes instantly as your team collaborates. No more merge conflicts.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-bold">Secure Sharing</h3>
                  <p className="text-muted-foreground text-sm">
                    Control who can view or edit your code with granular permissions.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center space-y-2 p-6 rounded-lg border bg-card">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-2xl">📝</span>
                  </div>
                  <h3 className="text-xl font-bold">10+ Languages</h3>
                  <p className="text-muted-foreground text-sm">
                    Support for JavaScript, Python, TypeScript, and many more languages.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full border-t py-6">
          <div className="container flex flex-col items-center justify-center gap-2 px-4 md:px-6 text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} CodeSync. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // This should not be reached as we redirect above
  return null;
}
