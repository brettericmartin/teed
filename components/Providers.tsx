'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';
import { ConfirmProvider } from '@/components/ui/ConfirmDialog';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ConfirmProvider>
      <ToastProvider>{children}</ToastProvider>
    </ConfirmProvider>
  );
}
