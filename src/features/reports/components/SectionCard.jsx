export default function SectionCard({
  title,
  subtitle,
  icon: Icon,
  actions,
  children,
  className = '',
  bodyClassName = '',
  flush = false,
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.035)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            {Icon ? (
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                <Icon className="size-4" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 className="truncate text-[13.5px] font-bold tracking-tight text-slate-900">{title}</h2>
              {subtitle ? <p className="mt-0.5 truncate text-[11.5px] text-slate-500">{subtitle}</p> : null}
            </div>
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div> : null}
        </header>
      )}
      <div className={flush ? bodyClassName : `p-5 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
