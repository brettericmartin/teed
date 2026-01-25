'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Command,
  Search,
  Link2,
  Plus,
  Palette,
  Package,
  Settings,
  Home,
  User,
  Video,
  ShoppingBag,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { classifyUrl, isValidUrl } from '@/lib/linkIntelligence/classifier';
import type { ClassifiedUrl } from '@/lib/linkIntelligence/types';

interface CommandPaletteProps {
  profileHandle: string;
  isOwner: boolean;
  onOpenBlockPicker?: () => void;
  onOpenThemeEditor?: () => void;
}

interface CommandItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  description?: string;
  shortcut?: string;
  onSelect: () => void;
  category?: 'navigation' | 'action' | 'link';
}

/**
 * CommandPalette - Power user keyboard interface
 *
 * Triggered by Cmd+K / Ctrl+K. Provides:
 * - Quick navigation (profile, settings, etc.)
 * - Link pasting with instant classification
 * - Quick actions (add block, customize theme)
 */
export function CommandPalette({
  profileHandle,
  isOwner,
  onOpenBlockPicker,
  onOpenThemeEditor,
}: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [classification, setClassification] = useState<ClassifiedUrl | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Close handler
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setClassification(null);
    setSelectedIndex(0);
  }, []);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Classify URL as user types
  useEffect(() => {
    const trimmed = query.trim();

    if (isValidUrl(trimmed)) {
      const result = classifyUrl(trimmed);
      setClassification(result);
    } else {
      setClassification(null);
    }
  }, [query]);

  // Build command items
  const getCommandItems = (): CommandItem[] => {
    const items: CommandItem[] = [];

    // If URL is detected, show link actions first
    if (classification) {
      const typeLabel = classification.type === 'embed'
        ? 'Add as Embed'
        : classification.type === 'social'
          ? 'Add to Social Links'
          : 'Add to Bag';

      const TypeIcon = classification.type === 'embed'
        ? Video
        : classification.type === 'social'
          ? User
          : ShoppingBag;

      items.push({
        id: 'add-link',
        icon: <TypeIcon className="w-4 h-4" />,
        label: typeLabel,
        description: `${classification.platform} detected`,
        onSelect: () => handleLinkAction(),
        category: 'link',
      });

      if (classification.type !== 'social') {
        items.push({
          id: 'create-bag-with-link',
          icon: <Plus className="w-4 h-4" />,
          label: 'Create New Bag',
          description: 'Start a new bag with this item',
          onSelect: () => {
            router.push(`/bags/new?url=${encodeURIComponent(classification.normalizedUrl)}`);
            handleClose();
          },
          category: 'link',
        });
      }
    }

    // Quick actions (only show if no URL or query matches)
    if (!classification) {
      const quickActions: CommandItem[] = [
        {
          id: 'new-bag',
          icon: <Package className="w-4 h-4" />,
          label: 'Create New Bag',
          description: 'Start curating a new collection',
          shortcut: 'N',
          onSelect: () => {
            router.push('/bags/new');
            handleClose();
          },
          category: 'action',
        },
      ];

      if (onOpenBlockPicker) {
        quickActions.push({
          id: 'add-block',
          icon: <Plus className="w-4 h-4" />,
          label: 'Add Panel',
          description: 'Add a new panel to your profile',
          onSelect: () => {
            onOpenBlockPicker();
            handleClose();
          },
          category: 'action',
        });
      }

      if (onOpenThemeEditor) {
        quickActions.push({
          id: 'customize',
          icon: <Palette className="w-4 h-4" />,
          label: 'Customize Theme',
          description: 'Change colors and fonts',
          onSelect: () => {
            onOpenThemeEditor();
            handleClose();
          },
          category: 'action',
        });
      }

      // Navigation items
      const navItems: CommandItem[] = [
        {
          id: 'profile',
          icon: <User className="w-4 h-4" />,
          label: 'View Profile',
          description: 'See your public profile',
          onSelect: () => {
            router.push(`/u/${profileHandle}`);
            handleClose();
          },
          category: 'navigation',
        },
        {
          id: 'settings',
          icon: <Settings className="w-4 h-4" />,
          label: 'Settings',
          description: 'Account and preferences',
          onSelect: () => {
            router.push('/settings');
            handleClose();
          },
          category: 'navigation',
        },
        {
          id: 'home',
          icon: <Home className="w-4 h-4" />,
          label: 'Go Home',
          description: 'Back to the homepage',
          onSelect: () => {
            router.push('/');
            handleClose();
          },
          category: 'navigation',
        },
      ];

      // Filter by query
      const allItems = [...quickActions, ...navItems];
      const lowerQuery = query.toLowerCase();

      if (lowerQuery) {
        return allItems.filter(
          item =>
            item.label.toLowerCase().includes(lowerQuery) ||
            item.description?.toLowerCase().includes(lowerQuery)
        );
      }

      return allItems;
    }

    return items;
  };

  // Handle link action
  const handleLinkAction = async () => {
    if (!classification) return;

    setIsProcessing(true);

    try {
      if (classification.type === 'embed') {
        // Add embed block
        const response = await fetch('/api/profile/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            block_type: 'embed',
            config: {
              url: classification.normalizedUrl,
              platform: classification.platform,
              showTitle: true,
            },
          }),
        });

        if (!response.ok) throw new Error('Failed to add embed');

        handleClose();
        // Refresh page to show new block
        router.refresh();
      } else if (classification.type === 'social') {
        // Add to social links - would need profile update API
        router.push(`/settings?add-social=${encodeURIComponent(classification.normalizedUrl)}`);
        handleClose();
      } else {
        // Product - redirect to bag creation
        router.push(`/bags/new?url=${encodeURIComponent(classification.normalizedUrl)}`);
        handleClose();
      }
    } catch (error) {
      console.error('Failed to process link:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const items = getCommandItems();

  // Reset selection when items change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, classification]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => (i + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => (i - 1 + items.length) % items.length);
        break;
      case 'Enter':
        e.preventDefault();
        if (items[selectedIndex]) {
          items[selectedIndex].onSelect();
        }
        break;
    }
  };

  // Don't render for non-owners or when not open
  if (!isOwner || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm animate-in fade-in duration-150"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-x-4 top-[20vh] mx-auto max-w-lg z-50 animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
            ) : classification ? (
              <Link2 className="w-5 h-5 text-teed-green-600" />
            ) : (
              <Search className="w-5 h-5 text-gray-400" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search or paste a link..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
            />
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">esc</kbd>
              <span>to close</span>
            </div>
          </div>

          {/* Link preview (if URL detected) */}
          {classification && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm">
                <div className={cn(
                  'w-6 h-6 rounded-md flex items-center justify-center',
                  classification.type === 'embed' && 'bg-purple-100 text-purple-600',
                  classification.type === 'social' && 'bg-blue-100 text-blue-600',
                  classification.type === 'product' && 'bg-amber-100 text-amber-600',
                )}>
                  {classification.type === 'embed' ? (
                    <Video className="w-3.5 h-3.5" />
                  ) : classification.type === 'social' ? (
                    <User className="w-3.5 h-3.5" />
                  ) : (
                    <ShoppingBag className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  {classification.platform.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="text-gray-500">
                  {classification.type === 'embed' ? 'Embed' : classification.type === 'social' ? 'Profile' : 'Product'}
                </span>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <div className="py-8 text-center text-gray-500 text-sm">
                No results found
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item, index) => (
                  <button
                    key={item.id}
                    onClick={item.onSelect}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left',
                      'transition-colors',
                      index === selectedIndex
                        ? 'bg-teed-green-50 text-teed-green-900'
                        : 'hover:bg-gray-50 text-gray-700'
                    )}
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      index === selectedIndex ? 'bg-teed-green-100' : 'bg-gray-100'
                    )}>
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      )}
                    </div>
                    {item.shortcut && (
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono text-gray-500">
                        {item.shortcut}
                      </kbd>
                    )}
                    {index === selectedIndex && (
                      <ArrowRight className="w-4 h-4 text-teed-green-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">\u2191</kbd>
                <kbd className="px-1 py-0.5 bg-gray-200 rounded text-[10px]">\u2193</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-[10px]">enter</kbd>
                select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Command className="w-3 h-3" />
              <span>K</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
