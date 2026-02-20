'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Link, Images, Sparkles, Image, TrendingUp, ChevronRight, ChevronDown, Type, Layers, Camera } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/animations';
import { BottomSheet } from '@/components/ui/BottomSheet';

type ToolId = 'quickAdd' | 'scanPhoto' | 'bulkAdd' | 'photoMatch' | 'enhanceDetails' | 'coverPhoto' | 'analytics';

type ToolOption = {
  id: ToolId;
  icon: React.ReactNode;
  /** Smaller icon for the collapsed strip */
  stripIcon: React.ReactNode;
  label: string;
  shortLabel: string;
  description: string;
  color: string;
  bgColor: string;
  /** Tailwind bg class for the strip icon circle */
  stripBg: string;
  stripText: string;
  visible: boolean;
  /** If true, selecting this tool triggers a callback directly instead of opening a BottomSheet */
  directAction?: boolean;
};

interface BagToolsMenuProps {
  showAnalytics: boolean;
  hasCoverPhoto: boolean;
  itemCount: number;
  renderQuickAdd: (onDismiss: () => void) => React.ReactNode;
  renderCoverPhoto: (onDismiss: () => void) => React.ReactNode;
  renderAnalytics?: (onDismiss: () => void) => React.ReactNode;
  onBulkAddFromLinks: () => void;
  onBulkAddFromText: () => void;
  onScanPhoto: () => void;
  onPhotoMatch: () => void;
  onEnhanceDetails: () => void;
}

