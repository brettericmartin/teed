'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { User, Settings, LogOut, ChevronDown, Compass, LayoutDashboard } from 'lucide-react';

interface NavigationProps {
  userHandle?: string;
  displayName?: string;
  isAuthenticated?: boolean;
}

export default function Navigation({ userHandle, displayName, isAuthenticated }: NavigationProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  // Close dropdown on route change
  useEffect(() => {
    setIsProfileOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href={isAuthenticated ? "/dashboard" : "/"}
              className="flex items-center gap-2 group transition-opacity hover:opacity-80 -ml-2 py-2 pl-2 pr-3 rounded-lg"
            >
              <img
                src="/teed-logo.svg"
                alt="Teed logo"
                className="w-8 h-12 object-contain"
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold text-[var(--text-primary)] leading-none">
                  Teed
                </span>
                <span className="text-[11px] text-[var(--text-tertiary)] leading-none mt-1 hidden lg:block">
                  Curations, Made Shareable
                </span>
              </div>
            </Link>

            {/* Navigation Links (when authenticated) */}
            {isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1 ml-4">
                <Link
                  href="/dashboard"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  href="/discover"
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    pathname === '/discover'
                      ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  <Compass className="w-4 h-4" />
                  <span>Discover</span>
                </Link>
              </nav>
            )}
          </div>

          {/* Right: Profile Menu (when authenticated) */}
          {isAuthenticated && userHandle && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-2.5 min-h-[44px] rounded-lg hover:bg-[var(--surface-hover)] transition-colors group"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                {/* Avatar Circle with Initials */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--teed-green-7)] to-[var(--teed-green-9)] flex items-center justify-center text-white text-sm font-medium">
                  {getInitials(displayName || userHandle)}
                </div>

                {/* User Info (hidden on mobile) */}
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm font-medium text-[var(--text-primary)] leading-none">
                    {displayName || userHandle}
                  </span>
                  <span className="text-xs text-[var(--text-tertiary)] leading-none mt-0.5">
                    @{userHandle}
                  </span>
                </div>

                {/* Dropdown Icon */}
                <ChevronDown
                  className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${
                    isProfileOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl bg-[var(--modal-bg)] shadow-[var(--shadow-6)] border border-[var(--modal-border)] overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {displayName || userHandle}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      @{userHandle}
                    </p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    {/* Mobile-only navigation items */}
                    <div className="md:hidden border-b border-[var(--border-subtle)] pb-1 mb-1">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[var(--text-secondary)]" />
                        Dashboard
                      </Link>
                      <Link
                        href="/discover"
                        className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                      >
                        <Compass className="w-4 h-4 text-[var(--text-secondary)]" />
                        Discover
                      </Link>
                    </div>

                    <Link
                      href={`/u/${userHandle}`}
                      className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <User className="w-4 h-4 text-[var(--text-secondary)]" />
                      View Profile
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-3 px-4 py-3 min-h-[48px] text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
                    >
                      <Settings className="w-4 h-4 text-[var(--text-secondary)]" />
                      Settings
                    </Link>
                  </div>

                  {/* Sign Out */}
                  <div className="border-t border-[var(--border-subtle)] py-1">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-3 min-h-[48px] text-sm text-[var(--sand-11)] hover:bg-[var(--sand-2)] transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Login Button (when not authenticated) */}
          {!isAuthenticated && (
            <Link
              href="/login"
              className="px-4 py-2.5 min-h-[44px] flex items-center text-sm font-medium text-[var(--button-primary-text)] bg-[var(--button-primary-bg)] hover:bg-[var(--button-primary-bg-hover)] rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
