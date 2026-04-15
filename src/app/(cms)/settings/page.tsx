'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { changePassword } from '@/lib/api'

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
  const { data: session } = useSession()

  // Password change state
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw]         = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [pwError, setPwError]     = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwLoading, setPwLoading] = useState(false)

  const handlePasswordChange = async () => {
    const token = (session as any)?.apiToken
    if (!token) { setPwError('Not authenticated. Please login again.'); return }
    
    setPwError('')
    setPwSuccess('')
    if (!newPw || newPw.length < 8) { setPwError('New password must be at least 8 characters.'); return }
    if (newPw !== confirmPw)         { setPwError('Passwords do not match.'); return }
    
    setPwLoading(true)
    try {
      await changePassword(token, currentPw, newPw)
      setPwSuccess('Password changed successfully.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => setPwSuccess(''), 3000)
    } catch {
      setPwError('Current password is incorrect.')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Admin Profile Info */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Admin Profile" />
        <div className="space-y-4">
          <Field label="Email">
            <div className="w-full rounded border border-brand-rule px-3 py-2 text-sm bg-brand-off text-brand-muted">
              {session?.user?.email || 'N/A'}
            </div>
          </Field>
          <p className="text-xs text-brand-muted">You're logged in as an administrator.</p>
        </div>
      </section>

      {/* Change Password */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <SectionHeader title="Change Password" />
        {pwError   && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{pwError}</div>}
        {pwSuccess && <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-status-live">{pwSuccess}</div>}
        <Field label="Current Password">
          <input 
            type="password" 
            className={inputCls} 
            value={currentPw} 
            onChange={(e) => setCurrentPw(e.target.value)} 
            placeholder="Enter your current password"
          />
        </Field>
        <Field label="New Password">
          <input 
            type="password" 
            className={inputCls} 
            value={newPw} 
            onChange={(e) => setNewPw(e.target.value)} 
            placeholder="Enter new password (min. 8 characters)"
          />
        </Field>
        <Field label="Confirm New Password">
          <input 
            type="password" 
            className={inputCls} 
            value={confirmPw} 
            onChange={(e) => setConfirmPw(e.target.value)} 
            placeholder="Confirm new password"
          />
        </Field>
        <button
          onClick={handlePasswordChange}
          disabled={pwLoading}
          className="rounded bg-brand-black px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors disabled:opacity-50"
        >
          {pwLoading ? 'Updating…' : 'Change Password'}
        </button>
      </section>
    </div>
  )
}
