'use client';

import { Crown, Zap, TrendingUp, Sparkles, MessageCircle, Star } from 'lucide-react';

const FOUNDER_BENEFITS = [
  {
    icon: Crown,
    title: 'Lifetime Founding Member Status',
    description: 'A permanent badge on your profile. Even when we open to everyone, you\'ll always be recognized as a founder.',
    exclusive: true,
    color: 'from-amber-400 to-amber-600',
  },
  {
    icon: MessageCircle,
    title: 'Direct Line to the Team',
    description: 'Private access to our team. Share feedback, request features, and shape the product roadmap.',
    exclusive: true,
    color: 'from-sky-400 to-sky-600',
  },
  {
    icon: TrendingUp,
    title: 'Enhanced Affiliate Rates',
    description: 'Founding members get priority access to exclusive affiliate partnerships with higher commission rates.',
    exclusive: false,
    color: 'from-green-400 to-green-600',
  },
  {
    icon: Sparkles,
    title: 'Early Feature Access',
    description: 'Be the first to try new features. AI improvements, new integrations, and experimental tools.',
    exclusive: false,
    color: 'from-purple-400 to-purple-600',
  },
  {
    icon: Star,
    title: 'Featured Placement',
    description: 'Founding members get priority placement in our Discover section and featured collections.',
    exclusive: true,
    color: 'from-pink-400 to-pink-600',
  },
  {
    icon: Zap,
    title: 'Unlimited AI Credits',
    description: 'No limits on AI-powered features during beta. Identify unlimited products, generate descriptions, and more.',
    exclusive: false,
    color: 'from-orange-400 to-orange-600',
  },
];

export default function BenefitsGrid() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {FOUNDER_BENEFITS.map((benefit, index) => (
        <div
          key={index}
          className="relative bg-white dark:bg-zinc-900 rounded-2xl p-6 border border-[var(--border-subtle)] hover:border-[var(--border-strong)] transition-colors group"
        >
          {benefit.exclusive && (
            <div className="absolute -top-2 -right-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--amber-4)] text-[var(--amber-11)] border border-[var(--amber-6)]">
                Exclusive
              </span>
            </div>
          )}

          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
          >
            <benefit.icon className="w-6 h-6 text-white" />
          </div>

          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
            {benefit.title}
          </h3>

          <p className="text-sm text-[var(--text-secondary)]">
            {benefit.description}
          </p>
        </div>
      ))}
    </div>
  );
}
