import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUIStore } from '@/store/useUIStore';
import { Avatar } from '@/components/common/Avatar';
import { ToastStack } from '@/components/common/ToastStack';
import { Button } from '@/components/common/Button';

export function App() {
  const init = useAuthStore((s) => s.init);
  const userId = useAuthStore((s) => s.userId);
  const displayName = useAuthStore((s) => s.displayName);
  const avatarId = useAuthStore((s) => s.avatarId);
  const signOut = useAuthStore((s) => s.signOut);
  const isMuted = useUIStore((s) => s.isMuted);
  const toggleMuted = useUIStore((s) => s.toggleMuted);
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex min-h-screen flex-col">
      <ToastStack />

      <header className="glass-panel sticky top-0 z-30 mx-3 mt-3 flex items-center justify-between rounded-2xl px-4 py-2.5 sm:mx-4">
        <Link to="/" className="font-display text-2xl tracking-wide text-accent-gold">
          SON<span className="text-white">7</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <Link to="/leaderboard" className="rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">Leaderboard</Link>
          {userId && <Link to="/history" className="rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">Match history</Link>}
          {userId && <Link to="/profile" className="rounded-lg px-3 py-1.5 text-sm text-slate-200 hover:bg-white/10">Profile</Link>}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMuted}
            className="rounded-lg px-2 py-1.5 text-lg hover:bg-white/10"
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          {userId ? (
            <button onClick={() => navigate('/profile')} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-white/10">
              <Avatar avatarId={avatarId} size="sm" />
              <span className="hidden text-sm font-medium sm:inline">{displayName}</span>
            </button>
          ) : (
            <Button onClick={() => navigate('/login')} className="!px-4 !py-1.5 text-sm">Sign in</Button>
          )}
          {userId && (
            <button
              onClick={() => { signOut(); navigate('/'); }}
              className="hidden rounded-lg px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10 sm:block"
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="px-4 py-6 text-center text-xs text-slate-500">
        SON 7 — a fan-made take on the classic 7s card game. Built with React, TypeScript &amp; Framer Motion.
      </footer>
    </div>
  );
}
