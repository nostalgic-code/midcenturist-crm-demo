'use client'

import { useEffect, useState } from 'react'
import { getSettings, updateSettings, changePassword } from '@/lib/api'
import type { Settings } from '@/types/cms'

function SectionHeader({ title }: { title: string }) {
  return <h2 className="mb-4 font-serif text-lg font-semibold text-brand-black border-b border-brand-rule pb-3">{title}</h2>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">{label}</label>
      {children}
    </div>
  )
}

const inputCls = 'w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors'

export default function SettingsPage() {
  const [settings, setSettings]   = useState<Settings | null>(null)
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [success, setSuccess]     = useState('')
  const [error, setError]         = useState('')

  // Password change state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setError('Failed to load settings.'))
      .finally(() => setLoading(false))
  }, [])

  const set = <K extends keyof Settings>(key: K, val: Settings[K]) => {
    setSettings((prev) => prev ? { ...prev, [key]: val } : prev)
  }

  const handleSave = async () => {
    if (!settings) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await updateSettings(settings)
      setSettings(updated)
      setSuccess('Settings saved.')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPwError('')
    setPwSuccess('')
    if (!newPw || newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw)         { setPwError('Passwords do not match.'); return }
    try {
      await changePassword(currentPw, newPw)
      setPwSuccess('Password changed successfully.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch {
      setPwError('Current password is incorrect.')
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
  if (!settings) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {error   && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>}
      {success && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-status-live">{success}</div>}

      {/* Store info */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Store Information" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Store Name">
            <input className={inputCls} value={settings.storeName} onChange={(e) => set('storeName', e.target.value)} />
          </Field>
          <Field label="Contact Email">
            <input type="email" className={inputCls} value={settings.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} />
          </Field>
          <Field label="Contact Phone">
            <input className={inputCls} value={settings.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} />
          </Field>
          <Field label="Collection Address">
            <input className={inputCls} value={settings.collectionAddress} onChange={(e) => set('collectionAddress', e.target.value)} />
          </Field>
        </div>
        <Field label="Business / Branded Email">
          <input type="email" className={inputCls} value={settings.businessEmail} onChange={(e) => set('businessEmail', e.target.value)} placeholder="hello@midcenturist.co.za" />
        </Field>
      </section>

      {/* Notifications */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-4">
        <SectionHeader title="Notification Preferences" />
        {(
          [
            { key: 'newOrder',       label: 'New order received' },
            { key: 'newEnquiry',     label: 'New enquiry submitted' },
            { key: 'newSubscriber',  label: 'New newsletter subscriber' },
            { key: 'instagramDraft', label: 'New Instagram draft detected' },
          ] as const
        ).map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <p className="text-sm text-brand-black">{label}</p>
            <button
              type="button"
              onClick={() => set('notifications', { ...settings.notifications, [key]: !settings.notifications[key] })}
              className={`relative h-6 w-11 rounded-full transition-colors ${settings.notifications[key] ? 'bg-brand-black' : 'bg-brand-rule'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.notifications[key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </section>

      {/* Payment */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Payment Gateway" />
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="PayFast Merchant ID">
            <input className={inputCls} value={settings.payfast.merchantId} onChange={(e) => set('payfast', { ...settings.payfast, merchantId: e.target.value })} />
          </Field>
          <Field label="PayFast Merchant Key">
            <input type="password" className={inputCls} value={settings.payfast.merchantKey} onChange={(e) => set('payfast', { ...settings.payfast, merchantKey: e.target.value })} placeholder="••••••••" />
          </Field>
          <Field label="Yoco Public Key">
            <input className={inputCls} value={settings.yoco.publicKey} onChange={(e) => set('yoco', { ...settings.yoco, publicKey: e.target.value })} />
          </Field>
          <Field label="Yoco Secret Key">
            <input type="password" className={inputCls} value={settings.yoco.secretKey} onChange={(e) => set('yoco', { ...settings.yoco, secretKey: e.target.value })} placeholder="••••••••" />
          </Field>
        </div>
      </section>

      {/* Shipping */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Shipping & Fulfilment" />
        <Field label="Default Shipping Message">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            value={settings.defaultShippingMessage}
            onChange={(e) => set('defaultShippingMessage', e.target.value)}
          />
        </Field>
        <Field label="Auto-Archive Sold Items After (days)">
          <input
            type="number"
            className={inputCls}
            value={settings.autoArchiveDays}
            onChange={(e) => set('autoArchiveDays', Number(e.target.value))}
            min={1}
            max={365}
          />
        </Field>
      </section>

      {/* Save */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded bg-brand-black px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>

      {/* Change password */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Admin Account" />
        {pwError   && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{pwError}</div>}
        {pwSuccess && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-status-live">{pwSuccess}</div>}
        <Field label="Current Password">
          <input type="password" className={inputCls} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
        </Field>
        <Field label="New Password">
          <input type="password" className={inputCls} value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        </Field>
        <Field label="Confirm New Password">
          <input type="password" className={inputCls} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        </Field>
        <button
          onClick={handlePasswordChange}
          className="rounded border border-brand-rule px-5 py-2 text-sm font-medium hover:bg-brand-off transition-colors"
        >
          Change Password
        </button>
      </section>
    </div>
  )
}
