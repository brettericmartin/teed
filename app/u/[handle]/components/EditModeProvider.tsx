'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ProfileBlock } from '@/lib/blocks/types';

interface GridLayout {
  gridX: number;
  gridY: number;
  gridW: number;
  gridH: number;
}

interface EditModeContextType {
  isEditMode: boolean;
  isOwner: boolean;
  toggleEditMode: () => void;
  setEditMode: (value: boolean) => void;

  // Block operations
  blocks: ProfileBlock[];
  setBlocks: (blocks: ProfileBlock[]) => void;
  addBlock: (block: Omit<ProfileBlock, 'id' | 'created_at' | 'updated_at'>) => void;
  updateBlock: (id: string, updates: Partial<ProfileBlock>) => void;
  updateBlockLayout: (id: string, layout: GridLayout) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  toggleBlockVisibility: (id: string) => void;

  // Selection
  selectedBlockId: string | null;
  selectBlock: (id: string | null) => void;

  // Dirty state
  isDirty: boolean;
  setIsDirty: (value: boolean) => void;

  // Saving
  isSaving: boolean;
  saveBlocks: () => Promise<void>;

  // Track if changes were made during edit session
  hadChanges: boolean;
}

const EditModeContext = createContext<EditModeContextType | undefined>(undefined);

interface EditModeProviderProps {
  children: ReactNode;
  initialBlocks: ProfileBlock[];
  profileId: string;
  isOwner: boolean;
}

