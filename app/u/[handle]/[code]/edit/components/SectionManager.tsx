'use client';

import { useState } from 'react';
import { Plus, GripVertical, Trash2, Edit2, Check, X, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import * as bagsApi from '@/lib/api/domains/bags';

type Section = {
  id: string;
  bag_id: string;
  name: string;
  description: string | null;
  sort_index: number;
  collapsed_by_default: boolean;
  created_at: string;
  updated_at: string;
};

type Item = {
  id: string;
  custom_name: string | null;
  section_id: string | null;
};

interface SectionManagerProps {
  bagCode: string;
  sections: Section[];
  items: Item[];
  onSectionsChange: (sections: Section[]) => void;
  onItemSectionChange: (itemId: string, sectionId: string | null) => void;
}

export default function SectionManager({
  bagCode,
  sections,
  items,
  onSectionsChange,
  onItemSectionChange,
}: SectionManagerProps) {
  const { showSuccess, showError } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(sections.map(s => s.id)));

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) return;

    setIsLoading(true);
    try {
      const newSection = await bagsApi.createSection(bagCode, newSectionName.trim());
      onSectionsChange([...sections, newSection]);
      setExpandedSections(prev => new Set([...prev, newSection.id]));
      setNewSectionName('');
      setIsCreating(false);
      showSuccess('Section created');
    } catch (err: any) {
      showError(err.message || 'Failed to create section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSection = async (sectionId: string) => {
    if (!editingName.trim()) return;

    setIsLoading(true);
    try {
      const updatedSection = await bagsApi.updateSection(bagCode, sectionId, editingName.trim());
      onSectionsChange(sections.map(s => s.id === sectionId ? updatedSection : s));
      setEditingId(null);
      showSuccess('Section updated');
    } catch (err: any) {
      showError(err.message || 'Failed to update section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const sectionItems = items.filter(i => i.section_id === sectionId);
    const confirmMessage = sectionItems.length > 0
      ? `Delete this section? ${sectionItems.length} item(s) will become unsectioned.`
      : 'Delete this section?';

    if (!confirm(confirmMessage)) return;

    setIsLoading(true);
    try {
      await bagsApi.deleteSection(bagCode, sectionId);
      onSectionsChange(sections.filter(s => s.id !== sectionId));
      // Update items that were in this section
      sectionItems.forEach(item => {
        onItemSectionChange(item.id, null);
      });
      showSuccess('Section deleted');
    } catch (err: any) {
      showError(err.message || 'Failed to delete section');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSectionExpanded = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const unsectionedItems = items.filter(i => !i.section_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          Sections ({sections.length})
        </h3>
        {!isCreating && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCreating(true)}
            className="text-[var(--teed-green-9)]"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Section
          </Button>
        )}
      </div>

      {/* Create Section Form */}
      {isCreating && (
        <div className="flex items-center gap-2 p-3 bg-[var(--teed-green-2)] rounded-lg border border-[var(--teed-green-6)]">
          <FolderOpen className="w-4 h-4 text-[var(--teed-green-9)] flex-shrink-0" />
          <input
            type="text"
            value={newSectionName}
            onChange={(e) => setNewSectionName(e.target.value)}
            placeholder="Section name..."
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateSection();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewSectionName('');
              }
            }}
          />
          <button
            onClick={handleCreateSection}
            disabled={!newSectionName.trim() || isLoading}
            className="p-1.5 text-[var(--teed-green-9)] hover:bg-[var(--teed-green-3)] rounded disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewSectionName('');
            }}
            className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-2">
        {sections.map((section) => {
          const sectionItems = items.filter(i => i.section_id === section.id);
          const isExpanded = expandedSections.has(section.id);
          const isEditing = editingId === section.id;

          return (
            <div key={section.id} className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
              <div
                className={`flex items-center gap-2 px-3 py-2 bg-[var(--surface-alt)] cursor-pointer hover:bg-[var(--surface-hover)] transition-colors ${
                  sectionItems.length === 0 ? 'opacity-60' : ''
                }`}
                onClick={() => !isEditing && toggleSectionExpanded(section.id)}
              >
                <button
                  className="p-1 text-[var(--text-tertiary)]"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSectionExpanded(section.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {isEditing ? (
                  <div className="flex-1 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 px-2 py-1 bg-[var(--surface)] border border-[var(--border-default)] rounded text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleUpdateSection(section.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => handleUpdateSection(section.id)}
                      disabled={!editingName.trim() || isLoading}
                      className="p-1 text-[var(--teed-green-9)] hover:bg-[var(--teed-green-2)] rounded disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <FolderOpen className="w-4 h-4 text-[var(--sky-10)] flex-shrink-0" />
                    <span className="flex-1 text-sm font-medium text-[var(--text-primary)]">
                      {section.name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] px-2 py-0.5 bg-[var(--surface)] rounded">
                      {sectionItems.length} {sectionItems.length === 1 ? 'item' : 'items'}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(section.id);
                        setEditingName(section.name);
                      }}
                      className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] rounded opacity-0 group-hover:opacity-100"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSection(section.id);
                      }}
                      className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-bg)] rounded opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

              {/* Section Items Preview */}
              {isExpanded && sectionItems.length > 0 && (
                <div className="px-3 py-2 bg-[var(--surface)] border-t border-[var(--border-subtle)]">
                  <div className="space-y-1">
                    {sectionItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-[var(--text-secondary)] rounded hover:bg-[var(--surface-hover)]"
                      >
                        <span className="w-1.5 h-1.5 bg-[var(--sky-8)] rounded-full" />
                        <span className="truncate">{item.custom_name || 'Unnamed item'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Unsectioned Items */}
      {unsectionedItems.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)] mb-2">
            <span className="font-medium">Unsectioned</span>
            <span className="px-1.5 py-0.5 bg-[var(--surface-alt)] rounded">
              {unsectionedItems.length} {unsectionedItems.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <p className="text-xs text-[var(--text-tertiary)]">
            Edit items to assign them to sections
          </p>
        </div>
      )}

      {sections.length === 0 && !isCreating && (
        <div className="text-center py-6 text-[var(--text-secondary)]">
          <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No sections yet</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Add sections to organize your items
          </p>
        </div>
      )}
    </div>
  );
}
