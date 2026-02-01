'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Palette,
  BarChart3,
  Package,
  LayoutGrid,
  Link2,
  Share2,
  User,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Monitor,
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ActionType = 'add' | 'customize';
type AddOption = 'bag' | 'block' | 'link' | 'social';
type CustomizeOption = 'theme' | 'profile' | 'blocks';

interface ProfileActionBarProps {
  // Add handlers
  onAddBag: () => void;
  onAddBlock: () => void;
  onAddLink: () => void;
  onAddSocial: () => void;
  // Customize handlers
  onCustomizeTheme: () => void;
  onCustomizeProfile: () => void;
  onEditBlocks: () => void;
  // Analyze handlers
  onViewStats: () => void;
  profileHandle: string;
  // Layout editing mode
  isEditMode?: boolean;
  editingLayout?: 'desktop' | 'mobile';
  onToggleEditingLayout?: () => void;
}

/**
 * ProfileActionBar - Premium floating bottom bar for profile owners
 *
 * Layout: [Customize] [+ ADD +] [Analyze]
 *
 * Fixed to bottom of viewport for easy access while editing
 * Menus expand upward from the buttons
 */
export function ProfileActionBar({
  onAddBag,
  onAddBlock,
  onAddLink,
  onAddSocial,
  onCustomizeTheme,
  onCustomizeProfile,
  onEditBlocks,
  onViewStats,
  profileHandle,
  isEditMode = false,
  editingLayout = 'desktop',
  onToggleEditingLayout,
}: ProfileActionBarProps) {
  const [activeMenu, setActiveMenu] = useState<ActionType | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem('profileActionBar:collapsed');
    if (stored === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapsed = () => {
    const newValue = !isCollapsed;
    setIsCollapsed(newValue);
    localStorage.setItem('profileActionBar:collapsed', String(newValue));
    // Close any open menu when collapsing
    if (newValue) {
      setActiveMenu(null);
    }
  };

  const closeMenu = () => setActiveMenu(null);

  const handleAddOption = (option: AddOption) => {
    closeMenu();
    switch (option) {
      case 'bag': onAddBag(); break;
      case 'block': onAddBlock(); break;
      case 'link': onAddLink(); break;
      case 'social': onAddSocial(); break;
    }
  };

  const handleCustomizeOption = (option: CustomizeOption) => {
    closeMenu();
    switch (option) {
      case 'theme': onCustomizeTheme(); break;
      case 'profile': onCustomizeProfile(); break;
      case 'blocks': onEditBlocks(); break;
    }
  };

  const handleViewStats = () => {
    closeMenu();
    onViewStats();
  };

  return (
    <>
      {/* Backdrop when menu is open */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-[2px]"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Dropdown Menus - positioned below the bar */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.25 }}
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-[100]',
              // Below top nav (64px + safe area) + action bar (~56px) + gap
              'top-[calc(64px+env(safe-area-inset-top,0px)+56px+8px)]',
              'bg-[var(--surface)] rounded-2xl shadow-2xl',
              'border border-[var(--border-subtle)]',
              'overflow-hidden',
              'w-[calc(100%-2rem)] max-w-md'
            )}
          >
            {/* Add Menu */}
            {activeMenu === 'add' && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  What would you like to add?
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <MenuOption
                    icon={<Package className="w-5 h-5" />}
                    label="New Bag"
                    description="Create a collection"
                    color="sky"
                    onClick={() => handleAddOption('bag')}
                  />
                  <MenuOption
                    icon={<LayoutGrid className="w-5 h-5" />}
                    label="Add Block"
                    description="Profile section"
                    color="teed-green"
                    onClick={() => handleAddOption('block')}
                  />
                  <MenuOption
                    icon={<Link2 className="w-5 h-5" />}
                    label="Add Link"
                    description="Products & embeds"
                    color="copper"
                    onClick={() => handleAddOption('link')}
                  />
                  <MenuOption
                    icon={<Share2 className="w-5 h-5" />}
                    label="Social Links"
                    description="Connect accounts"
                    color="sand"
                    onClick={() => handleAddOption('social')}
                  />
                </div>
              </div>
            )}

            {/* Customize Menu */}
            {activeMenu === 'customize' && (
              <div className="p-2">
                <div className="px-3 py-2 text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide">
                  Customize your profile
                </div>
                <div className="space-y-1">
                  <MenuRow
                    icon={<Palette className="w-5 h-5" />}
                    label="Theme & Colors"
                    description="Colors, fonts, and style"
                    onClick={() => handleCustomizeOption('theme')}
                  />
                  <MenuRow
                    icon={<User className="w-5 h-5" />}
                    label="Profile Info"
                    description="Name, bio, and avatar"
                    onClick={() => handleCustomizeOption('profile')}
                  />
                  <MenuRow
                    icon={<LayoutGrid className="w-5 h-5" />}
                    label="Panel Settings"
                    description="Arrange and configure panels"
                    onClick={() => handleCustomizeOption('blocks')}
                  />
                </div>
              </div>
            )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed Top Action Bar - below main nav */}
      <AnimatePresence mode="wait">
        {isCollapsed ? (
          /* Collapsed State - Compact pill tucked into nav */
          <motion.div
            key="collapsed"
            initial={{ y: -20, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-[95]',
              // Position at bottom edge of nav bar (64px) minus half the pill height (~20px)
              'top-[calc(64px+env(safe-area-inset-top,0px)-10px)]',
            )}
          >
            <motion.button
              onClick={toggleCollapsed}
              className={cn(
                'flex items-center justify-center',
                'w-11 h-11 rounded-full',
                'bg-gradient-to-br from-[var(--teed-green-9)] to-[var(--teed-green-10)]',
                'text-white',
                'shadow-lg shadow-[var(--teed-green-9)]/25',
                'border-2 border-white/20',
                'transition-all duration-200',
                'hover:from-[var(--teed-green-10)] hover:to-[var(--evergreen-9)]',
                'hover:shadow-xl hover:shadow-[var(--teed-green-9)]/30',
                'active:scale-95'
              )}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Expand edit menu"
            >
              <Plus className="w-5 h-5" strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        ) : (
          /* Expanded State - Full bar */
          <motion.div
            key="expanded"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.5, delay: 0.1 }}
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-[95]',
              'top-[calc(64px+env(safe-area-inset-top,0px)+8px)]',
              'bg-[var(--surface)]/95 backdrop-blur-md rounded-2xl',
              'border border-[var(--border-subtle)]',
              'shadow-xl',
              'px-2 py-2'
            )}
          >
            <div className="flex items-center gap-2">
              {/* Customize Button (Left) */}
              <motion.button
                onClick={() => setActiveMenu(activeMenu === 'customize' ? null : 'customize')}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'font-medium text-sm',
                  'transition-all duration-200',
                  activeMenu === 'customize'
                    ? 'bg-[var(--sand-9)] text-white'
                    : 'text-[var(--text-primary)] hover:bg-[var(--sand-3)]'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Palette className="w-4 h-4" />
                <span className="hidden sm:inline">Customize</span>
              </motion.button>

              {/* Divider */}
              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* ADD Button (Center - Primary) */}
              <motion.button
                onClick={() => setActiveMenu(activeMenu === 'add' ? null : 'add')}
                className={cn(
                  'relative flex items-center gap-2 px-6 py-3 rounded-xl',
                  'font-semibold text-sm',
                  'transition-all duration-200',
                  activeMenu === 'add'
                    ? 'bg-[var(--evergreen-11)] text-white'
                    : 'bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-10)] text-white hover:from-[var(--teed-green-10)] hover:to-[var(--evergreen-9)]'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Plus className="w-5 h-5" strokeWidth={2.5} />
                <span>Add</span>
                <ChevronDown className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  activeMenu === 'add' && 'rotate-180'
                )} />
              </motion.button>

              {/* Divider */}
              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Stats Button (Right) - Direct navigation, no menu */}
              <motion.button
                onClick={handleViewStats}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl',
                  'font-medium text-sm',
                  'transition-all duration-200',
                  'text-[var(--text-primary)] hover:bg-[var(--sky-3)]'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Stats</span>
              </motion.button>

              {/* Device Layout Toggle - Only visible in edit mode on desktop */}
              {isEditMode && onToggleEditingLayout && (
                <>
                  <div className="w-px h-8 bg-[var(--border-subtle)] hidden md:block" />
                  <div className="hidden md:flex items-center gap-1 bg-[var(--surface-elevated)] rounded-lg p-1">
                    <motion.button
                      onClick={editingLayout === 'desktop' ? undefined : onToggleEditingLayout}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                        editingLayout === 'desktop'
                          ? 'bg-[var(--teed-green-9)] text-white'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      )}
                      whileTap={{ scale: 0.98 }}
                      title="Edit desktop layout"
                    >
                      <Monitor className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={editingLayout === 'mobile' ? undefined : onToggleEditingLayout}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                        editingLayout === 'mobile'
                          ? 'bg-[var(--teed-green-9)] text-white'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                      )}
                      whileTap={{ scale: 0.98 }}
                      title="Edit mobile layout"
                    >
                      <Smartphone className="w-4 h-4" />
                    </motion.button>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="w-px h-8 bg-[var(--border-subtle)]" />

              {/* Collapse Button (Far Right) */}
              <motion.button
                onClick={toggleCollapsed}
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-xl',
                  'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]',
                  'hover:bg-[var(--surface-hover)]',
                  'transition-all duration-200'
                )}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                title="Collapse menu"
              >
                <ChevronUp className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Grid-style menu option (2x2 layout)
