'use client';

import { ReactNode } from 'react';
import { ToastProvider } from '@/components/ui/Toast';

export default function Providers({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