export function EditModeProvider({
  children,
  initialBlocks,
  profileId,
  isOwner,
}: EditModeProviderProps) {
  // Showcase Mode: Owners see their profile as visitors see it by default
  // They can press 'E' or click the floating edit button to enter edit mode
  const [isEditMode, setEditMode] = useState(false);
  const [blocks, setBlocks] = useState<ProfileBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hadChanges, setHadChanges] = useState(false);

  const toggleEditMode = useCallback(() => {
    setEditMode(prev => {
      if (prev) {
        // Exiting edit mode - deselect block
        setSelectedBlockId(null);
      }
      return !prev;
    });
  }, []);

  // Track when changes are made during an edit session
  useEffect(() => {
    if (isDirty) {
      setHadChanges(true);
    }
  }, [isDirty]);

  // Reset hadChanges when entering edit mode
  useEffect(() => {
    if (isEditMode) {
      setHadChanges(false);
    }
  }, [isEditMode]);

  // Keyboard shortcuts: E to enter edit mode, Escape to exit
  useEffect(() => {
    if (!isOwner) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // 'E' to toggle edit mode
      if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        setEditMode(prev => {
          if (prev) {
            // Exiting - deselect block
            setSelectedBlockId(null);
          }
          return !prev;
        });
      }

      // Escape to exit edit mode (alternative)
      if (e.key === 'Escape' && isEditMode) {
        e.preventDefault();
        setEditMode(false);
        setSelectedBlockId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOwner, isEditMode]);

  const addBlock = useCallback((block: Omit<ProfileBlock, 'id' | 'created_at' | 'updated_at'>) => {
    const newBlock: ProfileBlock = {
      ...block,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setBlocks(prev => {
      // Add at the end with appropriate sort_order
      const maxOrder = prev.reduce((max, b) => Math.max(max, b.sort_order), -1);
      return [...prev, { ...newBlock, sort_order: maxOrder + 1 }];
    });
    setIsDirty(true);
  }, []);

  const updateBlock = useCallback((id: string, updates: Partial<ProfileBlock>) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === id
          ? { ...block, ...updates, updated_at: new Date().toISOString() }
          : block
      )
    );
    setIsDirty(true);
  }, []);

  const updateBlockLayout = useCallback((id: string, layout: GridLayout) => {
    console.log('[EditModeProvider] updateBlockLayout called', { id, layout });
    setBlocks(prev =>
      prev.map(block =>
        block.id === id
          ? { ...block, ...layout, updated_at: new Date().toISOString() }
          : block
      )
    );
    setIsDirty(true);
    console.log('[EditModeProvider] isDirty set to true');
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(block => block.id !== id));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
    setIsDirty(true);
  }, [selectedBlockId]);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const blockToDuplicate = prev.find(b => b.id === id);
      if (!blockToDuplicate) return prev;

      const now = new Date().toISOString();
      const newBlock: ProfileBlock = {
        ...blockToDuplicate,
        id: crypto.randomUUID(),
        created_at: now,
        updated_at: now,
        // Position the duplicate below the original
        gridY: (blockToDuplicate.gridY ?? 0) + (blockToDuplicate.gridH ?? 2),
        sort_order: prev.length,
      };

      return [...prev, newBlock];
    });
    setIsDirty(true);
  }, []);

  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks(prev => {
      // CRITICAL: Sort by sort_order first to match what the caller sees
      // The caller (handleReorderBlock) finds indices in sortedBlocks which is
      // sorted by sort_order, so we must operate on the same sorted order
      const sorted = [...prev].sort((a, b) => a.sort_order - b.sort_order);

      // Perform the reorder on the sorted array
      const [removed] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, removed);

      // Update sort_order for all blocks based on new positions
      return sorted.map((block, index) => ({
        ...block,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));
    });
    setIsDirty(true);
  }, []);

  const toggleBlockVisibility = useCallback((id: string) => {
    setBlocks(prev =>
      prev.map(block =>
        block.id === id
          ? { ...block, is_visible: !block.is_visible, updated_at: new Date().toISOString() }
          : block
      )
    );
    setIsDirty(true);
  }, []);

  const selectBlock = useCallback((id: string | null) => {
    setSelectedBlockId(id);
  }, []);

  const saveBlocks = useCallback(async () => {
    console.log('[EditModeProvider] saveBlocks called', { isDirty, blocksCount: blocks.length });
    if (!isDirty) {
      console.log('[EditModeProvider] Not dirty, skipping save');
      return;
    }

    setIsSaving(true);
    try {
      console.log('[EditModeProvider] Sending blocks to API:', blocks.map(b => ({
        id: b.id,
        gridX: b.gridX,
        gridY: b.gridY,
        gridW: b.gridW,
        gridH: b.gridH,
      })));
      const response = await fetch('/api/profile/blocks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profileId,
          blocks: blocks,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EditModeProvider] Save failed:', errorText);
        throw new Error('Failed to save blocks');
      }

      console.log('[EditModeProvider] Save successful!');
      setIsDirty(false);
    } catch (error) {
      console.error('Error saving blocks:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [blocks, isDirty, profileId]);

  // Debounced auto-save: save 1.5s after last change
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('[EditModeProvider] Auto-save effect triggered', { isDirty, isSaving });
    // Only auto-save if dirty and not already saving
    if (!isDirty || isSaving) {
      console.log('[EditModeProvider] Skipping auto-save:', { isDirty, isSaving });
      return;
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    console.log('[EditModeProvider] Scheduling auto-save in 1.5s');
    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      console.log('[EditModeProvider] Auto-save timeout fired, calling saveBlocks');
      saveBlocks().catch(() => {
        // Error already logged in saveBlocks
      });
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, blocks, isSaving, saveBlocks]);

  // Listen for updateBlockConfig events (used by FeaturedBagsBlock to toggle featured bags)
  useEffect(() => {
    const handleUpdateBlockConfig = (e: CustomEvent<{ blockId: string; config: any }>) => {
      const { blockId, config } = e.detail;
      updateBlock(blockId, { config });
    };

    window.addEventListener('updateBlockConfig', handleUpdateBlockConfig as EventListener);
    return () => {
      window.removeEventListener('updateBlockConfig', handleUpdateBlockConfig as EventListener);
    };
  }, [updateBlock]);

  // Only allow edit mode for owners
  if (!isOwner) {
    return (
      <EditModeContext.Provider
        value={{
          isEditMode: false,
          isOwner: false,
          toggleEditMode: () => {},
          setEditMode: () => {},
          blocks,
          setBlocks,
          addBlock: () => {},
          updateBlock: () => {},
          updateBlockLayout: () => {},
          deleteBlock: () => {},
          duplicateBlock: () => {},
          reorderBlocks: () => {},
          toggleBlockVisibility: () => {},
          selectedBlockId: null,
          selectBlock: () => {},
          isDirty: false,
          setIsDirty: () => {},
          isSaving: false,
          saveBlocks: async () => {},
          hadChanges: false,
        }}
      >
        {children}
      </EditModeContext.Provider>
    );
  }

  return (
    <EditModeContext.Provider
      value={{
        isEditMode,
        isOwner,
        toggleEditMode,
        setEditMode,
        blocks,
        setBlocks,
        addBlock,
        updateBlock,
        updateBlockLayout,
        deleteBlock,
        duplicateBlock,
        reorderBlocks,
        toggleBlockVisibility,
        selectedBlockId,
        selectBlock,
        isDirty,
        setIsDirty,
        isSaving,
        saveBlocks,
        hadChanges,
      }}
    >
      {children}
    </EditModeContext.Provider>
  );
}

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (context === undefined) {
    throw new Error('useEditMode must be used within an EditModeProvider');
  }
  return context;
}
