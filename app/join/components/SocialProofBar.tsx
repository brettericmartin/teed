'use client';

import { useState, useEffect } from 'react';
import { Users, CheckCircle, TrendingUp } from 'lucide-react';

interface Stats {
  approvedThisWeek: number;
  waitlistSize: number;
  creatorsActive: number;
}

export default function SocialProofBar() {
  const [stats, setStats] = useState<Stats>({
    approvedThisWeek: 0,
    waitlistSize: 0,
    creatorsActive: 0,
  });

  useEffect(() => {
    // Fetch real stats from capacity endpoint
    fetch('/api/beta/capacity')
      .then((res) => res.json())
      .then((data) => {
        setStats({
          approvedThisWeek: data.approved_this_week || 0,
          waitlistSize: data.pending_applications || 0,
          creatorsActive: data.used || 0,
        });
      })
      .catch(console.error);
  }, []);

  const proofItems = [
    {
      icon: CheckCircle,
      value: stats.approvedThisWeek,
      label: 'approved this week',
      color: 'text-[var(--teed-green-9)]',
    },
    {
      icon: Users,
      value: stats.waitlistSize,
      label: 'on the waitlist',
      color: 'text-[var(--sky-9)]',
    },
    {
      icon: TrendingUp,
      value: stats.creatorsActive,
      label: 'creators active',
      color: 'text-[var(--copper-9)]',
    },
  ];

  return (
    <div className="bg-[var(--sand-2)] border-y border-[var(--border-subtle)]">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {proofItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <item.icon className={`w-5 h-5 ${item.color}`} />
              <span className="font-bold text-[var(--text-primary)]">
                {item.value}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
