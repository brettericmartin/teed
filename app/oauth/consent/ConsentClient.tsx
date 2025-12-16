'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Shield, ShoppingBag, User, Pencil, Trash2, Eye, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface AuthorizationDetails {
  client_name: string;
  client_logo?: string;
  scopes: string[];
  redirect_uri: string;
}

export default function ConsentClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authDetails, setAuthDetails] = useState<AuthorizationDetails | null>(null);
  const [user, setUser] = useState<{ email?: string; display_name?: string } | null>(null);

  const authorizationId = searchParams.get('authorization_id');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function loadAuthorizationDetails() {
      if (!authorizationId) {
        setError('Missing authorization ID. Please try the authorization process again.');
        setLoading(false);
        return;
      }

      try {
        // Get the current user
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();

        if (userError || !authUser) {
          // Redirect to login with return URL
          const returnUrl = encodeURIComponent(window.location.href);
          router.push(`/auth/login?redirect_to=${returnUrl}`);
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

        // Try to get authorization details from Supabase OAuth server
        try {
          const { data: oauthDetails, error: oauthError } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);

          if (oauthDetails && !oauthError) {
            setAuthDetails({
              client_name: oauthDetails.client?.client_name || 'ChatGPT - Teed Assistant',
              client_logo: oauthDetails.client?.logo_uri,
              scopes: oauthDetails.scope?.split(' ') || ['openid', 'email', 'profile'],
              redirect_uri: oauthDetails.redirect_uri || '',
            });
          } else {
            // Fallback to defaults if SDK method fails
            setAuthDetails({
              client_name: 'ChatGPT - Teed Assistant',
              scopes: ['openid', 'email', 'profile'],
              redirect_uri: searchParams.get('redirect_uri') || '',
            });
          }
        } catch {
          // Fallback if oauth methods don't exist in this SDK version
          setAuthDetails({
            client_name: 'ChatGPT - Teed Assistant',
            scopes: ['openid', 'email', 'profile'],
            redirect_uri: searchParams.get('redirect_uri') || '',
          });
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading authorization details:', err);
        setError('Failed to load authorization details. Please try again.');
        setLoading(false);
      }
    }

    loadAuthorizationDetails();
  }, [authorizationId, searchParams, router, supabase]);

  const handleApprove = async () => {
    if (!authorizationId) return;

    setSubmitting(true);
    try {
      // Get the current session for the access token
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Session expired. Please try again.');
        setSubmitting(false);
        return;
      }

      // Use server-side API to avoid CORS issues with Supabase
      const response = await fetch('/api/auth/oauth/consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          authorization_id: authorizationId,
          action: 'approve',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('OAuth approval failed:', data);
        setError(data.error || 'Failed to approve authorization.');
        setSubmitting(false);
        return;
      }

      // Supabase returns the redirect URL with the authorization code
      if (data?.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        // Fallback: something went wrong
        console.error('No redirect URL in response:', data);
        setError('Authorization approved but no redirect URL received.');
        setSubmitting(false);
      }
    } catch (err) {
      console.error('Error approving authorization:', err);
      setError('Failed to approve authorization. Please try again.');
      setSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!authorizationId) return;

    setSubmitting(true);
    try {
      // Get the current session for the access token
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Use server-side API to avoid CORS issues with Supabase
        const response = await fetch('/api/auth/oauth/consent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            authorization_id: authorizationId,
            action: 'deny',
          }),
        });

        const data = await response.json();

        if (response.ok && data?.redirect_url) {
          window.location.href = data.redirect_url;
          return;
        }
      }

      // Fallback: redirect with error
      const redirectUri = authDetails?.redirect_uri || searchParams.get('redirect_uri');
      if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.set('error', 'access_denied');
        url.searchParams.set('error_description', 'User denied the authorization request');
        window.location.href = url.toString();
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Error denying authorization:', err);
      // Fallback: redirect with error
      const redirectUri = authDetails?.redirect_uri || searchParams.get('redirect_uri');
      if (redirectUri) {
        const url = new URL(redirectUri);
        url.searchParams.set('error', 'access_denied');
        url.searchParams.set('error_description', 'User denied the authorization request');
        window.location.href = url.toString();
      } else {
        router.push('/');
      }
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
            Authorize {authDetails?.client_name || 'Application'}
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
