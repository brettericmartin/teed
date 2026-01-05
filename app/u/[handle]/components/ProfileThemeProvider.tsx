'use client';

import { ReactNode, useMemo } from 'react';
import { ProfileTheme, DEFAULT_THEME } from '@/lib/blocks/types';

interface ProfileThemeProviderProps {
  theme?: Partial<ProfileTheme> | null;
  children: ReactNode;
}

// Convert gradient direction to CSS
function getGradientDirection(direction?: string): string {
  const map: Record<string, string> = {
    'to-bottom': 'to bottom',
    'to-top': 'to top',
    'to-right': 'to right',
    'to-left': 'to left',
    'to-br': 'to bottom right',
    'to-bl': 'to bottom left',
    'to-tr': 'to top right',
    'to-tl': 'to top left',
  };
  return map[direction || 'to-bottom'] || 'to bottom';
}

// Convert border radius to CSS value
function getBorderRadiusValue(radius?: string): string {
  const map: Record<string, string> = {
    'none': '0',
    'sm': '0.25rem',
    'md': '0.375rem',
    'lg': '0.5rem',
    'xl': '0.75rem',
    '2xl': '1rem',
    'full': '9999px',
  };
  return map[radius || 'xl'] || '0.75rem';
}

// Generate card shadow based on style
function getCardShadow(style?: string): string {
  switch (style) {
    case 'elevated':
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    case 'flat':
      return 'none';
    case 'outlined':
      return 'none';
    default:
      return '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
  }
}

// Generate card border based on style
function getCardBorder(style?: string, textColor?: string): string {
  switch (style) {
    case 'elevated':
      return '1px solid transparent';
    case 'flat':
      return '1px solid transparent';
    case 'outlined':
      return `1px solid ${textColor || '#1F3A2E'}20`;
    default:
      return '1px solid transparent';
  }
}

// Calculate contrasting text color (simple luminance check)
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#1F3A2E' : '#FFFFFF';
}

export default function ProfileThemeProvider({
  theme,
  children,
}: ProfileThemeProviderProps) {
  const mergedTheme = useMemo(() => ({
    ...DEFAULT_THEME,
    ...theme,
  }), [theme]);

  const cssVariables = useMemo(() => {
    const {
      primary_color,
      accent_color,
      background_color,
      text_color,
      background_type,
      background_gradient_start,
      background_gradient_end,
      background_gradient_direction,
      background_image_url,
      card_style,
      border_radius,
    } = mergedTheme;

    // Calculate secondary/tertiary text colors from main text color
    const textSecondary = `${text_color}CC`; // 80% opacity
    const textTertiary = `${text_color}99`; // 60% opacity

    // Calculate background based on type
    let backgroundValue = background_color;
    if (background_type === 'gradient' && background_gradient_start && background_gradient_end) {
      const direction = getGradientDirection(background_gradient_direction);
      backgroundValue = `linear-gradient(${direction}, ${background_gradient_start}, ${background_gradient_end})`;
    } else if (background_type === 'image' && background_image_url) {
      backgroundValue = `url(${background_image_url})`;
    }

    return {
      // Theme colors
      '--theme-primary': primary_color,
      '--theme-primary-hover': `${primary_color}E6`, // 90% opacity
      '--theme-accent': accent_color,
      '--theme-background': background_color,
      '--theme-background-value': backgroundValue,
      '--theme-text': text_color,
      '--theme-text-secondary': textSecondary,
      '--theme-text-tertiary': textTertiary,

      // Button colors derived from primary
      '--theme-button-bg': primary_color,
      '--theme-button-text': getContrastColor(primary_color),
      '--theme-button-hover': `${primary_color}E6`,

      // Card styling
      '--theme-card-shadow': getCardShadow(card_style),
      '--theme-card-border': getCardBorder(card_style, text_color),
      '--theme-card-radius': getBorderRadiusValue(border_radius),

      // Background type for conditional styling
      '--theme-background-type': background_type,
    } as Record<string, string>;
  }, [mergedTheme]);

  const containerStyles = useMemo(() => {
    const { background_type, background_color, background_image_url, background_gradient_start, background_gradient_end, background_gradient_direction } = mergedTheme;

    // Always use `background` property, never mix with `backgroundColor`
    // This prevents React warnings about conflicting properties
    let background: string;

    if (background_type === 'gradient' && background_gradient_start && background_gradient_end) {
      const direction = getGradientDirection(background_gradient_direction);
      background = `linear-gradient(${direction}, ${background_gradient_start}, ${background_gradient_end})`;
    } else if (background_type === 'image' && background_image_url) {
      // Image with fallback color
      background = `url(${background_image_url}) center/cover no-repeat fixed, ${background_color}`;
    } else {
      // Solid color
      background = background_color;
    }

    return {
      background,
      color: 'var(--theme-text)',
      minHeight: '100vh',
    } as React.CSSProperties;
  }, [mergedTheme]);

  return (
    <div
      className="profile-themed"
      style={{
        ...containerStyles,
        ...Object.entries(cssVariables).reduce((acc, [key, value]) => {
          (acc as any)[key] = value;
          return acc;
        }, {} as React.CSSProperties),
      }}
    >
      {children}
    </div>
  );
}
