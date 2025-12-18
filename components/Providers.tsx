'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';
import { CelebrationProvider } from '@/lib/celebrations';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <CelebrationProvider>
      <ConfirmProvider>
        <ToastProvider>{children}</ToastProvider>
      </ConfirmProvider>
    </CelebrationProvider>
  );
}
