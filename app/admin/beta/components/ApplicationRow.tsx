'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Users,
  Mail,
  Calendar,
  TrendingUp,
  Sparkles,
  Link as LinkIcon,
  MessageSquare,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Application {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  priority_score: number | null;
  referral_tier: number | null;
  successful_referrals: number | null;
  approval_odds_percent: number | null;
  survey_responses: Record<string, any> | null;
  source: string | null;
  referred_by_code: string | null;
  referred_by_application_id: string | null;
  waitlist_position: number | null;
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  auto_approved: boolean | null;
  auto_approval_reason: string | null;
  created_at: string;
  referrer?: { name: string; email: string } | null;
}

interface ApplicationRowProps {
  application: Application;
  onApprove: (id: string, tier?: string) => void;
  onReject: (id: string, reason?: string) => void;
}

const TIER_NAMES = ['Standard', 'Engaged', 'Connector', 'Champion', 'Legend'];
const TIER_COLORS = [
  'bg-[var(--sand-4)] text-[var(--sand-11)]',
  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'bg-gradient-to-r from-amber-400 to-orange-500 text-white',
];

export default function ApplicationRow({
  application,
  onApprove,
  onReject,
}: ApplicationRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const tier = application.referral_tier || 0;
  const tierName = TIER_NAMES[tier] || 'Standard';
  const tierColor = TIER_COLORS[tier] || TIER_COLORS[0];

  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock },
    approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: XCircle },
    waitlisted: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Clock },
  };

  const status = statusConfig[application.status];
  const StatusIcon = status.icon;

  const handleApprove = async () => {
    setApproving(true);
    await onApprove(application.id);
    setApproving(false);
  };

  const handleReject = async () => {
    setRejecting(true);
    await onReject(application.id, rejectReason || undefined);
    setRejecting(false);
    setShowRejectModal(false);
  };

  const survey = application.survey_responses || {};
  const createdDate = new Date(application.created_at);
  const daysAgo = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));

  // Determine odds color
  const odds = application.approval_odds_percent || 0;
  const oddsColor =
    odds >= 80
      ? 'text-green-600'
      : odds >= 50
      ? 'text-yellow-600'
      : odds >= 20
      ? 'text-orange-600'
      : 'text-red-600';

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-[var(--border-subtle)] overflow-hidden">
      {/* Main Row */}
      <div className="flex items-center p-4 gap-4">
        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 hover:bg-[var(--sand-3)] rounded transition-colors"
        >
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
          )}
        </button>

        {/* Name & Email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-[var(--text-primary)] truncate">
              {application.name || 'No name'}
            </span>
            {application.auto_approved && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                <Zap className="w-3 h-3" />
                Auto
              </span>
            )}
          </div>
          <div className="text-sm text-[var(--text-secondary)] truncate">
            {application.email}
          </div>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5" />
          <span className="capitalize">{application.status}</span>
        </div>

        {/* Priority Score */}
        <div className="text-center min-w-[60px]">
          <div className="text-lg font-bold text-[var(--text-primary)]">
            {application.priority_score ?? '-'}
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Priority</div>
        </div>

        {/* Referral Tier */}
        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${tierColor}`}>
          {tierName}
        </div>

        {/* Approval Odds */}
        <div className="text-center min-w-[60px]">
          <div className={`text-lg font-bold ${oddsColor}`}>
            {odds}%
          </div>
          <div className="text-xs text-[var(--text-tertiary)]">Odds</div>
        </div>

        {/* Referrals Count */}
        <div className="flex items-center gap-1 text-[var(--text-secondary)]">
          <Users className="w-4 h-4" />
          <span className="font-medium">{application.successful_referrals || 0}</span>
        </div>

        {/* Age */}
        <div className="text-sm text-[var(--text-tertiary)] min-w-[60px] text-right">
          {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
        </div>

        {/* Actions */}
        {application.status === 'pending' && (
          <div className="flex items-center gap-2">
            <Button
              variant="create"
              size="sm"
              onClick={handleApprove}
              disabled={approving}
            >
              {approving ? 'Approving...' : 'Approve'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectModal(true)}
              className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--sand-1)] p-4">
          <div className="grid grid-cols-3 gap-6">
            {/* Survey Responses */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Survey Responses
              </h4>
              <div className="space-y-2">
                {Object.entries(survey).map(([key, value]) => (
                  <div key={key} className="text-sm">
                    <span className="text-[var(--text-tertiary)] capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
                {Object.keys(survey).length === 0 && (
                  <p className="text-sm text-[var(--text-tertiary)]">No survey data</p>
                )}
              </div>
            </div>

            {/* Referral Info */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Referral Info
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[var(--text-tertiary)]">Source:</span>
                  <span className="ml-2 text-[var(--text-primary)] capitalize">
                    {application.source || 'Unknown'}
                  </span>
                </div>
                {application.referrer && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Referred by:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {application.referrer.name} ({application.referrer.email})
                    </span>
                  </div>
                )}
                {application.referred_by_code && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Invite code used:</span>
                    <span className="ml-2 text-[var(--text-primary)] font-mono">
                      {application.referred_by_code}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[var(--text-tertiary)]">Successful referrals:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {application.successful_referrals || 0}
                  </span>
                </div>
                {application.waitlist_position && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Waitlist position:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      #{application.waitlist_position}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Admin Info */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-primary)] mb-3 flex items-center gap-2">
                <Star className="w-4 h-4" />
                Admin Info
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-[var(--text-tertiary)]">Created:</span>
                  <span className="ml-2 text-[var(--text-primary)]">
                    {createdDate.toLocaleDateString()} {createdDate.toLocaleTimeString()}
                  </span>
                </div>
                {application.reviewed_at && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Reviewed:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {new Date(application.reviewed_at).toLocaleDateString()} by {application.reviewed_by}
                    </span>
                  </div>
                )}
                {application.auto_approved && (
                  <div>
                    <span className="text-[var(--text-tertiary)]">Auto-approval reason:</span>
                    <span className="ml-2 text-[var(--text-primary)]">
                      {application.auto_approval_reason}
                    </span>
                  </div>
                )}
                {application.admin_notes && (
                  <div className="mt-3 p-2 bg-[var(--sand-3)] rounded">
                    <span className="text-[var(--text-tertiary)] text-xs block mb-1">Admin notes:</span>
                    <p className="text-[var(--text-primary)]">{application.admin_notes}</p>
                  </div>
                )}
              </div>

              {/* Priority Score Breakdown */}
              {application.priority_score !== null && (
                <div className="mt-4">
                  <h5 className="text-xs font-medium text-[var(--text-tertiary)] mb-2">
                    Score Breakdown (max 110)
                  </h5>
                  <div className="w-full h-3 bg-[var(--sand-4)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[var(--teed-green-7)] to-[var(--teed-green-9)]"
                      style={{ width: `${Math.min(100, (application.priority_score / 110) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">
              Reject Application
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to reject {application.name}'s application?
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (optional)"
              className="w-full p-3 border border-[var(--border-subtle)] rounded-lg bg-white dark:bg-zinc-800 text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
              rows={3}
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowRejectModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={rejecting}
                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {rejecting ? 'Rejecting...' : 'Reject'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
