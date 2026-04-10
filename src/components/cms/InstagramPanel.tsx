import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'

export default function InstagramPanel() {
  return (
    <div className="space-y-8">
      {/* Connection status */}
      <section className="rounded-lg border border-brand-rule bg-white p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-off">
            <FontAwesomeIcon icon={faInstagram} className="h-7 w-7 text-brand-muted" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold text-brand-black">Instagram Account</p>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-status-draft">
              <span className="h-1.5 w-1.5 rounded-full bg-status-draft" />
              Not Connected
            </span>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Instagram Account</label>
            <input
              disabled
              placeholder="@midcenturist_sa"
              className="w-full rounded border border-brand-rule bg-brand-off px-3 py-2 text-sm text-brand-muted cursor-not-allowed"
            />
          </div>

          <div className="group relative">
            <button
              disabled
              className="w-full cursor-not-allowed rounded bg-brand-black/40 px-4 py-3 text-sm font-medium text-white"
            >
              Connect Instagram Account
            </button>
            <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-brand-black px-2.5 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Requires Instagram Business account linked to a Facebook Page
            </div>
          </div>

          <p className="text-sm text-brand-muted">
            Once connected, new Instagram posts will automatically appear as draft product listings for your review.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="rounded-lg border border-brand-rule bg-white p-6">
        <h2 className="mb-6 font-serif text-lg font-semibold text-brand-black">How It Works</h2>
        <ol className="space-y-5">
          {[
            { step: '1', text: 'You post on Instagram with product details in the caption' },
            { step: '2', text: 'Midcenturist detects the new post automatically' },
            { step: '3', text: 'A draft listing is created for your review' },
            { step: '4', text: 'You review, edit if needed, and publish' },
            { step: '5', text: 'The product goes live on your store' },
          ].map(({ step, text }) => (
            <li key={step} className="flex items-start gap-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-brand-rule text-xs font-semibold text-brand-black">
                {step}
              </span>
              <p className="pt-0.5 text-sm text-brand-black">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Caption format */}
      <section className="rounded-lg border border-brand-rule bg-white p-6">
        <h2 className="mb-2 font-serif text-lg font-semibold text-brand-black">Caption Format Guide</h2>
        <p className="mb-4 text-sm text-brand-muted">Use this format in your Instagram captions for best results:</p>
        <pre className="overflow-x-auto rounded-lg bg-brand-off p-5 text-sm font-mono text-brand-black leading-relaxed">
{`AVAILABLE | Danish Teak Sideboard
Era: 1962 | Material: Solid Teak | Condition: Excellent
Price: R14,500 | Ships nationwide

Description of the piece...

#midcentury #teak #midcenturistsa`}
        </pre>
        <div className="mt-4 flex items-start gap-2 rounded bg-blue-50 p-3">
          <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
          <p className="text-xs text-blue-700">
            The first line must start with <strong>AVAILABLE |</strong> followed by the product name. Price must include the <strong>R</strong> symbol.
          </p>
        </div>
      </section>

      {/* Draft queue */}
      <section className="rounded-lg border border-brand-rule bg-white p-6">
        <h2 className="mb-4 font-serif text-lg font-semibold text-brand-black">Draft Listings Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-rule bg-brand-off text-left">
                {['IG Post', 'Detected Caption', 'Suggested Price', 'Suggested Name', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs uppercase tracking-widest text-brand-muted">{h}</th>
                ))}
              </tr>
            </thead>
          </table>
          <div className="py-16 text-center text-brand-muted">
            <FontAwesomeIcon icon={faInstagram} className="mb-3 h-8 w-8 text-brand-rule" />
            <p className="text-sm">No drafts yet — connect your Instagram account to start syncing</p>
          </div>
        </div>
      </section>

      {/* Sync settings */}
      <section className="rounded-lg border border-brand-rule bg-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="font-serif text-lg font-semibold text-brand-black">Sync Settings</h2>
          <span className="rounded-full bg-brand-off px-2 py-0.5 text-xs text-brand-muted">Disabled until connected</span>
        </div>
        <div className="space-y-4 opacity-50 pointer-events-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-black">Sync Frequency</p>
              <p className="text-xs text-brand-muted">How often to check for new posts</p>
            </div>
            <select className="rounded border border-brand-rule px-3 py-1.5 text-sm" disabled>
              <option>Every 4 hours</option>
            </select>
          </div>
          <div className="h-px bg-brand-rule" />
          {[
            { label: 'Auto-archive sold items on Instagram', desc: 'When a post is removed or archived on IG, mark the product as archived' },
            { label: 'Notify me when new drafts are detected', desc: 'Send an email alert when a new post is synced as a draft' },
          ].map(({ label, desc }) => (
            <div key={label} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-brand-black">{label}</p>
                <p className="text-xs text-brand-muted">{desc}</p>
              </div>
              <div className="relative h-6 w-11 rounded-full bg-brand-rule shrink-0">
                <span className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow" />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-start gap-2 rounded bg-yellow-50 p-3">
          <FontAwesomeIcon icon={faTriangleExclamation} className="mt-0.5 h-4 w-4 shrink-0 text-status-draft" />
          <p className="text-xs text-status-draft">
            Connect your Instagram account above to enable sync settings.
          </p>
        </div>
      </section>
    </div>
  )
}
