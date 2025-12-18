'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, User, Pencil, Trash2, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface OAuthRequest {
  client_id: string;
  redirect_uri: string;
  state: string | null;
  scope: string;
  code_challenge: string | null;
  code_challenge_method: string | null;
  user_id: string;
  created_at: number;
}

interface UserInfo {
  email?: string;
  display_name?: string;
}

export default function ConsentClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [oauthRequest, setOauthRequest] = useState<OAuthRequest | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadConsentDetails() {
      try {
        // Get the current user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !authUser) {
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(window.location.href);
          router.push(`/login?redirect_to=${returnUrl}`);
          return;
        }

        // Get user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', authUser.id)
          .single();

        setUser({
          email: authUser.email,
          display_name: profile?.display_name || authUser.email?.split('@')[0],
        });

        // Fetch OAuth request details from the server
        const response = await fetch('/api/auth/oauth/request');
        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.error || 'Failed to load authorization request');
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Verify the request hasn't expired (10 minute timeout)
        if (Date.now() - data.created_at > 10 * 60 * 1000) {
          setError('Authorization request has expired. Please try again.');
          setLoading(false);
          return;
        }

        // Verify the user matches
        if (data.user_id !== authUser.id) {
          setError('Session mismatch. Please log in again.');
          setLoading(false);
          return;
        }

        setOauthRequest(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading consent details:', err);
        setError('Failed to load authorization details. Please try again.');
        setLoading(false);
      }
    }

    loadConsentDetails();
  }, [router, supabase]);

  const handleApprove = async () => {
    if (!oauthRequest) return;

    setSubmitting(true);
    try {
      // Call our custom approve endpoint
      const response = await fetch('/api/auth/oauth/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'approve' }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to approve authorization');
        setSubmitting(false);
        return;
      }

      if (data.redirect_url) {
        // Redirect back to ChatGPT with the auth code
        window.location.href = data.redirect_url;
      } else {
        setError('No redirect URL received');
        setSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error approving authorization:', err);
      setError(err?.message || 'Failed to approve authorization. Please try again.');
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!oauthRequest) return;

    setSubmitting(true);
    try {
      // Redirect back to ChatGPT with an error
      const redirectUrl = new URL(oauthRequest.redirect_uri);
      redirectUrl.searchParams.set('error', 'access_denied');
      redirectUrl.searchParams.set('error_description', 'User denied the authorization request');
      if (oauthRequest.state) {
        redirectUrl.searchParams.set('state', oauthRequest.state);
      }
      window.location.href = redirectUrl.toString();
    } catch (err) {
      console.error('Error denying authorization:', err);
      router.push('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-elevated)]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--teed-green-9)]" />
          <p className="text-[var(--text-secondary)]">Loading authorization details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-elevated)] p-4">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl p-8 border border-[var(--border-subtle)] text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">Authorization Error</h1>
          <p className="text-[var(--text-secondary)] mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-[var(--teed-green-9)] text-white rounded-lg font-medium hover:bg-[var(--teed-green-10)] transition-colors"
          >
            Go to Teed
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--surface-elevated)] p-4">
      <div className="max-w-md w-full bg-[var(--surface)] rounded-2xl shadow-xl border border-[var(--border-subtle)] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-b from-[var(--teed-green-2)] to-[var(--surface)] p-6 text-center border-b border-[var(--border-subtle)]">
          <div className="w-16 h-16 bg-[var(--teed-green-3)] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[var(--teed-green-9)]" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-1">
            Authorize ChatGPT - Teed Assistant
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            wants to access your Teed account
          </p>
        </div>

        {/* User info */}
        {user && (
          <div className="px-6 py-4 bg-[var(--surface-elevated)] border-b border-[var(--border-subtle)]">
            <p className="text-sm text-[var(--text-secondary)]">
              Logged in as <span className="font-medium text-[var(--text-primary)]">{user.display_name}</span>
              {user.email && (
                <span className="text-[var(--text-tertiary)]"> ({user.email})</span>
              )}
            </p>
          </div>
        )}

        {/* Permissions */}
        <div className="p-6">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-4">
            This will allow the app to:
          </h2>

          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-elevated)]">
              <div className="w-8 h-8 rounded-full bg-[var(--teed-green-3)] flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[var(--teed-green-9)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">View your profile</p>
                <p className="text-sm text-[var(--text-secondary)]">Access your handle, display name, and bio</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-elevated)]">
              <div className="w-8 h-8 rounded-full bg-[var(--sky-3)] flex items-center justify-center flex-shrink-0">
                <Eye className="w-4 h-4 text-[var(--sky-9)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">View your bags & items</p>
                <p className="text-sm text-[var(--text-secondary)]">See all your bags and their contents</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-elevated)]">
              <div className="w-8 h-8 rounded-full bg-[var(--amber-3)] flex items-center justify-center flex-shrink-0">
                <Pencil className="w-4 h-4 text-[var(--amber-9)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Create & edit bags</p>
                <p className="text-sm text-[var(--text-secondary)]">Create new bags and add or modify items</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--surface-elevated)]">
              <div className="w-8 h-8 rounded-full bg-[var(--red-3)] flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-[var(--red-9)]" />
              </div>
              <div>
                <p className="font-medium text-[var(--text-primary)]">Delete bags & items</p>
                <p className="text-sm text-[var(--text-secondary)]">Remove bags and items when requested</p>
              </div>
            </div>
          </div>

          {/* Privacy note */}
          <p className="text-xs text-[var(--text-tertiary)] mt-4 p-3 bg-[var(--surface-elevated)] rounded-lg">
            By authorizing, you agree to this app&apos;s{' '}
            <a href="/legal/gpt-privacy" target="_blank" className="underline hover:text-[var(--text-secondary)]">
              Privacy Policy
            </a>
            . You can revoke access at any time from your account settings.
          </p>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={handleDeny}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-[var(--border-subtle)] rounded-lg font-medium text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-[var(--teed-green-9)] text-white rounded-lg font-medium hover:bg-[var(--teed-green-10)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Allow Access
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
