'use client';

import Link from 'next/link';
import { ArrowLeft, Save, Check, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useState, useEffect } from 'react';

type AffiliateSetting = {
  id: string;
  network: string;
  is_enabled: boolean;
  credentials: Record<string, string>;
  created_at: string;
  updated_at: string;
};

const NETWORK_INFO = {
  amazon: {
    name: 'Amazon Associates',
    fields: [
      { key: 'associate_tag', label: 'Associate Tag', placeholder: 'teed-20', hint: 'Your Amazon Associate Tag (also called Tracking ID)' },
    ],
  },
  impact: {
    name: 'Impact.com',
    fields: [
      { key: 'publisher_id', label: 'Publisher ID', placeholder: '12345', hint: 'Your Impact Publisher ID' },
      { key: 'campaign_id', label: 'Campaign ID (Optional)', placeholder: '67890', hint: 'Specific campaign ID (optional)' },
    ],
  },
  cj: {
    name: 'CJ Affiliate',
    fields: [
      { key: 'website_id', label: 'Website ID / PID', placeholder: '8712345', hint: 'Your CJ Website ID or PID' },
    ],
  },
  rakuten: {
    name: 'Rakuten Advertising',
    fields: [
      { key: 'mid', label: 'Merchant ID (MID)', placeholder: '12345', hint: 'Your Rakuten Merchant ID' },
      { key: 'sid', label: 'Site ID (SID)', placeholder: '67890', hint: 'Your Rakuten Site ID' },
    ],
  },
  shareasale: {
    name: 'ShareASale',
    fields: [
      { key: 'merchant_id', label: 'Merchant ID', placeholder: '12345', hint: 'Your ShareASale Merchant ID' },
      { key: 'affiliate_id', label: 'Affiliate ID', placeholder: '67890', hint: 'Your ShareASale Affiliate ID' },
    ],
  },
};

export default function AffiliateSettingsClient() {
  const [settings, setSettings] = useState<AffiliateSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedNetwork, setSavedNetwork] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/affiliate-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || []);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (network: string, currentlyEnabled: boolean) => {
    setSaving(network);
    setError(null);

    try {
      const setting = settings.find(s => s.network === network);
      if (!setting) return;

      const response = await fetch('/api/admin/affiliate-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          is_enabled: !currentlyEnabled,
          credentials: setting.credentials,
        }),
      });

      if (response.ok) {
        setSettings(settings.map(s =>
          s.network === network ? { ...s, is_enabled: !currentlyEnabled } : s
        ));
        setSavedNetwork(network);
        setTimeout(() => setSavedNetwork(null), 2000);
      } else {
        setError('Failed to update setting');
      }
    } catch (err) {
      console.error('Error updating setting:', err);
      setError('Failed to update setting');
    } finally {
      setSaving(null);
    }
  };

  const handleSave = async (network: string, credentials: Record<string, string>) => {
    setSaving(network);
    setError(null);

    try {
      const setting = settings.find(s => s.network === network);
      if (!setting) return;

      const response = await fetch('/api/admin/affiliate-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          network,
          is_enabled: setting.is_enabled,
          credentials,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(settings.map(s =>
          s.network === network ? data.setting : s
        ));
        setSavedNetwork(network);
        setTimeout(() => setSavedNetwork(null), 2000);
      } else {
        setError('Failed to save credentials');
      }
    } catch (err) {
      console.error('Error saving credentials:', err);
      setError('Failed to save credentials');
    } finally {
      setSaving(null);
    }
  };

  const handleCredentialChange = (network: string, key: string, value: string) => {
    setSettings(settings.map(s =>
      s.network === network
        ? { ...s, credentials: { ...s.credentials, [key]: value } }
        : s
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[var(--teed-green-8)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 bg-[var(--surface-elevated)]">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">
            Affiliate Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-2">
            Configure your platform's affiliate credentials. Links will use these tags instead of user-provided ones.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Info Box */}
        <div className="bg-[var(--sky-2)] border border-[var(--sky-6)] rounded-lg p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--sky-11)] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-[var(--sky-11)] mb-1">How Platform Affiliate Tags Work</p>
              <p className="text-sm text-[var(--sky-11)]">
                When enabled, Teed will automatically inject your affiliate tags into product links,
                allowing you to earn commissions on purchases made through your platform.
                Need help signing up? Check the <Link href="/admin/setup-guides" className="underline font-medium">Setup Guides</Link>.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[var(--copper-2)] border border-[var(--copper-6)] rounded-lg p-4 text-[var(--copper-11)]">
            {error}
          </div>
        )}

        {/* Settings for each network */}
        {settings.map((setting) => {
          const networkConfig = NETWORK_INFO[setting.network as keyof typeof NETWORK_INFO];
          if (!networkConfig) return null;

          return (
            <div
              key={setting.network}
              className="bg-[var(--surface)] rounded-[var(--radius-xl)] border border-[var(--border-subtle)] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-[var(--border-subtle)] bg-[var(--surface-elevated)]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                      {networkConfig.name}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {setting.is_enabled ? (
                        <span className="text-[var(--teed-green-11)] font-medium">Active - tags will be injected</span>
                      ) : (
                        <span className="text-[var(--text-tertiary)]">Disabled</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(setting.network, setting.is_enabled)}
                    disabled={saving === setting.network}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      setting.is_enabled ? 'bg-[var(--teed-green-9)]' : 'bg-[var(--sand-6)]'
                    } ${saving === setting.network ? 'opacity-50' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        setting.is_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Form Fields */}
              <div className="p-6 space-y-4">
                {networkConfig.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                      {field.label}
                    </label>
                    <input
                      type="text"
                      value={setting.credentials[field.key] || ''}
                      onChange={(e) => handleCredentialChange(setting.network, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--teed-green-8)] focus:border-transparent"
                    />
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">{field.hint}</p>
                  </div>
                ))}

                {/* Save Button */}
                <div className="flex items-center justify-between pt-4">
                  <div>
                    {savedNetwork === setting.network && (
                      <span className="flex items-center gap-2 text-sm text-[var(--teed-green-11)]">
                        <Check className="w-4 h-4" />
                        Saved successfully
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleSave(setting.network, setting.credentials)}
                    disabled={saving === setting.network}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[var(--teed-green-8)] text-white rounded-lg hover:bg-[var(--teed-green-9)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {saving === setting.network ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save {networkConfig.name}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
