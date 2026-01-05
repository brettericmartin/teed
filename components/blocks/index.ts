// Block components
export { default as BaseBlock } from './BaseBlock';
export { default as HeaderBlock } from './HeaderBlock';
export { default as BioBlock } from './BioBlock';
export { default as SocialLinksBlock } from './SocialLinksBlock';
export { default as FeaturedBagsBlock } from './FeaturedBagsBlock';
export { default as CustomTextBlock } from './CustomTextBlock';
export { default as SpacerBlock } from './SpacerBlock';
export { default as DividerBlock } from './DividerBlock';
export { default as EmbedBlock } from './EmbedBlock';
export { default as SortableBlockItem } from './SortableBlockItem';
export { default as SectionHeader } from './SectionHeader';
export { default as ProfileStats } from './ProfileStats';
export { default as BlockContainer } from './BlockContainer';

// Block editor components
export { default as BlockSettingsPanel } from './BlockSettingsPanel';
export { default as DevicePreviewToggle, DEVICE_WIDTHS } from './DevicePreviewToggle';
export type { DeviceType } from './DevicePreviewToggle';

// Profile enhancement components
export { default as ProfileCompletionIndicator } from './ProfileCompletionIndicator';

// Block types
export * from '@/lib/blocks/types';
