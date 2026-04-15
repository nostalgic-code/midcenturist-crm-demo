'use client'

import type { Subscriber } from '@/lib/api'

interface NewsletterTableProps {
  subscribers: Subscriber[]
}

export default function NewsletterTable({ subscribers }: NewsletterTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-brand-rule bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-brand-rule bg-brand-off text-left">
            {['Name', 'Email', 'Phone', 'Area', 'Date', 'Status'].map((h) => (
              <th key={h} className="px-4 py-3 text-xs uppercase tracking-widest text-brand-muted">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subscribers.map((sub) => (
            <tr
              key={sub.id}
              className={`border-b border-brand-rule last:border-0 ${sub.status === 'unsubscribed' ? 'opacity-50' : ''}`}
            >
              <td className="px-4 py-3 font-medium text-brand-black">
                {sub.first_name} {sub.last_name}
              </td>
              <td className="px-4 py-3 text-brand-muted">{sub.email}</td>
              <td className="px-4 py-3 text-brand-muted">{sub.phone ?? '—'}</td>
              <td className="px-4 py-3 text-brand-muted">{sub.area ?? '—'}</td>
              <td className="px-4 py-3 text-brand-muted">
                {new Date(sub.subscribed_at).toLocaleDateString('en-ZA')}
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                  sub.is_active
                    ? 'bg-green-100 text-status-live'
                    : 'bg-brand-off text-brand-muted'
                }`}>
                  {sub.is_active ? 'active' : 'unsubscribed'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {subscribers.length === 0 && (
        <div className="py-16 text-center text-brand-muted">No subscribers yet.</div>
      )}
    </div>
  )
}
