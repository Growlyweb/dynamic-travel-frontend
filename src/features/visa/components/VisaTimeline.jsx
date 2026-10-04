export default function VisaTimeline({ steps = [] }) {
  return (
    <ul className="timeline">
      {steps.map((step) => (
        <li key={step.label} className={`timeline__item is-${step.state}`}>
          <span className="timeline__dot" aria-hidden />
          <p className="timeline__label">{step.label}</p>
          {step.at ? <p className="timeline__at">{step.at}</p> : null}
        </li>
      ))}
    </ul>
  )
}
