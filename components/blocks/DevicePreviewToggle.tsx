'use client';

import { Smartphone, Tablet, Monitor } from 'lucide-react';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

interface DevicePreviewToggleProps {
  currentDevice: DeviceType;
  onChange: (device: DeviceType) => void;
}

const DEVICES: Array<{ type: DeviceType; icon: typeof Smartphone; label: string; width: number }> = [
  { type: 'mobile', icon: Smartphone, label: 'Mobile', width: 375 },
  { type: 'tablet', icon: Tablet, label: 'Tablet', width: 768 },
  { type: 'desktop', icon: Monitor, label: 'Desktop', width: 1200 },
];

export default function DevicePreviewToggle({
  currentDevice,
  onChange,
}: DevicePreviewToggleProps) {
  const currentWidth = DEVICES.find(d => d.type === currentDevice)?.width || 1200;

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
      {/* Device buttons */}
      <div className="flex items-center gap-1 bg-[var(--surface)] rounded-lg p-1 border border-[var(--border-subtle)]">
        {DEVICES.map((device) => {
          const Icon = device.icon;
          const isActive = currentDevice === device.type;
          return (
            <button
              key={device.type}
              onClick={() => onChange(device.type)}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                ${isActive
                  ? 'bg-[var(--teed-green-9)] text-white shadow-sm'
                  : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }
              `}
              title={`${device.label} (${device.width}px)`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{device.label}</span>
            </button>
          );
        })}
      </div>

      {/* Current width indicator */}
      <span className="text-xs text-[var(--text-tertiary)] font-mono">
        {currentWidth}px
      </span>

      {/* Editing indicator */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="w-2 h-2 rounded-full bg-[var(--teed-green-9)] animate-pulse" />
        <span className="text-xs text-[var(--text-secondary)]">
          Editing {currentDevice} view
        </span>
      </div>
    </div>
  );
}

// Export the width for each device
export const DEVICE_WIDTHS: Record<DeviceType, number> = {
  mobile: 375,
  tablet: 768,
  desktop: 1200,
};
