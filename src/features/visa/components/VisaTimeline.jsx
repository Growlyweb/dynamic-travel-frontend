import { Check, AlertTriangle } from 'lucide-react'

export default function VisaTimeline({ steps = [] }) {
  return (
    <div className="relative pl-6 space-y-5 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {steps.map((step, index) => {
        const isDone = step.state === 'done'
        const isRejected = step.label === 'Rejected'
        return (
          <div key={`${step.label}-${index}`} className="relative flex items-start gap-3">
            <span
              className={`absolute -left-6 flex size-5 items-center justify-center rounded-full text-[10px] ring-4 ring-white ${
                isRejected
                  ? 'bg-rose-500 text-white'
                  : isDone
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 border border-slate-300 text-transparent'
              }`}
            >
              {isRejected ? <AlertTriangle className="size-3" /> : isDone ? <Check className="size-3 stroke-[3]" /> : null}
            </span>
            <div className="min-w-0 pt-0.5">
              <p
                className={`text-sm font-semibold leading-tight ${
                  isRejected ? 'text-rose-600' : isDone ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step.label}
              </p>
              {step.at ? <p className="text-xs text-slate-400 mt-0.5">{step.at}</p> : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
