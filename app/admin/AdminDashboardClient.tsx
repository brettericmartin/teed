'use client';

import Link from 'next/link';
import {
  Settings,
  BookOpen,
  DollarSign,
  Users,
  BarChart3,
  Shield,
  FileText,
  Package,
  TrendingUp,
  Sparkles,
  Palette,
  MessageSquare,
  Video,
  Globe,
  UserPlus,
  Map,
  Cpu,
  Search,
  Link2,
  Lightbulb,
} from 'lucide-react';
import { ROLE_PERMISSIONS, getRoleDisplayName, type AdminRole } from '@/lib/types/admin';

interface Props {
  adminRole: AdminRole;
  adminEmail: string;
  adminHandle: string;
}

interface AdminCard {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  borderHover: string;
  permission?: keyof typeof ROLE_PERMISSIONS.super_admin;
  comingSoon?: boolean;
}

export default function AdminDashboardClient({
  adminRole,
  adminEmail,
  adminHandle,
}: Props) {
  const permissions = ROLE_PERMISSIONS[adminRole];

  const adminCards: AdminCard[] = [
    {
      href: '/admin/strategy',
      title: 'Strategic Roadmap',
      description: 'Advisory panel insights, competitive analysis, and product direction',
      icon: <Map className="w-6 h-6 text-[var(--evergreen-11)]" />,
      gradient: 'from-[var(--evergreen-4)] to-[var(--evergreen-6)]',
      borderHover: 'hover:border-[var(--evergreen-6)]',
    },
    {
      href: '/admin/proposals',
      title: 'Strategic Proposals',
      description: 'Review research proposals and make strategic decisions',
      icon: <Lightbulb className="w-6 h-6 text-[var(--amber-11)]" />,
      gradient: 'from-[var(--amber-4)] to-[var(--amber-6)]',
      borderHover: 'hover:border-[var(--amber-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/users',
      title: 'User Management',
      description: 'View users, manage roles, and handle moderation',
      icon: <Users className="w-6 h-6 text-[var(--sky-11)]" />,
      gradient: 'from-[var(--sky-4)] to-[var(--sky-6)]',
      borderHover: 'hover:border-[var(--sky-6)]',
      permission: 'canManageUsers',
    },
    {
      href: '/admin/beta',
      title: 'Beta Manager',
      description: 'Applications, controls, and survey insights',
      icon: <UserPlus className="w-6 h-6 text-[var(--teed-green-11)]" />,
      gradient: 'from-[var(--teed-green-4)] to-[var(--teed-green-6)]',
      borderHover: 'hover:border-[var(--teed-green-6)]',
      permission: 'canManageUsers',
    },
    {
      href: '/admin/affiliate-settings',
      title: 'Affiliate Settings',
      description: 'Configure platform affiliate tags for Amazon, Impact, CJ, and more',
      icon: <DollarSign className="w-6 h-6 text-[var(--teed-green-11)]" />,
      gradient: 'from-[var(--teed-green-4)] to-[var(--teed-green-6)]',
      borderHover: 'hover:border-[var(--teed-green-6)]',
      permission: 'canConfigureAffiliate',
    },
    {
      href: '/admin/analytics',
      title: 'Analytics',
      description: 'Platform metrics, AI usage, user activity, and costs',
      icon: <BarChart3 className="w-6 h-6 text-[var(--amber-11)]" />,
      gradient: 'from-[var(--amber-4)] to-[var(--amber-6)]',
      borderHover: 'hover:border-[var(--amber-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/bags',
      title: 'Bag Control',
      description: 'Manage bags, feature content, handle flags',
      icon: <Package className="w-6 h-6 text-[var(--copper-11)]" />,
      gradient: 'from-[var(--copper-4)] to-[var(--copper-6)]',
      borderHover: 'hover:border-[var(--copper-6)]',
      permission: 'canHideContent',
    },
    {
      href: '/admin/items',
      title: 'Item Analytics',
      description: 'Global items, duplicates, brand rankings',
      icon: <TrendingUp className="w-6 h-6 text-[var(--sand-11)]" />,
      gradient: 'from-[var(--sand-4)] to-[var(--sand-6)]',
      borderHover: 'hover:border-[var(--sand-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/audit-logs',
      title: 'Audit Logs',
      description: 'View history of all admin actions',
      icon: <FileText className="w-6 h-6 text-[var(--grey-11)]" />,
      gradient: 'from-[var(--grey-4)] to-[var(--grey-6)]',
      borderHover: 'hover:border-[var(--grey-6)]',
      permission: 'canViewAuditLogs',
    },
    {
      href: '/admin/feedback',
      title: 'Feedback',
      description: 'Bug reports, feature requests, and user questions',
      icon: <MessageSquare className="w-6 h-6 text-[var(--sky-11)]" />,
      gradient: 'from-[var(--sky-4)] to-[var(--sky-6)]',
      borderHover: 'hover:border-[var(--sky-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/setup-guides',
      title: 'Setup Guides',
      description: 'Step-by-step instructions for affiliate programs',
      icon: <BookOpen className="w-6 h-6 text-[var(--sky-11)]" />,
      gradient: 'from-[var(--sky-4)] to-[var(--sky-6)]',
      borderHover: 'hover:border-[var(--sky-6)]',
    },
    {
      href: '/admin/gpt-setup',
      title: 'ChatGPT GPT Setup',
      description: 'Configure the Teed custom GPT for ChatGPT integration',
      icon: <MessageSquare className="w-6 h-6 text-[var(--teed-green-11)]" />,
      gradient: 'from-[var(--teed-green-4)] to-[var(--teed-green-6)]',
      borderHover: 'hover:border-[var(--teed-green-6)]',
    },
    {
      href: '/admin/mcp-setup',
      title: 'MCP Server Setup',
      description: 'Deploy the MCP server for Claude Desktop and AI integrations',
      icon: <Cpu className="w-6 h-6 text-purple-600" />,
      gradient: 'from-purple-100 to-indigo-200 dark:from-purple-900/30 dark:to-indigo-900/30',
      borderHover: 'hover:border-purple-400',
    },
    {
      href: '/admin/design-system',
      title: 'Design System',
      description: 'Colors, typography, and component library',
      icon: <Palette className="w-6 h-6 text-[var(--evergreen-11)]" />,
      gradient: 'from-[var(--evergreen-4)] to-[var(--evergreen-6)]',
      borderHover: 'hover:border-[var(--evergreen-6)]',
    },
    {
      href: '/admin/content-ideas',
      title: 'Content Ideas',
      description: 'Social media manager - discover and curate content from YouTube',
      icon: <Video className="w-6 h-6 text-[var(--copper-11)]" />,
      gradient: 'from-[var(--copper-4)] to-[var(--copper-6)]',
      borderHover: 'hover:border-[var(--copper-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/tools',
      title: 'Video to Bag',
      description: 'Drop a YouTube or TikTok URL to extract products and create a bag',
      icon: <Sparkles className="w-6 h-6 text-purple-600" />,
      gradient: 'from-purple-100 to-indigo-200',
      borderHover: 'hover:border-purple-400',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/discovery',
      title: 'Discovery Team',
      description: 'Automated content research and bag curation across categories',
      icon: <Search className="w-6 h-6 text-[var(--evergreen-11)]" />,
      gradient: 'from-[var(--evergreen-4)] to-[var(--evergreen-6)]',
      borderHover: 'hover:border-[var(--evergreen-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/admin/ai-assistant',
      title: 'AI Curation',
      description: 'Quality scoring, moderation, bulk AI operations',
      icon: <Sparkles className="w-6 h-6 text-[var(--amber-11)]" />,
      gradient: 'from-[var(--amber-4)] to-[var(--amber-6)]',
      borderHover: 'hover:border-[var(--amber-6)]',
      permission: 'canViewAnalytics',
      comingSoon: true,
    },
    {
      href: '/admin/unrecognized-domains',
      title: 'Unrecognized Domains',
      description: 'Track new domains to expand the brand database',
      icon: <Globe className="w-6 h-6 text-[var(--copper-11)]" />,
      gradient: 'from-[var(--copper-4)] to-[var(--copper-6)]',
      borderHover: 'hover:border-[var(--copper-6)]',
      permission: 'canViewAnalytics',
    },
    {
      href: '/dev/link-process',
      title: 'Link ID Process',
      description: 'Technical docs for the link identification pipeline',
      icon: <Link2 className="w-6 h-6 text-[var(--sky-11)]" />,
      gradient: 'from-[var(--sky-4)] to-[var(--sky-6)]',
      borderHover: 'hover:border-[var(--sky-6)]',
    },
  ];

  return (
    <div className="min-h-screen pt-16">
      {/* Header with role badge */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Admin Dashboard
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Platform administration and configuration
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--amber-4)] rounded-full">
              <Shield className="w-4 h-4 text-[var(--amber-11)]" />
              <span className="text-sm font-medium text-[var(--amber-11)]">
                {getRoleDisplayName(adminRole)}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminCards.map((card) => {
            const hasPermission = card.permission
              ? permissions[card.permission]
              : true;

            if (!hasPermission) {
              return (
                <div
                  key={card.title}
                  className="p-6 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] opacity-50"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center`}
                    >
                      {card.icon}
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                      {card.title}
                    </h2>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Requires higher permission level
                  </p>
                </div>
              );
            }

            if (card.comingSoon) {
              return (
                <div
                  key={card.title}
                  className="p-6 bg-[var(--surface-elevated)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] opacity-60"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center`}
                    >
                      {card.icon}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                        {card.title}
                      </h2>
                      <span className="text-xs text-[var(--amber-11)] bg-[var(--amber-4)] px-2 py-0.5 rounded-full">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {card.description}
                  </p>
                </div>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href}
                className={`group block p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] ${card.borderHover} hover:shadow-[var(--shadow-3)] transition-all`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">
                    {card.title}
                  </h2>
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Admin Info */}
        <div className="mt-8 p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Admin Access
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Role</p>
              <p className="text-xl font-bold text-[var(--text-primary)]">
                {getRoleDisplayName(adminRole)}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Handle</p>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                @{adminHandle}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Email</p>
              <p className="text-sm font-medium text-[var(--text-primary)] break-all">
                {adminEmail}
              </p>
            </div>
            <div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">Status</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-2 h-2 bg-[var(--teed-green-9)] rounded-full" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Permission Overview */}
        <div className="mt-6 p-6 bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Your Permissions
          </h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(permissions).map(([key, value]) => (
              <span
                key={key}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  value
                    ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                    : 'bg-[var(--grey-4)] text-[var(--grey-11)]'
                }`}
              >
                {key.replace('can', '').replace(/([A-Z])/g, ' $1').trim()}
                {value ? ' ✓' : ' ✗'}
              </span>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