export function BagToolsMenu({
  showAnalytics,
  hasCoverPhoto,
  itemCount,
  renderQuickAdd,
  renderCoverPhoto,
  renderAnalytics,
  onBulkAddFromLinks,
  onBulkAddFromText,
  onScanPhoto,
  onPhotoMatch,
  onEnhanceDetails,
}: BagToolsMenuProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolId | null>(null);

  const tools: ToolOption[] = [
    {
      id: 'quickAdd',
      icon: <Plus className="w-5 h-5" />,
      stripIcon: <Plus className="w-4 h-4" strokeWidth={2.5} />,
      label: 'Quick Add Item',
      shortLabel: 'Add',
      description: 'Search or identify products',
      color: 'text-[var(--teed-green-10)]',
      bgColor: 'bg-[var(--teed-green-3)]',
      stripBg: 'bg-[var(--teed-green-4)]',
      stripText: 'text-[var(--teed-green-11)]',
      visible: true,
    },
    {
      id: 'scanPhoto',
      icon: <Camera className="w-5 h-5" />,
      stripIcon: <Camera className="w-3.5 h-3.5" />,
      label: 'Scan Photo',
      shortLabel: 'Scan',
      description: 'Identify all products in a photo',
      color: 'text-[var(--violet-10)]',
      bgColor: 'bg-[var(--violet-3)]',
      stripBg: 'bg-[var(--violet-4)]',
      stripText: 'text-[var(--violet-11)]',
      visible: process.env.NODE_ENV === 'development',
      directAction: true,
    },
    {
      id: 'bulkAdd',
      icon: <Layers className="w-5 h-5" />,
      stripIcon: <Layers className="w-3.5 h-3.5" />,
      label: 'Bulk Add',
      shortLabel: 'Bulk',
      description: 'Import from links or text',
      color: 'text-[var(--sky-10)]',
      bgColor: 'bg-[var(--sky-3)]',
      stripBg: 'bg-[var(--violet-4)]',
      stripText: 'text-[var(--violet-11)]',
      visible: true,
    },
    {
      id: 'photoMatch',
      icon: <Images className="w-5 h-5" />,
      stripIcon: <Images className="w-3.5 h-3.5" />,
      label: 'Smart Photo Match',
      shortLabel: 'Photos',
      description: 'Find better product photos',
      color: 'text-[var(--amber-10)]',
      bgColor: 'bg-[var(--amber-3)]',
      stripBg: 'bg-[var(--amber-4)]',
      stripText: 'text-[var(--amber-11)]',
      visible: itemCount > 0,
      directAction: true,
    },
    {
      id: 'enhanceDetails',
      icon: <Sparkles className="w-5 h-5" />,
      stripIcon: <Sparkles className="w-3.5 h-3.5" />,
      label: 'Enhance Details',
      shortLabel: 'Enhance',
      description: 'Complete missing product info',
      color: 'text-[var(--sky-10)]',
      bgColor: 'bg-[var(--sky-3)]',
      stripBg: 'bg-[var(--sky-4)]',
      stripText: 'text-[var(--sky-11)]',
      visible: itemCount > 0,
      directAction: true,
    },
    {
      id: 'coverPhoto',
      icon: <Image className="w-5 h-5" />,
      stripIcon: <Image className="w-3.5 h-3.5" />,
      label: hasCoverPhoto ? 'Change Cover Photo' : 'Add Cover Photo',
      shortLabel: 'Cover',
      description: hasCoverPhoto ? 'Update or crop your cover' : 'Upload a cover photo',
      color: 'text-[var(--teed-green-10)]',
      bgColor: 'bg-[var(--teed-green-3)]',
      stripBg: 'bg-[var(--teed-green-4)]',
      stripText: 'text-[var(--teed-green-11)]',
      visible: true,
    },
    {
      id: 'analytics',
      icon: <TrendingUp className="w-5 h-5" />,
      stripIcon: <TrendingUp className="w-3.5 h-3.5" />,
      label: 'Analytics',
      shortLabel: 'Stats',
      description: 'Views, clicks, visitors',
      color: 'text-[var(--copper-10)]',
      bgColor: 'bg-[var(--copper-3)]',
      stripBg: 'bg-[var(--copper-4)]',
      stripText: 'text-[var(--copper-11)]',
      visible: showAnalytics,
    },
  ];

  const visibleTools = tools.filter((t) => t.visible);

  const directActionHandlers: Partial<Record<ToolId, () => void>> = {
    scanPhoto: onScanPhoto,
    photoMatch: onPhotoMatch,
    enhanceDetails: onEnhanceDetails,
  };

  const handleToolSelect = useCallback((toolId: ToolId) => {
    setShowPicker(false);

    const handler = directActionHandlers[toolId];
    if (handler) {
      // Direct action tools: close picker then trigger callback
      setTimeout(() => handler(), 150);
    } else {
      // BottomSheet tools: close picker then open sheet
      setTimeout(() => setActiveTool(toolId), 150);
    }
  }, [onScanPhoto, onPhotoMatch, onEnhanceDetails]);

  const handleDismissTool = useCallback(() => {
    setActiveTool(null);
  }, []);

  const toolTitles: Record<string, string> = {
    quickAdd: 'Quick Add Item',
    bulkAdd: 'Bulk Add',
    coverPhoto: hasCoverPhoto ? 'Cover Photo' : 'Add Cover Photo',
    analytics: 'Analytics',
  };

  return (
    <>
      {/* Centered Pill Menu */}
      <div className="flex justify-center">
        <motion.button
          variants={fadeUp}
          initial="initial"
          animate="animate"
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowPicker(true)}
          className={cn(
            'inline-flex items-center gap-3 px-4 py-2',
            'bg-[var(--surface)] border border-[var(--border-subtle)]',
            'rounded-full shadow-sm',
            'hover:shadow-md hover:border-[var(--border)]',
            'transition-all duration-200',
            'group'
          )}
        >
          {visibleTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.06, type: 'spring', stiffness: 400, damping: 25 }}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                'transition-transform duration-150 group-hover:scale-105',
                tool.stripBg,
                tool.stripText
              )}
              title={tool.label}
            >
              {tool.stripIcon}
            </motion.div>
          ))}

          <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)] transition-colors ml-0.5" />
        </motion.button>
      </div>

      {/* Tool Picker BottomSheet */}
      <BottomSheet
        isOpen={showPicker}
        onClose={() => setShowPicker(false)}
        title="Bag Tools"
      >
        <div className="p-3 space-y-2">
          {visibleTools.map((tool, index) => (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleToolSelect(tool.id)}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl',
                'transition-all duration-200 group',
                'hover:scale-[1.02] active:scale-[0.98]',
                tool.bgColor,
                'hover:opacity-90'
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  'bg-white/60 dark:bg-black/10',
                  tool.color
                )}
              >
                {tool.icon}
              </div>

              {/* Text */}
              <div className="flex-1 text-left">
                <div className={cn('font-semibold text-sm', tool.color)}>
                  {tool.label}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                  {tool.description}
                </div>
              </div>

              {/* Arrow */}
              <ChevronRight
                className={cn(
                  'w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity',
                  tool.color
                )}
              />
            </motion.button>
          ))}
        </div>
      </BottomSheet>

      {/* Individual Tool BottomSheets (only for tools that render content) */}
      <BottomSheet
        isOpen={activeTool === 'quickAdd'}
        onClose={handleDismissTool}
        title={toolTitles.quickAdd}
        maxHeight={92}
      >
        <div className="p-4">{renderQuickAdd(handleDismissTool)}</div>
      </BottomSheet>

      {/* Bulk Add Chooser BottomSheet */}
      <BottomSheet
        isOpen={activeTool === 'bulkAdd'}
        onClose={handleDismissTool}
        title={toolTitles.bulkAdd}
      >
        <div className="p-4 space-y-3">
          <button
            onClick={() => {
              handleDismissTool();
              setTimeout(() => onBulkAddFromLinks(), 150);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[var(--sky-6)] hover:bg-[var(--sky-1)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--sky-3)] text-[var(--sky-10)]">
              <Link className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-gray-900">From Links</div>
              <div className="text-xs text-gray-500">Paste product URLs to import</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--sky-10)] transition-colors" />
          </button>

          <button
            onClick={() => {
              handleDismissTool();
              setTimeout(() => onBulkAddFromText(), 150);
            }}
            className="w-full flex items-center gap-3 p-4 rounded-xl border border-gray-200 hover:border-[var(--violet-6)] hover:bg-[var(--violet-1)] transition-all group"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--violet-3)] text-[var(--violet-10)]">
              <Type className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-semibold text-sm text-gray-900">From Text</div>
              <div className="text-xs text-gray-500">Type brand &amp; product names</div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--violet-10)] transition-colors" />
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={activeTool === 'coverPhoto'}
        onClose={handleDismissTool}
        title={toolTitles.coverPhoto}
        maxHeight={92}
      >
        <div className="p-4">{renderCoverPhoto(handleDismissTool)}</div>
      </BottomSheet>

      {renderAnalytics && (
        <BottomSheet
          isOpen={activeTool === 'analytics'}
          onClose={handleDismissTool}
          title={toolTitles.analytics}
          maxHeight={92}
        >
          <div className="p-4">{renderAnalytics(handleDismissTool)}</div>
        </BottomSheet>
      )}
    </>
  );
}

export default BagToolsMenu;