function MenuOption({
  icon,
  label,
  description,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  color: 'sky' | 'teed-green' | 'copper' | 'sand';
  onClick: () => void;
}) {
  const colorClasses = {
    'sky': 'bg-[var(--sky-3)] text-[var(--sky-10)] hover:bg-[var(--sky-4)]',
    'teed-green': 'bg-[var(--teed-green-3)] text-[var(--teed-green-10)] hover:bg-[var(--teed-green-4)]',
    'copper': 'bg-[var(--copper-3)] text-[var(--copper-10)] hover:bg-[var(--copper-4)]',
    'sand': 'bg-[var(--sand-3)] text-[var(--sand-11)] hover:bg-[var(--sand-4)]',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl',
        'transition-all duration-150',
        'hover:scale-[1.02] active:scale-[0.98]',
        colorClasses[color]
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-center">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs opacity-70">{description}</div>
      </div>
    </button>
  );
}

// Row-style menu option (list layout)
function MenuRow({
  icon,
  label,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl',
        'text-left transition-all duration-150',
        'hover:bg-[var(--surface-hover)]',
        'group'
      )}
    >
      <div className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] flex items-center justify-center text-[var(--text-secondary)] group-hover:text-[var(--teed-green-9)] transition-colors">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm text-[var(--text-primary)]">{label}</div>
        <div className="text-xs text-[var(--text-tertiary)]">{description}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

export default ProfileActionBar;
