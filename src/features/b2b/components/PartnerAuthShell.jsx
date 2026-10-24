import { Link } from 'react-router-dom'

export default function PartnerAuthShell({ title, subtitle, children, wide = false }) {
  return (
    <div className="min-h-screen bg-[#F5F8FC]">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/partner/login" className="flex items-center gap-3">
            <img src="/company_logo.png" alt="ABL Travels" className="size-11 rounded-lg object-contain" />
            <div>
              <p className="text-base font-extrabold tracking-tight text-slate-900">ABL Travels</p>
              <p className="text-[11px] font-medium text-slate-500">B2B Partner Portal</p>
            </div>
          </Link>
          <Link to="/dashboard/login/admin" className="text-xs font-semibold text-slate-500 hover:text-[#2F80ED]">
            Admin login →
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_1.15fr] lg:items-start">
        <section className="rounded-2xl bg-gradient-to-br from-[#2F80ED] to-[#0B4FB3] p-8 text-white shadow-xl lg:sticky lg:top-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/70">ABL Partners</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight">Grow your travel business with ABL.</h1>
          <p className="mt-4 text-sm leading-6 text-white/85">
            Apply for a B2B partner account, upload your trade license and business documents, and get verified by our
            team. Once approved, your portal becomes active.
          </p>
          <ul className="mt-7 space-y-3 text-sm text-white/90">
            {['Visa, air ticket, hotel and tour services', 'Wholesale B2B pricing', 'Your own partner portal', 'Admin-verified account'].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-white/20 text-[9px]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${wide ? '' : 'mx-auto w-full max-w-md'}`}>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p> : null}
          <div className="mt-6">{children}</div>
        </section>
      </main>

      <footer className="pb-8 text-center text-xs text-slate-400">
        ABL Travel &amp; Tours · Partner accounts are activated only after document verification and admin approval.
      </footer>
    </div>
  )
}
